import { Router } from "express";

import { handleChat } from "@/services/chatService";
import type { ChatRequestBody } from "@/types/chat";

/**
 * /api/chatルーターを生成します。
 * RAGオン時は関連チャンクを取得してから回答を生成します。
 *
 * @returns 生成されたExpressルーター。
 */
export const buildChatRouter = (): Router => {
  const router = Router();

  /**
   * チャットリクエストを処理し、必要に応じて知識チャンクを付与した上で応答を返します。
   *
   * @remarks
   * `useKnowledge` が有効かつユーザーメッセージが存在する場合のみEmbedding検索を実行します。
   * 依存関係はDIコンテナ（req.cradle）から取得します。
   */
  router.post("/", async (req, res, next) => {
    try {
      // DIコンテナから依存関係を取得
      const { chatModel, vectorStore } = req.cradle;

      const { stream, threadId } = await handleChat(
        chatModel,
        vectorStore,
        req.body as ChatRequestBody
      );

      // ストリーミング用ヘッダー設定
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // スレッドIDをヘッダーで返す
      res.setHeader("X-Thread-Id", threadId);

      for await (const chunk of stream) {
        const content = chunk.content || "";
        if (content) {
          res.write(content);
        }
      }

      res.end();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
