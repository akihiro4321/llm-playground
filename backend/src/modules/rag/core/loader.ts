import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { promises as fs } from "fs";

import { KNOWLEDGE_DOCS } from "@/modules/rag/core/docsConfig";
import type { Chunk } from "@/modules/rag/core/types";

/**
 * 文字列を指定サイズごとに再帰的に分割しチャンク配列を返します。
 * LangChainのRecursiveCharacterTextSplitterを使用します。
 *
 * @param text - 分割対象の文字列。
 * @param docId - ドキュメントID。
 * @param title - ドキュメントタイトル。
 * @param chunkSize - 1チャンクあたりの最大文字数。デフォルトは500。
 * @param chunkOverlap - チャンク間の重複文字数。デフォルトは50。
 * @returns チャンク配列。
 */
export const splitIntoChunks = async (
  text: string,
  docId: string,
  title: string,
  chunkSize = 500,
  chunkOverlap = 50
): Promise<Chunk[]> => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: ["\n\n", "\n", "。", "、", " ", ""],
  });

  const docs = await splitter.createDocuments([trimmed]);

  return docs.map((doc, index) => ({
    id: `${docId}-${index}`,
    docId,
    title,
    chunkIndex: index,
    text: doc.pageContent,
  }));
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
      const docChunks = await splitIntoChunks(buffer, doc.id, doc.title);
      chunks.push(...docChunks);
    } catch (error) {
      console.error(`Failed to load knowledge file for ${doc.id}:`, error);
    }
  }

  return chunks;
};