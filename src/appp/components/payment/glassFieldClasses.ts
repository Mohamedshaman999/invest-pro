/** Shared glass-style field classes (load account, withdrawal, etc.) */
export const loadFieldClass =
  "app-field border-slate-200 bg-white text-slate-900 placeholder:text-slate-600 focus:border-violet-400 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-violet-400 dark:focus:ring-2 dark:focus:ring-violet-400/25";

export const loadLabelClass =
  "block space-y-2 text-sm font-medium text-slate-900 dark:text-zinc-200";

export const loadErrorClass = "text-xs font-medium text-rose-600 dark:text-red-500";

export function loadFieldRing(invalid: boolean) {
  return invalid
    ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-red-500 dark:focus:border-red-500 dark:focus:ring-red-500/30"
    : "";
}
