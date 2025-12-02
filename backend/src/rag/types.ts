export type EmbeddingVector = number[];

export type Chunk = {
  id: string;
  docId: string;
  title: string;
  chunkIndex: number;
  text: string;
};

export type EmbeddedChunk = Chunk & {
  embedding: EmbeddingVector;
};
