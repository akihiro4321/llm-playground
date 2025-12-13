import { type FormEvent, useEffect, useState } from "react";

import { type ChatMessage, ChatRoles, type PresetId } from "@/entities/message";
import { sendChat } from "@/shared/api/chat";
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
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onMessageChange: (value: string) => void;
  onPresetChange: (preset: PresetId) => void;
  onCustomSystemPromptChange: (value: string) => void;
  onUseKnowledgeChange: (value: boolean) => void;
  onDocToggle: (docId: string) => void;
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

  useEffect(() => {
    fetchKnowledgeDocs()
      .then(setAvailableDocs)
      .catch((err) => {
        console.error(err);
        setError((prev) =>
          prev || "ドキュメント一覧の取得に失敗しました。サーバーを確認してください。",
        );
      });
  }, []);

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
      );
    } catch (err) {
      console.error(err);
      setError("送信に失敗しました。サーバーを確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleDocToggle = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId],
    );
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
    onSubmit: handleSubmit,
    onMessageChange: setMessage,
    onPresetChange: setPresetId,
    onCustomSystemPromptChange: setCustomSystemPrompt,
    onUseKnowledgeChange: setUseKnowledge,
    onDocToggle: handleDocToggle,
  };
};
