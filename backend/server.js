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
  const { message } = req.body || {};
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  // 環境変数が無い場合はスタブを返す
  if (!openaiClient) {
    return res.json({
      reply: "（スタブ応答）OpenAI API キーを設定してください。",
    });
  }

  try {
    const completion = await openaiClient.responses.create({
      model: "gpt-4.1-mini",
      input: message,
    });

    const reply =
      completion.output_text ||
      completion.output[0]?.content[0]?.text ||
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
