import { Router } from "express";

import { prisma } from "@/lib/prisma";

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
      const threads = await prisma.chatThread.findMany({
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      });
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
      const messages = await prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });
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
      await prisma.chatThread.delete({
        where: { id: threadId },
      });
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};