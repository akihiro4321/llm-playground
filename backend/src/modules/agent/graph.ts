import { tool } from "@langchain/core/tools";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

import { loadEnv } from "@/app/config/env";
import { MODEL_NAME } from "@/app/config/model";
import { createOpenAiClient } from "@/app/config/openai";

import { getCurrentWeather } from "./tools";

const env = loadEnv();

export type AgentState = typeof MessagesAnnotation.State;

const weatherTool = tool(
  async ({ location }) => {
    return await getCurrentWeather(location);
  },
  {
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    schema: z.object({
      location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    }),
  }
);

const tools = [weatherTool];
const toolNode = new ToolNode(tools);

const model = createOpenAiClient(
  env.openaiApiKey,
  MODEL_NAME,
  false, // streaming
  0 // temperature
);

if (!model) {
  throw new Error("OpenAI API Key is missing");
}

const modelWithTools = model.bindTools(tools);

async function callModel(state: AgentState) {
  const { messages } = state;
  const response = await modelWithTools.invoke(messages);
  return { messages: [response] };
}

function shouldContinue(state: AgentState) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
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
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const graph = workflow.compile();
