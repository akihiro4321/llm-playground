import type OpenAI from "openai";

import { embedTexts } from "@/rag/embeddings";
import { loadChunks } from "@/rag/loader";
import type { Chunk, EmbeddedChunk, EmbeddingVector } from "@/rag/types";

let embeddedChunksCache: EmbeddedChunk[] | null = null;

/**
 * 2つの埋め込みベクトルのコサイン類似度を計算します。
 *
 * @param a - ベクトルA。
 * @param b - ベクトルB。
 * @returns 類似度スコア。長さ不一致やゼロベクトルの場合は0。
 */
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

/**
 * 知識チャンクを埋め込み済みで取得します（キャッシュ付き）。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合は空配列を返します。
 * @returns 埋め込み済みチャンク配列。
 */
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

/**
 * クエリを埋め込み化し、類似度上位のチャンクを返します。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合は空配列を返します。
 * @param query - 類似検索するテキスト。
 * @param topK - 返すチャンク件数（デフォルト4件）。
 * @returns 類似度上位のチャンク配列。
 */
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
