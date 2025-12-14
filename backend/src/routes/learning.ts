import { Router } from "express";
import type OpenAI from "openai";

import { runLearningAgent } from "@/features/learning/simpleAgent";

/**
 * /api/learningルーターを生成します。
 * Function Calling学習用の同期型エンドポイントです。
 *
 * @param openaiClient - OpenAIクライアント
 * @returns 生成されたExpressルーター
 */
export const buildLearningRouter = (openaiClient: OpenAI | null): Router => {
  const router = Router();

  /**
   * 学習用のシンプルなAgentエンドポイント
   * ストリーミングを使わず、同期処理で完結します。
   */
  router.post("/", async (req, res, next) => {
    try {
      console.log("\n--- Learning Request Start ---");

      const { message } = req.body as { message?: string };

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "messageフィールドが必要です" });
        return;
      }

      // 同期型Agentを実行
      const reply = await runLearningAgent(openaiClient, message);

      console.log("--- Learning Request End ---\n");

      // 結果を返す
      res.json({ reply });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
