import { type FormEvent } from "react";

import type { PresetId, PresetOption } from "../types/chat";
import SystemPromptSettings from "./SystemPromptSettings";

type ChatFormProps = {
  message: string;
  loading: boolean;
  activeSystemPrompt: string;
  presetOptions: PresetOption[];
  presetId: PresetId;
  customSystemPrompt: string;
  useKnowledge: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMessageChange: (value: string) => void;
  onPresetChange: (preset: PresetId) => void;
  onCustomSystemPromptChange: (value: string) => void;
  onUseKnowledgeChange: (value: boolean) => void;
};

function ChatForm({
  message,
  loading,
  activeSystemPrompt,
  presetOptions,
  presetId,
  customSystemPrompt,
  useKnowledge,
  onSubmit,
  onMessageChange,
  onPresetChange,
  onCustomSystemPromptChange,
  onUseKnowledgeChange,
}: ChatFormProps) {
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
      <details className="system-prompt-toggle">
        <summary>システムプロンプトを設定</summary>
        <SystemPromptSettings
          presetOptions={presetOptions}
          presetId={presetId}
          onPresetChange={onPresetChange}
          customSystemPrompt={customSystemPrompt}
          onCustomSystemPromptChange={onCustomSystemPromptChange}
          useKnowledge={useKnowledge}
          onUseKnowledgeChange={onUseKnowledgeChange}
        />
      </details>
      <div className="chat-input__actions">
        <div className="input-meta">
          <span className="active-system-prompt">現在のシステム: {activeSystemPrompt}</span>
          <span className="knowledge-status">
            ドキュメント参照: {useKnowledge ? "ON" : "OFF"}
          </span>
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "送信中…" : "送信"}
        </button>
      </div>
    </form>
  );
}

export default ChatForm;
