import { AnimatePresence, motion } from "framer-motion";
import type { AppLanguage } from "../../contexts/LanguageContext";
import type { NotifPerformanceRow } from "../../hooks/useOwnedAssets24hPerformance";
import { Loader2 } from "lucide-react";

const COPY: Record<
  AppLanguage,
  {
    title: string;
    subtitle: string;
    empty: string;
    loading: string;
    lastUpdated: (minutes: number) => string;
    lastUpdatedJustNow: string;
    approxRef: string;
  }
> = {
  fr: {
    title: "Performance 24h",
    subtitle: "Progression de vos titres sur les dernières 24 heures",
    empty: "Aucune action ni ETF en portefeuille pour afficher la performance 24h.",
    loading: "Chargement des cotations…",
    lastUpdated: (minutes) => `Mis à jour il y a ${minutes} min`,
    lastUpdatedJustNow: "Mis à jour à l’instant",
    approxRef: "Réf. approx. (données journalières)",
  },
  en: {
    title: "24H Performance",
    subtitle: "Your stocks progress in the last 24 hours",
    empty: "No stocks or ETFs in your portfolio to show 24h performance.",
    loading: "Loading quotes…",
    lastUpdated: (minutes) => `Last updated ${minutes} min ago`,
    lastUpdatedJustNow: "Updated just now",
    approxRef: "Approx. ref. (daily snapshots)",
  },
  es: {
    title: "Rendimiento 24h",
    subtitle: "Sus valores en las últimas 24 horas",
    empty: "No hay acciones ni ETF en su cartera para mostrar el rendimiento 24h.",
    loading: "Cargando cotizaciones…",
    lastUpdated: (minutes) => `Actualizado hace ${minutes} min`,
    lastUpdatedJustNow: "Actualizado ahora",
    approxRef: "Ref. aprox. (cierres diarios)",
  },
  de: {
    title: "24h-Performance",
    subtitle: "Ihre Titel der letzten 24 Stunden",
    empty: "Keine Aktien oder ETFs im Portfolio für 24h-Performance.",
    loading: "Kurse werden geladen…",
    lastUpdated: (minutes) => `Vor ${minutes} Min. aktualisiert`,
    lastUpdatedJustNow: "Gerade aktualisiert",
    approxRef: "Ca. Referenz (Tagesstände)",
  },
  ar: {
    title: "أداء 24 ساعة",
    subtitle: "تطور أسهمك خلال آخر 24 ساعة",
    empty: "لا توجد أسهم أو صناديق متداولة في المحفظة لعرض أداء 24 ساعة.",
    loading: "جاري تحميل الأسعار…",
    lastUpdated: (minutes) => `آخر تحديث منذ ${minutes} د`,
    lastUpdatedJustNow: "تم التحديث الآن",
    approxRef: "مرجع تقريبي (يومي)",
  },
};

function localeFor(lang: AppLanguage): string {
  const m: Record<AppLanguage, string> = {
    fr: "fr-FR",
    en: "en-US",
    es: "es-ES",
    de: "de-DE",
    ar: "ar-SA",
  };
  return m[lang] ?? "en-US";
}

function lastUpdatedLabel(lang: AppLanguage, fetchedAt: number | null): string | null {
  if (fetchedAt == null) return null;
  const t = COPY[lang] ?? COPY.en;
  const sec = (Date.now() - fetchedAt) / 1000;
  if (sec < 50) return t.lastUpdatedJustNow;
  const minutes = Math.max(1, Math.round(sec / 60));
  return t.lastUpdated(minutes);
}

function MiniSparkline({ values, positive }: { values: number[]; positive: boolean }) {
  const stroke = positive ? "rgba(52,211,153,0.85)" : "rgba(248,113,113,0.9)";
  const w = 56;
  const h = 22;
  if (values.length < 2) {
    return (
      <div className="flex h-[22px] w-14 items-end justify-between gap-px opacity-50">
        {values.map((v, i) => (
          <div
            key={i}
            className="w-1 rounded-sm bg-gradient-to-t from-white/10 to-white/30"
            style={{ height: `${Math.max(18, v * 18)}px` }}
          />
        ))}
      </div>
    );
  }
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 2) + 1;
      const y = h - 1 - v * (h - 4);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible" aria-hidden>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
        className={positive ? "drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]" : "drop-shadow-[0_0_6px_rgba(248,113,113,0.4)]"}
      />
    </svg>
  );
}

