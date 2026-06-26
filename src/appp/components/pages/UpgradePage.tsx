import { useMemo, useRef, useState } from "react";
import { CreditCard, Loader2, Smartphone, ShieldCheck, Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { investApi } from "../../services/investApi";
import {
  CardType,
  formatCardNumber,
  formatExpiryDate,
  getCardType,
  isValidCardNumber,
  isValidCardholderName,
  isValidCvv,
  isValidExpiryDate,
  normalizeDigits,
  sanitizeNameInput,
} from "../../utils/paymentValidation";
import { GlassPasswordField } from "../ui/GlassPasswordField";

type PlanId = "monthly" | "yearly";
type PaymentMethodId = "card" | "d17";

const plans = [
  {
    id: "monthly",
    priceValue: 20,
    details: ["flexibleMonthlyBilling", "cancelAnytime"] as const,
    badge: null,
  },
  {
    id: "yearly",
    priceValue: 200,
    details: ["bestValue", "twoMonthsFree"] as const,
    badge: "Most Popular",
  },
] as const;

const paymentMethods = [
  {
    id: "card",
    icon: CreditCard,
  },
  {
    id: "d17",
    icon: Smartphone,
  },
] as const;

export function UpgradePage() {
  const { text } = useLanguage();
  const navigate = useNavigate();
  const { refreshUserProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("card");
  const [currentStep, setCurrentStep] = useState(1);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumberTouched, setCardNumberTouched] = useState(false);
  const [expiryTouched, setExpiryTouched] = useState(false);
  const [cvvTouched, setCvvTouched] = useState(false);
  const [cardNameTouched, setCardNameTouched] = useState(false);
  const [payBusy, setPayBusy] = useState(false);

  const cardNumberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const cvvRef = useRef<HTMLInputElement>(null);
  const cardNameRef = useRef<HTMLInputElement>(null);

  const plan = useMemo(
    () => plans.find((item) => item.id === selectedPlan) ?? plans[0],
    [selectedPlan],
  );

  const formattedPrice = text.pages.upgrade.planPrices[selectedPlan];
  const billingSummary = selectedPlan === "yearly" ? text.pages.upgrade.billedYearly : text.pages.upgrade.billedMonthly;
  const selectedMethodLabel = text.pages.upgrade.paymentMethods[selectedMethod];
  const stepTitle = useMemo(() => {
    switch (currentStep) {
      case 1:
        return text.pages.upgrade.stepLabels.planSelection;
      case 2:
        return text.pages.upgrade.stepLabels.paymentMethod;
      case 3:
        return text.pages.upgrade.stepLabels.details;
      default:
        return text.pages.upgrade.stepLabels.review;
    }
  }, [currentStep, text.pages.upgrade.stepLabels]);

  const planDetails = useMemo(
    () =>
      plan.details.map((detail) =>
        text.pages.upgrade.planDetails[detail as keyof typeof text.pages.upgrade.planDetails],
      ),
    [plan.details, text.pages.upgrade.planDetails],
  );

  const cardType = useMemo<CardType>(() => getCardType(cardNumber), [cardNumber]);
  const cardTypeLabel = cardType === "unknown" ? undefined : text.pages.upgrade.cardTypes[cardType];

  const cardNumberDigits = normalizeDigits(cardNumber);
  const expiryDigits = normalizeDigits(expiry);

  const cardNumberError = useMemo(() => {
    if (!cardNumberTouched && !cardNumberDigits) return undefined;
    if (!cardNumberDigits) return text.pages.upgrade.validation.requiredField;
    if (cardNumberDigits.length < 13 || cardNumberDigits.length > 19) return text.pages.upgrade.validation.invalidCardNumberLength;
    if (!isValidCardNumber(cardNumber)) return text.pages.upgrade.validation.invalidCardNumber;
    return undefined;
  }, [cardNumber, cardNumberDigits, cardNumberTouched, text.pages.upgrade.validation]);

  const expiryError = useMemo(() => {
    if (!expiryTouched && !expiryDigits) return undefined;
    if (!expiryDigits) return text.pages.upgrade.validation.requiredField;
    if (expiryDigits.length !== 4) return text.pages.upgrade.validation.invalidExpiryFormat;
    if (!isValidExpiryDate(expiry)) return text.pages.upgrade.validation.cardExpired;
    return undefined;
  }, [expiry, expiryDigits, expiryTouched, text.pages.upgrade.validation]);

  const cvvError = useMemo(() => {
    if (!cvvTouched && !cvv) return undefined;
    if (!cvv) return text.pages.upgrade.validation.requiredField;
    if (!/^[0-9]+$/.test(cvv)) return text.pages.upgrade.validation.invalidCvv;
    if (!isValidCvv(cvv, cardType)) return text.pages.upgrade.validation.invalidCvv;
    return undefined;
  }, [cvv, cvvTouched, cardType, text.pages.upgrade.validation]);

  const cardNameError = useMemo(() => {
    if (!cardNameTouched && !cardName) return undefined;
    if (!cardName.trim()) return text.pages.upgrade.validation.requiredField;
    if (!isValidCardholderName(cardName)) return text.pages.upgrade.validation.invalidCardholderName;
    return undefined;
  }, [cardName, cardNameTouched, text.pages.upgrade.validation]);

  const canProceed = useMemo(() => {
    if (currentStep === 2) return Boolean(selectedMethod);
    if (currentStep === 3) {
      if (selectedMethod === "card") {
        return (
          isValidCardNumber(cardNumber) &&
          isValidExpiryDate(expiry) &&
          isValidCvv(cvv, cardType) &&
          isValidCardholderName(cardName)
        );
      }
      return phone.trim().length >= 8;
    }
    return true;
  }, [currentStep, selectedMethod, cardNumber, expiry, cvv, cardName, phone, cardType]);

  const stepLabel = text.pages.upgrade.stepLabels.step.replace("{step}", String(currentStep));

  const handleNext = async () => {
    if (currentStep === 4) {
      if (selectedMethod === "d17") {
        navigate("/upgrade/d17", { state: { planId: selectedPlan, phone: phone.trim() } });
        return;
      }
      setPayBusy(true);
      try {
        const { profile } = await investApi.completeProSubscription({ planType: selectedPlan });
        await refreshUserProfile(profile);
        toast.success("Abonnement Pro activé. Vos outils sont disponibles.");
        navigate("/dashboard");
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Le paiement n’a pas pu être confirmé. Réessayez.");
      } finally {
        setPayBusy(false);
      }
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[32px] ip-panel-strong p-8 text-ip shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.22),transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.14),transparent_45%)]" />
        <div className="relative z-10 max-w-5xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-purple-200/90" style={{ fontFamily: "Orbitron, ui-sans-serif, system-ui, sans-serif" }}>
                {text.pages.upgrade.heroBadge}
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight">{text.pages.upgrade.heroTitle}</h1>
              <p className="mt-4 max-w-2xl text-base text-slate-300">{text.pages.upgrade.heroSubtitle}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-200/80">{text.pages.upgrade.whatYouGet}</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                {text.pages.upgrade.whatYouGetPoints.map((item) => (
                  <p key={item}>• {item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.7fr_1fr]">
        <div className="space-y-6 rounded-[28px] ip-panel p-8">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{stepLabel}</p>
              <h2 className="mt-2 text-2xl font-semibold text-ip">{stepTitle}</h2>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              {currentStep === 1 && text.pages.upgrade.stepLabels.planSelection}
              {currentStep === 2 && text.pages.upgrade.stepLabels.paymentMethod}
              {currentStep === 3 && text.pages.upgrade.stepLabels.details}
              {currentStep === 4 && text.pages.upgrade.stepLabels.review}
            </div>
          </div>

          <div className="grid gap-4">
            {currentStep === 1 && (
              <div className="grid gap-4 md:grid-cols-2">
                {plans.map((option) => {
                  const isActive = selectedPlan === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlan(option.id);
                        setCurrentStep(1);
                      }}
                      className={`relative overflow-hidden rounded-[24px] border p-6 text-left transition-all duration-200 ease-out ${
                        isActive
                          ? "hero-cta border-transparent shadow-2xl shadow-purple-900/35"
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/25 hover:bg-white/[0.08]"
                      }`}
                    >
                      {option.badge ? (
                        <span
                          className={`absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] backdrop-blur-sm ${
                            isActive ? "bg-white/20 text-ip" : "border border-amber-400/30 bg-amber-500/15 text-amber-200"
                          }`}
                        >
                          {option.badge}
                        </span>
                      ) : null}
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-ip">{text.pages.upgrade.planNames[option.id]}</h3>
                          <p className={`mt-2 text-sm ${isActive ? "text-ip/85" : "text-slate-400"}`}>{text.pages.upgrade.planPrices[option.id]}</p>
                        </div>
                        {isActive ? (
                          <span className="inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ip">
                            {text.pages.upgrade.selectedLabel}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                        {option.details.map((detail) => (
                          <span key={detail} className={isActive ? "text-ip/80" : "text-slate-500"}>
                            {text.pages.upgrade.planDetails[detail as keyof typeof text.pages.upgrade.planDetails]}
                          </span>
                        ))}
                      </div>
                      <p className={`mt-6 text-sm ${isActive ? "text-ip/80" : "text-slate-500"}`}>
                        {text.pages.upgrade.trialLabel}
                      </p>
                      {option.badge ? (
                        <p className={`mt-4 text-sm font-semibold ${isActive ? "text-ip" : "text-purple-300"}`}>
                          {text.pages.upgrade.planHighlights[option.id]}
                        </p>
                      ) : null}
                    </button>
                  );
                })}
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
                          : "border-white/10 bg-white/5 text-slate-200 hover:border-purple-400/25 hover:bg-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                            isSelected ? "bg-white/15 text-ip" : "bg-purple-500/15 text-purple-200"
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div>
                          <h3 className="text-lg font-semibold text-ip">{text.pages.upgrade.paymentMethods[method.id]}</h3>
                          <p className={`mt-2 text-sm ${isSelected ? "text-ip/80" : "text-slate-400"}`}>
                            {text.pages.upgrade.paymentMethodDescriptions[method.id]}
                          </p>
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
                      <label className="space-y-2 text-sm text-slate-400">
                        <div className="flex items-center justify-between gap-3">
                          <span>{text.pages.upgrade.cardNumber}</span>
                          {cardTypeLabel ? (
                            <span className="rounded-full border border-white/10 bg-slate-800 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">
                              {cardTypeLabel}
                            </span>
                          ) : null}
                        </div>
                        <input
                          ref={cardNumberRef}
                          inputMode="numeric"
                          autoComplete="cc-number"
                          type="text"
                          value={cardNumber}
                          onChange={(e) => {
                            const formatted = formatCardNumber(e.target.value);
                            setCardNumber(formatted);
                            const digits = normalizeDigits(formatted);
                            const nextCardType = getCardType(formatted);
                            const targetLength = nextCardType === "amex" ? 15 : 16;
                            if (digits.length >= targetLength) {
                              expiryRef.current?.focus();
                            }
                          }}
                          onBlur={() => setCardNumberTouched(true)}
                          placeholder={text.pages.upgrade.cardNumberPlaceholder}
                          className="app-field"
                          aria-invalid={Boolean(cardNumberError)}
                        />
                        {cardNumberError ? <p className="text-xs text-rose-400">{cardNumberError}</p> : null}
                      </label>
                      <label className="space-y-2 text-sm text-slate-400">
                        <span>{text.pages.upgrade.expiryDate}</span>
                        <input
                          ref={expiryRef}
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          type="text"
                          value={expiry}
                          onChange={(e) => {
                            const formattedExpiry = formatExpiryDate(e.target.value);
                            setExpiry(formattedExpiry);
                            if (formattedExpiry.length === 5) {
                              cvvRef.current?.focus();
                            }
                          }}
                          onBlur={() => setExpiryTouched(true)}
                          placeholder={text.pages.upgrade.expiryPlaceholder}
                          className="app-field"
                          aria-invalid={Boolean(expiryError)}
                        />
                        {expiryError ? <p className="text-xs text-rose-400">{expiryError}</p> : null}
                      </label>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-slate-400">
                        <span>{text.pages.upgrade.cvv}</span>
                        <GlassPasswordField
                          ref={cvvRef}
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          value={cvv}
                          onChange={(e) => {
                            const digits = normalizeDigits(e.target.value);
                            const maxLength = cardType === "amex" ? 4 : 3;
                            const shortened = digits.slice(0, maxLength);
                            setCvv(shortened);
                            if (shortened.length >= maxLength) {
                              cardNameRef.current?.focus();
                            }
                          }}
                          onBlur={() => setCvvTouched(true)}
                          placeholder={text.pages.upgrade.cvvPlaceholder}
                          className="app-field"
                          aria-invalid={Boolean(cvvError)}
                          showPasswordAriaLabel={text.pages.login.showPasswordAria}
                          hidePasswordAriaLabel={text.pages.login.hidePasswordAria}
                        />
                        {cvvError ? <p className="text-xs text-rose-400">{cvvError}</p> : null}
                      </label>
                      <label className="space-y-2 text-sm text-slate-400">
                        <span>{text.pages.upgrade.nameOnCard}</span>
                        <input
                          ref={cardNameRef}
                          type="text"
                          value={cardName}
                          onChange={(e) => setCardName(sanitizeNameInput(e.target.value))}
                          onBlur={() => setCardNameTouched(true)}
                          placeholder={text.pages.upgrade.cardholderNamePlaceholder}
                          className="app-field placeholder:text-slate-500"
                          aria-invalid={Boolean(cardNameError)}
                        />
                        {cardNameError ? <p className="text-xs text-rose-400">{cardNameError}</p> : null}
                      </label>
                    </div>
                  </>
                ) : (
                  <label className="space-y-3 text-sm text-slate-400">
                    <span>{text.pages.upgrade.phoneNumber}</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={text.pages.upgrade.phonePlaceholder}
                      className="app-field placeholder:text-slate-500"
                    />
                    <p className="text-xs text-slate-500">{text.pages.upgrade.phoneHelp}</p>
                  </label>
                )}
              </div>
            )}

            {currentStep === 4 && (
              <div className="rounded-[24px] ip-inner-well p-6">
                <div className="flex flex-col gap-4 text-slate-300">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-purple-400/30 bg-purple-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-purple-200">
                      {text.pages.upgrade.selectedPlanLabel}
                    </span>
                    <span className="text-lg font-semibold text-ip">{text.pages.upgrade.planNames[selectedPlan]}</span>
                  </div>
                  <p className="text-sm text-slate-400">{formattedPrice}</p>
                  <p className="text-sm text-slate-500">{billingSummary}</p>
                  <div className="rounded-3xl ip-panel-muted p-4">
                    <div className="flex items-center justify-between text-sm text-slate-400">
                      <span>{text.pages.upgrade.summaryPaymentMethod}</span>
                      <span className="font-semibold text-ip">{selectedMethodLabel}</span>
                    </div>
                    <div className="mt-3 rounded-2xl border border-white/5 bg-slate-900/50 p-4 text-sm text-slate-500">
                      {selectedMethod === "card"
                        ? `Card ending in ${cardNumber.slice(-4) || "0000"}`
                        : `D17 mobile payment via ${phone || "+216 XXXXXXXX"}`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
              disabled={currentStep === 1}
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors duration-200 hover:border-purple-400/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {text.pages.upgrade.back}
            </button>
            <button
              type="button"
              onClick={() => void handleNext()}
              disabled={!canProceed || payBusy}
              className="hero-cta rounded-xl px-6 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                {payBusy && currentStep === 4 && selectedMethod === "card" ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
                ) : null}
                {currentStep < 4
                  ? text.pages.upgrade.continue
                  : selectedMethod === "d17"
                  ? text.pages.upgrade.payViaD17
                  : text.pages.upgrade.confirmPayment}
              </span>
            </button>
          </div>
        </div>

        <aside className="space-y-6 rounded-[28px] ip-panel p-6">
          <div className="rounded-[24px] ip-inner-well p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{text.pages.upgrade.summaryTitle}</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl ip-panel-muted p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ip">{text.pages.upgrade.planNames[selectedPlan]}</p>
                    <p className="mt-1 text-sm text-slate-500">{text.pages.upgrade.trialLabel}</p>
                  </div>
                  <span className="text-lg font-semibold text-ip">{formattedPrice}</span>
                </div>
              </div>
              <div className="rounded-3xl ip-panel-muted p-5 text-sm text-slate-400">
                <p className="font-semibold text-ip">{text.pages.upgrade.summaryPaymentMethod}</p>
                <p className="mt-3">{selectedMethodLabel}</p>
              </div>
              <div className="rounded-3xl ip-panel-muted p-5 text-sm text-slate-400">
                <p className="font-semibold text-ip">{text.pages.upgrade.summaryTrial}</p>
                <p className="mt-3">{text.pages.upgrade.trialLabel}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-purple-500/25 bg-gradient-to-br from-violet-600/35 to-fuchsia-600/25 p-5 text-ip shadow-lg shadow-purple-900/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-purple-100" />
              <p className="text-sm font-semibold">{text.pages.upgrade.securePaymentTitle}</p>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-200/90">{text.pages.upgrade.securePaymentCopy}</p>
          </div>

          <div className="rounded-[24px] ip-inner-well p-5 text-sm text-slate-400">
            <div className="flex items-center gap-2 text-ip">
              <Sparkles className="h-4 w-4 text-purple-300" />
              <p className="font-semibold">{text.pages.upgrade.premiumBenefitsTitle}</p>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              {text.pages.upgrade.premiumBenefitsPoints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
