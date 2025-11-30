import type OpenAI from "openai";

import { embedTexts } from "@/rag/embeddings";
import type { Chunk } from "@/rag/types";
import { ensureQdrantIndexed } from "@/rag/vectorIndexer";
import { QDRANT_COLLECTION, qdrantClient } from "@/rag/vectorStore";

/**
 * クエリを埋め込み化し、Qdrantで類似チャンクを検索して返します。
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

  if (!openaiClient) return [];

  const indexed = await ensureQdrantIndexed(openaiClient);
  if (!indexed) return [];

  const [queryEmbedding] = await embedTexts(openaiClient, [query]);
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  try {
    const results = await qdrantClient.search(QDRANT_COLLECTION, {
      vector: queryEmbedding,
      limit: topK,
      with_payload: true,
    });

    return results
      .map<Chunk>((point, index) => ({
        id:
          typeof point.payload?.chunk_id === "number"
            ? point.payload.chunk_id
            : typeof point.id === "number"
              ? point.id
              : index,
        text: typeof point.payload?.text === "string" ? point.payload.text : "",
      }))
      .filter((chunk) => chunk.text.trim().length > 0);
  } catch (error) {
    console.error("Qdrant search failed:", error);
    return [];
  }
};
