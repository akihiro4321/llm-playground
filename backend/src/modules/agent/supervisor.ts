import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";

import { loadEnv } from "@/app/config/env";
import { MODEL_NAME } from "@/app/config/model";
import { createOpenAiClient } from "@/app/config/openai";

import { AgentState } from "./types";

const env = loadEnv();

const supervisorSchema = z.object({
  next: z.enum(["researcher", "writer", "FINISH"]),
});

export const createSupervisorNode = () => {
  const model = createOpenAiClient(env.openaiApiKey, MODEL_NAME, false, 0);
  if (!model) throw new Error("OpenAI Client not initialized");

  const modelWithStructuredOutput = model.withStructuredOutput(supervisorSchema);

  return async (state: AgentState) => {
    const messages = [
      new SystemMessage(
        "You are a supervisor tasked with managing a conversation between the following workers: [researcher, writer].\n" +
        "Given the following user request, respond with the worker to act next.\n" +
        " - If you need to find information, choose 'researcher'.\n" +
        " - If you have enough information and need to write an answer, choose 'writer'.\n" +
        " - If the answer is complete, choose 'FINISH'."
      ),
      ...state.messages,
    ];

    const result = await modelWithStructuredOutput.invoke(messages);
    return { next: result.next };
  };
};
