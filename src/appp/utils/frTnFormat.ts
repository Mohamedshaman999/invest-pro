/** Tunisia-style grouping and decimal comma for financial display. */

export function formatVolumeFrTn(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return Math.trunc(value).toLocaleString("fr-TN");
}

export function formatMarketCapFrTn(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const n = Number(value);
  return `${n.toLocaleString("fr-TN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TND`;
}
