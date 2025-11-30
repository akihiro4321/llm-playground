import { Router } from "express";
import type OpenAI from "openai";

import { normalizeChatRequest } from "../lib/chatValidation.js";
import { MODEL_NAME } from "../modelConfig.js";
import { generateChatReply } from "../services/openaiClient.js";
import type { ChatRequestBody } from "../types/chat.js";

export const buildChatRouter = (openaiClient: OpenAI | null): Router => {
  const router = Router();

  router.post("/chat", async (req, res, next) => {
    try {
      const { chatMessages } = normalizeChatRequest(req.body as ChatRequestBody);
      const reply = await generateChatReply(openaiClient, chatMessages, MODEL_NAME);

      res.json({ reply });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
