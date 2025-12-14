import OpenAI from "openai";

import { HttpError } from "@/errors/httpError";
import { getCurrentWeatherToolDefinition, toolFunctions } from "@/features/agent/tools";
import { type ChatMessage,ChatRoles } from "@/types/chat";

// スタブ用の非同期ジェネレーター
async function* createMockStream(
  content: string
): AsyncIterable<OpenAI.ChatCompletionChunk | { message: ChatMessage }> {
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
    } as OpenAI.ChatCompletionChunk;
  }
}

/**
 * ChatMessageをOpenAI APIのメッセージ形式に変換します。
 *
 * @param messages - 変換するメッセージ配列。
 * @returns OpenAI API用のメッセージ配列。
 */
function convertToOpenAIMessages(
  messages: ChatMessage[]
): OpenAI.ChatCompletionMessageParam[] {
  return messages.map((msg) => {
    if (msg.role === ChatRoles.Tool) {
      return {
        role: ChatRoles.Tool,
        tool_call_id: msg.tool_call_id || "",
        content: msg.content || "",
      } as OpenAI.ChatCompletionToolMessageParam;
    }
    if (msg.role === ChatRoles.Assistant && msg.tool_calls) {
      return {
        role: ChatRoles.Assistant,
        content: msg.content, // content can be null
        tool_calls: msg.tool_calls,
      } as OpenAI.ChatCompletionAssistantMessageParam;
    }
    // user, system, or assistant without tool_calls
    return {
      role: msg.role,
      content: msg.content || "",
    } as OpenAI.ChatCompletionMessageParam;
  });
}

/**
 * ストリーミングチャンクからツール呼び出しを蓄積します。
 *
 * @param delta - チャンクのデルタ部分。
 * @param toolCalls - 蓄積中のツール呼び出し配列。
 */
function accumulateToolCalls(
  delta: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta,
  toolCalls: OpenAI.ChatCompletionMessageToolCall[]
): void {
  if (!delta?.tool_calls) return;

  for (const toolCall of delta.tool_calls) {
    if (toolCall.index === undefined) continue;

    if (toolCalls[toolCall.index]) {
      // Append to existing tool_call
      if (toolCall.function?.arguments) {
        toolCalls[toolCall.index].function.arguments +=
          toolCall.function.arguments;
      }
    } else {
      // New tool_call
      toolCalls[toolCall.index] = {
        id: toolCall.id || "",
        type: "function",
        function: {
          name: toolCall.function?.name || "",
          arguments: toolCall.function?.arguments || "",
        },
      };
    }
  }
}

/**
 * ツール呼び出しを実行し、結果メッセージを生成します。
 *
 * @param toolCalls - 実行するツール呼び出し配列。
 * @returns ツール応答メッセージ配列。
 */
async function executeToolCalls(
  toolCalls: OpenAI.ChatCompletionMessageToolCall[]
): Promise<ChatMessage[]> {
  const toolMessages: ChatMessage[] = [];

  for (const call of toolCalls) {
    const functionName = call.function.name;
    const functionToCall = toolFunctions[functionName];
    if (functionToCall) {
      const functionArgs = JSON.parse(call.function.arguments || "{}");
      const toolOutput = await functionToCall(functionArgs.location); // Assuming only location for now

      toolMessages.push({
        role: ChatRoles.Tool,
        tool_call_id: call.id,
        content: toolOutput,
      });
    }
  }

  return toolMessages;
}

/**
 * OpenAI APIにストリーミングリクエストを送信し、レスポンスを処理します。
 *
 * @param openaiClient - OpenAIクライアント。
 * @param messages - 送信するメッセージ配列。
 * @param modelName - 使用するモデル名。
 * @returns ストリーミングレスポンスとツール呼び出し情報。
 */
async function* streamChatCompletion(
  openaiClient: OpenAI,
  messages: OpenAI.ChatCompletionMessageParam[],
  modelName: string
): AsyncGenerator<
  OpenAI.ChatCompletionChunk,
  {
    finishReason: string | null;
    toolCalls: OpenAI.ChatCompletionMessageToolCall[];
  }
> {
  const stream = await openaiClient.chat.completions.create({
    model: modelName,
    messages,
    stream: true,
    tools: [getCurrentWeatherToolDefinition],
    tool_choice: "auto",
  });

  const toolCalls: OpenAI.ChatCompletionMessageToolCall[] = [];
  let finishReason: string | null = null;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta;
    finishReason = chunk.choices[0]?.finish_reason || finishReason;

    accumulateToolCalls(delta, toolCalls);
    yield chunk;
  }

  return { finishReason, toolCalls };
}

export const openaiRepository = {
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
  async *generateChatReply(
    openaiClient: OpenAI | null,
    messages: ChatMessage[],
    modelName: string
  ): AsyncIterable<OpenAI.ChatCompletionChunk | { message: ChatMessage }> {
    if (!openaiClient) {
      yield* createMockStream("（スタブ応答）OpenAI API キーを設定してください。");
      return;
    }

    try {
      const chatMessages = convertToOpenAIMessages(messages);
      const { finishReason, toolCalls } = yield* streamChatCompletion(
        openaiClient,
        chatMessages,
        modelName
      );

      if (finishReason === "tool_calls" && toolCalls.length > 0) {
        // Add assistant's tool_calls message to history
        const assistantToolCallMessage: ChatMessage = {
          role: ChatRoles.Assistant,
          content: null, // Content is null for tool_calls
          tool_calls: toolCalls,
        };
        yield { message: assistantToolCallMessage };

        // Execute tool calls and generate tool response messages
        const toolMessages = await executeToolCalls(toolCalls);
        for (const toolMessage of toolMessages) {
          yield { message: toolMessage };
        }

        // Recursively call generateChatReply with updated messages
        const newMessages = [
          ...messages,
          assistantToolCallMessage,
          ...toolMessages,
        ];
        yield* this.generateChatReply(openaiClient, newMessages, modelName);
      }
    } catch (error) {
      if (error instanceof OpenAI.APIError && error.status) {
        throw new HttpError(error.status, "OpenAI API でエラーが発生しました。");
      }

      throw new HttpError(500, "チャット応答の生成に失敗しました。");
    }
  },
};
