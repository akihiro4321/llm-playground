import { ChatForm, SystemPromptSettings, useChat } from "@/features/chat";
import { PRESET_OPTIONS } from "@/shared/config/chatConfig";
import ChatLog from "@/widgets/chat-log/ui/ChatLog";
import Header from "@/widgets/header/ui/Header";

function ChatWindow() {
  const {
    message,
    messages,
    loading,
    error,
    presetId,
    customSystemPrompt,
    useKnowledge,
    activeSystemPrompt,
    onSubmit,
    onMessageChange,
    onPresetChange,
    onCustomSystemPromptChange,
    onUseKnowledgeChange,
  } = useChat();

  return (
    <div className="layout">
      <div className="chat-area">
        <Header />
        <ChatLog messages={messages} loading={loading} error={error} />
        <ChatForm
          message={message}
          loading={loading}
          activeSystemPrompt={activeSystemPrompt}
          useKnowledge={useKnowledge}
          onSubmit={onSubmit}
          onMessageChange={onMessageChange}
        >
          <SystemPromptSettings
            presetOptions={PRESET_OPTIONS}
            presetId={presetId}
            onPresetChange={onPresetChange}
            customSystemPrompt={customSystemPrompt}
            onCustomSystemPromptChange={onCustomSystemPromptChange}
            useKnowledge={useKnowledge}
            onUseKnowledgeChange={onUseKnowledgeChange}
          />
        </ChatForm>
      </div>
    </div>
  );
}

export default ChatWindow;
