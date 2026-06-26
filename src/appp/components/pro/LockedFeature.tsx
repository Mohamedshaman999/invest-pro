import { Link } from "react-router";
import { Lock, Sparkles } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

type LockedFeatureProps = {
  /** Nom court affiché (ex. « Trading IA »). */
  feature: string;
};

/**
 * Overlay glass réutilisable pour les fonctionnalités réservées aux comptes Pro.
 */
export function LockedFeature({ feature }: LockedFeatureProps) {
  const { text } = useLanguage();
  const p = text.pages.proFeature;

  return (
    <div className="relative flex min-h-[min(70vh,560px)] items-center justify-center overflow-hidden rounded-[28px] px-4 py-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.22), transparent 45%), radial-gradient(circle at 80% 70%, rgba(236,72,153,0.16), transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute inset-8 rounded-[24px] border border-white/[0.06] bg-slate-950/20 blur-xl dark:bg-slate-900/25" />
      <div className="pointer-events-none absolute inset-x-12 top-24 h-32 rounded-2xl bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-transparent blur-2xl" />

      <div
        className="relative z-10 w-full max-w-lg rounded-[28px] border border-white/15 bg-white/[0.07] p-8 shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-white/[0.06]"
        style={{
          boxShadow:
            "inset 0 1px 0 0 rgba(255,255,255,0.12), 0 24px 80px -12px rgba(0,0,0,0.45)",
        }}
      >
        <div className="flex flex-col items-center text-center">
          <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-violet-200 shadow-inner shadow-white/10">
            <Lock className="h-7 w-7" strokeWidth={2} aria-hidden />
          </span>
          <h2 className="text-2xl font-semibold tracking-tight text-ip">{p.modalTitle}</h2>
          <p className="mt-2 text-sm font-medium text-violet-200/90">{feature}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.modalSubtitle}</p>
          <p className="mt-2 text-xs text-slate-500">{p.lockHint}</p>

          <ul className="mt-8 w-full space-y-2.5 text-left text-sm text-slate-300">
            {p.previewFeatures.map((line) => (
              <li key={line} className="flex gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.04] px-3 py-2.5 backdrop-blur-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-purple-300/90" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <Link
            to="/upgrade"
            className="hero-cta mt-10 inline-flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold transition-all duration-300 hover:brightness-110"
          >
            <span className="hero-cta-label">{p.upgradeCta}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
