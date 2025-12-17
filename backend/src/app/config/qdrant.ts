import { QdrantClient } from "@qdrant/js-client-rest";

export const QDRANT_COLLECTION = "mini_llm_docs";
export const QDRANT_VECTOR_SIZE = 1536; // text-embedding-3-small の次元数

export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL ?? "http://localhost:6333",
});
