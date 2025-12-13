import { Router } from "express";
import type OpenAI from "openai";

import { buildChatRouter } from "./chat";
import { buildHistoryRouter } from "./history";
import { buildKnowledgeRouter } from "./knowledge";

/**
 * APIルーターを構築して返します。
 * /api 以下のルーティングを集約します。
 *
 * @param openaiClient - OpenAIクライアント
 * @returns Expressルーター
 */
export const buildApiRouter = (openaiClient: OpenAI | null): Router => {
  const router = Router();

  // /api/chat
  router.use("/chat", buildChatRouter(openaiClient));

  // /api/knowledge
  router.use("/knowledge", buildKnowledgeRouter());

  // /api/history
  router.use("/history", buildHistoryRouter());

  return router;
};
