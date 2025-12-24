import { Hono } from "hono";

import { buildChatRouter } from "@/modules/chat/api/router";
import { buildHistoryRouter } from "@/modules/history/api/router";
import { buildLearningRouter } from "@/modules/learning/api/router";
import { buildKnowledgeRouter } from "@/modules/rag/api/router";
import { HonoEnv } from "@/shared/types/hono";

/**
 * APIルーターを構築して返します。
 * /api 以下のルーティングを集約します。
 *
 * @returns Honoアプリケーション
 */
export const buildApiRouter = () => {
  const app = new Hono<HonoEnv>();

  // /api/chat
  app.route("/chat", buildChatRouter());

  // /api/knowledge
  app.route("/knowledge", buildKnowledgeRouter());

  // /api/history
  app.route("/history", buildHistoryRouter());

  // /api/learning
  app.route("/learning", buildLearningRouter());

  return app;
};