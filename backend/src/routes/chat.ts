import { Router } from "express";
import type OpenAI from "openai";

import { normalizeChatRequest } from "@/lib/chatValidation";
import { MODEL_NAME } from "@/modelConfig";
import { searchRelevantChunks } from "@/rag/search";
import { generateChatReply } from "@/services/openaiClient";
import type { ChatMessage, ChatRequestBody } from "@/types/chat";

/**
 * /api/chatルーターを生成します。
 * RAGオン時は関連チャンクを取得してから回答を生成します。
 *
 * @param openaiClient - OpenAIクライアント。未設定でもスタブとして動作します。
 * @returns 生成されたExpressルーター。
 */
export const buildChatRouter = (openaiClient: OpenAI | null): Router => {
  const router = Router();

  /**
   * チャットリクエストを処理し、必要に応じて知識チャンクを付与した上で応答を返します。
   *
   * @remarks
   * `useKnowledge` が有効かつユーザーメッセージが存在する場合のみEmbedding検索を実行します。
   */
  router.post("/chat", async (req, res, next) => {
    try {
      const { chatMessages, useKnowledge } = normalizeChatRequest(req.body as ChatRequestBody);
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

      const reply = await generateChatReply(openaiClient, finalMessages, MODEL_NAME);

      res.json({ reply });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
