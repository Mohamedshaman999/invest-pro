import { memo, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import type { MarketStockWithApi } from "../contexts/MarketDataContext";
import { cn } from "./ui/utils";
import { formatTndWithUnit } from "../utils/tndCurrency";

type StockMarketGlassSelectProps = {
  items: MarketStockWithApi[];
  value: string;
  onChange: (symbol: string) => void;
  placeholder: string;
  /** Message lorsque la liste filtrée est vide. */
  listEmptyLabel?: string;
  disabled?: boolean;
  /** Hauteur max de la liste (scroll interne). */
  listMaxHeightClass?: string;
  /** Liste en `position: fixed` dans `document.body` (évite le clipping si un parent a overflow). */
  attachDropdownToBody?: boolean;
};

const listPanelMotion = {
  initial: { opacity: 0, y: -6, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -4, scale: 0.98 },
  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] as const },
};

const StockRow = memo(function StockRow({
  stock,
  selected,
  onPick,
}: {
  stock: MarketStockWithApi;
  selected: boolean;
  onPick: (symbol: string) => void;
}) {
  const up = stock.change >= 0;
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onPick(stock.symbol)}
      className={cn(
        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200",
        "hover:bg-violet-500/[0.08] hover:shadow-[0_0_20px_-4px_rgba(139,92,246,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/40",
        selected &&
          "bg-gradient-to-r from-violet-600/18 via-fuchsia-600/12 to-transparent shadow-[inset_0_0_0_1px_rgba(139,92,246,0.22)]",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-bold tracking-tight text-ip">{stock.symbol}</span>
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums",
              up ? "text-emerald-500/95 dark:text-emerald-400/95" : "text-rose-500/95 dark:text-rose-400/95",
            )}
          >
            {up ? <TrendingUp className="h-3 w-3 opacity-90" aria-hidden /> : <TrendingDown className="h-3 w-3 opacity-90" aria-hidden />}
            {typeof stock.changePercent === "number" && Number.isFinite(stock.changePercent)
              ? `${stock.changePercent >= 0 ? "+" : ""}${stock.changePercent.toFixed(2)}%`
              : "—"}
          </span>
        </div>
        <span className="truncate text-xs text-ip-muted">{stock.name}</span>
      </div>
      <div className="shrink-0 text-right">
        <div className="ip-fintech-nums text-sm font-semibold text-ip">{formatTndWithUnit(stock.price)}</div>
      </div>
    </button>
  );
});

export const StockMarketGlassSelect = memo(function StockMarketGlassSelect({
  items,
  value,
  onChange,
  placeholder,
  listEmptyLabel,
  disabled,
  listMaxHeightClass = "max-h-[min(18rem,50vh)]",
  attachDropdownToBody = false,
}: StockMarketGlassSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [bodyPanelBox, setBodyPanelBox] = useState<{ top: number; left: number; width: number } | null>(null);
  const listId = useId();

  const selectedStock = useMemo(() => items.find((m) => m.symbol === value) ?? null, [items, value]);

  const syncBodyPanelBox = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setBodyPanelBox({ top: r.bottom + 8, left: r.left, width: r.width });
  }, []);

  useLayoutEffect(() => {
    if (!open || !attachDropdownToBody) {
      setBodyPanelBox(null);
      return;
    }
    syncBodyPanelBox();
    window.addEventListener("resize", syncBodyPanelBox);
    window.addEventListener("scroll", syncBodyPanelBox, true);
    return () => {
      window.removeEventListener("resize", syncBodyPanelBox);
      window.removeEventListener("scroll", syncBodyPanelBox, true);
    };
  }, [open, attachDropdownToBody, syncBodyPanelBox]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onPick = useCallback(
    (symbol: string) => {
      onChange(symbol);
      setOpen(false);
    },
    [onChange],
  );

  const triggerLabel = selectedStock
    ? `${selectedStock.symbol} · ${formatTndWithUnit(selectedStock.price)}`
    : placeholder;

  const panelClassName = cn(
    "z-[200] overflow-hidden rounded-2xl",
    !attachDropdownToBody && "absolute left-0 right-0 z-[80] mt-2",
    "bg-[var(--ip-popover-bg)]/75 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.45),0_0_0_1px_rgba(139,92,246,0.12)]",
    "backdrop-blur-2xl dark:bg-slate-950/55",
    "ring-1 ring-white/10 dark:ring-white/5",
  );

  const panelBody = (
    <div
      className={cn(
        "overflow-y-auto overscroll-contain px-2 py-2",
        listMaxHeightClass,
        "scrollbar-thin [scrollbar-color:rgba(139,92,246,0.35)_transparent]",
      )}
    >
      {items.length === 0 ? (
        <div className="px-3 py-6 text-center text-sm text-ip-muted">
          {listEmptyLabel ?? placeholder}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {items.map((stock) => (
            <StockRow
              key={stock.symbol}
              stock={stock}
              selected={stock.symbol === value}
              onPick={onPick}
            />
          ))}
        </div>
      )}
    </div>
  );

  const motionListbox =
    open && (!attachDropdownToBody || bodyPanelBox) ? (
      <motion.div
        key="stock-market-glass-panel"
        ref={panelRef}
        id={listId}
        role="listbox"
        aria-labelledby={`${listId}-trigger`}
        initial={listPanelMotion.initial}
        animate={listPanelMotion.animate}
        exit={listPanelMotion.exit}
        transition={listPanelMotion.transition}
        style={
          attachDropdownToBody && bodyPanelBox
            ? {
                position: "fixed",
                top: bodyPanelBox.top,
                left: bodyPanelBox.left,
                width: bodyPanelBox.width,
              }
            : undefined
        }
        className={panelClassName}
      >
        {panelBody}
      </motion.div>
    ) : null;

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id={`${listId}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex w-full min-h-[3rem] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm transition-all duration-200",
          "bg-[var(--ip-card-glass)] shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.06)]",
          "backdrop-blur-xl dark:bg-slate-950/35 dark:shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.04)]",
          "ring-1 ring-violet-500/10 hover:ring-violet-400/25",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/45",
          disabled && "cursor-not-allowed opacity-50",
          selectedStock && "ring-violet-400/20",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate font-medium", selectedStock ? "text-ip" : "text-ip-muted")}>
          {triggerLabel}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-violet-400/80 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {!attachDropdownToBody ? (
        <AnimatePresence mode="popLayout">{motionListbox}</AnimatePresence>
      ) : typeof document !== "undefined" ? (
        createPortal(<AnimatePresence mode="popLayout">{motionListbox}</AnimatePresence>, document.body)
      ) : null}
    </div>
  );
});
