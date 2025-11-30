export type EmbeddingVector = number[];

export type Chunk = {
  id: number;
  text: string;
};

export type EmbeddedChunk = Chunk & {
  embedding: EmbeddingVector;
};
