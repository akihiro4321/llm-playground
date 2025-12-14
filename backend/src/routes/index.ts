import { Router } from "express";

import { buildChatRouter } from "./chat";
import { buildHistoryRouter } from "./history";
import { buildKnowledgeRouter } from "./knowledge";
import { buildLearningRouter } from "./learning";

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
