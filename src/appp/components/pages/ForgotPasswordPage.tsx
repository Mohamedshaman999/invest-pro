import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Loader2 } from "lucide-react";
import logo1 from "../../../../logo1.png";
import { useLanguage } from "../../contexts/LanguageContext";
import { ApiError } from "../../lib/api";
import { investApi } from "../../services/investApi";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { text } = useLanguage();
  const t = text.pages.forgotPassword;
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await investApi.requestPasswordReset({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Something went wrong");
      }
    } finally {
      setBusy(false);
    }
  };

  const goReset = () => {
    navigate("/reset-password", {
      state: { email: email.trim().toLowerCase() },
    });
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

          {sent ? (
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
                {t.successHint}
              </div>
              <button
                type="button"
                onClick={goReset}
                className="hero-cta w-full py-3.5 text-sm font-semibold"
              >
                {t.continueToReset}
              </button>
              <div className="text-center text-sm text-slate-400">
                <Link to="/login" className="font-semibold text-purple-200 transition hover:text-ip">
                  {t.backToLogin}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <label htmlFor="fp-email" className="text-sm uppercase tracking-[0.24em] text-slate-300/80">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="fp-email"
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

              <button
                type="submit"
                disabled={busy}
                className="hero-cta w-full py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="hero-cta-label inline-flex items-center justify-center gap-2">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t.sendCode}
                </span>
              </button>

              <div className="text-center text-sm text-slate-400">
                <Link to="/login" className="font-semibold text-purple-200 transition hover:text-ip">
                  {t.backToLogin}
                </Link>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}
