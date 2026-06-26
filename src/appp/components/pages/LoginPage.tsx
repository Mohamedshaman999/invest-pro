import { useRef, useState } from "react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { isApiError } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { Lock, Mail, TrendingUp, Loader2 } from "lucide-react";
import { GlassPasswordField } from "../ui/GlassPasswordField";
import logo1 from "../../../../logo1.png";
import { useLanguage } from "../../contexts/LanguageContext";
import { defaultHomePathFromEmail } from "../../utils/authPaths";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [totpStep, setTotpStep] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [loginChallengeToken, setLoginChallengeToken] = useState("");
  const [totpUserId, setTotpUserId] = useState<number | null>(null);
  const [hcaptchaToken, setHcaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);

  const { login, completeTotpLogin } = useAuth();
  const { text } = useLanguage();
  const navigate = useNavigate();
  const t = text.pages.login;
  const hcaptchaSiteKey = String(import.meta.env.VITE_HCAPTCHA_SITE_KEY || "");
  const trimmedEmail = email.trim();
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const isPasswordValid = password.length >= 8;
  const isCaptchaValid = Boolean(hcaptchaToken);
  const canSubmit = !busy && Boolean(hcaptchaSiteKey) && isEmailValid && isPasswordValid && isCaptchaValid;

  const resetHcaptcha = () => {
    setHcaptchaToken("");
    captchaRef.current?.resetCaptcha();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    /** Always use React state: with a controlled field + visibility toggle, FormData can be empty while the UI still shows the password. */
    const emailVal = email.trim();
    const passwordVal = password;

    setError("");

    if (!hcaptchaSiteKey) {
      setError("Missing hCaptcha site key. Add VITE_HCAPTCHA_SITE_KEY to your .env file.");
      return;
    }

    if (!isEmailValid) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (!hcaptchaToken) {
      setError(
        captchaReady
          ? "Please complete the hCaptcha verification before signing in."
          : "hCaptcha is still loading. Please try again in a few seconds.",
      );
      return;
    }

    setBusy(true);
    try {
      // Frontend only: this keeps your existing login(email, password) signature.
      // For real security, update useAuth.login + backend to send and verify hcaptchaToken.
      // Example after backend update: const outcome = await login(emailVal, passwordVal, hcaptchaToken);
      const outcome = await login(emailVal, passwordVal);

      if (outcome.kind === "authenticated") {
        toast.success("Login successful");
        navigate(defaultHomePathFromEmail(emailVal), { replace: true });
        return;
      }
      if (outcome.kind === "totp_required") {
        setLoginChallengeToken(outcome.loginChallengeToken);
        setTotpUserId(outcome.userId);
        setTotpStep(true);
        setTotpCode("");
        return;
      }
    } catch (e) {
      setError(
        isApiError(e) ? e.message : e instanceof Error && e.message ? e.message : "Unable to sign in. Check the message above or try again.",
      );
    } finally {
      setBusy(false);
      resetHcaptcha();
    }
  };

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpUserId == null || !loginChallengeToken) {
      setError("Session expired. Please sign in again.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await completeTotpLogin({
        userId: totpUserId,
        loginChallengeToken,
        otpCode: totpCode,
      });
      toast.success("Login successful");
      navigate(defaultHomePathFromEmail(email), { replace: true });
    } catch (e) {
      setError(
        isApiError(e) ? e.message : e instanceof Error && e.message ? e.message : "Unable to verify the code. Try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const cancelTotp = () => {
    setTotpStep(false);
    setTotpCode("");
    setLoginChallengeToken("");
    setTotpUserId(null);
    setError("");
    resetHcaptcha();
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
                <h1 className="text-5xl font-semibold tracking-tight text-ip sm:text-6xl">{text.pages.login.title}</h1>
              </div>
              <p className="max-w-xl text-lg leading-8 text-ip-muted">{text.pages.login.subtitle}</p>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[28px] ip-glass-card p-6 shadow-2xl shadow-purple-700/20">
                <div className="mb-3 inline-flex rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] p-2">
                  <TrendingUp className="h-4 w-4 text-purple-400 dark:text-purple-200" />
                </div>
                <h3 className="text-lg font-semibold text-ip">{t.realtimeTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-ip-muted">{t.realtimeDesc}</p>
              </div>

              <div className="rounded-[28px] ip-glass-card p-6 shadow-2xl shadow-purple-700/20">
                <div className="mb-3 inline-flex rounded-xl border border-ip bg-[var(--ip-nav-hover-bg)] p-2">
                  <Lock className="h-4 w-4 text-purple-400 dark:text-purple-200" />
                </div>
                <h3 className="text-lg font-semibold text-ip">{t.securityTitle}</h3>
                <p className="mt-2 text-sm leading-6 text-ip-muted">{t.securityDesc}</p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] ip-panel-strong p-8 shadow-2xl shadow-purple-700/20 sm:p-10">
            <div className="mb-8">
              <p className="text-sm leading-6 text-ip-muted">{t.subtitle}</p>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-6 rounded-3xl border border-red-400/40 bg-red-500/15 p-4 text-sm font-medium leading-6 text-red-50 shadow-lg shadow-red-950/20 dark:text-red-100"
              >
                {error}
              </div>
            )}

            {!totpStep ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label htmlFor="email" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">{t.emailLabel}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="login-input auth-input"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label htmlFor="password" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">{t.passwordLabel}</label>
                  <GlassPasswordField
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    authUnderlineStyle
                    leftIcon={<Lock className="h-5 w-5 text-slate-400" />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input auth-input"
                    placeholder="••••••••"
                    required
                    minLength={8}
                    showPasswordAriaLabel={t.showPasswordAria}
                    hidePasswordAriaLabel={t.hidePasswordAria}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex items-center gap-3 text-sm text-slate-300/80">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-purple-400 focus:ring-purple-300"
                    />
                    {t.rememberMe}
                  </label>
                  <Link to="/forgot-password" className="text-sm text-purple-200 transition hover:text-ip">
                    {t.forgotPassword}
                  </Link>
                </div>

                {hcaptchaSiteKey ? (
                  <div className="flex min-h-[92px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3">
                    <HCaptcha
                      ref={captchaRef}
                      id="login-hcaptcha"
                      sitekey={hcaptchaSiteKey}
                      theme="dark"
                      reCaptchaCompat={false}
                      sentry={false}
                      onLoad={() => {
                        setCaptchaReady(true);
                      }}
                      onVerify={(token) => {
                        setHcaptchaToken(token);
                        setError("");
                      }}
                      onExpire={() => {
                        setHcaptchaToken("");
                      }}
                      onError={(event) => {
                        // hCaptcha can emit a transient error during the first local/dev render,
                        // then recover on the next click. Do not show this as a login error immediately.
                        console.warn("hCaptcha error:", event);
                        setHcaptchaToken("");
                      }}
                    />
                  </div>
                ) : (
                  <div
                    role="alert"
                    className="rounded-3xl border border-red-400/40 bg-red-500/15 p-4 text-sm font-medium leading-6 text-red-50 shadow-lg shadow-red-950/20 dark:text-red-100"
                  >
                    Add <code>VITE_HCAPTCHA_SITE_KEY</code> to your <code>.env</code> file to enable hCaptcha.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  title={!canSubmit ? "Enter a valid email, password, and complete hCaptcha to sign in." : undefined}
                  className="hero-cta w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t.signIn}
                  </span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleTotpSubmit} className="space-y-6">
                <p className="text-sm text-slate-300">
                  Two-factor authentication: enter the 6-digit code shown in Google Authenticator.
                </p>
                <div className="space-y-3">
                  <label htmlFor="totp-code" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">
                    Code TOTP
                  </label>
                  <input
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="login-input auth-input font-mono tracking-widest"
                    placeholder="000000"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={busy}
                    className="hero-cta flex-1 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Verify
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={cancelTotp}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    Back
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-sm text-slate-400">
              {t.noAccount}{" "}
              <Link to="/register" className="font-semibold text-purple-600 transition hover:text-ip dark:text-purple-200">
                {t.createAccount}
              </Link>
            </div>

            <div className="mt-7 rounded-[1.75rem] border border-ip bg-[var(--ip-nav-hover-bg)] p-4 text-xs text-ip-muted">
              <p>
                <strong className="text-ip">{t.demoPrefix}</strong> {t.demoBody}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
