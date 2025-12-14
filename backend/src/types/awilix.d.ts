import type { AwilixContainer } from "awilix";

import type { Cradle } from "@/infrastructure/container/types";

/**
 * Expressのリクエストオブジェクトを拡張して、
 * Awilixのコンテナとcradleにアクセスできるようにする型定義
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Awilixコンテナインスタンス
       */
      container: AwilixContainer<Cradle>;

      /**
       * コンテナに登録された依存関係への直接アクセス
       */
      cradle: Cradle;
    }
  }
}
