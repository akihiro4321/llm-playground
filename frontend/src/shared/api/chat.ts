import type { ChatMessage } from "@/entities/message";
import { API_ENDPOINT } from "@/shared/config/chatConfig";

export type ChatRequestPayload = {
  messages: ChatMessage[];
  systemPrompt: string;
  useKnowledge: boolean;
  docIds: string[];
  threadId?: string;
};

export const sendChat = async (
  payload: ChatRequestPayload,
  onDelta: (delta: string) => void,
  onThreadIdReceived?: (threadId: string) => void,
): Promise<void> => {
  const response = await fetch(API_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const threadId = response.headers.get("X-Thread-Id");
  if (threadId && onThreadIdReceived) {
    onThreadIdReceived(threadId);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is null");
  }

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    onDelta(chunk);
  }
};
