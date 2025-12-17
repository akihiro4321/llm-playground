import path from "path";

export interface KnowledgeDocConfig {
  id: string;
  title: string;
  filePath: string;
}

const KNOWLEDGE_DIR = path.resolve(process.cwd(), "knowledge/docs");

export const KNOWLEDGE_DOCS: KnowledgeDocConfig[] = [
  {
    id: "service-a",
    title: "Service A Specification",
    filePath: path.resolve(KNOWLEDGE_DIR, "service-a.txt"),
  },
  {
    id: "service-b",
    title: "Service B Specification",
    filePath: path.resolve(KNOWLEDGE_DIR, "service-b.txt"),
  },
];
