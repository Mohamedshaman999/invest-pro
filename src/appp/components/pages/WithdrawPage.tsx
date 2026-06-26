import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Landmark, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTndWithUnit } from "../../utils/tndCurrency";
import { useWallet, roundStnd } from "../../contexts/WalletContext";
import { loadErrorClass, loadFieldClass, loadFieldRing, loadLabelClass } from "../payment/glassFieldClasses";
import { formatRibInput, isCompleteRib, normalizeRibDigits } from "../../utils/ribFormat";
import { TUNISIAN_BANKS } from "../../data/tunisianBanks";

const quickAmounts = [50, 100, 200];

const withdrawalMethods = [
  {
    id: "bank",
    icon: Landmark,
  },
];

export function WithdrawPage() {
  const { text, language } = useLanguage();
  const { stndBalance, withdrawStnd, formatStnd } = useWallet();
  const w = text.pages.withdraw;
  const la = text.pages.loadAccount;

  const [currentStep, setCurrentStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("bank");
  const [fullName, setFullName] = useState("");
  const [rib, setRib] = useState("");
  const [bankId, setBankId] = useState("");
  const [complete, setComplete] = useState(false);

  const [fullNameTouched, setFullNameTouched] = useState(false);
  const [ribTouched, setRibTouched] = useState(false);
  const [bankTouched, setBankTouched] = useState(false);

  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ar: "ar-SA" };
  const locale = localeMap[language] ?? "en-US";

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? roundStnd(parsed) : 0;
  }, [amount]);

  const amountIsValid = numericAmount > 0 && numericAmount <= roundStnd(stndBalance) + 1e-9;

  const fullNameError = useMemo(() => {
    if (!fullNameTouched && !fullName.trim()) return undefined;
    if (!fullName.trim()) return text.pages.upgrade.validation.requiredField;
    return undefined;
  }, [fullName, fullNameTouched, text.pages.upgrade.validation.requiredField]);

  const ribError = useMemo(() => {
    if (!ribTouched && !normalizeRibDigits(rib)) return undefined;
    if (!isCompleteRib(rib)) return w.ribInvalid;
    return undefined;
  }, [rib, ribTouched, w.ribInvalid]);

  const bankError = useMemo(() => {
    if (!bankTouched && !bankId) return undefined;
    if (!bankId) return text.pages.upgrade.validation.requiredField;
    return undefined;
  }, [bankId, bankTouched, text.pages.upgrade.validation.requiredField]);

  const detailsValid = Boolean(fullName.trim()) && isCompleteRib(rib) && Boolean(bankId);

  const canContinue =
    currentStep === 1
      ? amountIsValid
      : currentStep === 2
        ? Boolean(selectedMethod)
        : currentStep === 3
          ? detailsValid
          : true;

  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 1:
        return w.title;
      case 2:
        return w.methodTitle;
      case 3:
        return w.beneficiaryTitle;
      default:
        return w.confirmWithdrawal;
    }
  }, [currentStep, w]);

  const formattedAmountStnd = formatTndWithUnit(numericAmount);

  const bankLabel = TUNISIAN_BANKS.find((b) => b.id === bankId)?.labelKey ?? "";

  const handleQuickSelect = (value: number) => {
    const capped = Math.min(value, roundStnd(stndBalance));
    if (capped > 0) setAmount(capped.toString());
  };

  const handleConfirm = async () => {
    if (currentStep === 4) {
      const ok = await withdrawStnd(numericAmount);
      if (ok) setComplete(true);
      else toast.error("Something went wrong");
      return;
    }
    if (canContinue) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const stepOfLabel = la.stepOf.replace("{current}", String(currentStep)).replace("{total}", "4");

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] ip-panel-strong p-8 text-ip shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.22),transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.12),transparent_45%)]" />
        <div className="relative z-10 max-w-4xl">
          <p
            className="text-sm font-extrabold uppercase tracking-[0.3em] text-violet-800 dark:text-purple-200/90"
            style={{ fontFamily: "Orbitron, ui-sans-serif, system-ui, sans-serif" }}
          >
            InvestPro
          </p>
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ip">{w.title}</h1>
          <p className="mt-4 max-w-2xl text-base text-ip-muted">{w.subtitle}</p>
          <p className="mt-2 text-sm font-medium text-violet-800 dark:text-purple-200/90">
            {text.pages.wallet.stndExplainer} · {w.availableBalance}:{" "}
            <span className="ip-fintech-nums">{formatStnd(stndBalance, locale)}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6 rounded-[28px] ip-panel p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-ip-subtle">{stepOfLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ip">{stepTitle}</h2>
            </div>
            <div className="text-sm text-ip-muted">
              {currentStep === 1 && w.amountLabel}
              {currentStep === 2 && w.methodTitle}
              {currentStep === 3 && w.beneficiaryTitle}
              {currentStep === 4 && w.confirmWithdrawal}
            </div>
          </div>

          {complete ? (
            <div className="rounded-[24px] border border-amber-500/40 bg-amber-50/95 p-8 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="text-lg font-semibold text-amber-950 dark:text-ip">{w.successPending}</p>
                  <p className="mt-2 text-sm text-amber-900/90 dark:text-amber-200/90">{w.successDetail}</p>
                  <p className="mt-2 text-sm font-medium text-amber-900 dark:text-amber-100">{formattedAmountStnd}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <label className={loadLabelClass}>
                    {w.amountLabel}
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      max={stndBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100"
                      className={`${loadFieldClass} ${loadFieldRing(numericAmount > roundStnd(stndBalance))}`}
                    />
                  </label>
                  {numericAmount > roundStnd(stndBalance) + 1e-9 ? (
                    <p className={loadErrorClass}>{w.amountExceedsBalance}</p>
                  ) : null}

                  <div>
                    <p className="text-sm font-semibold text-ip">{la.quickSelect}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {quickAmounts.map((value) => {
                        const capped = Math.min(value, roundStnd(stndBalance));
                        const disabled = capped <= 0;
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={disabled}
                            onClick={() => handleQuickSelect(value)}
                            className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-35 ${
                              numericAmount === capped && capped > 0
                                ? "hero-cta border-transparent shadow-lg shadow-purple-900/30"
                                : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-purple-400/30 dark:hover:bg-white/10"
                            }`}
                          >
                            <span
                              className={
                                numericAmount === capped && capped > 0 ? "hero-cta-label" : "text-slate-800 dark:text-slate-200"
                              }
                            >
                              {formatTndWithUnit(capped)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {withdrawalMethods.map((method) => {
                    const Icon = method.icon;
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        className={`rounded-[24px] border p-6 text-left transition-all duration-200 ease-out ${
                          isSelected
                            ? "hero-cta border-transparent shadow-2xl shadow-purple-900/35"
                            : "border-slate-200 bg-slate-100 text-slate-800 hover:border-purple-300/60 hover:bg-slate-200/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-purple-400/25 dark:hover:bg-white/[0.08]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                              isSelected
                                ? "bg-white/15 text-white"
                                : "bg-violet-200/80 text-violet-800 dark:bg-purple-500/15 dark:text-purple-200"
                            }`}
                          >
                            <Icon className="h-6 w-6" />
                          </span>
                          <div>
                            <h3 className={`text-lg font-semibold ${isSelected ? "text-white" : "text-ip"}`}>{w.methodBankTitle}</h3>
                            <p className={`mt-2 text-sm ${isSelected ? "text-white/90" : "text-ip-muted"}`}>{w.methodBankDesc}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 rounded-[24px] ip-inner-well p-6">
                  <label className={loadLabelClass}>
                    <span>{w.fullNameLabel}</span>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      onBlur={() => setFullNameTouched(true)}
                      placeholder={w.fullNamePlaceholder}
                      className={`${loadFieldClass} ${loadFieldRing(Boolean(fullNameError))}`}
                      autoComplete="name"
                    />
                    {fullNameError ? <p className={loadErrorClass}>{fullNameError}</p> : null}
                  </label>

                  <label className={loadLabelClass}>
                    <span>{w.ribLabel}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={rib}
                      onChange={(e) => setRib(formatRibInput(e.target.value))}
                      onBlur={() => setRibTouched(true)}
                      placeholder={w.ribPlaceholder}
                      className={`${loadFieldClass} ${loadFieldRing(Boolean(ribError))} font-mono tabular-nums tracking-wide`}
                      aria-invalid={Boolean(ribError)}
                    />
                    <p className="text-xs text-slate-700 dark:text-zinc-400">{w.ribHint}</p>
                    {ribError ? <p className={loadErrorClass}>{ribError}</p> : null}
                  </label>

                  <label className={loadLabelClass}>
                    <span>{w.bankLabel}</span>
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      onBlur={() => setBankTouched(true)}
                      className={`app-field-select border-slate-200 bg-white text-slate-900 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white ${loadFieldRing(Boolean(bankError))}`}
                    >
                      <option value="">{w.bankPlaceholder}</option>
                      {TUNISIAN_BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.labelKey}
                        </option>
                      ))}
                    </select>
                    {bankError ? <p className={loadErrorClass}>{bankError}</p> : null}
                  </label>
                </div>
              )}

              {currentStep === 4 && (
                <div className="rounded-[24px] ip-inner-well p-6">
                  <div className="flex flex-col gap-4 text-ip-secondary dark:text-slate-300">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-violet-300/80 bg-violet-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-900 dark:border-purple-400/30 dark:bg-purple-500/15 dark:text-purple-200">
                        {w.summaryAmount}
                      </span>
                      <span className="text-lg font-semibold text-ip">{formattedAmountStnd}</span>
                    </div>
                    <p className="text-sm text-ip-muted">{w.reviewNote}</p>
                    <div className="rounded-3xl ip-panel-muted p-4">
                      <div className="space-y-2 text-sm text-ip-muted">
                        <div className="flex justify-between gap-4">
                          <span>{w.summaryBank}</span>
                          <span className="font-semibold text-ip">{bankLabel}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>{w.summaryHolder}</span>
                          <span className="font-semibold text-ip">{fullName.trim()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span>{w.summaryRib}</span>
                          <span className="font-mono text-xs font-semibold text-ip">{rib || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!complete && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
                disabled={currentStep === 1}
                className="rounded-xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 transition-colors duration-200 hover:border-slate-300 hover:bg-slate-200/90 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-white/5 dark:text-slate-400 dark:hover:border-purple-400/30 dark:hover:bg-white/10"
              >
                {la.back}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!canContinue}
                className="hero-cta rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
              >
                <span className="hero-cta-label">{currentStep === 4 ? w.confirmWithdrawal : la.continue}</span>
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-6 rounded-[28px] ip-panel p-6">
          <div className="rounded-[24px] ip-inner-well p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ip-muted">{w.summaryTitle}</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl ip-panel-muted p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ip">{w.title}</p>
                    <p className="mt-1 text-sm text-ip-muted">{text.pages.wallet.stndExplainer}</p>
                  </div>
                  <span className="ip-fintech-nums text-lg font-semibold text-ip">
                    {formattedAmountStnd || formatTndWithUnit(0)}
                  </span>
                </div>
              </div>
              <div className="rounded-3xl ip-panel-muted p-5 text-sm text-ip-secondary">
                <p className="font-semibold text-slate-700 dark:text-ip">{w.availableBalance}</p>
                <p className="ip-fintech-nums mt-3 text-ip-muted">{formatStnd(stndBalance, locale)}</p>
              </div>
              <div className="rounded-3xl ip-panel-muted p-5 text-sm text-ip-secondary">
                <p className="font-semibold text-slate-700 dark:text-ip">{w.summaryBank}</p>
                <p className="mt-3 text-ip-muted">{bankLabel || "—"}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-violet-200/90 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-violet-50 p-5 shadow-md shadow-violet-200/40 backdrop-blur-sm dark:border-purple-500/25 dark:from-violet-600/35 dark:via-fuchsia-600/25 dark:to-violet-600/25 dark:shadow-purple-900/20">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-violet-800 dark:text-white" />
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{la.securePaymentTitle}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-violet-950 dark:text-white">{la.securePaymentCopy}</p>
          </div>

          <div className="rounded-[24px] ip-inner-well p-5 text-sm text-ip-muted">
            <div className="flex items-center gap-2 text-ip">
              <Sparkles className="h-4 w-4 text-violet-600 dark:text-purple-300" />
              <p className="font-semibold">{la.fastFundingTitle}</p>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-ip-muted">
              {la.fastFundingPoints.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
