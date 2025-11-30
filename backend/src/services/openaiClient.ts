import OpenAI from "openai";

import { HttpError } from "@/errors/httpError";
import type { ChatMessage } from "@/types/chat";

/**
 * OpenAIクライアントをAPIキーから初期化します。
 *
 * @param apiKey - OpenAIのAPIキー。未設定の場合は`null`を返します。
 * @returns 初期化済みのクライアントまたは`null`。
 */
export const createOpenAiClient = (apiKey?: string): OpenAI | null => {
  return apiKey ? new OpenAI({ apiKey }) : null;
};

/**
 * チャットメッセージ配列をOpenAIに送り、アシスタントの応答を生成します。
 *
 * @param openaiClient - OpenAIクライアント。未設定ならスタブ応答を返します。
 * @param messages - 送信するメッセージ配列。
 * @param modelName - 使用するモデル名。
 * @returns 生成された応答文字列。
 * @throws HttpError OpenAI API呼び出しに失敗した場合。
 */
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
