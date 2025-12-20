import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PORT = 3001;

export type AppEnv = {
  port: number;
  openaiApiKey?: string;
  nodeEnv?: string;
  langChainTracingV2?: string;
  langChainApiKey?: string;
  langChainProject?: string;
  tavilyApiKey?: string;
};

/**
 * PORT環境変数を数値に正規化します。
 *
 * @param value - PORTの文字列表現。
 * @returns 有効なポート番号。無効な値や未設定の場合はデフォルトポート。
 */
const normalizePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_PORT;
  }

  return parsed;
};

/**
 * dotenvを考慮して環境変数を読み込み、アプリ内で使いやすい形に整形します。
 *
 * @returns アプリで利用する環境設定。
 */
export const loadEnv = (): AppEnv => {
  return {
    port: normalizePort(process.env.PORT),
    openaiApiKey: process.env.OPENAI_API_KEY?.trim(),
    nodeEnv: process.env.NODE_ENV,
    langChainTracingV2: process.env.LANGCHAIN_TRACING_V2,
    langChainApiKey: process.env.LANGCHAIN_API_KEY,
    langChainProject: process.env.LANGCHAIN_PROJECT,
    tavilyApiKey: process.env.TAVILY_API_KEY,
  };
};
