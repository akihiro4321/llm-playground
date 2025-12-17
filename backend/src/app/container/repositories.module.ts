import type { QdrantVectorStore } from "@langchain/qdrant";
import { asFunction, asValue, type AwilixContainer } from "awilix";

import { createVectorStore } from "@/app/config/vectorStore";
import { chatRepository } from "@/modules/history/repository/chatRepository";
import { knowledgeRepository } from "@/modules/rag/repository/knowledgeRepository";
import { openaiRepository } from "@/shared/infrastructure/repositories/openaiRepository";

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
