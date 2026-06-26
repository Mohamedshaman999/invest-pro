import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { KeyRound, Loader2, Lock, Mail } from "lucide-react";
import { GlassPasswordField } from "../ui/GlassPasswordField";
import logo1 from "../../../../logo1.png";
import { useLanguage } from "../../contexts/LanguageContext";
import { ApiError } from "../../lib/api";
import { investApi } from "../../services/investApi";

export function ResetPasswordPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { text } = useLanguage();
  const t = text.pages.resetPassword;
  const loginA11y = text.pages.login;

  const emailFromNav = (location.state as { email?: string } | null)?.email?.trim().toLowerCase() ?? "";
  const emailFromQuery = (searchParams.get("email") || "").trim().toLowerCase();
  const initialEmail = emailFromNav || emailFromQuery;

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) {
      setError(t.missingEmail);
      return;
    }
    setBusy(true);
    try {
      await investApi.resetPassword({
        email: email.trim().toLowerCase(),
        code: code.trim(),
        newPassword,
      });
      toast.success(t.successToast);
      navigate("/login", { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === "INVALID_RESET") {
        setError(t.invalidCode);
      } else {
        setError(e instanceof ApiError ? e.message : "Something went wrong");
      }
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

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-16 sm:px-8">
        <section className="w-full rounded-[32px] ip-panel-strong p-8 shadow-2xl shadow-purple-700/20 sm:p-10">
          <div className="mb-6 flex justify-center lg:justify-start">
            <div className="hero-logo-wrap hero-logo-compact">
              <img src={logo1} alt="InvestPro logo" className="hero-logo-image" />
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-semibold tracking-tight text-ip sm:text-3xl">{t.title}</h1>
          <p className="mb-8 text-sm leading-6 text-ip-muted">{t.subtitle}</p>

          {error && (
            <div className="mb-6 rounded-3xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</div>
          )}

          {!initialEmail ? (
            <p className="mb-4 text-xs leading-relaxed text-slate-500">
              <Link to="/forgot-password" className="font-medium text-purple-200 hover:text-ip">
                {text.pages.forgotPassword.title}
              </Link>
              {" — "}
              {t.missingEmail}
            </p>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <label htmlFor="rp-email" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">
                {text.pages.forgotPassword.emailLabel}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="rp-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input auth-input"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="rp-code" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">
                {t.codeLabel}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="rp-code"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="login-input auth-input tracking-[0.35em]"
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="rp-password" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">
                {t.newPasswordLabel}
              </label>
              <GlassPasswordField
                id="rp-password"
                authUnderlineStyle
                leftIcon={<Lock className="h-5 w-5 text-slate-400" />}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="login-input auth-input"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete="new-password"
                showPasswordAriaLabel={loginA11y.showPasswordAria}
                hidePasswordAriaLabel={loginA11y.hidePasswordAria}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="hero-cta w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t.resetButton}
              </span>
            </button>

            <div className="text-center text-sm text-slate-400">
              <Link to="/login" className="font-semibold text-purple-200 transition hover:text-ip">
                {t.backToLogin}
              </Link>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
