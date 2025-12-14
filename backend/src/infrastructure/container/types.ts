import type { ClientsCradle } from "./clients.module";
import type { ConfigCradle } from "./config.module";
import type { RepositoriesCradle } from "./repositories.module";

/**
 * DIコンテナに登録される依存関係の型定義
 *
 * 各モジュールの型定義を統合します。
 * 新しいモジュールを追加する場合は、ここで継承を追加してください。
 */
export interface Cradle extends ConfigCradle, ClientsCradle, RepositoriesCradle {}