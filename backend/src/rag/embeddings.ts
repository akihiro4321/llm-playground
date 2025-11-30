import type OpenAI from "openai";

import { EMBEDDING_MODEL } from "@/modelConfig";
import type { EmbeddingVector } from "@/rag/types";

/**
 * 文字列配列を指定のEmbeddingモデルでベクトル化します。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合は空配列を返します。
 * @param texts - 埋め込み対象の文字列配列。
 * @returns 入力順に対応した埋め込みベクトル配列。
 */
export const embedTexts = async (
  openaiClient: OpenAI | null,
  texts: string[],
): Promise<EmbeddingVector[]> => {
  if (!openaiClient || texts.length === 0) return [];

  const response = await openaiClient.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((item) => item.embedding as EmbeddingVector);
};
