import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Link2,
  Loader2,
  PlusCircle,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { MarketStock } from "../../data/marketData";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage, type AppLanguage } from "../../contexts/LanguageContext";
import { useMarketData } from "../../contexts/MarketDataContext";
import {
  investApi,
  type AiAssistantChatMessage,
  type AiAssistantConversationSummary,
} from "../../services/investApi";
import { ApiError } from "../../lib/api";
import { formatTndWithUnit } from "../../utils/tndCurrency";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

const glassPanel =
  "rounded-2xl border border-white/[0.08] bg-zinc-950/40 shadow-[0_8px_40px_-16px_rgba(0,0,0,0.85),0_0_36px_-10px_rgba(139,92,246,0.18)] backdrop-blur-xl dark:border-cyan-400/10";
const glassInput =
  "rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md outline-none transition-[border-color,box-shadow] duration-200 ease-out focus:border-violet-400/35 focus:shadow-[0_0_24px_-8px_rgba(167,139,250,0.45)]";

const CACHE_KEY = "ip_ai_assistant_v1";

function apiLang(language: AppLanguage): "fr" | "en" {
  return language === "fr" ? "fr" : "en";
}

function loadCache(): { conversationId: string | null; messages: AiAssistantChatMessage[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as { conversationId?: string; messages?: AiAssistantChatMessage[] };
    if (!o || typeof o !== "object") return null;
    return {
      conversationId: typeof o.conversationId === "string" ? o.conversationId : null,
      messages: Array.isArray(o.messages) ? o.messages : [],
    };
  } catch {
    return null;
  }
}

function saveCache(conversationId: string | null, messages: AiAssistantChatMessage[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ conversationId, messages }));
  } catch {
    /* ignore */
  }
}

