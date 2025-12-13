import { ChatForm, ChatSidebar, SystemPromptSettings, useChat } from "@/features/chat";
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
    availableDocs,
    selectedDocIds,
    activeSystemPrompt,
    threads,
    currentThreadId,
    onSubmit,
    onMessageChange,
    onPresetChange,
    onCustomSystemPromptChange,
    onUseKnowledgeChange,
    onDocToggle,
    onSelectThread,
    onNewChat,
    onDeleteThread,
  } = useChat();

  return (
    <div className="layout">
      <ChatSidebar
        threads={threads}
        currentThreadId={currentThreadId}
        onNewChat={onNewChat}
        onSelectThread={onSelectThread}
        onDeleteThread={onDeleteThread}
      />

      {/* メインチャットエリア */}
      <div className="chat-area">
        <Header />
        <ChatLog messages={messages} loading={loading} error={error} />
        <ChatForm
          message={message}
          loading={loading}
          activeSystemPrompt={activeSystemPrompt}
          useKnowledge={useKnowledge}
          selectedDocIds={selectedDocIds}
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
            availableDocs={availableDocs}
            selectedDocIds={selectedDocIds}
            onDocToggle={onDocToggle}
          />
        </ChatForm>
      </div>
    </div>
  );
}

export default ChatWindow;
