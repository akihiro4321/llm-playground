import { type FormEvent, useEffect, useState } from "react";

import { type ChatMessage, ChatRoles, type PresetId } from "@/entities/message";
import { sendChat } from "@/shared/api/chat";
import { type ChatThread, deleteThread, fetchMessages, fetchThreads } from "@/shared/api/history";
import { fetchKnowledgeDocs, type KnowledgeDocSummary } from "@/shared/api/knowledge";
import { DEFAULT_SYSTEM_PROMPT, PRESET_OPTIONS } from "@/shared/config/chatConfig";

export type UseChatReturn = {
  message: string;
  messages: ChatMessage[];
  loading: boolean;
  error: string;
  presetId: PresetId;
  customSystemPrompt: string;
  useKnowledge: boolean;
  availableDocs: KnowledgeDocSummary[];
  selectedDocIds: string[];
  activeSystemPrompt: string;
  threads: ChatThread[];
  currentThreadId: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onMessageChange: (value: string) => void;
  onPresetChange: (preset: PresetId) => void;
  onCustomSystemPromptChange: (value: string) => void;
  onUseKnowledgeChange: (value: boolean) => void;
  onDocToggle: (docId: string) => void;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string) => void;
};

export const useChat = (): UseChatReturn => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [presetId, setPresetId] = useState<PresetId>("polite");
  const [customSystemPrompt, setCustomSystemPrompt] = useState("");
  const [useKnowledge, setUseKnowledge] = useState(false);
  const [availableDocs, setAvailableDocs] = useState<KnowledgeDocSummary[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // 履歴管理用ステート
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);

  // 初期ロード：ドキュメント一覧とスレッド一覧
  useEffect(() => {
    fetchKnowledgeDocs()
      .then(setAvailableDocs)
      .catch((err) => {
        console.error(err);
        setError((prev) => prev || "ドキュメント一覧の取得に失敗しました。");
      });

    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      const data = await fetchThreads();
      setThreads(data);
    } catch (err) {
      console.error(err);
      // スレッド取得失敗は致命的ではないのでエラー表示は控えめにするかログのみ
    }
  };

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
      setMessages((prev) => [...prev, { role: ChatRoles.Assistant, content: "" }]);

      await sendChat(
        {
          messages: nextMessages,
          systemPrompt: resolvedSystemPrompt(),
          useKnowledge,
          docIds: selectedDocIds,
          threadId: currentThreadId || undefined, // スレッドIDがあれば送信
        },
        (delta) => {
          setMessages((prev) => {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg && lastMsg.role === ChatRoles.Assistant) {
              const updatedLastMsg = { ...lastMsg, content: lastMsg.content + delta };
              return [...prev.slice(0, -1), updatedLastMsg];
            }
            return [...prev, { role: ChatRoles.Assistant, content: delta }];
          });
        },
        (newThreadId) => {
          if (newThreadId !== currentThreadId) {
            setCurrentThreadId(newThreadId);
          }
        }
      );

      // 送信完了後にスレッド一覧を更新（タイトル更新や新規追加のため）
      await loadThreads();
    } catch (err) {
      console.error(err);
      setError("送信に失敗しました。サーバーを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleDocToggle = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectThread = async (threadId: string) => {
    setLoading(true);
    setError("");
    try {
      const msgs = await fetchMessages(threadId);
      setMessages(msgs);
      setCurrentThreadId(threadId);
    } catch (err) {
      console.error(err);
      setError("メッセージの読み込みに失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setCurrentThreadId(null);
    setMessages([]);
    setError("");
  };

  const handleDeleteThread = async (threadId: string) => {
    if (!confirm("このチャット履歴を削除しますか？")) return;
    try {
      await deleteThread(threadId);
      await loadThreads();
      if (currentThreadId === threadId) {
        handleNewChat();
      }
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました");
    }
  };

  return {
    message,
    messages,
    loading,
    error,
    presetId,
    customSystemPrompt,
    useKnowledge,
    availableDocs,
    selectedDocIds,
    activeSystemPrompt: resolvedSystemPrompt(),
    threads,
    currentThreadId,
    onSubmit: handleSubmit,
    onMessageChange: setMessage,
    onPresetChange: setPresetId,
    onCustomSystemPromptChange: setCustomSystemPrompt,
    onUseKnowledgeChange: setUseKnowledge,
    onDocToggle: handleDocToggle,
    onSelectThread: handleSelectThread,
    onNewChat: handleNewChat,
    onDeleteThread: handleDeleteThread,
  };
};
