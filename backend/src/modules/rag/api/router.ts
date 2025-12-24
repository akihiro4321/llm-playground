import { Hono } from "hono";

import { KNOWLEDGE_DOCS } from "@/modules/rag/core/docsConfig";
import { HonoEnv } from "@/shared/types/hono";

/**
 * ナレッジドキュメントの一覧を返すルーターを生成します。
 *
 * @returns 生成されたHonoアプリケーション。
 */
export const buildKnowledgeRouter = () => {
  const app = new Hono<HonoEnv>();

  app.get("/docs", (c) => {
    return c.json(KNOWLEDGE_DOCS.map(({ id, title }) => ({ id, title })));
  });

  return app;
};