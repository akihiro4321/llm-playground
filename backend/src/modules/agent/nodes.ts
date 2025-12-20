import { SystemMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MessagesAnnotation,StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
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

// Helper to create a standard ReAct graph
function createReActGraph(model: any, tools: any[], systemMessage: string) {
  const toolNode = new ToolNode(tools);
  const modelWithTools = model.bindTools(tools);

  async function callModel(state: typeof MessagesAnnotation.State) {
    const messages = [new SystemMessage(systemMessage), ...state.messages];
    const response = await modelWithTools.invoke(messages);
    return { messages: [response] };
  }

  function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1];
    if (
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls.length > 0
    ) {
      return "tools";
    }
    return "__end__";
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addNode("tools", toolNode)
    .addEdge("__start__", "agent")
    .addConditionalEdges("agent", shouldContinue, {
      tools: "tools",
      __end__: "__end__",
    })
    .addEdge("tools", "agent");

  return workflow.compile();
}

// Helper to create a simple LLM graph (no tools)
function createLLMGraph(model: any, systemMessage: string) {
  async function callModel(state: typeof MessagesAnnotation.State) {
    const messages = [new SystemMessage(systemMessage), ...state.messages];
    const response = await model.invoke(messages);
    return { messages: [response] };
  }

  const workflow = new StateGraph(MessagesAnnotation)
    .addNode("agent", callModel)
    .addEdge("__start__", "agent")
    .addEdge("agent", "__end__");

  return workflow.compile();
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

  const agent = createReActGraph(
    model,
    tools,
    "You are a researcher. Use the search tool to find information about the user's query."
  );

  return async (state: AgentState, config?: RunnableConfig) => {
    const result = await agent.invoke(state, config);
    const newMessages = result.messages.slice(state.messages.length);
    return { messages: newMessages };
  };
};

// Writer Agent (Simple LLM)
export const createWriterAgent = () => {
  const model = getModel();
  const agent = createLLMGraph(
    model,
    "You are a writer. Summarize the conversation and write a comprehensive answer based on the provided information."
  );

  return async (state: AgentState, config?: RunnableConfig) => {
    const result = await agent.invoke(state, config);
    const newMessages = result.messages.slice(state.messages.length);
    return { messages: newMessages };
  };
};
