import { Router } from "express";
import type OpenAI from "openai";

import { normalizeChatRequest } from "@/lib/chatValidation.js";
import { MODEL_NAME } from "@/modelConfig.js";
import { searchRelevantChunks } from "@/rag/search.js";
import { generateChatReply } from "@/services/openaiClient.js";
import type { ChatMessage, ChatRequestBody } from "@/types/chat.js";

export const buildChatRouter = (openaiClient: OpenAI | null): Router => {
  const router = Router();

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
