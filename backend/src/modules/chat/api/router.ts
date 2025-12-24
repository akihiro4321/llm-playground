import { Hono } from "hono";
import { streamText } from "hono/streaming";

import { handleChat } from "@/modules/chat/core/service";
import type { ChatRequestBody } from "@/shared/types/chat";
import { HonoEnv } from "@/shared/types/hono";

/**
 * /api/chatルーターを生成します。
 * RAGオン時は関連チャンクを取得してから回答を生成します。
 *
 * @returns 生成されたHonoアプリケーション。
 */
export const buildChatRouter = () => {
  const app = new Hono<HonoEnv>();

  /**
   * チャットリクエストを処理し、必要に応じて知識チャンクを付与した上で応答を返します。
   *
   * @remarks
   * `useKnowledge` が有効かつユーザーメッセージが存在する場合のみEmbedding検索を実行します。
   * 依存関係はDIコンテナ（c.get('cradle')）から取得します。
   */
  app.post("/", async (c) => {
    // DIコンテナから依存関係を取得
    const { chatModel, vectorStore } = c.get("cradle");

    const body = await c.req.json<ChatRequestBody>();

    const { stream, threadId } = await handleChat(
      chatModel,
      vectorStore,
      body
    );

    // スレッドIDをヘッダーで返す
    c.header("X-Thread-Id", threadId);

    // ストリーミングレスポンス
    return streamText(c, async (streamWriter) => {
      for await (const chunk of stream) {
        const content = chunk.content;
        if (content && typeof content === "string") {
          await streamWriter.write(content);
        }
      }
    });
  });

  return app;
};