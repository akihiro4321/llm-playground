import { BadRequestError } from "@/errors/httpError";
import { DEFAULT_SYSTEM_PROMPT } from "@/modelConfig";
import type { ChatMessage, ChatRequestBody } from "@/types/chat";

type NormalizedChatRequest = {
  chatMessages: ChatMessage[];
  useKnowledge: boolean;
  docIds: string[];
  threadId?: string;
};

/**
 * メッセージオブジェクトが有効かを検証します。
 *
 * @param message - 検証対象のメッセージ。
 * @returns 有効な場合は`true`、それ以外は`false`。
 */
const isValidMessage = (message: ChatMessage): boolean => {
  return (
    message &&
    typeof message === "object" &&
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
};

/**
 * クライアントからのボディを正規化し、systemメッセージの付与と `useKnowledge` フラグを確定させます。
 *
 * @param body - リクエストボディ。
 * @returns 正規化済みのメッセージ配列とフラグ。
 * @throws BadRequestError メッセージ配列が不正な場合。
 */
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

  const threadId =
    typeof body.threadId === "string" && body.threadId.trim().length > 0
      ? body.threadId.trim()
      : undefined;

  return {
    chatMessages: [systemMessage, ...sanitizedMessages],
    useKnowledge: body.useKnowledge === true,
    docIds:
      Array.isArray(body.docIds) && body.docIds.length > 0
        ? Array.from(
            new Set(
              body.docIds
                .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
                .map((id) => id.trim()),
            ),
          )
        : [],
    threadId,
  };
};
