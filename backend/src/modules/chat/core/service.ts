import type { ChatOpenAI } from "@langchain/openai";
import type { QdrantVectorStore } from "@langchain/qdrant";

import { graph } from "@/modules/agent/graph";
import { chatRepository } from "@/modules/history/repository/chatRepository";
import { searchRelevantChunks } from "@/modules/rag/core/search";
import { openaiRepository } from "@/shared/infrastructure/repositories/openaiRepository";
import { normalizeChatRequest } from "@/shared/lib/chatValidation";
import { type ChatMessage, type ChatRequestBody, ChatRoles } from "@/shared/types/chat";

/**
 * 知識ベースから関連情報を検索し、システムメッセージ（コンテキスト）を構築する
 */
async function getRagContextMessage(
  vectorStore: QdrantVectorStore | null,
  useKnowledge: boolean,
  query: string,
  docIds?: string[]
): Promise<ChatMessage | null> {
  if (!useKnowledge || !vectorStore || !query) return null;

  const relevantChunks = await searchRelevantChunks(vectorStore, query, {
    topK: 4,
    docIds,
  });

  if (relevantChunks.length === 0) return null;

  return {
    role: ChatRoles.System,
    content: `以下の資料断片を前提に、ユーザーの質問に答えてください。必要に応じて資料内容を引用して構いません.\n\n${relevantChunks
      .map(
        (chunk, index) =>
          `[#${index + 1} ${chunk.title || chunk.docId} #${chunk.chunkIndex}] ${chunk.text}`
      )
      .join("\n\n")}`,
  };
}

/**
 * スレッドIDを特定または新規作成する
 */
async function getOrCreateThread(
  requestedThreadId?: string,
  firstMessage?: string | null
): Promise<string> {
  if (requestedThreadId) {
    const thread = await chatRepository.findThread(requestedThreadId);
    if (thread) return thread.id;
  }
  const title = firstMessage?.slice(0, 50) || "新しいチャット";
  const newThread = await chatRepository.createThread(title);
  return newThread.id;
}

/**
 * エージェントの実行結果（メッセージストリーム）を生成する
 */
async function* runAgent(
  messages: ChatMessage[]
): AsyncIterable<{ content: string } | { message: ChatMessage }> {
  const langchainMessages = openaiRepository.convertToLangChainMessages(messages);
  const stream = await graph.stream({ messages: langchainMessages }, { streamMode: "updates" });

  for await (const update of stream) {
    const nodeName = Object.keys(update)[0];
    const nodeOutput = (update as any)[nodeName];
    if (nodeOutput && nodeOutput.messages) {
      for (const msg of nodeOutput.messages) {
        const chatMsg = openaiRepository.convertFromLangChainMessage(msg);
        yield { message: chatMsg };
        if (chatMsg.role === ChatRoles.Assistant && chatMsg.content) {
          yield { content: chatMsg.content };
        }
      }
    }
  }
}

/**
 * ストリームを監視し、アシスタントの応答をDBに保存しながらパススルーする
 */
async function* withPersistence(
  stream: AsyncIterable<{ content: string } | { message: ChatMessage }>,
  threadId: string
): AsyncIterable<{ content: string }> {
  let accumulatedContent = "";
  let assistantToolCallMessageId: string | null = null;

  try {
    for await (const item of stream) {
      if ("message" in item && item.message) {
        const messageToSave = item.message;
        const createdMessage = await chatRepository.createMessage({
          role: messageToSave.role,
          content: messageToSave.content || "",
          threadId,
          tool_calls: messageToSave.tool_calls
            ? JSON.stringify(messageToSave.tool_calls)
            : undefined,
          tool_call_id: messageToSave.tool_call_id,
        });

        if (
          messageToSave.role === ChatRoles.Assistant &&
          messageToSave.tool_calls &&
          createdMessage.id
        ) {
          assistantToolCallMessageId = createdMessage.id;
        }
      } else if ("content" in item) {
        accumulatedContent += item.content;
        yield item;
      }
    }
  } finally {
    if (accumulatedContent) {
      if (assistantToolCallMessageId) {
        await chatRepository.updateMessageContent(assistantToolCallMessageId, accumulatedContent);
      } else {
        await chatRepository.createMessage({
          role: ChatRoles.Assistant,
          content: accumulatedContent,
          threadId,
        });
      }
      await chatRepository.updateThread(threadId, { updatedAt: new Date() });
    }
  }
}

/**
 * チャットリクエストのメインハンドラー
 */
export const handleChat = async (
  _chatModel: ChatOpenAI | null,
  vectorStore: QdrantVectorStore | null,
  body: ChatRequestBody | undefined
): Promise<{
  stream: AsyncIterable<{ content: string }>;
  threadId: string;
}> => {
  const {
    chatMessages,
    useKnowledge,
    docIds,
    threadId: requestedThreadId,
  } = normalizeChatRequest(body);
  const [systemMessage, ...historyMessages] = chatMessages;

  // 1. スレッド管理
  const lastUserMessage = [...historyMessages].reverse().find((m) => m.role === ChatRoles.User);
  const threadId = await getOrCreateThread(requestedThreadId, lastUserMessage?.content);

  // 2. ユーザーメッセージの保存
  if (lastUserMessage) {
    await chatRepository.createMessage({
      role: ChatRoles.User,
      content: lastUserMessage.content || "",
      threadId,
    });
  }

  // 3. RAGによるコンテキスト取得
  const knowledgeMessage = await getRagContextMessage(
    vectorStore,
    useKnowledge,
    lastUserMessage?.content || "",
    docIds
  );

  // 4. メッセージ構築
  const finalMessages: ChatMessage[] = [
    ...(systemMessage ? [systemMessage] : []),
    ...(knowledgeMessage ? [knowledgeMessage] : []),
    ...historyMessages,
  ];

  // 5. エージェント実行 & 永続化レイヤーの適用
  const agentStream = runAgent(finalMessages);
  const persistentStream = withPersistence(agentStream, threadId);

  return { stream: persistentStream, threadId };
};
