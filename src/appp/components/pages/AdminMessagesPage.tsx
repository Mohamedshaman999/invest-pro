import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { investApi, type MessagingMessage, type MessagingConversationSummary } from "../../services/investApi";
import { ApiError } from "../../lib/api";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const glassPanel =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/40 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.85),0_0_36px_-10px_rgba(139,92,246,0.16)] backdrop-blur-xl dark:border-cyan-400/10";
const glassInput =
  "rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-violet-400/35 focus:shadow-[0_0_24px_-8px_rgba(167,139,250,0.45)]";

type AdminRow = MessagingConversationSummary & {
  user: { id: number; name: string; email: string } | null;
};

const POLL_MS = 12_000;

export function AdminMessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { text } = useLanguage();
  const t = text.pages.messages;

  const [rows, setRows] = useState<AdminRow[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [messages, setMessages] = useState<MessagingMessage[]>([]);
  const [threadMeta, setThreadMeta] = useState<
    (MessagingConversationSummary & { user: AdminRow["user"] }) | null
  >(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");

  const listEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const queryParams = useMemo(() => {
    const o: { status?: string; role?: string } = {};
    if (filterStatus === "open" || filterStatus === "closed") o.status = filterStatus;
    if (filterRole === "investor" || filterRole === "pro_investor") o.role = filterRole;
    return o;
  }, [filterStatus, filterRole]);

  const refreshList = useCallback(async () => {
    setListLoading(true);
    try {
      const { conversations } = await investApi.adminListMessagingConversations(queryParams);
      setRows(conversations as AdminRow[]);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.sendError);
    } finally {
      setListLoading(false);
    }
  }, [queryParams, t.sendError]);

  const loadThread = useCallback(
    async (id: string) => {
      setThreadLoading(true);
      try {
        const data = await investApi.adminGetMessagingConversation(id);
        setThreadMeta({
          ...data.conversation,
          user: data.conversation.user,
        });
        setMessages(data.messages);
        await refreshList();
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : t.sendError);
      } finally {
        setThreadLoading(false);
      }
    },
    [refreshList, t.sendError]
  );

  useEffect(() => {
    if (!isAdmin) {
      navigate("/", { replace: true });
      return;
    }
    void refreshList();
  }, [isAdmin, navigate, refreshList]);

  useEffect(() => {
    if (!conversationId) {
      setThreadMeta(null);
      setMessages([]);
      return;
    }
    void loadThread(conversationId);
  }, [conversationId, loadThread]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationId, messages]);

  useEffect(() => {
    if (!isAdmin || !conversationId) return;
    pollRef.current = setInterval(() => {
      void loadThread(conversationId);
      void refreshList();
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isAdmin, conversationId, loadThread, refreshList]);

  const onSendReply = async () => {
    if (!conversationId) return;
    const body = replyDraft.trim();
    if (!body || threadMeta?.status === "closed") return;

    const optimistic: MessagingMessage = {
      id: `temp-${Date.now()}`,
      conversationId,
      sender: "admin",
      content: body,
      isRead: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setReplyDraft("");

    setSendBusy(true);
    try {
      const { message } = await investApi.adminSendMessagingMessage({ conversationId, content: body });
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? message : m)));
      toast.success(t.sentToast);
      await refreshList();
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setReplyDraft(body);
      toast.error(e instanceof ApiError ? e.message : t.sendError);
    } finally {
      setSendBusy(false);
    }
  };

  const onToggleStatus = async (next: "open" | "closed") => {
    if (!conversationId) return;
    setStatusBusy(true);
    try {
      const { conversation } = await investApi.adminPatchMessagingConversation(conversationId, {
        status: next,
      });
      setThreadMeta((prev) => (prev ? { ...prev, status: conversation.status } : prev));
      await refreshList();
      toast.success(next === "closed" ? t.statusClosed : t.statusOpen);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.sendError);
    } finally {
      setStatusBusy(false);
    }
  };

  const roleLabel = (role: string) => (role === "pro_investor" ? t.rolePro : t.roleInvestor);

  if (!isAdmin) return null;

  return (
    <div className="mx-auto flex h-[min(760px,calc(100vh-8rem))] max-w-7xl flex-col gap-4 lg:flex-row">
      <aside className={cn("flex min-h-0 w-full flex-col lg:w-[380px] lg:shrink-0", glassPanel, "p-3")}>
        <div className="mb-3 px-1">
          <h1 className="text-lg font-semibold tracking-tight text-zinc-100">{t.adminTitle}</h1>
          <p className="text-xs text-zinc-500">{t.adminSubtitle}</p>
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className={cn("h-9 w-[140px] border-white/10 bg-white/[0.04] text-xs text-zinc-100")}>
              <SelectValue placeholder={t.filterStatus} />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950/95 backdrop-blur-xl">
              <SelectItem value="all">{t.filterAll}</SelectItem>
              <SelectItem value="open">{t.statusOpen}</SelectItem>
              <SelectItem value="closed">{t.statusClosed}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className={cn("h-9 w-[160px] border-white/10 bg-white/[0.04] text-xs text-zinc-100")}>
              <SelectValue placeholder={t.filterRole} />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-zinc-950/95 backdrop-blur-xl">
              <SelectItem value="all">{t.filterAll}</SelectItem>
              <SelectItem value="investor">{t.roleInvestor}</SelectItem>
              <SelectItem value="pro_investor">{t.rolePro}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-x-auto overflow-y-auto pr-1">
          {listLoading && rows.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl bg-gradient-to-r from-white/[0.06] to-white/[0.02]"
                />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">{t.noConversations}</p>
          ) : (
            <table className="w-full min-w-[320px] border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-zinc-500">
                  <th className="px-2 pb-1 font-medium">{t.colUser}</th>
                  <th className="px-2 pb-1 font-medium">{t.colRole}</th>
                  <th className="px-2 pb-1 font-medium">{t.colStatus}</th>
                  <th className="px-2 pb-1 font-medium text-right">{t.colUnread}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const selected = r.id === conversationId;
                  const unread = r.unreadCount > 0;
                  return (
                    <tr key={r.id}>
                      <td colSpan={4} className="p-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/messages/${r.id}`)}
                          className={cn(
                            "w-full rounded-xl px-2 py-2.5 text-left transition-[background,box-shadow] duration-200",
                            selected
                              ? "bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25)]"
                              : "hover:bg-white/[0.05]"
                          )}
                        >
                          <div className="flex items-start gap-2">
                            <div className="relative mt-1 h-2 w-2 shrink-0">
                              {unread ? (
                                <span className="absolute inset-0 rounded-full bg-fuchsia-400 shadow-[0_0_12px_2px_rgba(232,121,249,0.5)]" />
                              ) : (
                                <span className="absolute inset-0 rounded-full bg-zinc-600/80" />
                              )}
                            </div>
                            <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto_auto] gap-x-2 gap-y-0.5 text-xs">
                              <span className="truncate font-medium text-zinc-100">
                                {r.user?.name ?? "—"}{" "}
                                <span className="font-normal text-zinc-500">({r.user?.email ?? ""})</span>
                              </span>
                              <span className="text-zinc-400">{roleLabel(r.role)}</span>
                              <span
                                className={cn(
                                  "justify-self-end rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                                  r.status === "open"
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-zinc-500/20 text-zinc-400"
                                )}
                              >
                                {r.status === "open" ? t.statusOpen : t.statusClosed}
                              </span>
                              <span className="col-span-3 truncate text-zinc-500">
                                {t.colLastMessage}: {r.lastMessage?.content ?? "—"}
                              </span>
                            </div>
                            <span className="shrink-0 text-[11px] tabular-nums text-violet-300/90">{r.unreadCount}</span>
                          </div>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </aside>

      <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", glassPanel)}>
        {!conversationId ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-zinc-500">
            <p className="text-sm">{t.selectConversation}</p>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] px-4 py-3 backdrop-blur-md">
              <button
                type="button"
                onClick={() => navigate("/admin/messages")}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 lg:hidden"
                aria-label={t.backToList}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {threadMeta?.user?.name ?? "—"}{" "}
                  <span className="font-normal text-zinc-500">· {threadMeta?.user?.email}</span>
                </p>
                <p className="text-xs text-zinc-500">
                  {threadMeta?.subject?.trim() || "—"} · {roleLabel(threadMeta?.role ?? "investor")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {threadMeta?.status === "open" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={statusBusy}
                    onClick={() => void onToggleStatus("closed")}
                    className="rounded-xl border-white/15 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]"
                  >
                    {t.closeConversation}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={statusBusy}
                    onClick={() => void onToggleStatus("open")}
                    className="rounded-xl border-0 bg-gradient-to-r from-emerald-600/90 to-cyan-600/85 text-white shadow-[0_0_20px_-8px_rgba(52,211,153,0.45)]"
                  >
                    {t.reopenConversation}
                  </Button>
                )}
              </div>
            </header>

            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {threadLoading && messages.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-12 max-w-[80%] animate-pulse rounded-2xl",
                        i % 2 === 0 ? "mr-auto bg-white/[0.05]" : "ml-auto bg-violet-500/10"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const mine = msg.sender === "admin";
                    return (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={cn("flex w-full", mine ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg",
                            mine
                              ? "bg-gradient-to-br from-cyan-600/85 to-violet-700/85 text-white shadow-[0_0_28px_-8px_rgba(34,211,238,0.35)]"
                              : "border border-white/[0.08] bg-zinc-900/70 text-zinc-100 backdrop-blur-md"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={cn("mt-1 text-[10px] opacity-70", mine ? "text-cyan-50" : "text-zinc-500")}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={listEndRef} />
            </div>

            <div className="border-t border-white/[0.06] p-4 backdrop-blur-xl">
              <div className={cn("flex items-end gap-2 p-2", glassInput)}>
                <textarea
                  rows={1}
                  disabled={threadMeta?.status === "closed"}
                  placeholder={threadMeta?.status === "closed" ? t.closedHint : t.placeholderReply}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void onSendReply();
                    }
                  }}
                  className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 disabled:opacity-50"
                />
                <Button
                  type="button"
                  size="icon"
                  disabled={threadMeta?.status === "closed" || sendBusy || !replyDraft.trim()}
                  onClick={() => void onSendReply()}
                  className="h-11 w-11 shrink-0 rounded-xl border-0 bg-gradient-to-br from-fuchsia-500/90 to-violet-600/90 text-white shadow-[0_0_20px_-4px_rgba(217,70,239,0.45)] transition-[filter,transform] duration-200 hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
