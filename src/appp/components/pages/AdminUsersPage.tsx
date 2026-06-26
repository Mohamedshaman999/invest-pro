import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Eye, Loader2, Shield, Trash2, Unlock, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { ApiError } from "../../lib/api";
import { investApi, type AdminUserDto } from "../../services/investApi";

type AdminUsersListPayload = Awaited<ReturnType<typeof investApi.adminListUsers>>;
const listCache = new Map<string, AdminUsersListPayload>();

function cacheKey(page: number, limit: number) {
  return `${page}:${limit}`;
}

function formatLastActive(iso: string | null, locale: string, neverLabel: string) {
  if (!iso) return neverLabel;
  try {
    const loc =
      locale === "fr"
        ? "fr-FR"
        : locale === "es"
          ? "es-ES"
          : locale === "de"
            ? "de-DE"
            : locale === "ar"
              ? "ar-SA"
              : "en-US";
    return new Intl.DateTimeFormat(loc, { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function riskTone(failed: number): "green" | "yellow" | "red" {
  if (failed >= 5) return "red";
  if (failed >= 3) return "yellow";
  return "green";
}

export function AdminUsersPage() {
  const { isAdmin, user: authUser } = useAuth();
  const { text, language } = useLanguage();
  const t = text.pages.adminUsersPage;
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = 15;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<AdminUserDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [detailUser, setDetailUser] = useState<AdminUserDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUserDto | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const invalidateCache = useCallback(() => {
    listCache.clear();
  }, []);

  const loadPage = useCallback(
    async (p: number, opts?: { force?: boolean; silent?: boolean }): Promise<AdminUsersListPayload | null> => {
      const key = cacheKey(p, limit);
      const silent = opts?.silent === true;
      if (!opts?.force && listCache.has(key)) {
        const c = listCache.get(key)!;
        if (!mounted.current) return null;
        setRows(c.users);
        setTotalPages(c.totalPages);
        setTotal(c.total);
        if (!silent) setLoading(false);
        return c;
      }
      if (!silent) {
        setLoading(true);
        setError("");
      }
      try {
        const data = await investApi.adminListUsers({ page: p, limit });
        listCache.set(key, data);
        if (!mounted.current) return null;
        setRows(data.users);
        setTotalPages(data.totalPages);
        setTotal(data.total);
        return data;
      } catch (e) {
        if (!mounted.current) return null;
        if (silent) {
          toast.error(e instanceof ApiError ? e.message : t.loadError);
        } else {
          setError(e instanceof ApiError ? e.message : t.loadError);
          setRows([]);
        }
        return null;
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [limit, t.loadError]
  );

  useEffect(() => {
    if (!isAdmin) navigate("/");
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    void loadPage(page);
  }, [isAdmin, page, loadPage]);

  const openDetail = async (u: AdminUserDto) => {
    setDetailUser(u);
    setDetailLoading(true);
    try {
      const fresh = await investApi.adminGetUser(u.id);
      if (mounted.current) setDetailUser(fresh);
    } catch {
      toast.error(t.loadError);
      setDetailUser(null);
    } finally {
      if (mounted.current) setDetailLoading(false);
    }
  };

  const onUnlock = async (u: AdminUserDto) => {
    const prevRows = rows;
    const optimistic = rows.map((r) =>
      r.id === u.id
        ? {
            ...r,
            accountLocked: false,
            lockReason: null,
            lockUntil: null,
            failedLoginAttempts: 0,
          }
        : r
    );
    setRows(optimistic);
    setBusyId(u.id);
    try {
      const updated = await investApi.adminUnlockUser(u.id);
      invalidateCache();
      setRows((cur) => cur.map((r) => (r.id === u.id ? updated : r)));
      setDetailUser((d) => (d?.id === u.id ? updated : d));
      toast.success(t.unlockedToast);
    } catch (e) {
      setRows(prevRows);
      toast.error(e instanceof ApiError ? e.message : t.loadError);
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    const prevRows = rows;
    const prevTotal = total;
    const currentPage = page;
    setRows((cur) => cur.filter((r) => r.id !== id));
    setTotal((n) => Math.max(0, n - 1));
    setBusyId(id);
    try {
      await investApi.adminDeleteUser(id);
      invalidateCache();
      toast.success(t.deletedToast);
      setDeleteTarget(null);
      setDetailUser((d) => (d?.id === id ? null : d));
      const data = await loadPage(currentPage, { force: true, silent: true });
      if (data && data.users.length === 0 && currentPage > 1) {
        setPage((p) => Math.max(1, p - 1));
      }
    } catch (e) {
      setRows(prevRows);
      setTotal(prevTotal);
      toast.error(e instanceof ApiError ? e.message : t.loadError);
    } finally {
      setBusyId(null);
    }
  };

  const selfId = authUser?.id ? Number(authUser.id) : NaN;

  const riskClasses = useMemo(
    () => ({
      green:
        "border-emerald-400/35 bg-emerald-500/10 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.25)]",
      yellow:
        "border-amber-400/35 bg-amber-500/10 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.2)]",
      red: "border-rose-400/35 bg-rose-500/12 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.28)]",
    }),
    []
  );

  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-400" />
            <h1 className="text-3xl font-bold text-ip">{t.title}</h1>
          </div>
          <p className="mt-2 max-w-2xl text-ip-muted">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ip-muted backdrop-blur-md">
          <Shield className="h-4 w-4 text-violet-300/90" aria-hidden />
          <span>
            {total} {language === "fr" ? "comptes" : "accounts"}
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] backdrop-blur-xl">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-lg font-semibold text-ip">{t.title}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-xs uppercase tracking-[0.18em] text-ip-muted">
                <th className="px-6 py-4 font-semibold">{t.colName}</th>
                <th className="px-6 py-4 font-semibold">{t.colEmail}</th>
                <th className="px-6 py-4 font-semibold">{t.colLastActive}</th>
                <th className="px-6 py-4 font-semibold">{t.colStatus}</th>
                <th className="px-6 py-4 font-semibold">{t.colRisk}</th>
                <th className="px-6 py-4 text-right font-semibold">{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-ip-muted">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-400/80" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-ip-muted">
                    {t.empty}
                  </td>
                </tr>
              ) : (
                rows.map((u) => {
                  const tone = riskTone(u.failedLoginAttempts);
                  const riskLabel =
                    tone === "green" ? t.riskBadgeLow : tone === "yellow" ? t.riskBadgeMid : t.riskBadgeHigh;
                  const lockedGlow = u.accountLocked
                    ? "shadow-[0_0_14px_rgba(244,63,94,0.22)]"
                    : "shadow-[0_0_10px_rgba(52,211,153,0.18)]";
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-white/[0.04] transition-colors duration-200 hover:bg-white/[0.04]"
                    >
                      <td className="px-6 py-4 font-medium text-ip">{u.displayName || u.name}</td>
                      <td className="px-6 py-4 text-ip-secondary">{u.email}</td>
                      <td className="px-6 py-4 text-ip-muted tabular-nums">
                        {formatLastActive(u.lastActiveAt, language, t.neverActive)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors ${lockedGlow} ${
                            u.accountLocked
                              ? "border-rose-400/40 bg-rose-500/15 text-rose-100"
                              : "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
                          }`}
                        >
                          {u.accountLocked ? t.statusLocked : t.statusActive}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${riskClasses[tone]}`}
                        >
                          <span className="tabular-nums">{u.failedLoginAttempts}</span>
                          <span className="opacity-90">{riskLabel}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => void openDetail(u)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-ip transition hover:border-violet-400/35 hover:bg-white/[0.1]"
                          >
                            <Eye className="h-4 w-4" />
                            {t.view}
                          </button>
                          {!Number.isNaN(selfId) && u.id === selfId ? null : (
                            <button
                              type="button"
                              disabled={busyId === u.id}
                              onClick={() => setDeleteTarget(u)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-rose-100 transition hover:bg-rose-500/15 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              {t.delete}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] px-6 py-4 text-sm text-ip-muted">
            <span>
              {t.pageLabel} {page} / {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/15 px-4 py-2 transition hover:bg-white/[0.06] disabled:opacity-40"
              >
                {t.prev}
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/15 px-4 py-2 transition hover:bg-white/[0.06] disabled:opacity-40"
              >
                {t.next}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <Dialog open={detailUser != null} onOpenChange={(o) => !o && setDetailUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-zinc-950/85 backdrop-blur-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-ip">{t.detailTitle}</DialogTitle>
          </DialogHeader>
          {detailUser ? (
            <div className="space-y-4 text-sm">
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 backdrop-blur-md">
                    <p className="text-xs uppercase tracking-wider text-ip-muted">{t.colName}</p>
                    <p className="mt-1 text-lg font-semibold text-ip">{detailUser.displayName || detailUser.name}</p>
                    <p className="mt-3 text-xs uppercase tracking-wider text-ip-muted">{t.colEmail}</p>
                    <p className="mt-1 text-ip-secondary">{detailUser.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <p className="text-xs text-ip-muted">{language === "fr" ? "Rôle" : "Role"}</p>
                      <p className="mt-1 font-medium text-ip">
                        {detailUser.investorRole === "PRO_INVESTOR" ? t.rolePro : t.roleInvestor}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <p className="text-xs text-ip-muted">{t.colLastActive}</p>
                      <p className="mt-1 font-medium text-ip tabular-nums">
                        {formatLastActive(detailUser.lastActiveAt, language, t.neverActive)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <p className="text-xs text-ip-muted">{t.failedAttempts}</p>
                      <p className="mt-1 font-medium tabular-nums text-ip">{detailUser.failedLoginAttempts}</p>
                    </div>
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
                      <p className="text-xs text-ip-muted">{t.colStatus}</p>
                      <p className="mt-1 font-medium text-ip">
                        {detailUser.accountLocked ? t.statusLocked : t.statusActive}
                      </p>
                    </div>
                  </div>
                  {detailUser.lockReason ? (
                    <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 p-3 text-rose-50">
                      <p className="text-xs font-medium uppercase tracking-wide text-rose-200/90">{t.lockReason}</p>
                      <p className="mt-1">{detailUser.lockReason}</p>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {detailUser.accountLocked ? (
                      <button
                        type="button"
                        disabled={busyId === detailUser.id}
                        onClick={() => void onUnlock(detailUser)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2.5 font-medium text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50 min-[400px]:flex-none"
                      >
                        <Unlock className="h-4 w-4" />
                        {t.unlock}
                      </button>
                    ) : null}
                    {!Number.isNaN(selfId) && detailUser.id === selfId ? null : (
                      <button
                        type="button"
                        disabled={busyId === detailUser.id}
                        onClick={() => setDeleteTarget(detailUser)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-400/35 bg-rose-500/10 px-4 py-2.5 font-medium text-rose-100 transition hover:bg-rose-500/15 disabled:opacity-50 min-[400px]:flex-none"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t.delete}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="border-white/10 bg-zinc-950/90 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ip">{t.confirmDeleteTitle}</AlertDialogTitle>
            <AlertDialogDescription className="text-ip-muted">{t.confirmDeleteBody}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/15 bg-transparent">{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
