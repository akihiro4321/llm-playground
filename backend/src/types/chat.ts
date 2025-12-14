import OpenAI from "openai";

export const ChatRoles = {
  System: "system",
  User: "user",
  Assistant: "assistant",
  Tool: "tool",
} as const;

export type ChatRole = (typeof ChatRoles)[keyof typeof ChatRoles];

export type ChatMessage = {
  id?: string; // データベースによって生成されるID
  role: ChatRole;
  content: string | null; // Content can be null for tool_calls
  tool_calls?: OpenAI.ChatCompletionMessageToolCall[];
  tool_call_id?: string;
};

export type ChatRequestBody = {
  messages?: ChatMessage[];
  systemPrompt?: string;
  useKnowledge?: boolean;
  docIds?: string[];
  threadId?: string;
};
