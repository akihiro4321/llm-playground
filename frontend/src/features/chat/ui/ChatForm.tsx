import { type FormEvent, type ReactNode } from "react";

type ChatFormProps = {
  message: string;
  loading: boolean;
  activeSystemPrompt: string;
  useKnowledge: boolean;
  selectedDocIds: string[];
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMessageChange: (value: string) => void;
  children?: ReactNode;
};

function ChatForm({
  message,
  loading,
  activeSystemPrompt,
  useKnowledge,
  selectedDocIds,
  onSubmit,
  onMessageChange,
  children,
}: ChatFormProps) {
  const knowledgeLabel = useKnowledge
    ? `ON (${selectedDocIds.length > 0 ? `${selectedDocIds.length}件選択` : "全ドキュメント"})`
    : "OFF";

  return (
    <form onSubmit={onSubmit} className="chat-form chat-input">
      <label htmlFor="message">メッセージ</label>
      <textarea
        id="message"
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        placeholder="聞きたいことを入力"
        rows={3}
      />
      {children ? (
        <details className="system-prompt-toggle">
          <summary>システムプロンプトを設定</summary>
          {children}
        </details>
      ) : null}
      <div className="chat-input__actions">
        <div className="input-meta">
          <span className="active-system-prompt">現在のシステム: {activeSystemPrompt}</span>
          <span className="knowledge-status">ドキュメント参照: {knowledgeLabel}</span>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "送信中…" : "送信"}
        </button>
      </div>
    </form>
  );
}

export default ChatForm;
