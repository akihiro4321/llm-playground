import { loadKnowledgeText } from "@/knowledge/knowledgeLoader";
import type { Chunk } from "@/rag/types";

/**
 * 文字列を指定サイズごとに分割しチャンク配列を返します。
 *
 * @param text - 分割対象の文字列。
 * @param chunkSize - 1チャンクあたりの文字数。デフォルトは500。
 * @returns チャンク配列。空白のみのチャンクは除外します。
 */
export const splitIntoChunks = (text: string, chunkSize = 500): Chunk[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  return Array.from({ length: Math.ceil(trimmed.length / chunkSize) }, (_, index) => {
    const chunkText = trimmed.slice(index * chunkSize, (index + 1) * chunkSize).trim();
    return { id: index, text: chunkText };
  }).filter((chunk) => chunk.text.length > 0);
};

/**
 * 知識ベースからテキストを読み込み、チャンク配列に変換します。
 *
 * @returns チャンク配列。ロードできない場合は空配列。
 */
export const loadChunks = async (): Promise<Chunk[]> => {
  const text = await loadKnowledgeText();
  if (!text) return [];

  return splitIntoChunks(text);
};
