export const ChatRoles = {
  System: "system",
  User: "user",
  Assistant: "assistant",
  Tool: "tool",
} as const;

export type ChatRole = (typeof ChatRoles)[keyof typeof ChatRoles];

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type ChatMessage = {
  id?: string;
  role: ChatRole;
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export type PresetId = "polite" | "casual" | "english-coach";

export type PresetOption = {
  id: PresetId;
  label: string;
  prompt: string;
};
