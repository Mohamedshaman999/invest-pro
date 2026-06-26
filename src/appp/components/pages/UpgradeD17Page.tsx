import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { investApi } from "../../services/investApi";
import { formatTndWithUnit } from "../../utils/tndCurrency";

type PlanId = "monthly" | "yearly";

type UpgradeD17LocationState = {
  planId?: PlanId;
  phone?: string;
};

const PLAN_AMOUNTS: Record<PlanId, number> = {
  monthly: 20,
  yearly: 200,
};

function isPlanId(v: unknown): v is PlanId {
  return v === "monthly" || v === "yearly";
}

export function UpgradeD17Page() {
  const { text } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUserProfile } = useAuth();
  const [proBusy, setProBusy] = useState(false);
  const d17 = text.pages.upgrade.d17Checkout;

  const state = location.state as UpgradeD17LocationState | null;
  const planId = state?.planId;
  const phone = typeof state?.phone === "string" ? state.phone.trim() : "";

  const valid = isPlanId(planId);
  const amount = valid ? PLAN_AMOUNTS[planId] : 0;

  const planName = valid ? text.pages.upgrade.planNames[planId] : "—";

  const steps = useMemo(() => [d17.step1, d17.step2, d17.step3], [d17.step1, d17.step2, d17.step3]);

  const confirmProAfterPayment = async () => {
    if (!valid || !planId) return;
    setProBusy(true);
    try {
      const { profile } = await investApi.completeProSubscription({ planType: planId });
      await refreshUserProfile(profile);
      toast.success("Abonnement Pro activé. Vos outils sont disponibles.");
      navigate("/dashboard");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Activation Pro impossible. Réessayez.");
    } finally {
      setProBusy(false);
    }
  };

  if (!valid) {
    return (
      <div className="mx-auto max-w-lg space-y-6 rounded-[28px] ip-panel p-8 text-ip">
        <p className="text-lg font-semibold">{d17.invalidSession}</p>
        <Link
          to="/upgrade"
          className="inline-flex rounded-xl hero-cta px-5 py-3 text-sm font-semibold"
        >
          <span className="hero-cta-label">{d17.retryUpgrade}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] ip-panel-strong p-8 text-ip shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.22),transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.14),transparent_45%)]" />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-200">
                <Smartphone className="h-6 w-6" />
              </span>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-purple-200/90" style={{ fontFamily: "Orbitron, ui-sans-serif, system-ui, sans-serif" }}>
                D17
              </p>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{d17.title}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-300">{d17.subtitle}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <p className="text-sm font-semibold text-slate-400">{d17.amountLabel}</p>
            <p className="mt-2 text-2xl font-bold text-ip">{formatTndWithUnit(amount)}</p>
            <p className="mt-4 text-sm text-slate-400">{d17.planLabel}</p>
            <p className="mt-1 font-semibold text-ip">{planName}</p>
            {phone ? (
              <>
                <p className="mt-4 text-sm text-slate-400">{d17.phoneLabel}</p>
                <p className="mt-1 font-mono text-sm text-ip">{phone}</p>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-[28px] ip-panel p-8">
          <h2 className="text-xl font-semibold text-ip">{d17.stepsTitle}</h2>
          <ol className="list-decimal space-y-4 pl-6 text-ip-muted">
            {steps.map((line) => (
              <li key={line} className="leading-relaxed">
                {line}
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => navigate("/upgrade")}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-400/30 hover:bg-white/10"
            >
              {d17.backToUpgrade}
            </button>
            <button
              type="button"
              disabled={proBusy}
              onClick={() => void confirmProAfterPayment()}
              className="hero-cta rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="hero-cta-label inline-flex items-center gap-2">
                {proBusy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {d17.confirmPaidActivate}
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition-colors hover:border-purple-400/30 hover:bg-white/10"
            >
              {d17.goDashboard}
            </button>
          </div>
        </div>

        <aside className="rounded-[28px] border border-purple-500/25 bg-gradient-to-br from-violet-600/35 to-fuchsia-600/25 p-6 text-ip shadow-lg shadow-purple-900/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-purple-100" />
            <p className="text-sm font-semibold">{text.pages.upgrade.securePaymentTitle}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-200/90">{d17.footerNote}</p>
        </aside>
      </div>
    </div>
  );
}
