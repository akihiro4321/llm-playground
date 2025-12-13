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

// スタブ用の非同期ジェネレーター
async function* createMockStream(
  content: string,
): AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk> {
  const chunks = content.split("");
  for (const chunk of chunks) {
    // 少し遅延させてストリーミングっぽくする
    await new Promise((resolve) => setTimeout(resolve, 30));
    yield {
      id: "mock-id",
      created: Date.now(),
      model: "mock-model",
      object: "chat.completion.chunk",
      choices: [
        {
          index: 0,
          delta: { content: chunk },
          finish_reason: null,
        },
      ],
    } as OpenAI.Chat.Completions.ChatCompletionChunk;
  }
}

/**
 * チャットメッセージ配列をOpenAIに送り、アシスタントの応答を生成します。
 * ストリーミング形式で返します。
 *
 * @param openaiClient - OpenAIクライアント。未設定ならスタブ応答をストリームで返します。
 * @param messages - 送信するメッセージ配列。
 * @param modelName - 使用するモデル名。
 * @returns 応答の非同期イテレータ。
 * @throws HttpError OpenAI API呼び出しに失敗した場合。
 */
export const generateChatReply = async (
  openaiClient: OpenAI | null,
  messages: ChatMessage[],
  modelName: string,
): Promise<AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>> => {
  if (!openaiClient) {
    return createMockStream("（スタブ応答）OpenAI API キーを設定してください。");
  }

  try {
    const stream = await openaiClient.chat.completions.create({
      model: modelName,
      messages,
      stream: true,
    });

    return stream;
  } catch (error) {
    if (error instanceof OpenAI.APIError && error.status) {
      throw new HttpError(error.status, "OpenAI API でエラーが発生しました。");
    }

    throw new HttpError(500, "チャット応答の生成に失敗しました。");
  }
};
