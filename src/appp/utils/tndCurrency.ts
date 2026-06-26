/**
 * Tunisian Dinar display: comma decimals, space as thousands separator (fr-TN).
 * Used for all TND amounts regardless of UI language.
 */
export const TND_NUMBER_LOCALE = "fr-TN";

export function roundTndCents(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function formatTndAmount(
  amount: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  return roundTndCents(amount).toLocaleString(TND_NUMBER_LOCALE, {
    minimumFractionDigits: opts?.minimumFractionDigits ?? 2,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
  });
}

/** e.g. "12 345,67 TND" (narrow no-break space before TND). */
export function formatTndWithUnit(
  amount: number,
  opts?: { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  return `${formatTndAmount(amount, opts)}\u00a0TND`;
}
