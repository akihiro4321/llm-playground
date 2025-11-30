import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import OpenAI from "openai";
import { DEFAULT_SYSTEM_PROMPT, MODEL_NAME } from "./modelConfig.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;
const openaiApiKey = process.env.OPENAI_API_KEY;

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatRequestBody = {
  messages?: ChatMessage[];
  systemPrompt?: string;
};

app.use(cors());
app.use(express.json());

const openaiClient = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null;

app.post("/api/chat", async (req: Request<unknown, unknown, ChatRequestBody>, res: Response) => {
  const { messages, systemPrompt } = req.body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const sanitizedMessages = messages
    .filter((msg): msg is ChatMessage => {
      return (
        msg &&
        typeof msg === "object" &&
        (msg.role === "user" || msg.role === "assistant") &&
        typeof msg.content === "string" &&
        msg.content.trim().length > 0
      );
    })
    .map((msg) => ({
      role: msg.role,
      content: msg.content.trim(),
    }));

  if (sanitizedMessages.length === 0) {
    return res.status(400).json({ error: "no valid messages in array" });
  }

  const systemContent =
    typeof systemPrompt === "string" && systemPrompt.trim()
      ? systemPrompt.trim()
      : DEFAULT_SYSTEM_PROMPT;

  const chatMessages: ChatMessage[] = [
    { role: "system", content: systemContent },
    ...sanitizedMessages,
  ];

  // 環境変数が無い場合はスタブを返す
  if (!openaiClient) {
    return res.json({
      reply: "（スタブ応答）OpenAI API キーを設定してください。",
    });
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: MODEL_NAME,
      messages: chatMessages,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() || "返答を生成できませんでした。";
    return res.json({ reply });
  } catch (error) {
    console.error("chat error", error);
    return res.status(500).json({ error: "チャット応答の生成に失敗しました。" });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
