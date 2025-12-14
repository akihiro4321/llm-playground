import { Router } from "express";

import { chatRepository } from "@/infrastructure/repositories/chatRepository";

/**
 * 履歴関連のルーターを生成します。
 *
 * @returns 生成されたExpressルーター。
 */
export const buildHistoryRouter = (): Router => {
  const router = Router();

  /**
   * GET /api/history/threads
   * スレッド一覧を更新日時降順で取得します。
   */
  router.get("/threads", async (req, res, next) => {
    try {
      const threads = await chatRepository.getThreads();
      res.json({ threads });
    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/history/threads/:threadId/messages
   * 指定したスレッドのメッセージ一覧を作成日時昇順で取得します。
   */
  router.get("/threads/:threadId/messages", async (req, res, next) => {
    const { threadId } = req.params;
    try {
      const messages = await chatRepository.getMessages(threadId);
      res.json({ messages });
    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/history/threads/:threadId
   * 指定したスレッドを削除します。
   */
  router.delete("/threads/:threadId", async (req, res, next) => {
    const { threadId } = req.params;
    try {
      await chatRepository.deleteThread(threadId);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
