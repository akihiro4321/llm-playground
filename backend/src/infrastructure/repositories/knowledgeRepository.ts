import {
  QDRANT_COLLECTION,
  QDRANT_VECTOR_SIZE,
  qdrantClient,
} from "@/config/qdrant";

type PointPayload = {
  doc_id: string;
  title: string;
  text: string;
  chunk_index: number;
};

type PointStruct = {
  id: string;
  vector: number[];
  payload: PointPayload;
};

export const knowledgeRepository = {
  async ensureCollection() {
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
  },

  async deleteCollection() {
    await qdrantClient.deleteCollection(QDRANT_COLLECTION);
  },

  async countPoints() {
    const { count } = await qdrantClient.count(QDRANT_COLLECTION, {
      exact: true,
    });
    return count;
  },

  async upsertPoints(points: PointStruct[]) {
    await qdrantClient.upsert(QDRANT_COLLECTION, { points });
  },

  async searchPoints(
    vector: number[],
    limit: number,
    docIds?: string[]
  ) {
    return qdrantClient.search(QDRANT_COLLECTION, {
      vector,
      limit,
      with_payload: true,
      filter:
        docIds && docIds.length > 0
          ? {
              must: [
                {
                  key: "doc_id",
                  match: { any: docIds },
                },
              ],
            }
          : undefined,
    });
  },
};
