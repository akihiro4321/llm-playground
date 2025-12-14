import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { HttpError } from "@/errors/httpError";
import { getCurrentWeatherToolDefinition, toolFunctions } from "@/features/agent/tools";
import { type ChatMessage, ChatRoles } from "@/types/chat";

// スタブ用の非同期ジェネレーター
async function* createMockStream(
  content: string
): AsyncIterable<{ content: string } | { message: ChatMessage }> {
  const chunks = content.split("");
  for (const chunk of chunks) {
    // 少し遅延させてストリーミングっぽくする
    await new Promise((resolve) => setTimeout(resolve, 30));
    yield { content: chunk };
  }
}

/**
 * ChatMessageをLangChainのBaseMessage形式に変換します。
 *
 * @param messages - 変換するメッセージ配列。
 * @returns LangChain BaseMessage配列。
 */
function convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
  return messages.map((msg) => {
    if (msg.role === ChatRoles.System) {
      return new SystemMessage(msg.content || "");
    }
    if (msg.role === ChatRoles.User) {
      return new HumanMessage(msg.content || "");
    }
    if (msg.role === ChatRoles.Tool) {
      return new ToolMessage({
        content: msg.content || "",
        tool_call_id: msg.tool_call_id || "",
      });
    }
    if (msg.role === ChatRoles.Assistant) {
      // OpenAI 形式の tool_calls を LangChain 形式に変換
      const toolCalls = msg.tool_calls?.map((tc) => ({
        name: tc.function.name,
        args: JSON.parse(tc.function.arguments || "{}"),
        id: tc.id,
      })) || [];

      return new AIMessage({
        content: msg.content || "",
        tool_calls: toolCalls,
      });
    }
    // Fallback to HumanMessage
    return new HumanMessage(msg.content || "");
  });
}

/**
 * ツール呼び出しを実行し、結果メッセージを生成します。
 *
 * @param toolCalls - 実行するツール呼び出し配列（LangChain形式）。
 * @returns ツール応答メッセージ配列。
 */
async function executeToolCalls(
  toolCalls: Array<{ name: string; args: Record<string, any>; id: string }>
): Promise<ChatMessage[]> {
  const toolMessages: ChatMessage[] = [];

  for (const call of toolCalls) {
    const functionName = call.name;
    const functionToCall = toolFunctions[functionName];
    if (functionToCall) {
      const toolOutput = await functionToCall(call.args.location); // Assuming only location for now

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
 * LangChainを使ってストリーミングリクエストを送信し、レスポンスを処理します。
 *
 * @param chatModel - LangChain ChatOpenAIインスタンス。
 * @param messages - 送信するメッセージ配列（LangChain BaseMessage形式）。
 * @returns ストリーミングレスポンスとツール呼び出し情報。
 */
async function* streamChatCompletion(
  chatModel: ChatOpenAI,
  messages: BaseMessage[]
): AsyncGenerator<
  { content: string },
  {
    toolCalls: Array<{ name: string; args: Record<string, any>; id: string }>;
  }
> {
  // ツール定義をバインド
  const modelWithTools = chatModel.bindTools([getCurrentWeatherToolDefinition]);

  // ストリーミング実行
  const stream = await modelWithTools.stream(messages);

  let toolCalls: Array<{ name: string; args: Record<string, any>; id: string }> = [];

  for await (const chunk of stream) {
    // テキストコンテンツがある場合はyield
    if (chunk.content) {
      const contentStr = typeof chunk.content === "string" ? chunk.content : "";
      yield { content: contentStr };
    }

    // ツール呼び出しがある場合は蓄積（idがundefinedの場合はフィルタリング）
    if (chunk.tool_calls && chunk.tool_calls.length > 0) {
      toolCalls = chunk.tool_calls
        .filter((tc) => tc.id !== undefined)
        .map((tc) => ({
          name: tc.name,
          args: tc.args,
          id: tc.id!,
        }));
    }
  }

  return { toolCalls };
}

export const openaiRepository = {
  /**
   * チャットメッセージ配列をLangChain経由でOpenAIに送り、アシスタントの応答を生成します。
   * ストリーミング形式で返します。
   *
   * @param chatModel - LangChain ChatOpenAIインスタンス。未設定ならスタブ応答をストリームで返します。
   * @param messages - 送信するメッセージ配列。
   * @returns 応答の非同期イテレータ。
   * @throws HttpError OpenAI API呼び出しに失敗した場合。
   */
  async *generateChatReply(
    chatModel: ChatOpenAI | null,
    messages: ChatMessage[]
  ): AsyncIterable<{ content: string } | { message: ChatMessage }> {
    if (!chatModel) {
      yield* createMockStream("（スタブ応答）OpenAI API キーを設定してください。");
      return;
    }

    try {
      const langchainMessages = convertToLangChainMessages(messages);
      const { toolCalls } = yield* streamChatCompletion(
        chatModel,
        langchainMessages
      );

      if (toolCalls.length > 0) {
        // Add assistant's tool_calls message to history
        const assistantToolCallMessage: ChatMessage = {
          role: ChatRoles.Assistant,
          content: null, // Content is null for tool_calls
          tool_calls: toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.args),
            },
          })),
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
        yield* this.generateChatReply(chatModel, newMessages);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpError(500, `LangChain API でエラーが発生しました: ${error.message}`);
      }

      throw new HttpError(500, "チャット応答の生成に失敗しました。");
    }
  },
};