function TypingDots({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-zinc-900/70 px-4 py-3 backdrop-blur-md">
      <span className="sr-only">{label}</span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-violet-400/90"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

export function AiAssistantPage() {
  const { user } = useAuth();
  const verified = user?.isVerified === true;
  const { text, language } = useLanguage();
  const t = text.pages.aiAssistant;
  const tm = text.pages.messages;

  const [conversations, setConversations] = useState<AiAssistantConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiAssistantChatMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sendBusy, setSendBusy] = useState(false);
  const [attachedTicker, setAttachedTicker] = useState<string | null>(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockSearch, setStockSearch] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const { markets, loading: marketsLoading } = useMarketData();
  const listEndRef = useRef<HTMLDivElement>(null);

  const filteredMarkets = useMemo(() => {
    const q = stockSearch.trim().toLowerCase();
    if (!q) return markets;
    return markets.filter((m) => m.symbol.toLowerCase().includes(q) || m.name.toLowerCase().includes(q));
  }, [markets, stockSearch]);

  const refreshList = useCallback(async () => {
    if (!verified) return;
    setListLoading(true);
    try {
      const { conversations: rows } = await investApi.listAiConversations();
      setConversations(rows);
    } catch {
      setConversations([]);
    } finally {
      setListLoading(false);
    }
  }, [verified]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  useEffect(() => {
    if (!verified) return;
    const cached = loadCache();
    if (cached?.conversationId && cached.messages.length > 0) {
      setConversationId(cached.conversationId);
      setMessages(cached.messages);
    }
  }, [verified]);

  useEffect(() => {
    if (!verified) return;
    saveCache(conversationId, messages);
  }, [conversationId, messages, verified]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendBusy]);

  const loadThread = useCallback(
    async (id: string) => {
      setThreadLoading(true);
      try {
        const { messages: rows } = await investApi.getAiConversation(id);
        setConversationId(id);
        setMessages(rows);
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : t.sendError);
      } finally {
        setThreadLoading(false);
      }
    },
    [t.sendError]
  );

  const onNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setAttachedTicker(null);
  }, []);

  const confirmDeleteConversation = useCallback(async () => {
    if (!deleteConfirmId) return;
    const id = deleteConfirmId;
    setDeleteBusy(true);
    try {
      await investApi.deleteAiConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (conversationId === id) {
        onNewChat();
        saveCache(null, []);
      }
      setDeleteConfirmId(null);
      void refreshList();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.deleteConversationError);
    } finally {
      setDeleteBusy(false);
    }
  }, [conversationId, deleteConfirmId, onNewChat, refreshList, t.deleteConversationError]);

  const sendMessage = useCallback(
    async (textOverride?: string) => {
      const trimmed = (textOverride ?? draft).trim();
      if (!trimmed || sendBusy) return;

      const userMsg: AiAssistantChatMessage = {
        id: `tmp-u-${Date.now()}`,
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      if (!textOverride) setDraft("");
      setSendBusy(true);

      try {
        const { reply, conversationId: cid } = await investApi.postAiChat({
          message: trimmed,
          conversationId: conversationId ?? undefined,
          stock_context: attachedTicker ? { ticker: attachedTicker } : undefined,
          lang: apiLang(language),
        });
        setConversationId(cid);
        const assistantMsg: AiAssistantChatMessage = {
          id: `tmp-a-${Date.now()}`,
          role: "assistant",
          content: reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((m) => [...m, assistantMsg]);
        void refreshList();
      } catch (e) {
        setMessages((m) => m.filter((x) => x.id !== userMsg.id));
        const msg = e instanceof ApiError ? e.message : t.sendError;
        toast.error(msg, {
          action: {
            label: t.retry,
            onClick: () => void sendMessage(trimmed),
          },
        });
      } finally {
        setSendBusy(false);
      }
    },
    [attachedTicker, conversationId, draft, language, refreshList, sendBusy, t]
  );

  const pickStock = (stock: MarketStock) => {
    setAttachedTicker(stock.symbol.toUpperCase());
    setStockModalOpen(false);
    setStockSearch("");
  };

  if (!verified) {
    return (
      <div className={cn("mx-auto max-w-lg p-8 text-center", glassPanel)}>
        <p className="text-sm text-zinc-300">{tm.verifyRequired}</p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[min(720px,calc(100vh-8rem))] max-w-6xl flex-col gap-4 lg:flex-row">
      <aside
        className={cn(
          "flex min-h-0 w-full flex-col rounded-2xl border border-ip bg-[var(--ip-card-bg)] p-4 shadow-sm lg:w-[280px] lg:shrink-0"
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ip-secondary">{t.historyTitle}</h2>
            <p className="mt-0.5 text-[11px] text-ip-muted">{t.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="hero-cta inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold"
          >
            <PlusCircle className="h-4 w-4" aria-hidden />
            {t.newChat}
          </button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {listLoading && conversations.length === 0 ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-xl border border-ip bg-[var(--ip-inner-well)]"
                />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-ip-muted">{t.noConversations}</p>
          ) : (
            conversations.map((c) => {
              const active = c.id === conversationId;
              const preview = c.lastMessage?.content ?? "—";
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex min-w-0 items-stretch gap-0.5 rounded-xl border transition-colors",
                    active
                      ? "border-violet-500/40 bg-violet-500/10"
                      : "border-ip bg-[var(--ip-inner-well)] hover:border-ip/80"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => void loadThread(c.id)}
                    className="min-w-0 flex-1 px-3 py-2.5 text-left"
                  >
                    <p className="truncate text-xs font-medium text-ip">
                      {new Date(c.updatedAt).toLocaleString()}
                    </p>
                    <p className="truncate text-xs text-ip-muted">{preview}</p>
                  </button>
                  <button
                    type="button"
                    className="flex shrink-0 items-center justify-center rounded-r-[11px] px-2 text-ip-muted transition-colors hover:bg-red-500/15 hover:text-red-400"
                    aria-label={t.deleteConversationAria}
                    title={t.deleteConversationAria}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDeleteConfirmId(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </aside>

      <section className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", glassPanel)}>
        <header className="flex shrink-0 items-center gap-3 border-b border-white/[0.06] px-4 py-3 backdrop-blur-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] text-violet-200 shadow-inner shadow-white/10">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight text-zinc-100">{t.title}</h1>
            <p className="truncate text-xs text-zinc-500">{t.subtitle}</p>
          </div>
        </header>

        <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
          {threadLoading && messages.length === 0 ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-14 max-w-[70%] animate-pulse rounded-2xl",
                    i % 2 === 0 ? "ml-auto bg-violet-500/10" : "mr-auto bg-white/[0.05]"
                  )}
                />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="max-w-sm text-sm text-zinc-500">{t.emptyThreadHint}</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const mine = msg.role === "user";
                return (
                  <motion.div
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className={cn("flex w-full", mine ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg transition-shadow duration-200 ease-in-out",
                        mine
                          ? "bg-gradient-to-br from-violet-600/85 to-fuchsia-700/80 text-white shadow-[0_0_28px_-8px_rgba(167,139,250,0.45)]"
                          : "border border-white/[0.08] bg-zinc-900/65 text-zinc-100 backdrop-blur-lg"
                      )}
                      style={
                        mine
                          ? undefined
                          : { boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.06), 0 8px 32px -12px rgba(0,0,0,0.5)" }
                      }
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                      {mine ? (
                        <p className="mt-1 text-[10px] opacity-70 text-violet-100">
                          {new Date(msg.createdAt).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          {sendBusy ? (
            <div className="flex justify-start">
              <TypingDots label={t.typing} />
            </div>
          ) : null}
          <div ref={listEndRef} />
        </div>

        <div className="shrink-0 border-t border-white/[0.06] p-4 backdrop-blur-xl">
          {attachedTicker ? (
            <div className="mb-2 flex items-center gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/25 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100 backdrop-blur-md">
                <Link2 className="h-3.5 w-3.5 opacity-80" aria-hidden />
                {t.attachedPrefix}: {attachedTicker}
                <button
                  type="button"
                  onClick={() => setAttachedTicker(null)}
                  className="rounded-full p-0.5 text-violet-200/90 hover:bg-white/10 disabled:opacity-40"
                  aria-label={t.clearStock}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            </div>
          ) : null}
          <div className={cn("flex flex-col gap-2 sm:flex-row sm:items-end", glassInput, "p-2")}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={marketsLoading}
              onClick={() => setStockModalOpen(true)}
              className="h-11 shrink-0 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-semibold text-zinc-200 hover:bg-white/[0.07]"
            >
              {marketsLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
              {t.attachStock}
            </Button>
            <textarea
              rows={1}
              placeholder={t.placeholder}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 disabled:opacity-50"
            />
            <Button
              type="button"
              size="icon"
              disabled={sendBusy || !draft.trim()}
              onClick={() => void sendMessage()}
              className="h-11 w-11 shrink-0 rounded-xl border-0 bg-gradient-to-br from-cyan-500/90 to-violet-600/90 text-white shadow-[0_0_20px_-4px_rgba(34,211,238,0.45)] transition-[filter,transform] duration-200 ease-in-out hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <Dialog
        open={deleteConfirmId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null);
        }}
      >
        <DialogContent className="border-white/10 bg-zinc-950/90 backdrop-blur-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{t.deleteConversation}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-400">{t.deleteConversationConfirm}</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" onClick={() => setDeleteConfirmId(null)} disabled={deleteBusy}>
              {tm.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="bg-red-600 hover:bg-red-500"
              disabled={deleteBusy}
              onClick={() => void confirmDeleteConversation()}
            >
              {deleteBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : t.deleteConversation}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent className="border-white/10 bg-zinc-950/90 backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">{t.stockPickerTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative py-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={stockSearch}
              onChange={(e) => setStockSearch(e.target.value)}
              placeholder={t.stockSearch}
              className={cn("w-full py-2.5 pl-10 pr-3 text-sm text-zinc-100", glassInput)}
              autoComplete="off"
            />
          </div>
          <div className="custom-scrollbar max-h-[min(360px,45vh)] space-y-2 overflow-y-auto pr-1">
            {filteredMarkets.map((m) => (
              <div
                key={m.symbol}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-zinc-100">{m.symbol}</p>
                  <p className="truncate text-xs text-zinc-500">{m.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-medium text-zinc-300">{formatTndWithUnit(m.price)}</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => pickStock(m)}
                    className="rounded-xl bg-gradient-to-r from-violet-600/90 to-fuchsia-600/85 text-xs text-white"
                  >
                    {t.pick}
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setStockModalOpen(false)}>
              {tm.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
