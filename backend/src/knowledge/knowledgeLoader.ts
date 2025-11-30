import { promises as fs } from "fs";

import { KNOWLEDGE_FILE_PATH } from "@/knowledge/knowledgeConfig.js";

export const loadKnowledgeText = async (): Promise<string | null> => {
  try {
    const buffer = await fs.readFile(KNOWLEDGE_FILE_PATH, { encoding: "utf-8" });
    return buffer.trim();
  } catch (error) {
    console.error("Failed to load knowledge file:", error);
    return null;
  }
};
