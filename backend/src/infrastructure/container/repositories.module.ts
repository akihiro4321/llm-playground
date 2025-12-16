import type { QdrantVectorStore } from "@langchain/qdrant";
import { asFunction, asValue, type AwilixContainer } from "awilix";

import { chatRepository } from "@/infrastructure/repositories/chatRepository";
import { knowledgeRepository } from "@/infrastructure/repositories/knowledgeRepository";
import { openaiRepository } from "@/infrastructure/repositories/openaiRepository";
import { createVectorStore } from "@/rag/vectorStore";

export interface RepositoriesCradle {
  chatRepository: typeof chatRepository;
  knowledgeRepository: typeof knowledgeRepository;
  openaiRepository: typeof openaiRepository;
  vectorStore: QdrantVectorStore | null;
}

/**
 * リポジトリ層の依存関係を登録します
 *
 * @param container - Awilixコンテナ
 */
export function registerRepositories(container: AwilixContainer): void {
  container.register({
    chatRepository: asValue(chatRepository),
    knowledgeRepository: asValue(knowledgeRepository),
    openaiRepository: asValue(openaiRepository),
    vectorStore: asFunction(({ embeddingsModel }) => {
      return embeddingsModel ? createVectorStore(embeddingsModel) : null;
    }).singleton(),
  });
}
