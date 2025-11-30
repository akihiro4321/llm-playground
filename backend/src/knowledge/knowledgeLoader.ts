import { promises as fs } from "fs";

import { KNOWLEDGE_FILE_PATH } from "@/knowledge/knowledgeConfig";

/**
 * 知識ベースのテキストファイルを読み込み、トリムした文字列を返します。
 *
 * @returns テキスト本文。読み込みに失敗した場合は`null`。
 */
export const loadKnowledgeText = async (): Promise<string | null> => {
  try {
    const buffer = await fs.readFile(KNOWLEDGE_FILE_PATH, { encoding: "utf-8" });
    return buffer.trim();
  } catch (error) {
    console.error("Failed to load knowledge file:", error);
    return null;
  }
};
