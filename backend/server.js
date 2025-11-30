import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const openaiApiKey = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

const openaiClient = openaiApiKey
  ? new OpenAI({ apiKey: openaiApiKey })
  : null;

app.post("/api/chat", async (req, res) => {
  const { messages, systemPrompt } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const systemContent =
    typeof systemPrompt === "string" && systemPrompt.trim()
      ? systemPrompt
      : "You are a helpful assistant.";

  const chatMessages = [
    { role: "system", content: systemContent },
    ...messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ];

  // 環境変数が無い場合はスタブを返す
  if (!openaiClient) {
    return res.json({
      reply: "（スタブ応答）OpenAI API キーを設定してください。",
    });
  }

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: chatMessages,
    });

    const reply =
      completion.choices?.[0]?.message?.content?.trim() ||
      "返答を生成できませんでした。";
    return res.json({ reply });
  } catch (error) {
    console.error("chat error", error);
    return res
      .status(500)
      .json({ error: "チャット応答の生成に失敗しました。" });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
