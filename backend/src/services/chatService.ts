import type OpenAI from "openai";

import { generateChatReply } from "@/infrastructure/openaiClient";
import { normalizeChatRequest } from "@/lib/chatValidation";
import { MODEL_NAME } from "@/modelConfig";
import { searchRelevantChunks } from "@/rag/search";
import type { ChatMessage, ChatRequestBody } from "@/types/chat";

/**
 * チャットリクエストを処理し、必要に応じて知識チャンクを付与したうえで応答を生成する。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合はスタブとして動作する。
 * @param body - リクエストボディ。
 * @returns 生成された応答文字列。
 */
export const handleChat = async (
  openaiClient: OpenAI | null,
  body: ChatRequestBody | undefined,
): Promise<string> => {
  const { chatMessages, useKnowledge } = normalizeChatRequest(body);
  const [systemMessage, ...historyMessages] = chatMessages;

  const lastUserMessage = [...historyMessages].reverse().find((message) => message.role === "user");
  const relevantChunks =
    useKnowledge && lastUserMessage
      ? await searchRelevantChunks(openaiClient, lastUserMessage.content, 4)
      : [];

  const knowledgeMessage: ChatMessage | null =
    useKnowledge && relevantChunks.length > 0
      ? {
          role: "system",
          content: `以下の資料断片を前提に、ユーザーの質問に答えてください。必要に応じて資料内容を引用して構いません。\n\n${relevantChunks
            .map((chunk, index) => `[#${index + 1}] ${chunk.text}`)
            .join("\n\n")}`,
        }
      : null;

  const finalMessages: ChatMessage[] = [
    ...(systemMessage ? [systemMessage] : []),
    ...(knowledgeMessage ? [knowledgeMessage] : []),
    ...historyMessages,
  ];

  return generateChatReply(openaiClient, finalMessages, MODEL_NAME);
};
