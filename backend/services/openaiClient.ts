import OpenAI from "openai";

import { HttpError } from "../errors/httpError.js";
import type { ChatMessage } from "../types/chat.js";

export const createOpenAiClient = (apiKey?: string): OpenAI | null => {
  return apiKey ? new OpenAI({ apiKey }) : null;
};

export const generateChatReply = async (
  openaiClient: OpenAI | null,
  messages: ChatMessage[],
  modelName: string,
): Promise<string> => {
  if (!openaiClient) {
    return "（スタブ応答）OpenAI API キーを設定してください。";
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: modelName,
      messages,
    });

    return completion.choices?.[0]?.message?.content?.trim() || "返答を生成できませんでした。";
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status) {
      throw new HttpError(error.status, "OpenAI API でエラーが発生しました。");
    }

    throw new HttpError(500, "チャット応答の生成に失敗しました。");
  }
};
