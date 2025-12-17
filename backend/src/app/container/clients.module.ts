import type { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { asValue, type AwilixContainer } from "awilix";

import { createEmbeddingsClient, createOpenAiClient } from "@/app/config/openai";

export interface ClientsCradle {
  chatModel: ChatOpenAI | null;
  embeddingsModel: OpenAIEmbeddings | null;
}

/**
 * 外部クライアント（OpenAI, LangChainなど）の依存関係を登録します
 *
 * @param container - Awilixコンテナ
 */
export function registerClients(container: AwilixContainer): void {
  const { env } = container.cradle;

  container.register({
    // LangChain ChatOpenAI client
    chatModel: asValue(createOpenAiClient(env.openaiApiKey)),

    // LangChain OpenAIEmbeddings client
    embeddingsModel: asValue(createEmbeddingsClient(env.openaiApiKey)),
  });
}
