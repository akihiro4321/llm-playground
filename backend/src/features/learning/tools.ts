import type OpenAI from "openai";

/**
 * OpenAI Function Calling用のツールスキーマ定義
 */
export const toolsSchema: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "指定された都市の現在の天気を取得する",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "都市名（例: 東京、大阪）",
          },
          unit: {
            type: "string",
            enum: ["celsius", "fahrenheit"],
            description: "温度の単位",
          },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculate_sum",
      description: "2つの数値の足し算を行う",
      parameters: {
        type: "object",
        properties: {
          a: {
            type: "number",
            description: "1つ目の数値",
          },
          b: {
            type: "number",
            description: "2つ目の数値",
          },
        },
        required: ["a", "b"],
      },
    },
  },
];

/**
 * 天気取得ツールの実行関数（スタブ実装）
 */
export const executeWeather = (location: string, unit = "celsius") => {
  console.log("🛠️  [TOOL] Weather実行:", location);
  return {
    location,
    temperature: 25,
    weather: "sunny",
    unit,
    info: "これはスタブデータです",
  };
};

/**
 * 計算ツールの実行関数
 */
export const executeCalculation = (a: number, b: number) => {
  console.log("🛠️  [TOOL] Calc実行:", a, "+", b);
  return {
    result: a + b,
  };
};

/**
 * ツール実行関数の型定義
 */
// eslint-disable-next-line no-unused-vars
type ToolFunction = (args: Record<string, unknown>) => unknown;

/**
 * ツール名と実行関数のマッピング
 */
export const availableTools: Record<string, ToolFunction> = {
  get_current_weather: (args) =>
    executeWeather(args.location as string, args.unit as string | undefined),
  calculate_sum: (args) =>
    executeCalculation(args.a as number, args.b as number),
};
