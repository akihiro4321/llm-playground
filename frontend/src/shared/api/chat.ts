import type { ChatMessage } from "@/entities/message";
import { API_ENDPOINT } from "@/shared/config/chatConfig";

export type ChatResponse = {
  reply?: string;
  error?: string;
};

export type ChatRequestPayload = {
  messages: ChatMessage[];
  systemPrompt: string;
  useKnowledge: boolean;
  docIds: string[];
};

export const sendChat = async (payload: ChatRequestPayload): Promise<ChatResponse> => {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as ChatResponse;
};
