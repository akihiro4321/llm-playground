import { type ChatThread } from "@/shared/api/history";

type ChatSidebarProps = {
  threads: ChatThread[];
  currentThreadId: string | null;
  onNewChat: () => void;
  onSelectThread: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
};

function ChatSidebar({
  threads,
  currentThreadId,
  onNewChat,
  onSelectThread,
  onDeleteThread,
}: ChatSidebarProps) {
  return (
    <div
      style={{
        width: "260px",
        backgroundColor: "#f1f5f9",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        padding: "16px",
        gap: "16px",
        flexShrink: 0,
      }}
    >
      <button
        onClick={onNewChat}
        style={{
          padding: "10px",
          borderRadius: "8px",
          border: "1px solid #cbd5e1",
          backgroundColor: "#ffffff",
          cursor: "pointer",
          fontWeight: "bold",
          color: "#475569",
          width: "100%",
        }}
      >
        ＋ 新しいチャット
      </button>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor:
                currentThreadId === thread.id ? "#e0e7ff" : "transparent",
              color: currentThreadId === thread.id ? "#4338ca" : "#475569",
              fontSize: "14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                textOverflow: "ellipsis",
                overflow: "hidden",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {thread.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteThread(thread.id);
              }}
              style={{
                border: "none",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
              }}
              title="削除"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChatSidebar;
