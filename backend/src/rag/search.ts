import type OpenAI from "openai";

import { knowledgeRepository } from "@/infrastructure/repositories/knowledgeRepository";
import { embedTexts } from "@/rag/embeddings";
import type { Chunk } from "@/rag/types";
import { ensureQdrantIndexed } from "@/rag/vectorIndexer";

type SearchOptions = {
  topK?: number;
  docIds?: string[];
};

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
  options: SearchOptions = {},
): Promise<Chunk[]> => {
  const { topK = 4, docIds } = options;
  if (!query.trim()) return [];

  if (!openaiClient) return [];

  const indexed = await ensureQdrantIndexed(openaiClient);
  if (!indexed) return [];

  const [queryEmbedding] = await embedTexts(openaiClient, [query]);
  if (!queryEmbedding || queryEmbedding.length === 0) return [];

  try {
    const results = await knowledgeRepository.searchPoints(
      queryEmbedding,
      topK,
      docIds,
    );

    return results
      .map<Chunk>((point, index) => ({
        id: typeof point.id === "string" ? point.id : `result-${index}`,
        docId:
          typeof point.payload?.doc_id === "string" ? point.payload.doc_id : "unknown-doc",
        title: typeof point.payload?.title === "string" ? point.payload.title : "",
        chunkIndex:
          typeof point.payload?.chunk_index === "number" ? point.payload.chunk_index : index,
        text: typeof point.payload?.text === "string" ? point.payload.text : "",
      }))
      .filter((chunk) => chunk.text.trim().length > 0);
  } catch (error) {
    console.error("Qdrant search failed:", error);
    return [];
  }
};