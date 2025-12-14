import OpenAI from "openai";

/**
 * OpenAIクライアントをAPIキーから初期化します。
 *
 * @param apiKey - OpenAIのAPIキー。未設定の場合は`null`を返します。
 * @returns 初期化済みのクライアントまたは`null`。
 */
export const createOpenAiClient = (apiKey?: string): OpenAI | null => {
  return apiKey ? new OpenAI({ apiKey }) : null;
};
