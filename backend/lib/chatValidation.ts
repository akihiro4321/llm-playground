import { BadRequestError } from "../errors/httpError.js";
import { DEFAULT_SYSTEM_PROMPT } from "../modelConfig.js";
import type { ChatMessage, ChatRequestBody } from "../types/chat.js";

type NormalizedChatRequest = {
  chatMessages: ChatMessage[];
};

const isValidMessage = (message: ChatMessage): boolean => {
  return (
    message &&
    typeof message === "object" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
};

export const normalizeChatRequest = (body: ChatRequestBody | undefined): NormalizedChatRequest => {
  if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new BadRequestError("messages array is required");
  }

  const sanitizedMessages = body.messages
    .filter((message): message is ChatMessage => isValidMessage(message))
    .map((message) => ({
      role: message.role,
      content: message.content.trim(),
    }));

  if (sanitizedMessages.length === 0) {
    throw new BadRequestError("no valid messages in array");
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content:
      typeof body.systemPrompt === "string" && body.systemPrompt.trim()
        ? body.systemPrompt.trim()
        : DEFAULT_SYSTEM_PROMPT,
  };

  return { chatMessages: [systemMessage, ...sanitizedMessages] };
};
