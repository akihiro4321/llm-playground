import type OpenAI from "openai";

import { embedTexts } from "@/rag/embeddings";
import { loadChunks } from "@/rag/loader";
import { QDRANT_COLLECTION, QDRANT_VECTOR_SIZE, qdrantClient } from "@/rag/vectorStore";

let initPromise: Promise<boolean> | null = null;

const ensureCollection = async (): Promise<void> => {
  try {
    await qdrantClient.getCollection(QDRANT_COLLECTION);
  } catch {
    await qdrantClient.createCollection(QDRANT_COLLECTION, {
      vectors: {
        size: QDRANT_VECTOR_SIZE,
        distance: "Cosine",
      },
    });
  }
};

const hasIndexedPoints = async (): Promise<boolean> => {
  const { count } = await qdrantClient.count(QDRANT_COLLECTION, { exact: true });
  return (count ?? 0) > 0;
};

/**
 * Qdrantコレクションの存在確認と、未インデックス時のチャンク投入を行う。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合はfalseを返す。
 * @returns インデックスが準備済みならtrue、失敗や未設定ならfalse。
 */
export const ensureQdrantIndexed = async (openaiClient: OpenAI | null): Promise<boolean> => {
  if (!openaiClient) return false;

  if (!initPromise) {
    initPromise = (async () => {
      try {
        await ensureCollection();
        if (await hasIndexedPoints()) return true;

        const chunks = await loadChunks();
        if (chunks.length === 0) return false;

        const embeddings = await embedTexts(
          openaiClient,
          chunks.map((chunk) => chunk.text),
        );

        const points = chunks
          .map((chunk, index) => ({
            id: chunk.id,
            vector: embeddings[index] ?? [],
            payload: {
              text: chunk.text,
              chunk_id: chunk.id,
            },
          }))
          .filter((point) => Array.isArray(point.vector) && point.vector.length > 0);

        if (points.length === 0) return false;

        await qdrantClient.upsert(QDRANT_COLLECTION, { points });
        return true;
      } catch (error) {
        console.error("Failed to initialize Qdrant index:", error);
        return false;
      }
    })();
  }

  const result = await initPromise;
  if (!result) {
    initPromise = null;
  }
  return result;
};
