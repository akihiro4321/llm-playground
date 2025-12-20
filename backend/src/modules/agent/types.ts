import { Annotation, MessagesAnnotation } from "@langchain/langgraph";

export const AgentStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  next: Annotation<string>({
    reducer: (x, y) => y ?? x ?? "FINISH",
    default: () => "FINISH",
  }),
});

export type AgentState = typeof AgentStateAnnotation.State;
