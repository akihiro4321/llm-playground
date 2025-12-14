import type { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

import { chatRepository } from "@/infrastructure/repositories/chatRepository";
import { openaiRepository } from "@/infrastructure/repositories/openaiRepository";
import { normalizeChatRequest } from "@/lib/chatValidation";
import { searchRelevantChunks } from "@/rag/search";
import { type ChatMessage, type ChatRequestBody,ChatRoles } from "@/types/chat";

/**
 * チャットリクエストを処理し、必要に応じて知識チャンクを付与したうえで応答を生成する。
 * 会話履歴のDB保存も行う。
 *
 * @param chatModel - LangChain ChatOpenAIインスタンス（チャット用）。未設定の場合はスタブとして動作する。
 * @param embeddingsModel - LangChain OpenAIEmbeddingsインスタンス（RAG用）。
 * @param body - リクエストボディ。
 * @returns 生成された応答のストリームとスレッドID。
 */
export const handleChat = async (
  chatModel: ChatOpenAI | null,
  embeddingsModel: OpenAIEmbeddings | null,
  body: ChatRequestBody | undefined,
): Promise<{
  stream: AsyncIterable<{ content: string }>;
  threadId: string;
}> => {
  const { chatMessages, useKnowledge, docIds, threadId: requestedThreadId } = normalizeChatRequest(body);
  const [systemMessage, ...historyMessages] = chatMessages;

  // 1. スレッドの特定または作成
  let threadId = requestedThreadId;
  if (!threadId) {
    const thread = await chatRepository.createThread(
      historyMessages.find((m) => m.role === ChatRoles.User)?.content?.slice(0, 50) || "新しいチャット"
    );
    threadId = thread.id;
  } else {
    // 存在確認（簡易）
    const thread = await chatRepository.findThread(threadId);
    if (!thread) {
      // 指定されたIDがない場合は新規作成（またはエラーにするが、ここでは新規作成してIDを返す）
      const newThread = await chatRepository.createThread("復元されたチャット");
      threadId = newThread.id;
    }
  }

  // 2. ユーザーメッセージの保存
  const lastUserMessage = [...historyMessages].reverse().find((message) => message.role === ChatRoles.User);
  if (lastUserMessage) {
    await chatRepository.createMessage({
      role: ChatRoles.User,
      content: lastUserMessage.content || "",
      threadId,
    });
  }

  const relevantChunks =
    useKnowledge && lastUserMessage && lastUserMessage.content
      ? await searchRelevantChunks(embeddingsModel, lastUserMessage.content, {
          topK: 4,
          docIds,
        })
      : [];

  const knowledgeMessage: ChatMessage | null =
    useKnowledge && relevantChunks.length > 0
      ? {
          role: ChatRoles.System,
          content: `以下の資料断片を前提に、ユーザーの質問に答えてください。必要に応じて資料内容を引用して構いません。\n\n${relevantChunks
            .map(
              (chunk, index) =>
                `[#${index + 1} ${chunk.title || chunk.docId} #${chunk.chunkIndex}] ${chunk.text}`,
            )
            .join("\n\n")}`,
        }
      : null;

  const finalMessages: ChatMessage[] = [
    ...(systemMessage ? [systemMessage] : []),
    ...(knowledgeMessage ? [knowledgeMessage] : []),
    ...historyMessages,
  ];

  const originalStream = openaiRepository.generateChatReply(chatModel, finalMessages);

  // 3. ストリームをラップしてアシスタント応答を蓄積・保存
  async function* wrappedStream() {
    let accumulatedContent = "";
    let assistantToolCallMessageId: string | null = null; // ツール呼び出しを持つアシスタントメッセージのIDを保持

    try {
      for await (const item of originalStream) {
        if ("message" in item) {
          // yieldされたのがChatMessageの場合（ツール呼び出し、ツール応答など）
          const messageToSave = item.message;
          const createdMessage = await chatRepository.createMessage({
            role: messageToSave.role,
            content: messageToSave.content || "",
            threadId: threadId!,
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
          // yieldされたのが LangChain のストリーミングチャンクの場合
          const content = item.content;
          if (content) {
            accumulatedContent += content;
          }
          yield item; // クライアントにはチャンクをそのまま流す
        }
      }
    } finally {
      // 4. 最終的なアシスタントメッセージ（コンテンツを持つもの）の保存
      if (accumulatedContent) {
        if (assistantToolCallMessageId) {
          // ツール呼び出しを持つアシスタントメッセージが事前に保存されている場合、内容を更新
          await chatRepository.updateMessageContent(
            assistantToolCallMessageId,
            accumulatedContent
          );
        } else {
          // 通常のアシスタント応答として新規保存
          await chatRepository.createMessage({
            role: ChatRoles.Assistant,
            content: accumulatedContent,
            threadId: threadId!,
          });
        }

        // スレッドのupdatedAtを更新
        await chatRepository.updateThread(threadId!, { updatedAt: new Date() });
      }
    }
  }

  return { stream: wrappedStream(), threadId: threadId! };
};
