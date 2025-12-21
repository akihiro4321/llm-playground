import { Router } from "express";

import { runLearningAgent, runMultiAgentSystem } from "@/modules/learning/core/simpleAgent";

/**
 * /api/learningルーターを生成します。
 * Function Calling学習用の同期型エンドポイントです。
 *
 * @returns 生成されたExpressルーター
 */
export const buildLearningRouter = (): Router => {
  const router = Router();

  /**
   * 学習用のシンプルなAgentエンドポイント
   * ストリーミングを使わず、同期処理で完結します。
   * 依存関係はDIコンテナ（req.cradle）から取得します。
   */
  router.post("/", async (req, res, next) => {
    try {
      console.log("\n--- Learning Request Start ---");

      const { message } = req.body as { message?: string };

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "messageフィールドが必要です" });
        return;
      }

      // DIコンテナから依存関係を取得
      const { chatModel } = req.cradle;

      // 同期型Agentを実行
      const reply = await runLearningAgent(chatModel, message);

      console.log("--- Learning Request End ---\n");

      // 結果を返す
      res.json({ reply });
    } catch (error) {
      next(error);
    }
  });

  router.post("/multi", async (req, res, next) => {
    try {
      console.log("\n--- Learning Request Start ---");

      const { message } = req.body as { message?: string };

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "messageフィールドが必要です" });
        return;
      }

      // DIコンテナから依存関係を取得
      const { chatModel } = req.cradle;

      // 同期型Agentを実行
      const reply = await runMultiAgentSystem(chatModel, message);

      console.log("--- Learning Request End ---\n");

      // 結果を返す
      res.json({ reply });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
