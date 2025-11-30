import type OpenAI from "openai";

import type { EmbeddingVector } from "@/rag/types.js";

const EMBEDDING_MODEL = "text-embedding-3-small";

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

export const getEmbeddingModel = (): string => EMBEDDING_MODEL;
