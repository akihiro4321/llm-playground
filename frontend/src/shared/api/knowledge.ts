import { KNOWLEDGE_DOCS_ENDPOINT } from "@/shared/config/chatConfig";

export type KnowledgeDocSummary = {
  id: string;
  title: string;
};

export const fetchKnowledgeDocs = async (): Promise<KnowledgeDocSummary[]> => {
  const response = await fetch(KNOWLEDGE_DOCS_ENDPOINT);

  if (!response.ok) {
    throw new Error(`Failed to fetch knowledge docs: ${response.status}`);
  }

  return (await response.json()) as KnowledgeDocSummary[];
};
