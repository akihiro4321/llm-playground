import { Hono } from "hono";

import { runLearningAgent, runMultiAgentSystem } from "@/modules/learning/core/simpleAgent";
import { HonoEnv } from "@/shared/types/hono";

import { processResumeOpenAI } from "../core/ocrAgentOpenAI";

/**
 * /api/learningルーターを生成します。
 * Function Calling学習用の同期型エンドポイントです。
 *
 * @returns 生成されたHonoアプリケーション
 */
export const buildLearningRouter = () => {
  const app = new Hono<HonoEnv>();

  /**
   * 学習用のシンプルなAgentエンドポイント
   * ストリーミングを使わず、同期処理で完結します。
   * 依存関係はDIコンテナ（c.get('cradle')）から取得します。
   */
  app.post("/", async (c) => {
    console.log("\n--- Learning Request Start ---");

    const body = await c.req.json<{ message?: string }>();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return c.json({ error: "messageフィールドが必要です" }, 400);
    }

    // DIコンテナから依存関係を取得
    const { chatModel } = c.get("cradle");

    // 同期型Agentを実行
    const reply = await runLearningAgent(chatModel, message);

    console.log("--- Learning Request End ---\n");

    // 結果を返す
    return c.json({ reply });
  });

  app.post("/multi", async (c) => {
    console.log("\n--- Learning Request Start ---");

    const body = await c.req.json<{ message?: string }>();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return c.json({ error: "messageフィールドが必要です" }, 400);
    }

    // DIコンテナから依存関係を取得
    const { chatModel } = c.get("cradle");

    // 同期型Agentを実行
    const reply = await runMultiAgentSystem(chatModel, message);

    console.log("--- Learning Request End ---\n");

    // 結果を返す
    return c.json({ reply });
  });

  app.post("/ocr", async (c) => {
    const body = await c.req.parseBody();
    const file = body["file"];

    if (!file || !(file instanceof File)) {
      throw new Error("ファイルがありません");
    }

    const buffer = await file.arrayBuffer();
    const result = await processResumeOpenAI(Buffer.from(buffer));
    return c.json({ result });
  });

  return app;
};