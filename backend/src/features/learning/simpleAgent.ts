import type OpenAI from "openai";

import { availableTools, toolsSchema } from "./tools";

/**
 * 学習用の同期型Agentを実行します。
 * ストリーミングを使わず、ツール実行を含むループ処理を同期的に行います。
 *
 * @param openaiClient - OpenAIクライアント
 * @param userQuery - ユーザーからの質問
 * @returns 最終的なAIの回答
 */
export const runLearningAgent = async (
  openaiClient: OpenAI | null,
  userQuery: string
): Promise<string> => {
  if (!openaiClient) {
    return "OpenAI APIキーが設定されていません。";
  }

  // 会話履歴の初期化
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content:
        "あなたは親切なアシスタントです。ツールを使って正確な情報を提供してください。",
    },
    {
      role: "user",
      content: userQuery,
    },
  ];

  const MAX_TURNS = 5; // 無限ループ防止のための最大ターン数
  let turnCount = 0;

  while (turnCount < MAX_TURNS) {
    turnCount++;
    console.log(`\n🔄 [TURN ${turnCount}]`);

    // OpenAI APIを呼び出す（同期処理）
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      tools: toolsSchema,
      tool_choice: "auto",
      stream: false, // 重要: ストリーミングを無効化
    });

    const message = response.choices[0].message;

    // 履歴に追加
    messages.push(message);

    // レスポンスのログ出力
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log("🤖 [AI] Response: ツール要求");
    } else {
      console.log("🤖 [AI] Response:", message.content);
    }

    // ツール呼び出しがある場合
    if (message.tool_calls && message.tool_calls.length > 0) {
      // 各ツールを実行
      for (const toolCall of message.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        console.log(`📞 [TOOL CALL] ${functionName}(${JSON.stringify(functionArgs)})`);

        // ツールの実行
        const toolFunction = availableTools[functionName];
        if (!toolFunction) {
          throw new Error(`未知のツール: ${functionName}`);
        }

        const result = toolFunction(functionArgs);

        // ツール実行結果を履歴に追加
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });

        console.log(`✅ [TOOL RESULT] ${JSON.stringify(result)}`);
      }

      // ツール実行後、次のターンへ
      continue;
    }

    // ツール呼び出しがない場合 = 最終回答
    return message.content || "回答がありませんでした。";
  }

  // 最大ターン数に達した場合
  return `最大ターン数（${MAX_TURNS}）に達したため、処理を終了しました。`;
};
