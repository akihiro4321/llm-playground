import { type FormEvent, useState } from "react";

import { type ChatMessage, ChatRoles, type PresetId } from "@/entities/message";
import ChatForm from "@/features/chat-input/ui/ChatForm";
import SystemPromptSettings from "@/features/system-prompt/ui/SystemPromptSettings";
import { sendChat } from "@/shared/api/chat";
import { DEFAULT_SYSTEM_PROMPT, PRESET_OPTIONS } from "@/shared/config/chatConfig";
import ChatLog from "@/widgets/chat-log/ui/ChatLog";
import Header from "@/widgets/header/ui/Header";

function ChatPage() {
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
      const data = await sendChat({
        messages: nextMessages,
        systemPrompt: resolvedSystemPrompt(),
        useKnowledge,
      });

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
          useKnowledge={useKnowledge}
          onSubmit={handleSubmit}
          onMessageChange={setMessage}
        >
          <SystemPromptSettings
            presetOptions={PRESET_OPTIONS}
            presetId={presetId}
            onPresetChange={setPresetId}
            customSystemPrompt={customSystemPrompt}
            onCustomSystemPromptChange={setCustomSystemPrompt}
            useKnowledge={useKnowledge}
            onUseKnowledgeChange={setUseKnowledge}
          />
        </ChatForm>
      </div>
    </div>
  );
}

export default ChatPage;
