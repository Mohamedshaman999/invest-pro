import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Lock, Mail, TrendingUp, User, Calendar, Check, X, Loader2 } from "lucide-react";
import { GlassPasswordField } from "../ui/GlassPasswordField";
import logo1 from "../../../../logo1.png";
import { useLanguage } from "../../contexts/LanguageContext";
import { ApiError } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { defaultHomePathFromEmail } from "../../utils/authPaths";

function hasLetter(value: string) {
  return /[A-Za-z]/.test(value);
}

function hasNumber(value: string) {
  return /\d/.test(value);
}

function hasSymbol(value: string) {
  return /[^A-Za-z0-9]/.test(value);
}

function isAtLeast18YearsOld(dateOfBirth: string) {
  if (!dateOfBirth) {
    return false;
  }

  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) {
    return false;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 18;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, verifyEmail, login } = useAuth();
  const { text } = useLanguage();
  const t = text.pages.register;
  const [familyName, setFamilyName] = useState("");
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [phase, setPhase] = useState<"form" | "verify">("form");
  const [verifyCode, setVerifyCode] = useState("");
  const [busy, setBusy] = useState(false);

  const passwordChecks = useMemo(
    () => ({
      letter: hasLetter(password),
      number: hasNumber(password),
      symbol: hasSymbol(password),
      length: password.length >= 8,
    }),
    [password],
  );

  const isPasswordValid =
    passwordChecks.letter &&
    passwordChecks.number &&
    passwordChecks.symbol &&
    passwordChecks.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!isAtLeast18YearsOld(dateOfBirth)) {
      setError(t.under18);
      return;
    }

    if (!isPasswordValid) {
      setError(t.passwordInvalid);
      return;
    }

    setBusy(true);
    try {
      const fullName = `${name.trim()} ${familyName.trim()}`.trim();
      await register({
        name: fullName || name.trim(),
        email: email.trim().toLowerCase(),
        password,
        currency: "TND",
      });
      setSuccessMessage(t.success);
      setPhase("verify");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      await verifyEmail(normalizedEmail, verifyCode.trim());
      setSuccessMessage("");
      let outcome: Awaited<ReturnType<typeof login>> | null = null;
      try {
        outcome = await login(normalizedEmail, password);
      } catch {
        /* login() rethrows ApiError on bad credentials; still verified — send user to login */
      }
      if (outcome?.kind === "authenticated") {
        toast.success("E-mail vérifié. Bienvenue !");
        navigate(defaultHomePathFromEmail(normalizedEmail), { replace: true });
        return;
      }
      if (outcome?.kind === "totp_required") {
        toast.message("E-mail vérifié", {
          description: "La double authentification est requise : connectez-vous depuis la page de connexion.",
        });
        navigate("/login", { replace: true });
        return;
      }
      toast.message("E-mail vérifié", {
        description: "Connectez-vous avec le même mot de passe que lors de l'inscription.",
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ip-auth-page relative">
      <div className="pointer-events-none absolute inset-0 ip-shell-radial" />
      <div className="pointer-events-none absolute inset-0 ip-shell-grid" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 ip-vignette-top" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 ip-vignette-bottom" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16 sm:px-8">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="hidden lg:block">
            <div className="auth-brand-line">
              <div className="auth-title-with-icon">
                <div className="hero-logo-wrap hero-logo-compact">
                  <img src={logo1} alt="InvestPro logo" className="hero-logo-image" />
                </div>
                <h1 className="text-5xl font-semibold tracking-tight text-ip sm:text-6xl">{text.pages.register.title}</h1>
              </div>
              <p className="max-w-xl text-lg leading-8 text-ip-muted">{text.pages.register.subtitle}</p>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[28px] ip-glass-card p-6 shadow-2xl shadow-purple-700/20">
                <div className="mb-3 inline-flex rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] p-2">
                  <TrendingUp className="h-4 w-4 text-purple-400 dark:text-purple-200" />
                </div>
                <h3 className="text-lg font-semibold text-ip">{t.performanceTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-ip-muted">{t.performanceDesc}</p>
              </div>

              <div className="rounded-[28px] ip-glass-card p-6 shadow-2xl shadow-purple-700/20">
                <div className="mb-3 inline-flex rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] p-2">
                  <Lock className="h-4 w-4 text-purple-400 dark:text-purple-200" />
                </div>
                <h3 className="text-lg font-semibold text-ip">{t.protectionTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-ip-muted">{t.protectionDesc}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] ip-panel-strong p-8 shadow-2xl shadow-purple-700/20 sm:p-10">
            <div className="mb-8">
              <p className="text-sm leading-6 text-ip-muted">{t.subtitle}</p>
            </div>

            {error && (
              <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                {successMessage}
              </div>
            )}

            {phase === "verify" ? (
              <form onSubmit={handleVerify} className="space-y-5">
                <p className="text-sm text-ip-muted">
                  {text.pages.register.subtitle}
                </p>
                <div className="space-y-2">
                  <label htmlFor="verifyCode" className="block text-sm uppercase tracking-[0.24em] text-ip-muted">
                    Code (6 chiffres)
                  </label>
                  <input
                    id="verifyCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="login-input auth-input tracking-widest"
                    placeholder="000000"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy || verifyCode.length !== 6}
                  className="hero-cta w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Vérifier
                  </span>
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="familyName" className="block text-sm uppercase tracking-[0.24em] text-ip-muted">
                  {t.familyName}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ip-muted" />
                  <input
                    id="familyName"
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    className="login-input auth-input"
                    placeholder="Votre family name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm uppercase tracking-[0.24em] text-ip-muted">
                  {t.name}
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ip-muted" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input auth-input"
                    placeholder="Votre name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="dateOfBirth" className="block text-sm uppercase tracking-[0.24em] text-ip-muted">
                  {t.dateOfBirth}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ip-muted" />
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="login-input auth-input"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm uppercase tracking-[0.24em] text-ip-muted">
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ip-muted" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="login-input auth-input"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm uppercase tracking-[0.24em] text-ip-muted">
                  {t.password}
                </label>
                <GlassPasswordField
                  id="password"
                  authUnderlineStyle
                  leftIcon={<Lock className="h-5 w-5 text-ip-muted" />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input auth-input"
                  placeholder="••••••••"
                  required
                  showVisibilityCheckbox
                  visibilityCheckboxLabel={t.showPasswordCheckboxLabel}
                  showPasswordAriaLabel={text.pages.login.showPasswordAria}
                  hidePasswordAriaLabel={text.pages.login.hidePasswordAria}
                />

                <ul className="mt-3 space-y-1 pl-10 text-sm">
                  <li className={`flex items-center gap-2 ${passwordChecks.letter ? "text-emerald-300" : "text-rose-300"}`}>
                    {passwordChecks.letter ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {t.passwordRuleLetter}
                  </li>
                  <li className={`flex items-center gap-2 ${passwordChecks.number ? "text-emerald-300" : "text-rose-300"}`}>
                    {passwordChecks.number ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {t.passwordRuleNumber}
                  </li>
                  <li className={`flex items-center gap-2 ${passwordChecks.symbol ? "text-emerald-300" : "text-rose-300"}`}>
                    {passwordChecks.symbol ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {t.passwordRuleSymbol}
                  </li>
                  <li className={`flex items-center gap-2 ${passwordChecks.length ? "text-emerald-300" : "text-rose-300"}`}>
                    {passwordChecks.length ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {t.passwordRuleLength}
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="hero-cta w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t.createMyAccount}
                </span>
              </button>
            </form>
            )}

            <div className="mt-8 text-center">
              <p className="text-sm text-ip-muted">
                {t.alreadyHaveAccount}{" "}
                <Link to="/login" className="font-semibold text-purple-600 transition hover:text-ip dark:text-purple-200">
                  Se connecter
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
