import { Router } from "express";

import { KNOWLEDGE_DOCS } from "@/modules/rag/core/docsConfig";

/**
 * ナレッジドキュメントの一覧を返すルーターを生成します。
 *
 * @returns 生成されたExpressルーター。
 */
export const buildKnowledgeRouter = (): Router => {
  const router = Router();

  router.get("/docs", (_req, res) => {
    res.json(KNOWLEDGE_DOCS.map(({ id, title }) => ({ id, title })));
  });

  return router;
};
