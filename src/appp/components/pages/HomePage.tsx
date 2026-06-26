import type { MutableRefObject, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import logo1 from "../../../../logo1.png";
import { useLanguage } from "../../contexts/LanguageContext";
import { formatTndWithUnit } from "../../utils/tndCurrency";

/** Glow + lift cards: primary features (3) + “Powerful features” row (3) */
const GLOW_CARD_COUNT = 6;

function FeatureGlowCard({
  cardIndex,
  cardRefs,
  children,
}: {
  cardIndex: number;
  cardRefs: MutableRefObject<(HTMLDivElement | null)[]>;
  children: ReactNode;
}) {
  return (
    <div
      data-reveal
      className="reveal-card rounded-[32px] ip-glass-card p-px shadow-2xl shadow-purple-700/20"
    >
      <div
        ref={(el) => {
          cardRefs.current[cardIndex] = el;
        }}
        className="group features-glow-card ip-glass-card-inner relative overflow-hidden rounded-[31px] p-8"
      >
        <div className="features-glow-overlay" aria-hidden />
        <div className="relative z-[1]">{children}</div>
      </div>
    </div>
  );
}

export function HomePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { text } = useLanguage();
  const t = text.pages.home;

  const featureItems = [
    { overline: t.aiInsights, heading: t.automatedGuidance, description: t.automatedGuidanceDesc },
    { overline: t.secure, heading: t.enterpriseProtection, description: t.enterpriseProtectionDesc },
    { overline: t.design, heading: t.immersiveUi, description: t.immersiveUiDesc },
  ] as const;

  const powerfulFeatureItems = [
    { heading: t.precisionTracking, description: t.precisionTrackingDesc },
    { heading: t.adaptiveAlerts, description: t.adaptiveAlertsDesc },
    { heading: t.glowingPerformance, description: t.glowingPerformanceDesc },
  ] as const;

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const setPointerVars = (el: HTMLElement, clientX: number, clientY: number) => {
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      el.style.setProperty("--mouse-x", `${x}px`);
      el.style.setProperty("--mouse-y", `${y}px`);
    };

    const centerPointerVars = (el: HTMLElement) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mouse-x", `${rect.width / 2}px`);
      el.style.setProperty("--mouse-y", `${rect.height / 2}px`);
    };

    const cleanups: (() => void)[] = [];

    const rafId = requestAnimationFrame(() => {
      for (let i = 0; i < GLOW_CARD_COUNT; i++) {
        const el = cardRefs.current[i];
        if (!el) continue;

        centerPointerVars(el);

        const onMouseMove = (e: MouseEvent) => {
          setPointerVars(el, e.clientX, e.clientY);
        };
        const onTouchMove = (e: TouchEvent) => {
          const touch = e.touches[0];
          if (touch) setPointerVars(el, touch.clientX, touch.clientY);
        };
        const onMouseLeave = () => centerPointerVars(el);

        el.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mouseleave", onMouseLeave);
        el.addEventListener("touchmove", onTouchMove, { passive: true });

        cleanups.push(() => {
          el.removeEventListener("mousemove", onMouseMove);
          el.removeEventListener("mouseleave", onMouseLeave);
          el.removeEventListener("touchmove", onTouchMove);
        });
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      cleanups.forEach((fn) => fn());
    };
  }, []);

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;

    const revealItems = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!revealItems.length) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      revealItems.forEach((item) => {
        item.style.setProperty("--reveal-progress", "0");
      });
      return;
    }

    const activeItems = new Set<HTMLElement>();
    let rafId = 0;
    let isScheduled = false;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));

    const updateItemProgress = (item: HTMLElement) => {
      const rect = item.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const fadeStartY = viewportHeight * 0.35;
      const fadeEndY = 0;

      let progress = clamp((fadeStartY - rect.top) / (fadeStartY - fadeEndY || 1));

      if (rect.bottom <= 0) {
        progress = 1;
      } else if (rect.top >= fadeStartY) {
        progress = 0;
      }

      const stagger = Number(item.dataset.revealStagger ?? "0");
      const staggeredProgress = clamp((progress - stagger) / (1 - stagger));
      item.style.setProperty("--reveal-progress", staggeredProgress.toFixed(4));
    };

    const updateActiveItems = () => {
      activeItems.forEach((item) => updateItemProgress(item));
      isScheduled = false;
    };

    const scheduleUpdate = () => {
      if (isScheduled) return;
      isScheduled = true;
      rafId = window.requestAnimationFrame(updateActiveItems);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as HTMLElement;
          if (entry.isIntersecting) {
            activeItems.add(element);
          } else {
            activeItems.delete(element);
            updateItemProgress(element);
          }
        });
        scheduleUpdate();
      },
      {
        threshold: [0, 0.25, 0.5, 0.75, 1],
        rootMargin: "10% 0px 0px 0px",
      },
    );

    revealItems.forEach((item, index) => {
      item.dataset.revealStagger = ((index % 5) * 0.055).toFixed(3);
      item.style.setProperty("--reveal-progress", "0");
      observer.observe(item);
    });

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (rafId) window.cancelAnimationFrame(rafId);
      observer.disconnect();
      activeItems.clear();
    };
  }, []);

  return (
    <div ref={pageRef} className="ip-home-bg relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 ip-shell-radial" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 ip-vignette-top" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 ip-vignette-bottom" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-28 sm:px-8">
        <div className="text-center space-y-6">
          <div className="hero-logo-container">
            <div className="hero-logo-wrap">
              <img src={logo1} alt="InvestPro logo" className="hero-logo-image" />
            </div>
          </div>
          <p className="text-sm uppercase tracking-[0.15em] font-extrabold text-purple-200" style={{ fontFamily: "Orbitron, ui-sans-serif, system-ui, sans-serif" }}>
            {t.brand}
          </p>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-ip sm:text-6xl lg:text-7xl">
            {t.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-ip-muted sm:text-xl">
            {t.heroSubtitle}
          </p>
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/login"
            className="hero-cta inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-semibold"
          >
            <span className="hero-cta-label">{t.cta}</span>
          </Link>
        </div>

        <div className="relative mx-auto mt-16 w-full max-w-5xl">
          <div className="absolute left-1/2 top-1/2 h-72 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute inset-x-0 top-1/2 h-52 bg-gradient-to-t from-[#a855f7]/20 to-transparent blur-3xl" />
          <div
            className="relative overflow-hidden rounded-[40px] ip-panel-strong p-8 shadow-2xl shadow-purple-700/30"
            style={{ transform: "perspective(1400px) rotateX(8deg)" }}
          >
            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-purple-500/10 to-transparent" />
            <div className="relative space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-purple-300/80">{t.previewLabel}</p>
                  <h2 className="mt-3 text-2xl font-semibold text-ip">{t.previewTitle}</h2>
                </div>
                <span className="rounded-full bg-purple-500/15 px-4 py-2 text-xs font-semibold text-purple-700 dark:text-purple-100">
                  {t.connected}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <div data-reveal className="reveal-card rounded-3xl border border-ip bg-[var(--ip-nav-hover-bg)] p-6 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-ip-muted">{t.balance}</p>
                  <p className="ip-fintech-nums mt-4 text-3xl font-semibold text-ip">{formatTndWithUnit(73450)}</p>
                  <p className="mt-2 text-sm text-ip-muted">{t.availableFunds}</p>
                </div>
                <div data-reveal className="reveal-card rounded-3xl border border-ip bg-[var(--ip-nav-hover-bg)] p-6 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-ip-muted">{t.income}</p>
                  <p className="ip-fintech-nums mt-4 text-3xl font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatTndWithUnit(12800)}
                  </p>
                  <p className="mt-2 text-sm text-ip-muted">{t.last30Days}</p>
                </div>
                <div data-reveal className="reveal-card rounded-3xl border border-ip bg-[var(--ip-nav-hover-bg)] p-6 backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.28em] text-ip-muted">{t.signal}</p>
                  <p className="ip-fintech-nums mt-4 text-3xl font-semibold text-purple-600 dark:text-purple-300">+18.2%</p>
                  <p className="mt-2 text-sm text-ip-muted">{t.portfolioMomentum}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[32px] ip-inner-well p-5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-ip-muted">{t.insights}</p>
                    <p className="mt-2 text-lg font-semibold text-ip">{t.healthForecast}</p>
                  </div>
                  <span className="rounded-full bg-[var(--ip-nav-hover-bg)] px-3 py-1 text-xs text-ip-secondary">{t.premium}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div data-reveal className="reveal-card rounded-3xl ip-panel-muted p-4">
                    <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-ip-secondary">
                      <span>{t.spendRate}</span>
                      <span className="text-emerald-700 dark:text-emerald-300">+6.4%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full w-3/4 rounded-full bg-purple-500" />
                    </div>
                  </div>
                  <div data-reveal className="reveal-card rounded-3xl ip-panel-muted p-4">
                    <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-ip-secondary">
                      <span>{t.riskLevel}</span>
                      <span className="text-fuchsia-600 dark:text-fuchsia-300">{t.low}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full w-1/3 rounded-full bg-pink-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="features-grid-section relative mt-20 border-0 bg-transparent py-20 outline-none">
          <div className="relative z-[1] mx-auto max-w-6xl border-0 px-6 sm:px-8 outline-none">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {featureItems.map((item, index) => (
                <FeatureGlowCard key={`feature-glow-primary-${index}`} cardIndex={index} cardRefs={cardRefs}>
                  <p className="text-xs uppercase tracking-[0.28em] text-purple-300/80">{item.overline}</p>
                  <h3 className="mt-5 text-xl font-semibold text-ip">{item.heading}</h3>
                  <p className="mt-3 text-sm leading-6 text-ip-muted">{item.description}</p>
                </FeatureGlowCard>
              ))}
            </div>
          </div>
        </section>

        <section className="features-grid-section relative border-0 py-24 outline-none">
          <div className="relative z-[1] mx-auto max-w-6xl border-0 px-6 sm:px-8 outline-none">
            <div className="mb-12 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-300/80">{t.deepInsights}</p>
              <h2 className="mt-4 text-3xl font-semibold text-ip sm:text-4xl">{t.precisionHeadline}</h2>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-ip-muted">
                {t.precisionSubheadline}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {powerfulFeatureItems.map((item, index) => (
                <FeatureGlowCard key={`feature-glow-powerful-${index}`} cardIndex={3 + index} cardRefs={cardRefs}>
                  <h3 className="text-xl font-semibold text-ip">{item.heading}</h3>
                  <p className="mt-3 text-sm leading-6 text-ip-muted">{item.description}</p>
                </FeatureGlowCard>
              ))}
            </div>

            <div data-reveal className="reveal-card mt-20 rounded-[40px] ip-glass-card p-10 shadow-2xl shadow-purple-700/20">
              <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-center">
                <div>
                  <p className="text-sm uppercase tracking-[0.35em] text-purple-300/80">{t.nextLevelControl}</p>
                  <h3 className="mt-4 text-3xl font-semibold text-ip">{t.longerPageTitle}</h3>
                  <p className="mt-4 text-sm leading-7 text-ip-muted">
                    {t.longerPageDesc}
                  </p>
                </div>
                <div className="rounded-[28px] ip-inner-well p-6">
                  <div className="flex items-center justify-between gap-4 text-sm text-ip-muted">
                    <span>{t.monthlyVolume}</span>
                    <span className="text-ip font-semibold">124K</span>
                  </div>
                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div className="h-full w-4/5 rounded-full bg-purple-500" />
                  </div>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div data-reveal className="reveal-card rounded-3xl ip-panel-muted p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-ip-secondary">{t.conversion}</p>
                      <p className="mt-2 text-xl font-semibold text-ip">18.4%</p>
                    </div>
                    <div data-reveal className="reveal-card rounded-3xl ip-panel-muted p-4">
                      <p className="text-xs uppercase tracking-[0.28em] text-ip-secondary">{t.retention}</p>
                      <p className="mt-2 text-xl font-semibold text-ip">92.1%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
