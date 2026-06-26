/**
 * Monthly contributions at end of each month (ordinary annuity),
 * compounded monthly at a nominal annual rate (APR).
 *
 * FV = P * (((1 + i)^m - 1) / i),  i = annualRate / 12,  m = months.
 */

/**
 * @param {{ monthlyInvestment: number; years: number; annualReturnPercent: number; assumption?: string }} p
 */
export function computeInvestmentSimulation(p) {
  const P = Number(p.monthlyInvestment);
  const years = Number(p.years);
  const annualPct = Number(p.annualReturnPercent);

  if (!Number.isFinite(P) || !Number.isFinite(years) || !Number.isFinite(annualPct)) {
    throw new Error("INVALID_NUMBERS");
  }

  const m = Math.max(0, Math.round(years * 12));
  const i = annualPct / 100 / 12;

  /** @param {number} months */
  function futureValueAtMonths(months) {
    const mm = Math.max(0, Math.min(months, m));
    if (mm === 0 || P === 0) return 0;
    if (i === 0 || !Number.isFinite(i)) return P * mm;
    const base = 1 + i;
    if (base <= 0 || !Number.isFinite(base)) return P * mm;
    const pow = Math.pow(base, mm);
    if (!Number.isFinite(pow)) return Number.POSITIVE_INFINITY;
    return P * ((pow - 1) / i);
  }

  const finalValue = futureValueAtMonths(m);
  const totalContributions = P * m;
  const gain = finalValue - totalContributions;
  const gainPercent = totalContributions > 0 ? (gain / totalContributions) * 100 : 0;

  /** Year-end milestones (no duplicate month counts). */
  const curve = [];
  let prevMonths = -1;
  const maxYearIndex = Math.ceil(years);
  for (let yr = 0; yr <= maxYearIndex; yr += 1) {
    const monthsAt = Math.min(yr * 12, m);
    if (monthsAt === prevMonths && yr > 0) continue;
    prevMonths = monthsAt;
    curve.push({
      year: yr,
      months: monthsAt,
      value: futureValueAtMonths(monthsAt),
      contributions: P * monthsAt,
    });
  }

  const defaultAssumption =
    "Contributions at the end of each month; nominal annual return compounded monthly (same month count as years × 12, rounded to integer months).";

  return {
    assumption: typeof p.assumption === "string" && p.assumption.trim() ? p.assumption.trim() : defaultAssumption,
    months: m,
    monthlyRate: i,
    monthlyInvestment: P,
    years,
    annualReturnPercent: annualPct,
    finalValue,
    totalContributions,
    gain,
    gainPercent,
    curve,
  };
}
