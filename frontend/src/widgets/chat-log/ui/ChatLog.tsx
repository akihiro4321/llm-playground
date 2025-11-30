import { type ChatMessage, type ChatRole,ChatRoles } from "@/entities/message";

const ROLE_LABEL: Record<ChatRole, string> = {
  [ChatRoles.Assistant]: "Assistant",
  [ChatRoles.User]: "You",
  [ChatRoles.System]: "System",
};

type ChatLogProps = {
  messages: ChatMessage[];
  loading: boolean;
  error: string;
};

function ChatLog({ messages, loading, error }: ChatLogProps) {
  return (
    <section className="response chat-log">
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
              <span className="msg-role">{ROLE_LABEL[msg.role] ?? "Unknown"}</span>
              <span className="msg-content">{msg.content}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ChatLog;
