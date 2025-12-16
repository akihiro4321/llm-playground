import { scopePerRequest } from "awilix-express";
import cors from "cors";
import express from "express";

import { configureContainer } from "@/infrastructure/container";
import { errorHandler } from "@/middleware/errorHandler";
import { ensureQdrantIndexed } from "@/rag/vectorIndexer";
import { buildApiRouter } from "@/routes";

const app = express();

// DIコンテナのセットアップ
const container = configureContainer();

app.use(cors());
app.use(express.json());

// Awilixミドルウェア: リクエストごとにスコープ付きコンテナを作成
app.use(scopePerRequest(container));

// req.cradle を利用可能にするミドルウェア
app.use((req, _res, next) => {
  // @ts-ignore awilix-express adds container, but we need to alias cradle
  req.cradle = req.container.cradle;
  next();
});

app.use("/api", buildApiRouter());

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
const { env, embeddingsModel } = container.cradle;

if (env.langChainTracingV2 === "true") {
  console.log("🛠️  LangSmith Tracing: ON");
  if (env.langChainProject) {
    console.log(`   Project: ${env.langChainProject}`);
  }
}

// Qdrantインデックスの初期化（サーバー起動前に実行）
ensureQdrantIndexed(embeddingsModel).then(() => {
  app.listen(env.port, () => {
    console.log(`Server listening on http://localhost:${env.port}`);
  });
});
