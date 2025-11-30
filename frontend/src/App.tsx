import { useState } from "react";

type ChatRole = "system" | "user" | "assistant";
type ChatMessage = {
  role: ChatRole;
  content: string;
};

type PresetId = "polite" | "casual" | "english-coach";

const PRESET_OPTIONS: { id: PresetId; label: string; prompt: string }[] = [
  {
    id: "polite",
    label: "丁寧な日本語アシスタント",
    prompt:
      "あなたは丁寧な日本語アシスタントです。わかりやすく、簡潔に説明してください。",
  },
  {
    id: "casual",
    label: "カジュアルな友達",
    prompt:
      "あなたはカジュアルな友達です。フランクな口調で、親しみやすく答えてください。",
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

  const resolvedSystemPrompt = (): string => {
    if (customSystemPrompt.trim()) {
      return customSystemPrompt.trim();
    }
    const preset = PRESET_OPTIONS.find((p) => p.id === presetId);
    return preset?.prompt || DEFAULT_SYSTEM_PROMPT;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("メッセージを入力してください");
      return;
    }

    const newUserMessage: ChatMessage = {
      role: "user",
      content: message.trim(),
    };
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
        data.reply ||
        "（応答が空でした。モデル設定やネットワークを確認してください）";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantReply },
      ]);
    } catch (err) {
      console.error(err);
      setError("送信に失敗しました。サーバーを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <div className="pill">Mini LLM Chat</div>
        <h1>
          シンプルに試す
          <span>LLM Playground</span>
        </h1>
        <p>バックエンドの /api/chat に投げて結果を見るだけの最小UIです。</p>
      </header>

      <main className="card">
        <section className="system-prompt">
          <div className="system-prompt__header">システムプロンプト</div>
          <div className="preset-options">
            {PRESET_OPTIONS.map((preset) => (
              <label key={preset.id} className="preset-option">
                <input
                  type="radio"
                  name="preset"
                  value={preset.id}
                  checked={presetId === preset.id}
                  onChange={() => setPresetId(preset.id)}
                />
                <span className="preset-label">{preset.label}</span>
              </label>
            ))}
          </div>
          <div className="custom-prompt">
            <label htmlFor="customPrompt">
              カスタムプロンプト（入力がある場合はこちらを優先）
            </label>
            <textarea
              id="customPrompt"
              value={customSystemPrompt}
              onChange={(e) => setCustomSystemPrompt(e.target.value)}
              placeholder="例: あなたは関西弁で話すアシスタントです。"
              rows={3}
            />
          </div>
        </section>

        <form onSubmit={handleSubmit} className="chat-form">
          <label htmlFor="message">メッセージ</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="聞きたいことを入力"
            rows={4}
          />
          <button type="submit" disabled={loading}>
            {loading ? "送信中…" : "送信"}
          </button>
        </form>

        <section className="response">
          <div className="response-header">
            応答
            {loading && <span className="status">Thinking...</span>}
          </div>
          {error && <div className="error">{error}</div>}
          <div className="reply">
            {messages.length === 0 ? (
              <span>まだメッセージはありません</span>
            ) : (
              messages.map((msg, index) => (
                <div key={`${msg.role}-${index}`} className={`msg msg-${msg.role}`}>
                  <span className="msg-role">
                    {msg.role === "assistant" ? "Assistant" : "You"}
                  </span>
                  <span className="msg-content">{msg.content}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
