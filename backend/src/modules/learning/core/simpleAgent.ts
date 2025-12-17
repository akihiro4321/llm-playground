import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";

import { availableTools, toolsSchema } from "./tools";

/**
 * 学習用の同期型Agentを実行します。
 * ストリーミングを使わず、ツール実行を含むループ処理を同期的に行います。
 *
 * @param chatModel - LangChain ChatOpenAIインスタンス
 * @param userQuery - ユーザーからの質問
 * @returns 最終的なAIの回答
 */
export const runLearningAgent = async (
  chatModel: ChatOpenAI | null,
  userQuery: string
): Promise<string> => {
  if (!chatModel) {
    return "OpenAI APIキーが設定されていません。";
  }

  // ツールをバインド
  const modelWithTools = chatModel.bindTools(toolsSchema);

  // 会話履歴の初期化
  const messages: BaseMessage[] = [
    new SystemMessage(
      "あなたは親切なアシスタントです。ツールを使って正確な情報を提供してください。"
    ),
    new HumanMessage(userQuery),
  ];

  const MAX_TURNS = 5; // 無限ループ防止のための最大ターン数
  let turnCount = 0;

  while (turnCount < MAX_TURNS) {
    turnCount++;
    console.log(`\n🔄 [TURN ${turnCount}]`);

    // LangChain APIを呼び出す（同期処理）
    const response = await modelWithTools.invoke(messages);

    // 履歴に追加
    messages.push(response);

    // レスポンスのログ出力
    if (response.tool_calls && response.tool_calls.length > 0) {
      console.log("🤖 [AI] Response: ツール要求");
    } else {
      console.log("🤖 [AI] Response:", response.content);
    }

    // ツール呼び出しがある場合
    if (response.tool_calls && response.tool_calls.length > 0) {
      // 各ツールを実行
      for (const toolCall of response.tool_calls) {
        const functionName = toolCall.name;
        const functionArgs = toolCall.args;

        console.log(
          `📞 [TOOL CALL] ${functionName}(${JSON.stringify(functionArgs)})`
        );

        // ツールの実行
        const toolFunction = availableTools[functionName];
        if (!toolFunction) {
          throw new Error(`未知のツール: ${functionName}`);
        }

        const result = toolFunction(functionArgs);

        // ツール実行結果を履歴に追加
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id || "",
            content: JSON.stringify(result),
          })
        );

        console.log(`✅ [TOOL RESULT] ${JSON.stringify(result)}`);
      }

      // ツール実行後、次のターンへ
      continue;
    }

    // ツール呼び出しがない場合 = 最終回答
    return typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);
  }

  // 最大ターン数に達した場合
  return `最大ターン数（${MAX_TURNS}）に達したため、処理を終了しました。`;
};
