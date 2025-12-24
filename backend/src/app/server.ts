import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { configureContainer } from "@/app/container";
import { buildApiRouter } from "@/app/routes";
import { ensureQdrantIndexed } from "@/modules/rag/core/vectorIndexer";
import { scopePerRequest } from "@/shared/middleware/awilix";
import { errorHandler } from "@/shared/middleware/errorHandler";
import { HonoEnv } from "@/shared/types/hono";

const app = new Hono<HonoEnv>();

// DIコンテナのセットアップ
const container = configureContainer();

app.use("*", cors());
app.use("*", scopePerRequest(container));

app.route("/api", buildApiRouter());

/**
 * ヘルスチェック用の軽量エンドポイントです。
 */
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.onError(errorHandler);

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
  console.log(`Server listening on http://localhost:${env.port}`);
  serve({
    fetch: app.fetch,
    port: Number(env.port),
  });
});