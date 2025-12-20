import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";

import { type ChatMessage, ChatRoles } from "@/shared/types/chat";

export const openaiRepository = {
  /**
   * LangChainのBaseMessageをChatMessage形式に変換します。
   */
  convertFromLangChainMessage(msg: BaseMessage): ChatMessage {
    if (msg instanceof SystemMessage) {
      return { role: ChatRoles.System, content: msg.content as string };
    }
    if (msg instanceof HumanMessage) {
      return { role: ChatRoles.User, content: msg.content as string };
    }
    if (msg instanceof ToolMessage) {
      return {
        role: ChatRoles.Tool,
        content: msg.content as string,
        tool_call_id: msg.tool_call_id,
      };
    }
    if (msg instanceof AIMessage) {
      return {
        role: ChatRoles.Assistant,
        content: (msg.content as string) || null,
        tool_calls: msg.tool_calls?.map((tc) => ({
          id: tc.id!,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.args),
          },
        })),
      };
    }
    return { role: ChatRoles.Assistant, content: msg.content as string };
  },

  /**
   * ChatMessageをLangChainのBaseMessage形式に変換します。
   * @param messages - 変換するメッセージ配列。
   * @returns LangChain BaseMessage配列。
   */
  convertToLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
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
        const toolCalls =
          msg.tool_calls?.map((tc) => ({
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
  },
};
