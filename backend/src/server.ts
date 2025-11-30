import cors from "cors";
import express from "express";

import { loadEnv } from "@/config/env";
import { errorHandler } from "@/middleware/errorHandler";
import { buildChatRouter } from "@/routes/chat";
import { createOpenAiClient } from "@/services/openaiClient";

const app = express();
const env = loadEnv();
const openaiClient = createOpenAiClient(env.openaiApiKey);

app.use(cors());
app.use(express.json());

app.use("/api", buildChatRouter(openaiClient));

/**
 * ヘルスチェック用の軽量エンドポイントです。
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

/**
 * アプリケーションサーバーを起動します。
 */
app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
