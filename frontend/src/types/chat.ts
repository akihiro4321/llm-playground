export const ChatRoles = {
  System: "system",
  User: "user",
  Assistant: "assistant",
} as const;

export type ChatRole = (typeof ChatRoles)[keyof typeof ChatRoles];

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type PresetId = "polite" | "casual" | "english-coach";

export type PresetOption = {
  id: PresetId;
  label: string;
  prompt: string;
};
