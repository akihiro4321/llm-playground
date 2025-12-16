import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";

import { QDRANT_COLLECTION } from "@/config/qdrant";

/**
 * LangChain用のQdrantVectorStoreインスタンスを生成します。
 *
 * @param embeddings - Embeddingモデル
 * @returns QdrantVectorStore
 */
export const createVectorStore = (
  embeddings: OpenAIEmbeddings
): QdrantVectorStore => {
  return new QdrantVectorStore(embeddings, {
    url: process.env.QDRANT_URL ?? "http://localhost:6333",
    collectionName: QDRANT_COLLECTION,
  });
};
