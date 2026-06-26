import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquarePlus, Send, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMessaging } from "../../contexts/MessagingContext";
import { ApiError } from "../../lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { useMessagingRealtime } from "../../hooks/useMessagingRealtime";

const glassPanel =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/40 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.85),0_0_36px_-10px_rgba(139,92,246,0.18)] backdrop-blur-xl dark:border-cyan-400/10";
const glassInput =
  "rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-violet-400/35 focus:shadow-[0_0_24px_-8px_rgba(167,139,250,0.45)]";

export function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { text } = useLanguage();
  const t = text.pages.messages;
  const {
    conversations,
    messagesByConversationId,
    listLoading,
    threadLoadingId,
    setPollingThreadId,
    loadThread,
    sendMessage,
    createConversation,
    refreshList,
  } = useMessaging();

  useMessagingRealtime(conversationId ?? null, { enabled: !!conversationId });

  const [modalOpen, setModalOpen] = useState(false);
  const [subjectDraft, setSubjectDraft] = useState("");
  const [firstMessageDraft, setFirstMessageDraft] = useState("");
  const [composeBusy, setComposeBusy] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  const verified = user?.isVerified === true;

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/messages", { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!conversationId) {
      setPollingThreadId(null);
      return;
    }
    setPollingThreadId(conversationId);
    void loadThread(conversationId);
    return () => setPollingThreadId(null);
  }, [conversationId, loadThread, setPollingThreadId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationId, messagesByConversationId]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId]
  );

  const messages = conversationId ? messagesByConversationId[conversationId] ?? [] : [];

  const onOpenModal = useCallback(() => {
    setSubjectDraft("");
    setFirstMessageDraft("");
    setModalOpen(true);
  }, []);

  const onCreateConversation = async () => {
    const msg = firstMessageDraft.trim();
    if (!msg) return;
    setComposeBusy(true);
    try {
      const sub = subjectDraft.trim();
      const { conversationId: id } = await createConversation({
        subject: sub || undefined,
        message: msg,
      });
      toast.success(t.createdToast);
      setModalOpen(false);
      navigate(`/messages/${id}`);
      await refreshList();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.sendError);
    } finally {
      setComposeBusy(false);
    }
  };

  const onSendReply = async () => {
    if (!conversationId) return;
    const body = replyDraft.trim();
    if (!body) return;
    if (activeConv?.status === "closed") return;
    setSendBusy(true);
    try {
      await sendMessage(conversationId, body);
      setReplyDraft("");
      toast.success(t.sentToast);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.sendError);
    } finally {
      setSendBusy(false);
    }
  };

  if (isAdmin) return null;

  if (!verified) {
    return (
      <div className={cn("mx-auto max-w-lg p-8 text-center", glassPanel)}>
        <p className="text-sm text-zinc-300">{t.verifyRequired}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[min(720px,calc(100vh-8rem))] max-w-6xl flex-col gap-4 lg:flex-row">
      <aside className={cn("flex min-h-0 w-full flex-col lg:w-[300px] lg:shrink-0", glassPanel, "p-3")}>
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-100">{t.title}</h1>
            <p className="text-xs text-zinc-500">{t.subtitle}</p>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={onOpenModal}
            className="shrink-0 rounded-xl border-0 bg-gradient-to-r from-violet-600/90 to-fuchsia-600/85 text-white shadow-[0_0_24px_-6px_rgba(167,139,250,0.55)] transition-[filter,transform] duration-200 hover:brightness-110 active:scale-[0.98]"
          >
            <MessageSquarePlus className="mr-1.5 h-4 w-4" />
            {t.contactAdmin}
          </Button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {listLoading && conversations.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-xl bg-gradient-to-r from-white/[0.06] to-white/[0.02]"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-zinc-500">{t.noConversations}</p>
          ) : (
            conversations.map((c) => {
              const preview = c.lastMessage?.content ?? "—";
              const unread = c.unreadCount > 0;
              return (
                <NavLink
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className={({ isActive }) =>
                    cn(
                      "block rounded-xl px-3 py-2.5 transition-[background,box-shadow] duration-200 ease-out",
                      isActive
                        ? "bg-white/[0.08] shadow-[inset_0_0_0_1px_rgba(167,139,250,0.25),0_0_24px_-12px_rgba(139,92,246,0.35)]"
                        : "hover:bg-white/[0.05]"
                    )
                  }
                >
                  <div className="flex items-start gap-2">
                    <div className="relative mt-1.5 h-2 w-2 shrink-0">
                      {unread ? (
                        <span className="absolute inset-0 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.55)]" />
                      ) : (
                        <span className="absolute inset-0 rounded-full bg-zinc-600/80" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-100">
                        {c.subject?.trim() || t.adminLabel}
                      </p>
                      <p className="truncate text-xs text-zinc-500">{preview}</p>
                    </div>
                  </div>
                </NavLink>
              );
            })
          )}
        </div>
      </aside>

      <section className={cn("flex min-h-0 min-w-0 flex-1 flex-col", glassPanel)}>
        {!conversationId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-zinc-500">
            <p className="text-sm">{t.selectConversation}</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 backdrop-blur-md">
              <NavLink
                to="/messages"
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-white/[0.06] hover:text-zinc-100 lg:hidden"
                aria-label={t.backToList}
              >
                <ArrowLeft className="h-5 w-5" />
              </NavLink>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-100">
                  {activeConv?.subject?.trim() || t.adminLabel}
                </p>
                <p className="text-xs text-zinc-500">
                  {activeConv?.status === "closed" ? t.closedHint : t.subtitle}
                </p>
              </div>
            </header>

            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {threadLoadingId === conversationId && messages.length === 0 ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        "h-12 max-w-[80%] animate-pulse rounded-2xl",
                        i % 2 === 0 ? "ml-auto bg-violet-500/10" : "mr-auto bg-white/[0.05]"
                      )}
                    />
                  ))}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map((msg) => {
                    const mine = msg.sender === "user";
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
                            "max-w-[min(100%,28rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg transition-shadow duration-200",
                            mine
                              ? "bg-gradient-to-br from-violet-600/85 to-fuchsia-700/80 text-white shadow-[0_0_28px_-8px_rgba(167,139,250,0.45)]"
                              : "border border-white/[0.08] bg-zinc-900/70 text-zinc-100 backdrop-blur-md"
                          )}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p className={cn("mt-1 text-[10px] opacity-70", mine ? "text-violet-100" : "text-zinc-500")}>
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
                  disabled={activeConv?.status === "closed"}
                  placeholder={
                    activeConv?.status === "closed" ? t.closedHint : t.placeholderReply
                  }
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
                  disabled={activeConv?.status === "closed" || sendBusy || !replyDraft.trim()}
                  onClick={() => void onSendReply()}
                  className="h-11 w-11 shrink-0 rounded-xl border-0 bg-gradient-to-br from-cyan-500/90 to-violet-600/90 text-white shadow-[0_0_20px_-4px_rgba(34,211,238,0.45)] transition-[filter,transform] duration-200 hover:brightness-110 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border-white/10 bg-zinc-950/90 backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{t.modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">{t.subjectOptional}</label>
              <input
                value={subjectDraft}
                onChange={(e) => setSubjectDraft(e.target.value)}
                placeholder={t.subjectPlaceholder}
                className={cn("w-full px-3 py-2 text-sm text-zinc-100", glassInput)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">{t.messageLabel}</label>
              <textarea
                value={firstMessageDraft}
                onChange={(e) => setFirstMessageDraft(e.target.value)}
                placeholder={t.messagePlaceholder}
                rows={4}
                className={cn("w-full resize-none px-3 py-2 text-sm text-zinc-100", glassInput)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              {t.cancel}
            </Button>
            <Button
              type="button"
              disabled={composeBusy || !firstMessageDraft.trim()}
              onClick={() => void onCreateConversation()}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_24px_-8px_rgba(167,139,250,0.5)]"
            >
              {t.send}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
