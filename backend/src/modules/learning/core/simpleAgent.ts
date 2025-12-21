import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import type { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { traceable } from "langsmith/traceable";

import { loadEnv } from "@/app/config/env";

import { callResearcher, callSupervisor, callWriter } from "./multiAgent";
import { availableTools, toolsSchema } from "./tools";

const env = loadEnv();

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

  const searchTool = new TavilySearch({
    maxResults: 3,
    tavilyApiKey: env.tavilyApiKey,
  });

  // ツールをバインド
  const modelWithTools = chatModel.bindTools([...toolsSchema, searchTool]);

  // 会話履歴の初期化
  const messages: BaseMessage[] = [
    new SystemMessage(
      `
      あなたは優秀なAIアシスタントです。
      質問に答えるために、利用可能なツールを適切に使用してください。

      【重要：思考プロセス】
      ツールを使用する前、または回答する前に、必ず以下のフォーマットであなたの思考を出力してください。

      Thought: [ここに、ユーザーの意図の理解、次にすべき行動、その理由などを記述する]

      例：
      Thought: ユーザーは天気を知りたがっている。場所は東京だ。get_current_weatherツールを使う必要がある。
      (その後にツール呼び出し)
      `
    ),
    new HumanMessage(userQuery),
  ];

  const MAX_TURNS = 5; // 無限ループ防止のための最大ターン数
  let turnCount = 0;

  while (turnCount < MAX_TURNS) {
    turnCount++;

    // LangChain APIを呼び出す（同期処理）
    const response = await modelWithTools.invoke(messages);

    // 履歴に追加
    messages.push(response);

    // ツール呼び出しがある場合
    if (response.tool_calls && response.tool_calls.length > 0) {
      // 各ツールを実行
      for (const toolCall of response.tool_calls) {
        // ツールの実行
        let result;
        if (toolCall.name === searchTool.name) {
          result = await searchTool.invoke(toolCall.args as any);
        } else {
          const toolFn = availableTools[toolCall.name];
          if (!toolFn) throw new Error(`未知のツール: ${toolCall.name}`);
          result = await toolFn(toolCall.args);
        }

        // ツール実行結果を履歴に追加
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id || "",
            content: JSON.stringify(result),
          })
        );
      }
      // ツール実行後、次のターンへ
      continue;
    }

    // ツール呼び出しがない場合 = 最終回答
    let finalContent =
      typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    // "Thought:" から始まる思考プロセス部分を削除（ユーザーには見せない）
    // Thought: ... (改行) までを削除
    finalContent = finalContent.replace(/Thought:[\s\S]*?(\n\n|\n|$)/g, "").trim();

    return finalContent;
  }

  // 最大ターン数に達した場合
  return `最大ターン数（${MAX_TURNS}）に達したため、処理を終了しました。`;
};

/**
 * マルチエージェントシステムを一つのトレースとして実行します。
 */
export const runMultiAgentSystem = traceable(
  async (chatModel: ChatOpenAI | null, userQuery: string): Promise<string> => {
    if (!chatModel) {
      return "OpenAI APIキーが設定されていません。";
    }

    const history: BaseMessage[] = [new HumanMessage(userQuery)];
    let nextAgent = "Supervisor";
    let currentInstruction = "";
    let loopCount = 0;
    const MAX_LOOPS = 10;

    console.log("\n👥 [MultiAgent] System Start");

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      console.log(`\n🔄 [Loop ${loopCount}] Next: ${nextAgent}`);

      if (nextAgent === "Supervisor") {
        const result = await callSupervisor(chatModel, history);

        if (result.next === "FINISH") {
          console.log("🏁 [MultiAgent] Finished");
          break;
        }

        nextAgent = result.next;
        currentInstruction = result.instruction || "";
      } else if (nextAgent === "Researcher") {
        const result = await callResearcher(chatModel, currentInstruction);

        history.push(new HumanMessage({ name: "Researcher", content: `【調査結果】\n${result}` }));
        nextAgent = "Supervisor";
      } else if (nextAgent === "Writer") {
        // historyを文字列コンテキストに変換
        const context = history.map((m) => `[${m.name || "User"}]: ${m.content}`).join("\n\n");

        const result = await callWriter(chatModel, context, currentInstruction);

        history.push(new HumanMessage({ name: "Writer", content: result }));
        nextAgent = "Supervisor";
      }
    }

    if (loopCount >= MAX_LOOPS) {
      return "システムエラー: ループ回数が上限に達しました。";
    }

    // 最後のメッセージ（Writerの成果物など）を返す
    const lastMessage = history[history.length - 1];
    return typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);
  },
  { name: "MultiAgentSystem" }
);
