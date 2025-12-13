import type { ChatMessage, ChatRole } from "@/entities/message";

export type ChatThread = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type FetchThreadsResponse = {
  threads: ChatThread[];
};

export type FetchMessagesResponse = {
  messages: (ChatMessage & { id: number; createdAt: string })[];
};

export const fetchThreads = async (): Promise<ChatThread[]> => {
  const response = await fetch("/api/history/threads");
  if (!response.ok) {
    throw new Error(`Failed to fetch threads: ${response.status}`);
  }
  const data = (await response.json()) as FetchThreadsResponse;
  return data.threads;
};

export const fetchMessages = async (threadId: string): Promise<ChatMessage[]> => {
  const response = await fetch(`/api/history/threads/${threadId}/messages`);
  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.status}`);
  }
  const data = (await response.json()) as FetchMessagesResponse;
  // 型変換: roleが文字列で返ってくるのでキャスト（バリデーションした方が安全だが今回は省略）
  return data.messages.map((msg) => ({
    role: msg.role as ChatRole,
    content: msg.content,
  }));
};

export const deleteThread = async (threadId: string): Promise<void> => {
    const response = await fetch(`/api/history/threads/${threadId}`, {
        method: "DELETE"
    });
    if (!response.ok) {
        throw new Error(`Failed to delete thread: ${response.status}`);
    }
}
