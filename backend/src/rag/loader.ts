import { promises as fs } from "fs";

import { KNOWLEDGE_DOCS } from "@/rag/docsConfig";
import type { Chunk } from "@/rag/types";

/**
 * 文字列を指定サイズごとに分割しチャンク配列を返します。
 *
 * @param text - 分割対象の文字列。
 * @param chunkSize - 1チャンクあたりの文字数。デフォルトは500。
 * @returns チャンク配列。空白のみのチャンクは除外します。
 */
export const splitIntoChunks = (
  text: string,
  docId: string,
  title: string,
  chunkSize = 500,
): Chunk[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  return Array.from({ length: Math.ceil(trimmed.length / chunkSize) }, (_, index) => {
    const chunkText = trimmed.slice(index * chunkSize, (index + 1) * chunkSize).trim();
    return {
      id: `${docId}-${index}`,
      docId,
      title,
      chunkIndex: index,
      text: chunkText,
    };
  }).filter((chunk) => chunk.text.length > 0);
};

/**
 * 知識ベースのドキュメントをすべて読み込み、チャンク配列として返します。
 *
 * @returns 全ドキュメントのチャンク配列。ロードできない場合は空配列。
 */
export const loadDocumentChunks = async (): Promise<Chunk[]> => {
  const chunks: Chunk[] = [];

  for (const doc of KNOWLEDGE_DOCS) {
    try {
      const buffer = await fs.readFile(doc.filePath, { encoding: "utf-8" });
      chunks.push(...splitIntoChunks(buffer, doc.id, doc.title));
    } catch (error) {
      console.error(`Failed to load knowledge file for ${doc.id}:`, error);
    }
  }

  return chunks;
};
