import { HumanMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

export const processResume = async (pdfBuffer: Buffer): Promise<string> => {
  // 1. PDFをBase64に変換
  const base64Pdf = pdfBuffer.toString("base64");

  // 2. Geminiの初期化
  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // 2.5がまだの場合は1.5を使用 (PDF直接入力に対応)
    apiKey: process.env.GOOGLE_API_KEY,
    temperature: 0,
  });

  const schema = z.object({
    basic_info: z.object({ name: z.string(), email: z.string().optional() }),
    summary: z.string(),
    skills: z.array(z.string()),
    experience: z.array(
      z.object({
        company: z.string(),
        position: z.string(),
        period: z.string(),
        details: z.string(),
      })
    ),
    error: z
      .string()
      .optional()
      .describe("PDFが読み取れない、または職務経歴書でない場合のエラー理由"),
  });

  const structuredLlm = model.withStructuredOutput(schema);

  // 3. マルチモーダルメッセージの作成 (テキスト + PDFデータ)
  const message = new HumanMessage({
    content: [
      {
        type: "text",
        text: `
        以下のPDFファイル（職務経歴書）を解析し、JSONデータを抽出してください。
        
        【注意点】
        - もしファイルが読み取れない場合や、職務経歴書として認識できない場合は、'error' フィールドに理由を出力してください。
        - 画像PDF（スキャンデータ）の場合も、OCRを行い可能な限り読み取ってください。
        `,
      },
      {
        type: "media", // LangChainのバージョンによっては image_url などの場合もあるが、Googleプロバイダはこれで通る場合が多い
        mimeType: "application/pdf",
        data: base64Pdf, // Base64データ
      },
    ],
  });

  const result = await structuredLlm.invoke([message]);

  return JSON.stringify(result);
};
