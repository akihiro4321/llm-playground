import { SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearch } from "@langchain/tavily";

import { loadEnv } from "@/app/config/env";
import { MODEL_NAME } from "@/app/config/model";
import { createOpenAiClient } from "@/app/config/openai";

import { AgentState } from "./types";

const env = loadEnv();

function getModel() {
  const model = createOpenAiClient(env.openaiApiKey, MODEL_NAME, false, 0);
  if (!model) throw new Error("OpenAI Client not initialized");
  return model;
}

// Research Agent (ReAct)
export const createResearchAgent = () => {
  const tools = [
    new TavilySearch({
      maxResults: 3,
      tavilyApiKey: env.tavilyApiKey,
    }),
  ];
  const model = getModel();

  const agent = createReactAgent({
    llm: model,
    tools,
    messageModifier: new SystemMessage(
      "You are a researcher. Use the search tool to find information about the user's query."
    ),
  });

  return async (state: AgentState, config?: RunnableConfig) => {
    const result = await agent.invoke(state, config);
    const newMessages = result.messages.slice(state.messages.length);
    return { messages: newMessages };
  };
};

// Writer Agent (Simple LLM wrapped in Agent)
export const createWriterAgent = () => {
  const model = getModel();
  const agent = createReactAgent({
    llm: model,
    tools: [],
    messageModifier: new SystemMessage(
      "You are a writer. Summarize the conversation and write a comprehensive answer based on the provided information."
    ),
  });

  return async (state: AgentState, config?: RunnableConfig) => {
    const result = await agent.invoke(state, config);
    const newMessages = result.messages.slice(state.messages.length);
    return { messages: newMessages };
  };
};
