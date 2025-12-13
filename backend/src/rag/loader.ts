import { promises as fs } from "fs";

import { KNOWLEDGE_DOCS } from "@/rag/docsConfig";
import type { Chunk } from "@/rag/types";

/**
 * 文字列を指定サイズごとに再帰的に分割しチャンク配列を返します。
 * LangChainのRecursiveCharacterTextSplitterと同様のロジックです。
 *
 * @param text - 分割対象の文字列。
 * @param docId - ドキュメントID。
 * @param title - ドキュメントタイトル。
 * @param chunkSize - 1チャンクあたりの最大文字数。デフォルトは500。
 * @param chunkOverlap - チャンク間の重複文字数。デフォルトは50。
 * @returns チャンク配列。
 */
export const splitIntoChunks = (
  text: string,
  docId: string,
  title: string,
  chunkSize = 500,
  chunkOverlap = 50,
): Chunk[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const separators = ["\n\n", "\n", "。", "、", " ", ""];
  const textChunks = recursiveSplit(trimmed, separators, chunkSize, chunkOverlap);

  return textChunks.map((chunkText, index) => ({
    id: `${docId}-${index}`,
    docId,
    title,
    chunkIndex: index,
    text: chunkText,
  }));
};

/**
 * テキストをセパレーターリストに基づいて再帰的に分割・結合します。
 */
function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number,
  chunkOverlap: number,
): string[] {
  const finalChunks: string[] = [];
  
  // 適切なセパレーターを探す
  let separator = separators[0];
  let newSeparators = separators.slice(1);
  let separatorFound = false;

  for (const sep of separators) {
    if (text.includes(sep)) {
      separator = sep;
      separatorFound = true;
      newSeparators = separators.slice(separators.indexOf(sep) + 1);
      break;
    }
  }

  // セパレーターがない場合
  if (!separatorFound) {
    if (text.length > chunkSize) {
      // 強制分割
      for (let i = 0; i < text.length; i += chunkSize - chunkOverlap) {
        finalChunks.push(text.slice(i, i + chunkSize));
      }
      return finalChunks;
    } else {
      return [text];
    }
  }

  // セパレーターで分割
  // note: split() するとセパレーターが消えるので、後で復元できるように工夫が必要
  // ここでは簡易的に「後ろにつける」か「前につける」かだが、
  // LangChainのデフォルトは "shared" だが、実装簡略化のため
  // 「分割後の各パーツの末尾にセパレーターを付与する（最後以外）」方針でいく
  const parts = text.split(separator);
  const goodSplits: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    let part = parts[i];
    if (i < parts.length - 1) {
      part += separator;
    }
    
    if (part.length < chunkSize) {
      goodSplits.push(part);
    } else {
      // 1パーツだけでサイズ超過する場合は再帰的に分割
      if (newSeparators.length > 0) {
        const subSplits = recursiveSplit(part, newSeparators, chunkSize, chunkOverlap);
        goodSplits.push(...subSplits);
      } else {
        // セパレーター切れなら強制分割
        for (let j = 0; j < part.length; j += chunkSize - chunkOverlap) {
          goodSplits.push(part.slice(j, j + chunkSize));
        }
      }
    }
  }

  // 分割片をチャンクサイズに収まるようにマージ
  let currentChunk: string[] = [];
  let currentLen = 0;

  for (const split of goodSplits) {
    if (currentLen + split.length > chunkSize) {
      if (currentLen > 0) {
        const doc = currentChunk.join("");
        finalChunks.push(doc);

        // オーバーラップ処理
        // 直前のチャンクの末尾から overlap 分だけ取得して次のチャンクの先頭にする
        let overlapBuffer: string[] = [];
        let overlapLen = 0;
        
        // 後ろから遡ってバッファに入れる
        for (let k = currentChunk.length - 1; k >= 0; k--) {
          const part = currentChunk[k];
          if (overlapLen < chunkOverlap) {
            overlapBuffer.unshift(part);
            overlapLen += part.length;
          } else {
            break;
          }
        }
        
        currentChunk = [...overlapBuffer, split];
        currentLen = overlapLen + split.length;
      } else {
        // split単体でサイズ超過（本来ここには来ないはずだが念のため）
        finalChunks.push(split);
        currentChunk = [];
        currentLen = 0;
      }
    } else {
      currentChunk.push(split);
      currentLen += split.length;
    }
  }

  if (currentChunk.length > 0) {
    finalChunks.push(currentChunk.join(""));
  }

  return finalChunks;
}

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