type Props = {
  open: boolean;
  language: AppLanguage;
  rows: NotifPerformanceRow[];
  loading: boolean;
  fetchedAt: number | null;
};

export function NotificationPerformanceDropdown({ open, language, rows, loading, fetchedAt }: Props) {
  const t = COPY[language] ?? COPY.en;
  const loc = localeFor(language);
  const updated = lastUpdatedLabel(language, fetchedAt);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="ip-notif-performance-panel"
          role="dialog"
          aria-label={t.title}
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -6 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-full z-[100] mt-2 w-[min(calc(100vw-1.25rem),22rem)] origin-top-right overflow-hidden rounded-2xl border-0 bg-zinc-950/55 px-0 py-0 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.55),0_0_48px_-6px_rgba(168,85,247,0.28)] outline-none backdrop-blur-2xl dark:bg-[rgba(6,8,20,0.58)]"
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/[0.07] via-transparent to-fuchsia-500/[0.06]" />
          <div className="relative flex items-start justify-between gap-2 px-4 pb-3 pt-4">
            <div className="min-w-0">
              <h2 className="text-[0.95rem] font-semibold tracking-tight text-ip">{t.title}</h2>
              <p className="mt-0.5 text-xs leading-relaxed text-ip-muted">{t.subtitle}</p>
            </div>
            {loading && rows.length > 0 ? (
              <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-violet-400/90" aria-hidden />
            ) : null}
          </div>

          <div className="relative max-h-[min(60vh,22rem)] overflow-y-auto px-2 pb-3">
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-ip-muted">
                <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                {t.loading}
              </div>
            ) : rows.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ip-muted">{t.empty}</p>
            ) : (
              <ul className="space-y-1.5 px-1 pb-1">
                {rows.map((r) => {
                  const up = r.changePct >= 0;
                  const pctStr = new Intl.NumberFormat(loc, {
                    signDisplay: "always",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(r.changePct);
                  const priceStr = new Intl.NumberFormat(loc, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(r.currentPrice);
                  return (
                    <li
                      key={r.ticker}
                      className="rounded-xl px-2.5 py-2.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2">
                            <span className="truncate font-semibold tabular-nums text-ip">{r.ticker}</span>
                            <span className="truncate text-xs text-ip-muted">{r.name}</span>
                          </div>
                          <p className="mt-0.5 text-[11px] text-ip-subtle">
                            <span className="text-ip-muted">24h</span>{" "}
                            {new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
                              r.referencePrice,
                            )}{" "}
                            <span className="text-ip-muted">→</span> {priceStr}
                            {r.usedFallback ? (
                              <span className="ml-1 align-middle text-[10px] text-ip-muted" title={t.approxRef}>
                                *
                              </span>
                            ) : null}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span
                            className={
                              up
                                ? "tabular-nums text-sm font-semibold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)]"
                                : "tabular-nums text-sm font-semibold text-rose-400 drop-shadow-[0_0_10px_rgba(251,113,133,0.35)]"
                            }
                          >
                            {pctStr}%
                          </span>
                          <MiniSparkline values={r.sparklineNormalized} positive={up} />
                        </div>
                      </div>
                      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className={
                            up
                              ? "h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/90 shadow-[0_0_12px_rgba(52,211,153,0.35)]"
                              : "h-full rounded-full bg-gradient-to-r from-rose-600/90 to-rose-400/85 shadow-[0_0_12px_rgba(251,113,133,0.3)]"
                          }
                          style={{
                            width: `${Math.max(6, Math.min(100, Math.abs(r.changePct) * 6 + 4))}%`,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {updated && rows.length > 0 ? (
            <div className="relative px-4 py-2.5 text-center text-[11px] text-ip-subtle [box-shadow:inset_0_1px_0_rgba(255,255,255,0.05)]">
              {updated}
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
