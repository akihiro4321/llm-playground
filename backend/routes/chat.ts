import { Router } from "express";
import type OpenAI from "openai";

import { loadKnowledgeText } from "../knowledge/knowledgeLoader.js";
import { normalizeChatRequest } from "../lib/chatValidation.js";
import { MODEL_NAME } from "../modelConfig.js";
import { generateChatReply } from "../services/openaiClient.js";
import type { ChatMessage, ChatRequestBody } from "../types/chat.js";

export const buildChatRouter = (openaiClient: OpenAI | null): Router => {
  const router = Router();

  router.post("/chat", async (req, res, next) => {
    try {
      const { chatMessages, useKnowledge } = normalizeChatRequest(req.body as ChatRequestBody);
      const [systemMessage, ...historyMessages] = chatMessages;

      const knowledgeText = useKnowledge ? await loadKnowledgeText() : null;

      const knowledgeMessage: ChatMessage | null =
        useKnowledge && knowledgeText
          ? {
              role: "system",
              content: `以下の資料を前提に、ユーザーの質問に答えてください。\n\n${knowledgeText}`,
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
