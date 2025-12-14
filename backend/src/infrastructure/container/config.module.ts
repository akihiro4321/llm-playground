import { asValue, type AwilixContainer } from "awilix";

import { loadEnv } from "@/config/env";

export interface ConfigCradle {
  env: ReturnType<typeof loadEnv>;
}

/**
 * 設定関連の依存関係を登録します
 *
 * @param container - Awilixコンテナ
 */
export function registerConfig(container: AwilixContainer): void {
  const env = loadEnv();

  container.register({
    env: asValue(env),
  });
}
