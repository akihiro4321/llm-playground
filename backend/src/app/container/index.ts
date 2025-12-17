import { type AwilixContainer, createContainer } from "awilix";

import { registerClients } from "./clients.module";
import { registerConfig } from "./config.module";
import { registerRepositories } from "./repositories.module";
import type { Cradle } from "./types";

/**
 * DIコンテナを作成し、すべてのモジュールを登録します。
 *
 * モジュール構成:
 * - config.module.ts: 環境変数などの設定
 * - clients.module.ts: 外部API クライアント（OpenAI, LangChain等）
 * - repositories.module.ts: データアクセス層（Prisma, Qdrant等）
 *
 * 新しい依存関係を追加する場合:
 * 1. 適切なモジュールファイルに追加、または新しいモジュールを作成
 * 2. types.tsのCradleインターフェースに型定義を追加
 * 3. このファイルで新しいモジュールを登録
 *
 * @returns 設定済みのAwilixコンテナ
 */
export function configureContainer(): AwilixContainer<Cradle> {
  const container = createContainer<Cradle>();

  // 依存関係を順番に登録（依存する順序に注意）
  registerConfig(container); // 最初に設定を登録（他のモジュールが依存する可能性があるため）
  registerClients(container); // 外部クライアント
  registerRepositories(container); // リポジトリ層

  // 将来的に追加されるモジュール:
  // registerServices(container);  // ビジネスロジック層
  // registerMiddlewares(container); // カスタムミドルウェア

  return container;
}

// 型定義をエクスポート
export type { Cradle } from "./types";
