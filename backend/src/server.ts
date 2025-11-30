import cors from "cors";
import express from "express";

import { loadEnv } from "@/config/env.js";
import { errorHandler } from "@/middleware/errorHandler.js";
import { buildChatRouter } from "@/routes/chat.js";
import { createOpenAiClient } from "@/services/openaiClient.js";

const app = express();
const env = loadEnv();
const openaiClient = createOpenAiClient(env.openaiApiKey);

app.use(cors());
app.use(express.json());

app.use("/api", buildChatRouter(openaiClient));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`);
});
