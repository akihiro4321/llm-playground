import { useState } from "react";

const API_ENDPOINT = "/api/chat";
const DEFAULT_SYSTEM_PROMPT = "You are a helpful assistant.";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!message.trim()) {
      setError("メッセージを入力してください");
      return;
    }

    const newUserMessage = { role: "user", content: message.trim() };
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
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
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
                <div key={index} className={`msg msg-${msg.role}`}>
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
