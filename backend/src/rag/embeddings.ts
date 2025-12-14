import type { OpenAIEmbeddings } from "@langchain/openai";

import type { EmbeddingVector } from "@/rag/types";

/**
 * 文字列配列を指定のEmbeddingモデルでベクトル化します。
 *
 * @param embeddingsModel - LangChain OpenAIEmbeddingsモデル。未設定の場合は空配列を返します。
 * @param texts - 埋め込み対象の文字列配列。
 * @returns 入力順に対応した埋め込みベクトル配列。
 */
export const embedTexts = async (
  embeddingsModel: OpenAIEmbeddings | null,
  texts: string[]
): Promise<EmbeddingVector[]> => {
  if (!embeddingsModel || texts.length === 0) return [];

  const embeddings = await embeddingsModel.embedDocuments(texts);

  return embeddings as EmbeddingVector[];
};
