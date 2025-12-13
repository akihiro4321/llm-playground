import crypto from "crypto";
import type OpenAI from "openai";

import { embedTexts } from "@/rag/embeddings";
import { loadDocumentChunks } from "@/rag/loader";
import { QDRANT_COLLECTION, QDRANT_VECTOR_SIZE, qdrantClient } from "@/rag/vectorStore";

let initPromise: Promise<boolean> | null = null;

// コレクションが存在しなければ作成する。
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

/**
 * Qdrantコレクションを削除します。
 * 主に開発時の再インデックス目的で使用します。
 */
export const deleteQdrantCollection = async (): Promise<void> => {
  try {
    await qdrantClient.deleteCollection(QDRANT_COLLECTION);
    console.log(`Qdrant collection '${QDRANT_COLLECTION}' deleted.`);
  } catch (error) {
    console.error(`Failed to delete Qdrant collection '${QDRANT_COLLECTION}':`, error);
  }
};


// 追加されたチャンクがある場合は再インデックスが必要。
const needsReindex = async (expectedCount: number): Promise<boolean> => {
  try {
    const { count } = await qdrantClient.count(QDRANT_COLLECTION, { exact: true });
    return count < expectedCount;
  } catch {
    return true;
  }
};

/**
 * Qdrantコレクションの存在確認と、未インデックス時のチャンク投入を行う。
 *
 * @param openaiClient - OpenAIクライアント。未設定の場合はfalseを返す。
 * @returns インデックスが準備済みならtrue、失敗や未設定ならfalse。
 */
export const ensureQdrantIndexed = async (openaiClient: OpenAI | null): Promise<boolean> => {
  if (!openaiClient) return false;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await ensureCollection();

      // 全ドキュメントをロードして、必要な場合だけEmbedding→Upsertする。
      const chunks = await loadDocumentChunks();
      if (chunks.length === 0) return false;

      const shouldIndex = await needsReindex(chunks.length);
      if (!shouldIndex) {
        console.log("Qdrant index already up-to-date.");
        return true;
      }
      
      console.log(`Re-indexing ${chunks.length} chunks into Qdrant...`);

      const embeddings = await embedTexts(
        openaiClient,
        chunks.map((chunk) => chunk.text),
      );

      const points = chunks
        .map((chunk, index) => ({
          id: crypto.randomUUID(),
          vector: embeddings[index] ?? [],
          payload: {
            doc_id: chunk.docId,
            title: chunk.title,
            text: chunk.text,
            chunk_index: chunk.chunkIndex,
          },
        }))
        .filter((point) => Array.isArray(point.vector) && point.vector.length > 0);

      if (points.length === 0) return false;

      // Qdrantへまとめて投入し、初期化完了とする。
      await qdrantClient.upsert(QDRANT_COLLECTION, { points });
      console.log("Qdrant indexing complete.");
      return true;
    } catch (error) {
      console.error("Failed to initialize Qdrant index:", error);
      return false;
    }
  })();

  const result = await initPromise;
  initPromise = null;
  return result;
};