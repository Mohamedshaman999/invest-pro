import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  investApi,
  type MessagingConversationSummary,
  type MessagingMessage,
} from "../services/investApi";
import { ApiError } from "../lib/api";

const POLL_MS = 12_000;

type MessagingContextValue = {
  conversations: MessagingConversationSummary[];
  messagesByConversationId: Record<string, MessagingMessage[]>;
  listLoading: boolean;
  threadLoadingId: string | null;
  pollingThreadId: string | null;
  setPollingThreadId: (id: string | null) => void;
  refreshList: () => Promise<void>;
  loadThread: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  createConversation: (input: { subject?: string; message: string }) => Promise<{ conversationId: string }>;
};

const MessagingContext = createContext<MessagingContextValue | undefined>(undefined);

function tempId() {
  return `temp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const enabled = isAuthenticated && !isAdmin && user?.isVerified === true;

  const [conversations, setConversations] = useState<MessagingConversationSummary[]>([]);
  const [messagesByConversationId, setMessagesByConversationId] = useState<Record<string, MessagingMessage[]>>(
    {}
  );
  const [listLoading, setListLoading] = useState(false);
  const [threadLoadingId, setThreadLoadingId] = useState<string | null>(null);
  const [pollingThreadId, setPollingThreadId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingThreadIdRef = useRef<string | null>(null);
  pollingThreadIdRef.current = pollingThreadId;
  const threadLoadingIdRef = useRef<string | null>(null);
  threadLoadingIdRef.current = threadLoadingId;

  const refreshList = useCallback(async () => {
    if (!enabled) return;
    setListLoading(true);
    try {
      const { conversations: rows } = await investApi.listMessagingConversations();
      setConversations(rows);
    } finally {
      setListLoading(false);
    }
  }, [enabled]);

  const loadThread = useCallback(
    async (conversationId: string) => {
      if (!enabled) return;
      setThreadLoadingId(conversationId);
      try {
        const { messages } = await investApi.getMessagingConversation(conversationId);
        setMessagesByConversationId((prev) => ({ ...prev, [conversationId]: messages }));
        await refreshList();
      } finally {
        setThreadLoadingId((id) => (id === conversationId ? null : id));
      }
    },
    [enabled, refreshList]
  );

  const sendMessage = useCallback(
    async (conversationId: string, content: string) => {
      if (!enabled) return;
      const trimmed = content.trim();
      if (!trimmed) return;

      const optimistic: MessagingMessage = {
        id: tempId(),
        conversationId,
        sender: "user",
        content: trimmed,
        isRead: true,
        createdAt: new Date().toISOString(),
      };

      setMessagesByConversationId((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] ?? []), optimistic],
      }));

      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: { content: trimmed, sender: "user", createdAt: optimistic.createdAt },
                updatedAt: optimistic.createdAt,
              }
            : c
        )
      );

      try {
        const { message } = await investApi.sendMessagingMessage({ conversationId, content: trimmed });
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).map((m) => (m.id === optimistic.id ? message : m)),
        }));
        await refreshList();
      } catch (e) {
        setMessagesByConversationId((prev) => ({
          ...prev,
          [conversationId]: (prev[conversationId] ?? []).filter((m) => m.id !== optimistic.id),
        }));
        throw e;
      }
    },
    [enabled, refreshList]
  );

  const createConversation = useCallback(
    async (input: { subject?: string; message: string }) => {
      if (!enabled) throw new ApiError("Not available", 403);
      const { conversation, message } = await investApi.createMessagingConversation(input);
      setConversations((prev) => [
        {
          ...conversation,
          lastMessage: {
            content: message.content,
            sender: message.sender,
            createdAt: message.createdAt,
          },
          unreadCount: 0,
        },
        ...prev.filter((c) => c.id !== conversation.id),
      ]);
      setMessagesByConversationId((prev) => ({
        ...prev,
        [conversation.id]: [message],
      }));
      return { conversationId: conversation.id };
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) {
      setConversations([]);
      setMessagesByConversationId({});
      return;
    }
    void refreshList();
  }, [enabled, refreshList]);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      void refreshList();
      const tid = pollingThreadIdRef.current;
      if (tid && threadLoadingIdRef.current !== tid) {
        void investApi.getMessagingConversation(tid).then(({ messages }) => {
          setMessagesByConversationId((prev) => ({ ...prev, [tid]: messages }));
        });
      }
    };
    pollRef.current = setInterval(tick, POLL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshList();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, refreshList]);

  const value = useMemo<MessagingContextValue>(
    () => ({
      conversations,
      messagesByConversationId,
      listLoading,
      threadLoadingId,
      pollingThreadId,
      setPollingThreadId,
      refreshList,
      loadThread,
      sendMessage,
      createConversation,
    }),
    [
      conversations,
      messagesByConversationId,
      listLoading,
      threadLoadingId,
      pollingThreadId,
      refreshList,
      loadThread,
      sendMessage,
      createConversation,
    ]
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessaging() {
  const ctx = useContext(MessagingContext);
  if (!ctx) throw new Error("useMessaging must be used within MessagingProvider");
  return ctx;
}
