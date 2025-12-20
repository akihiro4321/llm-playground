import { StateGraph } from "@langchain/langgraph";

import { createResearchAgent, createWriterAgent } from "./nodes";
import { createSupervisorNode } from "./supervisor";
import { AgentStateAnnotation } from "./types";

const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("supervisor", createSupervisorNode())
  .addNode("researcher", createResearchAgent())
  .addNode("writer", createWriterAgent())
  .addEdge("__start__", "supervisor")
  .addConditionalEdges(
    "supervisor",
    (state) => state.next,
    {
      researcher: "researcher",
      writer: "writer",
      FINISH: "__end__",
    }
  )
  .addEdge("researcher", "supervisor")
  .addEdge("writer", "supervisor");

export const graph = workflow.compile();
