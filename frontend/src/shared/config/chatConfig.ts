import type { PresetOption } from "@/entities/message";

export const API_ENDPOINT = "/api/chat";
export const KNOWLEDGE_DOCS_ENDPOINT = "/api/knowledge/docs";

export const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

export const PRESET_OPTIONS: PresetOption[] = [
  {
    id: "polite",
    label: "丁寧な日本語アシスタント",
    prompt: "あなたは丁寧な日本語アシスタントです。わかりやすく、簡潔に説明してください。",
  },
  {
    id: "casual",
    label: "カジュアルな友達",
    prompt: "あなたはカジュアルな友達です。フランクな口調で、親しみやすく答えてください。",
  },
  {
    id: "english-coach",
    label: "英語学習コーチ",
    prompt:
      "あなたは英語学習のコーチです。英語と日本語を交えて、学習者が理解しやすいようにアドバイスしてください。",
  },
];
