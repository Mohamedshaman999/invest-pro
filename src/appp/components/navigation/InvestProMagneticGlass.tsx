import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useRef,
  useState,
} from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const MAGNETIC_MAX = 2.5;
const SPRING = { stiffness: 320, damping: 24, mass: 0.35 };

/**
 * Inset only on the frosted layer — outer diffuse glow lives on `outerRing` so it is not
 * clipped by `backdrop-filter` + `border-radius` (Chromium/WebKit paint quirk).
 * `overflow-hidden` matches the profile pill (same card chrome as `as="button"`).
 */
const innerGlass = [
  "relative isolate flex w-full min-w-0 items-center justify-center gap-3 overflow-hidden rounded-full bg-white/5 px-3 py-1.5",
  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.22)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] dark:hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]",
  "backdrop-blur-[20px] saturate-[180%] transition-[box-shadow,background-color] duration-300 ease-out",
  "hover:bg-white/10",
  "active:scale-[0.98] dark:bg-zinc-900/40",
].join(" ");

/** Violet / indigo bloom on the ring (no backdrop-filter here → soft, uncropped halo). */
const outerGlowBase =
  "shadow-[0_0_20px_rgba(168,85,247,0.24),0_0_40px_rgba(99,102,241,0.14)] dark:shadow-[0_0_20px_rgba(168,85,247,0.22),0_0_44px_rgba(79,70,229,0.12)]";
const outerGlowHover =
  "hover:shadow-[0_0_28px_rgba(168,85,247,0.4),0_0_56px_rgba(129,140,248,0.22)] dark:hover:shadow-[0_0_30px_rgba(168,85,247,0.45),0_0_60px_rgba(129,140,248,0.24)]";

const outerRing = [
  "rounded-full bg-gradient-to-br from-white/30 via-white/[0.07] to-transparent p-px",
  outerGlowBase,
  outerGlowHover,
  "transition-[box-shadow] duration-300 ease-out will-change-transform",
].join(" ");

function GlowFollow({ xPct, yPct }: { xPct: number; yPct: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] opacity-90 mix-blend-soft-light transition-[background] duration-100 ease-out"
      style={{
        background: `radial-gradient(140px circle at ${xPct}% ${yPct}%, rgba(168,85,247,0.28), rgba(59,130,246,0.12) 38%, transparent 58%)`,
      }}
      aria-hidden
    />
  );
}

export type InvestProMagneticGlassProps =
  | {
      as?: "div";
      innerProps?: HTMLAttributes<HTMLDivElement>;
      children: ReactNode;
      className?: string;
      outerClassName?: string;
    }
  | {
      as: "button";
      innerProps: ButtonHTMLAttributes<HTMLButtonElement>;
      children: ReactNode;
      className?: string;
      outerClassName?: string;
    };

export function InvestProMagneticGlass(props: InvestProMagneticGlassProps) {
  const { children, className = "", outerClassName = "" } = props;
  const as = props.as ?? "div";
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, SPRING);
  const springY = useSpring(y, SPRING);
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const handleMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      x.set(nx * MAGNETIC_MAX * 2);
      y.set(ny * MAGNETIC_MAX * 2);
      setGlow({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    },
    [x, y],
  );

  const handleLeave = useCallback(() => {
    x.set(0);
    y.set(0);
    setGlow({ x: 50, y: 50 });
  }, [x, y]);

  const innerClass = `${innerGlass} ${className}`.trim();
  const mergedOuter = `${outerRing} ${outerClassName}`.trim();
  const childrenRowClass = "relative z-[2] flex min-w-0 items-center justify-center gap-3";

  if (as === "button") {
    const { innerProps } = props as Extract<InvestProMagneticGlassProps, { as: "button" }>;
    const { className: ipCls, type, ...rest } = innerProps;
    return (
      <motion.div
        ref={ref}
        className={mergedOuter}
        style={{ x: springX, y: springY }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <button
          type={type ?? "button"}
          className={`${innerClass} ${ipCls ?? ""}`.trim()}
          {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <GlowFollow xPct={glow.x} yPct={glow.y} />
          <span className={childrenRowClass}>{children}</span>
        </button>
      </motion.div>
    );
  }

  const { innerProps } = props as Extract<InvestProMagneticGlassProps, { as?: "div" }>;
  const { className: ipCls, ...rest } = innerProps ?? {};
  return (
    <motion.div
      ref={ref}
      className={mergedOuter}
      style={{ x: springX, y: springY }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className={`${innerClass} ${ipCls ?? ""}`.trim()} {...rest}>
        <GlowFollow xPct={glow.x} yPct={glow.y} />
        <span className={childrenRowClass}>{children}</span>
      </div>
    </motion.div>
  );
}
