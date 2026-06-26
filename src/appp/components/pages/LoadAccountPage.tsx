import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { CreditCard, Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useWallet } from "../../contexts/WalletContext";
import { CardBrandIcon } from "../payment/CardBrandIcon";
import { loadErrorClass, loadFieldClass, loadFieldRing, loadLabelClass } from "../payment/glassFieldClasses";
import {
  CardType,
  cardNumberExceedsBrandLength,
  formatCardNumber,
  formatCardholderNameInput,
  formatExpiryDate,
  getCardNumberCompleteLength,
  getCardType,
  isValidCardNumber,
  isValidCardholderName,
  isValidCvv,
  isValidExpiryDate,
  normalizeDigits,
} from "../../utils/paymentValidation";
import { formatTndWithUnit } from "../../utils/tndCurrency";
import { GlassPasswordField } from "../ui/GlassPasswordField";

const quickAmounts = [50, 100, 200];

export function LoadAccountPage() {
  const { text, language } = useLanguage();
  const { depositStnd } = useWallet();
  const v = text.pages.upgrade.validation;
  const la = text.pages.loadAccount;
  const up = text.pages.upgrade;

  const localeMap: Record<string, string> = { fr: "fr-FR", en: "en-US", es: "es-ES", de: "de-DE", ar: "ar-SA" };
  const locale = localeMap[language] ?? "en-US";

  const paymentMethods = useMemo(
    () => [
      {
        id: "card",
        title: up.paymentMethods.card,
        description: up.paymentMethodDescriptions.card,
        icon: CreditCard,
      },
      {
        id: "d17",
        title: up.paymentMethods.d17,
        description: up.paymentMethodDescriptions.d17,
        icon: Smartphone,
      },
    ],
    [up.paymentMethodDescriptions.card, up.paymentMethodDescriptions.d17, up.paymentMethods.card, up.paymentMethods.d17],
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [cardNumberTouched, setCardNumberTouched] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [cvvTouched, setCvvTouched] = useState(false);
  const [cardNameTouched, setCardNameTouched] = useState(false);

  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const cardNameRef = useRef<HTMLInputElement>(null);

  const numericAmount = useMemo(() => {
    const parsed = parseFloat(amount.replace(/[^0-9.]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const amountIsValid = numericAmount > 0;

  const cardType = useMemo<CardType>(() => getCardType(cardNumber), [cardNumber]);
  const cardNumberDigits = normalizeDigits(cardNumber);
  const expiryDigits = normalizeDigits(expiry);

  const cardNumberError = useMemo(() => {
    const exceed = cardNumberExceedsBrandLength(cardNumberDigits, cardType);
    const show = cardNumberTouched || exceed;
    if (!show) return undefined;
    if (!cardNumberDigits) return v.requiredField;
    if (exceed) return v.invalidCardNumber;
    if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) {
      return v.invalidCardNumberLength;
    }
    if (!isValidCardNumber(cardNumber)) return v.invalidCardNumber;
    return undefined;
  }, [cardNumber, cardNumberDigits, cardNumberTouched, cardType, v]);

  const expiryError = useMemo(() => {
    if (!expiryTouched && expiryDigits.length === 0) return undefined;
    if (!expiryDigits) return v.requiredField;
    if (expiryDigits.length !== 4) return expiryTouched ? v.invalidExpiryFormat : undefined;
    if (!isValidExpiryDate(expiry)) return v.cardExpired;
    return undefined;
  }, [expiry, expiryDigits, expiryTouched, v]);

  const cvvError = useMemo(() => {
    if (!cvvTouched && !cvv) return undefined;
    if (!cvv) return v.requiredField;
    if (!isValidCvv(cvv, cardType)) return v.invalidCvv;
    return undefined;
  }, [cvv, cvvTouched, cardType, v]);

  const cardNameError = useMemo(() => {
    if (!cardNameTouched && !cardName) return undefined;
    if (!cardName.trim()) return v.requiredField;
    if (!isValidCardholderName(cardName)) return v.invalidCardholderName;
    return undefined;
  }, [cardName, cardNameTouched, v]);

  const paymentDetailsValid = useMemo(() => {
    if (selectedMethod === "card") {
      return (
        isValidCardNumber(cardNumber) &&
        isValidExpiryDate(expiry) &&
        isValidCvv(cvv, cardType) &&
        isValidCardholderName(cardName)
      );
    }
    return phone.trim().length >= 8;
  }, [selectedMethod, cardNumber, expiry, cvv, cardName, phone, cardType]);

  const canContinue =
    currentStep === 1
      ? amountIsValid
      : currentStep === 2
      ? Boolean(selectedMethod)
      : currentStep === 3
      ? paymentDetailsValid
      : true;

  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 1:
        return la.title;
      case 2:
        return la.paymentMethod;
      case 3:
        return la.enterAmount;
      default:
        return la.confirmPayment;
    }
  }, [currentStep, la]);

  const formattedAmount = formatTndWithUnit(numericAmount);

  const stepOfLabel = la.stepOf.replace("{current}", String(currentStep)).replace("{total}", "4");

  const handleQuickSelect = (value: number) => {
    setAmount(value.toString());
  };

  const handleConfirm = async () => {
    if (currentStep === 4) {
      try {
        await depositStnd(numericAmount);
        setPaymentComplete(true);
      } catch {
        toast.error("Something went wrong");
      }
      return;
    }
    if (canContinue) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

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
          <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-ip">{la.title}</h1>
          <p className="mt-4 max-w-2xl text-base text-ip-muted">{la.subtitle}</p>
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
              {currentStep === 1 && la.amountLabel}
              {currentStep === 2 && la.paymentMethod}
              {currentStep === 3 && la.enterAmount}
              {currentStep === 4 && la.confirmPayment}
            </div>
          </div>

          {paymentComplete ? (
            <div className="rounded-[24px] border border-emerald-500/40 bg-emerald-50/95 p-8 text-emerald-950 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <div>
                  <p className="text-lg font-semibold text-emerald-950 dark:text-ip">{la.successMessage}</p>
                  <p className="mt-2 text-sm text-emerald-800/90 dark:text-emerald-200/90">
                    {formattedAmount} — {la.creditedStndDetail}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-6">
                  <label className={loadLabelClass}>
                    {la.amountLabel}
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="100"
                      className={loadFieldClass}
                    />
                  </label>

                  <div>
                    <p className="text-sm font-semibold text-ip">{la.quickSelect}</p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {quickAmounts.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => handleQuickSelect(value)}
                          className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                            numericAmount === value
                              ? "hero-cta border-transparent shadow-lg shadow-purple-900/30"
                              : "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-purple-400/30 dark:hover:bg-white/10"
                          }`}
                        >
                          <span
                            className={`ip-fintech-nums ${
                              numericAmount === value ? "hero-cta-label" : "text-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {formatTndWithUnit(value)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {paymentMethods.map((method) => {
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
                            <h3 className={`text-lg font-semibold ${isSelected ? "text-white" : "text-ip"}`}>{method.title}</h3>
                            <p className={`mt-2 text-sm ${isSelected ? "text-white/90" : "text-ip-muted"}`}>{method.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 rounded-[24px] ip-inner-well p-6">
                  {selectedMethod === "card" ? (
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className={loadLabelClass}>
                          <span>{up.cardNumber}</span>
                          <div className="relative">
                            <input
                              ref={cardNumberRef}
                              type="text"
                              inputMode="numeric"
                              autoComplete="cc-number"
                              value={cardNumber}
                              onChange={(e) => {
                                const formatted = formatCardNumber(e.target.value);
                                setCardNumber(formatted);
                                const digits = normalizeDigits(formatted);
                                const nextType = getCardType(formatted);
                                if (digits.length >= getCardNumberCompleteLength(nextType)) {
                                  expiryRef.current?.focus();
                                }
                              }}
                              onBlur={() => setCardNumberTouched(true)}
                              placeholder={up.cardNumberPlaceholder}
                              className={`${loadFieldClass} ${loadFieldRing(Boolean(cardNumberError))} pr-14 font-mono tabular-nums tracking-wide`}
                              aria-invalid={Boolean(cardNumberError)}
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                              <CardBrandIcon type={cardType} />
                            </span>
                          </div>
                          {cardNumberError ? <p className={loadErrorClass}>{cardNumberError}</p> : null}
                        </label>
                        <label className={loadLabelClass}>
                          <span>{up.expiryDate}</span>
                          <input
                            ref={expiryRef}
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-exp"
                            value={expiry}
                            onChange={(e) => {
                              const formattedExpiry = formatExpiryDate(e.target.value);
                              setExpiry(formattedExpiry);
                              if (formattedExpiry.length === 5) {
                                cvvRef.current?.focus();
                              }
                            }}
                            onBlur={() => setExpiryTouched(true)}
                            placeholder={up.expiryPlaceholder}
                            maxLength={5}
                            className={`${loadFieldClass} ${loadFieldRing(Boolean(expiryError))} font-mono tabular-nums`}
                            aria-invalid={Boolean(expiryError)}
                          />
                          {expiryError ? <p className={loadErrorClass}>{expiryError}</p> : null}
                        </label>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className={loadLabelClass}>
                          <span>{up.cvv}</span>
                          <GlassPasswordField
                            ref={cvvRef}
                            inputMode="numeric"
                            autoComplete="cc-csc"
                            value={cvv}
                            onChange={(e) => {
                              const digits = normalizeDigits(e.target.value);
                              const maxLen = cardType === "amex" ? 4 : 3;
                              const next = digits.slice(0, maxLen);
                              setCvv(next);
                              if (next.length >= maxLen) {
                                cardNameRef.current?.focus();
                              }
                            }}
                            onBlur={() => setCvvTouched(true)}
                            placeholder={cardType === "amex" ? "1234" : up.cvvPlaceholder}
                            maxLength={cardType === "amex" ? 4 : 3}
                            className={`${loadFieldClass} ${loadFieldRing(Boolean(cvvError))} font-mono tabular-nums tracking-widest`}
                            aria-invalid={Boolean(cvvError)}
                            showPasswordAriaLabel={text.pages.login.showPasswordAria}
                            hidePasswordAriaLabel={text.pages.login.hidePasswordAria}
                          />
                          {cvvError ? <p className={loadErrorClass}>{cvvError}</p> : null}
                        </label>
                        <label className={loadLabelClass}>
                          <span>{up.nameOnCard}</span>
                          <input
                            ref={cardNameRef}
                            type="text"
                            autoComplete="cc-name"
                            value={cardName}
                            onChange={(e) => setCardName(formatCardholderNameInput(e.target.value))}
                            onBlur={() => setCardNameTouched(true)}
                            placeholder={up.cardholderNamePlaceholder}
                            className={`${loadFieldClass} ${loadFieldRing(Boolean(cardNameError))} uppercase`}
                            aria-invalid={Boolean(cardNameError)}
                          />
                          {cardNameError ? <p className={loadErrorClass}>{cardNameError}</p> : null}
                        </label>
                      </div>
                    </>
                  ) : (
                    <label className={`${loadLabelClass} space-y-3`}>
                      <span>{up.phoneNumber}</span>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder={up.phonePlaceholder}
                        className={loadFieldClass}
                      />
                      <p className="text-xs text-slate-700 dark:text-ip-subtle">{up.phoneHelp}</p>
                    </label>
                  )}
                </div>
              )}

              {currentStep === 4 && (
                <div className="rounded-[24px] ip-inner-well p-6">
                  <div className="flex flex-col gap-4 text-ip-secondary dark:text-slate-300">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-violet-300/80 bg-violet-100/90 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-900 dark:border-purple-400/30 dark:bg-purple-500/15 dark:text-purple-200">
                        {la.amountLabel}
                      </span>
                      <span className="text-lg font-semibold text-ip">{formattedAmount}</span>
                    </div>
                    <p className="text-sm text-ip-muted">{la.reviewChargeNote}</p>
                    <div className="rounded-3xl ip-panel-muted p-4">
                      <div className="flex items-center justify-between text-sm text-ip-muted">
                        <span>{la.paymentMethod}</span>
                        <span className="font-semibold text-ip">
                          {selectedMethod === "card" ? la.summaryMethodCard : la.summaryMethodD17}
                        </span>
                      </div>
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-100/90 p-4 text-sm text-ip-muted dark:border-white/5 dark:bg-slate-900/50 dark:text-slate-400">
                        {selectedMethod === "card"
                          ? `${la.cardEnding} ${normalizeDigits(cardNumber).slice(-4) || "••••"}`
                          : `${la.d17Via} ${phone || "+216 XXXXXXXX"}`}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!paymentComplete && (
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
                <span className="hero-cta-label">
                  {currentStep === 4 ? la.confirmPayment : la.continue}
                </span>
              </button>
            </div>
          )}
        </div>

        <aside className="space-y-6 rounded-[28px] ip-panel p-6">
          <div className="rounded-[24px] ip-inner-well p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ip-muted">{la.summaryTitle}</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl ip-panel-muted p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ip">{la.summaryCharge}</p>
                    <p className="mt-1 text-sm text-ip-muted">{la.trial}</p>
                  </div>
                  <span className="ip-fintech-nums text-lg font-semibold text-ip">{formattedAmount}</span>
                </div>
              </div>
              <div className="rounded-3xl ip-panel-muted p-5 text-sm text-ip-secondary">
                <p className="font-semibold text-slate-700 dark:text-ip">{la.paymentMethod}</p>
                <p className="mt-3 text-ip-muted">
                  {selectedMethod === "card" ? la.summaryMethodCard : la.summaryMethodD17}
                </p>
              </div>
              <div className="rounded-3xl ip-panel-muted p-5 text-sm text-ip-secondary">
                <p className="font-semibold text-slate-700 dark:text-ip">{la.amountLabel}</p>
                <p className="ip-fintech-nums mt-3 text-ip-muted">{formattedAmount}</p>
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
