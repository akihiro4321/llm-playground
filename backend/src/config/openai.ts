import { ChatOpenAI,OpenAIEmbeddings } from "@langchain/openai";

import { EMBEDDING_MODEL, MODEL_NAME } from "@/modelConfig";

/**
 * LangChain ChatOpenAI インスタンスをAPIキーから初期化します。
 *
 * @param apiKey - OpenAIのAPIキー。未設定の場合は`null`を返します。
 * @param modelName - 使用するモデル名（デフォルト: modelConfig.tsのMODEL_NAME）。
 * @returns 初期化済みのChatOpenAIインスタンスまたは`null`。
 */
export const createOpenAiClient = (
  apiKey?: string,
  modelName: string = MODEL_NAME
): ChatOpenAI | null => {
  if (!apiKey) return null;

  return new ChatOpenAI({
    apiKey,
    model: modelName,
    streaming: true,
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
