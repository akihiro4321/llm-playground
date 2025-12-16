import type { QdrantVectorStore } from "@langchain/qdrant";

import type { Chunk } from "@/rag/types";

type SearchOptions = {
  topK?: number;
  docIds?: string[];
};

/**
 * クエリを埋め込み化し、Qdrantで類似チャンクを検索して返します。
 *
 * @param vectorStore - LangChain QdrantVectorStoreインスタンス。未設定の場合は空配列を返します。
 * @param query - 類似検索するテキスト。
 * @param options - 検索オプション（topK, docIds）。
 * @returns 類似度上位のチャンク配列。
 */
export const searchRelevantChunks = async (
  vectorStore: QdrantVectorStore | null,
  query: string,
  options: SearchOptions = {}
): Promise<Chunk[]> => {
  const { topK = 4, docIds } = options;
  if (!query.trim()) return [];

  if (!vectorStore) return [];

  try {
    // Qdrant用メタデータフィルタの構築
    const filter =
      docIds && docIds.length > 0
        ? {
            should: docIds.map((id) => ({
              key: "doc_id",
              match: { value: id },
            })),
          }
        : undefined;

    // LangChain経由で検索
    const results = await vectorStore.similaritySearch(query, topK, filter);

    return results
      .map<Chunk>((doc, index) => ({
        id: `result-${index}`, // DocumentにはIDが含まれない場合があるため仮ID
        docId: doc.metadata.doc_id || "unknown-doc",
        title: doc.metadata.title || "",
        chunkIndex: doc.metadata.chunk_index ?? index,
        text: doc.pageContent || "",
      }))
      .filter((chunk) => chunk.text.trim().length > 0);
  } catch (error) {
    console.error("Qdrant search failed:", error);
    return [];
  }
};