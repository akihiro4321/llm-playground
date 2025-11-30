import type OpenAI from "openai";

import { embedTexts } from "@/rag/embeddings.js";
import { loadChunks } from "@/rag/loader.js";
import type { Chunk, EmbeddedChunk, EmbeddingVector } from "@/rag/types.js";

let embeddedChunksCache: EmbeddedChunk[] | null = null;

const cosineSimilarity = (a: EmbeddingVector, b: EmbeddingVector): number => {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const ensureEmbeddedChunks = async (openaiClient: OpenAI | null): Promise<EmbeddedChunk[]> => {
  if (embeddedChunksCache) return embeddedChunksCache;

  if (!openaiClient) {
    embeddedChunksCache = [];
    return embeddedChunksCache;
  }

  const chunks = await loadChunks();
  if (chunks.length === 0) {
    embeddedChunksCache = [];
    return embeddedChunksCache;
  }

  const embeddings = await embedTexts(
    openaiClient,
    chunks.map((chunk) => chunk.text),
  );

  embeddedChunksCache = chunks
    .map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index] ?? [],
    }))
    .filter((chunk) => chunk.embedding.length > 0);

  return embeddedChunksCache;
};

export const searchRelevantChunks = async (
  openaiClient: OpenAI | null,
  query: string,
  topK = 4,
): Promise<Chunk[]> => {
  if (!query.trim()) return [];

  const embeddedChunks = await ensureEmbeddedChunks(openaiClient);
  if (!openaiClient || embeddedChunks.length === 0) return [];

  const [queryEmbedding] = await embedTexts(openaiClient, [query]);
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  const scored = embeddedChunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((item) => item.chunk);
};
