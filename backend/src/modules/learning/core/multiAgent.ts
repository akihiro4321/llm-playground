import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { TavilySearch } from "@langchain/tavily";
import { z } from "zod";

import { loadEnv } from "@/app/config/env";

const env = loadEnv();

export const callSupervisor = async (chatModel: ChatOpenAI, history: BaseMessage[]) => {
  const systemPrompt = `
    あなたは編集長です。以下のメンバーを管理し、ユーザーの依頼を達成してください。
    - Researcher: 情報が足りない場合、調査を依頼する。
    - Writer: 情報が十分集まった場合、記事執筆を依頼する。
    
    【重要：判断基準】
    - 会話履歴を確認し、Researcherによる「調査結果」が既に存在し、質問に答えるのに十分な情報量がある場合は、直ちに "Writer" を指名してください。
    - 同じ内容の再調査は禁止です。情報が多少不足していても、ある情報だけで記事を書かせてください。
    - 全て完了したら FINISH を選択してください。
  `;

  const supervisorSchema = z.object({
    next: z.enum(["Researcher", "Writer", "FINISH"]).describe("次に呼び出すワーカー、または終了"),
    instruction: z.string().describe("そのワーカーへの具体的な指示内容"),
  });

  const model = chatModel.withStructuredOutput(supervisorSchema);
  return await model.invoke([new SystemMessage(systemPrompt), ...history]);
};

export const callResearcher = async (model: ChatOpenAI, instruction: string): Promise<string> => {
  const searchTool = new TavilySearch({
    maxResults: 3,
    tavilyApiKey: env.tavilyApiKey,
  });

  // ツールをバインド
  const modelWithTools = model.bindTools([searchTool]);

  // 会話履歴の初期化
  const messages: BaseMessage[] = [
    new SystemMessage(
      `あなたは優秀なリサーチャーです。与えられたトピックについてWeb検索を行い、正確な情報を収集してください。
      【制約事項】
      - 検索は重要と思われるキーワードを検討しそのキーワードを用いて行なってください。
      - tool_callは1度だけにしてください。
      - 検索結果が得られたら、それ以上の追加検索はせず、得られた情報を要約して回答してください。
      `
    ),
    new HumanMessage(instruction),
  ];

  // 1回目：ツール呼び出し（検索）の要求
  const response = await modelWithTools.invoke(messages);
  messages.push(response);

  // ツール呼び出しがある場合、実行してその結果を追加
  if (response.tool_calls && response.tool_calls.length > 0) {
    for (const toolCall of response.tool_calls) {
      if (toolCall.name === searchTool.name) {
        const result = await searchTool.invoke(toolCall.args as any);
        messages.push(
          new ToolMessage({
            tool_call_id: toolCall.id || "",
            content: JSON.stringify(result),
          })
        );
      }
    }

    // 2回目：検索結果を踏まえた最終要約（報告書）の作成
    const finalResponse = await model.invoke(messages);
    return typeof finalResponse.content === "string"
      ? finalResponse.content
      : JSON.stringify(finalResponse.content);
  }

  // ツール呼び出しが最初からなかった場合の回答
  return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
};

export const callWriter = async (
  model: ChatOpenAI,
  context: string,
  instruction: string
): Promise<string> => {
  const response = await model.invoke([
    new SystemMessage(
      "あなたはプロのWebライターです。提供された情報を元に、読者を惹きつけるブログ記事を書いてください。"
    ),
    new HumanMessage(`以下の情報を参考にしてください:\n${context}`),
    new HumanMessage(instruction),
  ]);
  return typeof response.content === "string" ? response.content : JSON.stringify(response.content);
};
