import { Router } from "express";

import { buildChatRouter } from "@/modules/chat/api/router";
import { buildHistoryRouter } from "@/modules/history/api/router";
import { buildLearningRouter } from "@/modules/learning/api/router";
import { buildKnowledgeRouter } from "@/modules/rag/api/router";

/**
 * APIルーターを構築して返します。
 * /api 以下のルーティングを集約します。
 *
 * @returns Expressルーター
 */
export const buildApiRouter = (): Router => {
  const router = Router();

  // /api/chat
  router.use("/chat", buildChatRouter());

  // /api/knowledge
  router.use("/knowledge", buildKnowledgeRouter());

  // /api/history
  router.use("/history", buildHistoryRouter());

  // /api/learning
  router.use("/learning", buildLearningRouter());

  return router;
};
