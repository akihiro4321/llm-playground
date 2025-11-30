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
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onMessageChange: (value: string) => void;
  onPresetChange: (preset: PresetId) => void;
  onCustomSystemPromptChange: (value: string) => void;
};

function ChatForm({
  message,
  loading,
  activeSystemPrompt,
  presetOptions,
  presetId,
  customSystemPrompt,
  onSubmit,
  onMessageChange,
  onPresetChange,
  onCustomSystemPromptChange,
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
        />
      </details>
      <div className="chat-input__actions">
        <span className="active-system-prompt">現在のシステム: {activeSystemPrompt}</span>
        <button type="submit" disabled={loading}>
          {loading ? "送信中…" : "送信"}
        </button>
      </div>
    </form>
  );
}

export default ChatForm;
