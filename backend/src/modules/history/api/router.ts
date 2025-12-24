import { Hono } from "hono";

import { chatRepository } from "@/modules/history/repository/chatRepository";
import { HonoEnv } from "@/shared/types/hono";

/**
 * 履歴関連のルーターを生成します。
 *
 * @returns 生成されたHonoアプリケーション。
 */
export const buildHistoryRouter = () => {
  const app = new Hono<HonoEnv>();

  /**
   * GET /api/history/threads
   * スレッド一覧を更新日時降順で取得します。
   */
  app.get("/threads", async (c) => {
    const threads = await chatRepository.getThreads();
    return c.json({ threads });
  });

  /**
   * GET /api/history/threads/:threadId/messages
   * 指定したスレッドのメッセージ一覧を作成日時昇順で取得します。
   */
  app.get("/threads/:threadId/messages", async (c) => {
    const threadId = c.req.param("threadId");
    const messages = await chatRepository.getMessages(threadId);
    return c.json({ messages });
  });

  /**
   * DELETE /api/history/threads/:threadId
   * 指定したスレッドを削除します。
   */
  app.delete("/threads/:threadId", async (c) => {
    const threadId = c.req.param("threadId");
    await chatRepository.deleteThread(threadId);
    return c.body(null, 204);
  });

  return app;
};