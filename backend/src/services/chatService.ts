import type OpenAI from "openai";

import { generateChatReply } from "@/infrastructure/openaiClient";
import { normalizeChatRequest } from "@/lib/chatValidation";
import { prisma } from "@/lib/prisma";
import { MODEL_NAME } from "@/modelConfig";
import { searchRelevantChunks } from "@/rag/search";
import type { ChatMessage, ChatRequestBody } from "@/types/chat";

/**
 * チャットリクエストを処理し、必要に応じて知識チャンクを付与したうえで応答を生成する。
 * 会話履歴のDB保存も行う。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合はスタブとして動作する。
 * @param body - リクエストボディ。
 * @returns 生成された応答のストリームとスレッドID。
 */
export const handleChat = async (
  openaiClient: OpenAI | null,
  body: ChatRequestBody | undefined,
): Promise<{
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;
  threadId: string;
}> => {
  const { chatMessages, useKnowledge, docIds, threadId: requestedThreadId } = normalizeChatRequest(body);
  const [systemMessage, ...historyMessages] = chatMessages;

  // 1. スレッドの特定または作成
  let threadId = requestedThreadId;
  if (!threadId) {
    const thread = await prisma.chatThread.create({
      data: {
        title: historyMessages.find((m) => m.role === "user")?.content.slice(0, 50) || "新しいチャット",
      },
    });
    threadId = thread.id;
  } else {
    // 存在確認（簡易）
    const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
    if (!thread) {
      // 指定されたIDがない場合は新規作成（またはエラーにするが、ここでは新規作成してIDを返す）
      const newThread = await prisma.chatThread.create({
        data: {
          title: "復元されたチャット",
        },
      });
      threadId = newThread.id;
    }
  }

  // 2. ユーザーメッセージの保存
  const lastUserMessage = [...historyMessages].reverse().find((message) => message.role === "user");
  if (lastUserMessage) {
    await prisma.chatMessage.create({
      data: {
        role: "user",
        content: lastUserMessage.content,
        threadId,
      },
    });
  }

  const relevantChunks =
    useKnowledge && lastUserMessage
      ? await searchRelevantChunks(openaiClient, lastUserMessage.content, {
          topK: 4,
          docIds,
        })
      : [];

  const knowledgeMessage: ChatMessage | null =
    useKnowledge && relevantChunks.length > 0
      ? {
          role: "system",
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

  const originalStream = await generateChatReply(openaiClient, finalMessages, MODEL_NAME);

  // 3. ストリームをラップしてアシスタント応答を蓄積・保存
  async function* wrappedStream() {
    let accumulatedContent = "";
    try {
      for await (const chunk of originalStream) {
        const content = chunk.choices[0]?.delta?.content || "";
        accumulatedContent += content;
        yield chunk;
      }
    } finally {
      // 4. アシスタントメッセージの保存
      if (accumulatedContent) {
        await prisma.chatMessage.create({
          data: {
            role: "assistant",
            content: accumulatedContent,
            threadId: threadId!, // ここでは必ず存在する
          },
        });
        
        // スレッドのupdatedAtを更新
        await prisma.chatThread.update({
            where: { id: threadId },
            data: { updatedAt: new Date() }
        });
      }
    }
  }

  return { stream: wrappedStream(), threadId: threadId! };
};
