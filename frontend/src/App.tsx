import { type FormEvent, useState } from "react";

import ChatForm from "./components/ChatForm";
import ChatLog from "./components/ChatLog";
import Header from "./components/Header";
import { type ChatMessage, ChatRoles, type PresetId, type PresetOption } from "./types/chat";

const PRESET_OPTIONS: PresetOption[] = [
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

const API_ENDPOINT = "/api/chat";
const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

type ChatResponse = {
  reply?: string;
  error?: string;
};

function App() {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [presetId, setPresetId] = useState<PresetId>("polite");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [useKnowledge, setUseKnowledge] = useState(false);

  const resolvedSystemPrompt = (): string => {
    if (customSystemPrompt.trim()) {
      return customSystemPrompt.trim();
    }
    const preset = PRESET_OPTIONS.find((p) => p.id === presetId);
    return preset?.prompt || DEFAULT_SYSTEM_PROMPT;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("メッセージを入力してください");
      return;
    }

    const newUserMessage: ChatMessage = { role: ChatRoles.User, content: message.trim() };
    const nextMessages = [...messages, newUserMessage];
    setMessages(nextMessages);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          systemPrompt: resolvedSystemPrompt(),
          useKnowledge,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const assistantReply =
        data.reply || "（応答が空でした。モデル設定やネットワークを確認してください）";

      setMessages((prev) => [...prev, { role: ChatRoles.Assistant, content: assistantReply }]);
    } catch (err) {
      console.error(err);
      setError("送信に失敗しました。サーバーを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="layout">
      <div className="chat-area">
        <Header />

        <ChatLog messages={messages} loading={loading} error={error} />

        <ChatForm
          message={message}
          loading={loading}
          activeSystemPrompt={resolvedSystemPrompt()}
          presetOptions={PRESET_OPTIONS}
          presetId={presetId}
          customSystemPrompt={customSystemPrompt}
          useKnowledge={useKnowledge}
          onSubmit={handleSubmit}
          onMessageChange={setMessage}
          onPresetChange={setPresetId}
          onCustomSystemPromptChange={setCustomSystemPrompt}
          onUseKnowledgeChange={setUseKnowledge}
        />
      </div>
    </div>
  );
}

export default App;
