import { loadKnowledgeText } from "@/knowledge/knowledgeLoader.js";
import type { Chunk } from "@/rag/types.js";

export const splitIntoChunks = (text: string, chunkSize = 500): Chunk[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const chunks: Chunk[] = [];
  let current = "";
  let id = 0;

  for (const char of trimmed) {
    current += char;
    if (current.length >= chunkSize) {
      chunks.push({ id: id++, text: current.trim() });
      current = "";
    }
  }

  if (current.trim()) {
    chunks.push({ id: id++, text: current.trim() });
  }

  return chunks;
};

export const loadChunks = async (): Promise<Chunk[]> => {
  const text = await loadKnowledgeText();
  if (!text) return [];

  return splitIntoChunks(text);
};
