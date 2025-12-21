import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

// LangSmithでトレースできるようにラップする
const openai = wrapOpenAI(
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
);

export const processResumeOpenAI = traceable(
  async (pdfBuffer: Buffer): Promise<string> => {
    // 1. PDFをBase64に変換
    const base64String = pdfBuffer.toString("base64");

    // 2. 構造化データの定義 (OpenAI SDKの形式)
    const ResumeSchema = z.object({
      basic_info: z.object({
        name: z.string(),
        email: z.string().optional(),
      }),
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
    });

    try {
      // 3. OpenAI Chat Completion呼び出し (PDF直接送信)
      const completion = await openai.chat.completions.create({
        model: "gpt-5", // PDF対応の最新モデルを指定
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "以下の職務経歴書(PDF)を解析して、指定されたフォーマットのJSONで返してください。",
              },
              {
                // @ts-ignore - 最新の型定義が反映されていない場合があるための回避
                type: "text", // "file" typeがまだSDK型定義にない場合、便宜上text等にしておくか、型アサーションで回避
                ...({
                  type: "file",
                  file: {
                    filename: "resume.pdf",
                    file_data: `data:application/pdf;base64,${base64String}`,
                  },
                } as any),
              },
            ],
          },
        ],
        response_format: zodResponseFormat(ResumeSchema, "resume_parser"),
      });

      const result = completion.choices[0].message.content;
      return result || "{}";
    } catch (error) {
      console.error("OpenAI OCR error:", error);
      throw new Error("OpenAIでのPDF解析に失敗しました。");
    }
  },
  { name: "OpenAI_PDF_OCR" }
);
