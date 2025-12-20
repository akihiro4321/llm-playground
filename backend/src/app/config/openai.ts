import { ChatOpenAI,OpenAIEmbeddings } from "@langchain/openai";

import { EMBEDDING_MODEL, MODEL_NAME } from "@/app/config/model";

/**
 * LangChain ChatOpenAI インスタンスをAPIキーから初期化します。
 *
 * @param apiKey - OpenAIのAPIキー。未設定の場合は`null`を返します。
 * @param modelName - 使用するモデル名（デフォルト: modelConfig.tsのMODEL_NAME）。
 * @param streaming - ストリーミングを有効にするかどうか（デフォルト: true）。
 * @param temperature - サンプリング温度（デフォルト: 1。モデルによっては0が未サポートのため）。
 * @returns 初期化済みのChatOpenAIインスタンスまたは`null`。
 */
export const createOpenAiClient = (
  apiKey?: string,
  modelName: string = MODEL_NAME,
  streaming: boolean = true,
  temperature: number = 1
): ChatOpenAI | null => {
  if (!apiKey) return null;

  // o1系などのモデルは temperature: 1 固定（0などはエラーになる）
  const isO1Model = modelName.startsWith("o1-");
  const finalTemperature = isO1Model ? 1 : temperature;

  return new ChatOpenAI({
    apiKey,
    model: modelName,
    streaming,
    temperature: finalTemperature,
  });
};

/**
 * LangChain OpenAIEmbeddings インスタンスをAPIキーから初期化します。
 *
 * @param apiKey - OpenAIのAPIキー。未設定の場合は`null`を返します。
 * @param modelName - 使用するEmbeddingモデル名（デフォルト: modelConfig.tsのEMBEDDING_MODEL）。
 * @returns 初期化済みのOpenAIEmbeddingsインスタンスまたは`null`。
 */
export const createEmbeddingsClient = (
  apiKey?: string,
  modelName: string = EMBEDDING_MODEL
): OpenAIEmbeddings | null => {
  if (!apiKey) return null;

  return new OpenAIEmbeddings({
    apiKey,
    model: modelName,
  });
};
