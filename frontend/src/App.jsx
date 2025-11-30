import { useState } from "react";

const API_ENDPOINT = "/api/chat";

function App() {
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setReply("");

    if (!message.trim()) {
      setError("メッセージを入力してください");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const data = await response.json();
      setReply(data.reply || "(応答が空でした)");
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
          <div className="response-header">応答</div>
          {error ? (
            <div className="error">{error}</div>
          ) : (
            <pre className="reply">{reply || "まだ応答はありません"}</pre>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
