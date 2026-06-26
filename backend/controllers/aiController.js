import * as aiAssetExplainerService from "../services/aiAssetExplainerService.js";
import { computeInvestmentSimulation } from "../services/investmentSimulationMath.js";
import * as investmentSimulatorAiService from "../services/investmentSimulatorAiService.js";
import * as portfolioExpectedReturnService from "../services/portfolioExpectedReturnService.js";
import { YAHOO_FALLBACK_ANNUAL_PCT } from "../services/yahooFinanceHistoryService.js";
import { investmentSimulateSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postAssetInfo = asyncHandler(async (req, res) => {
  const raw = req.body?.ticker ?? req.body?.symbol;
  if (typeof raw !== "string" || !raw.trim()) {
    res.status(400).json({ message: "ticker is required", code: "VALIDATION" });
    return;
  }
  const lang = req.body?.lang === "en" ? "en" : "fr";
  const payload = await aiAssetExplainerService.buildAssetInfo(raw, lang);
  res.json(payload);
});

export const postSimulate = asyncHandler(async (req, res) => {
  const { error, value } = investmentSimulateSchema.validate(req.body ?? {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    res.status(400).json({ message: error.details.map((d) => d.message).join("; "), code: "VALIDATION" });
    return;
  }
  const lang = value.lang === "en" ? "en" : "fr";
  const userId = req.user.id;
  const currency = req.user.currency || "TND";

  const lookbackYears = Math.max(1, Math.min(40, Number(value.years)));

  let annualReturnPercent;
  /** @type {Array<{ symbol: string; weight: number; return: number }>} */
  let breakdown = [];
  let returnSource;

  if (value.useCustomReturn) {
    annualReturnPercent = value.customAnnualReturnPercent;
    returnSource = "custom";
  } else {
    const computed = await portfolioExpectedReturnService.computePortfolioExpectedReturn(userId, lookbackYears, currency);
    annualReturnPercent = computed.expectedReturn;
    breakdown = computed.breakdown;
    returnSource = "portfolio";
  }

  const assumption =
    returnSource === "custom"
      ? `Custom nominal annual return ${Number(annualReturnPercent).toFixed(4)}%. End-of-month contributions; monthly compounding (months = round(years × 12)).`
      : `Nominal annual return ${Number(annualReturnPercent).toFixed(4)}% estimated from your portfolio (value-weighted mix; Yahoo Finance weekly history where available, otherwise ${YAHOO_FALLBACK_ANNUAL_PCT}% per symbol). End-of-month contributions; monthly compounding (months = round(years × 12)).`;

  let math;
  try {
    math = computeInvestmentSimulation({
      monthlyInvestment: value.monthlyInvestment,
      years: value.years,
      annualReturnPercent,
      assumption,
    });
  } catch {
    res.status(400).json({ message: "Invalid numeric inputs", code: "VALIDATION" });
    return;
  }

  const { explanation, source } = await investmentSimulatorAiService.explainSimulation(math, lang, {
    returnSource,
  });

  res.json({
    inputs: {
      monthlyInvestment: math.monthlyInvestment,
      years: math.years,
      annualReturnPercent: math.annualReturnPercent,
      months: math.months,
      monthlyRate: math.monthlyRate,
      assumption: math.assumption,
      returnSource,
      lookbackYears: returnSource === "portfolio" ? lookbackYears : null,
    },
    expectedReturn: Number(Number(annualReturnPercent).toFixed(4)),
    breakdown: returnSource === "portfolio" ? breakdown : [],
    returnSource,
    finalValue: math.finalValue,
    totalContributions: math.totalContributions,
    gain: math.gain,
    gainPercent: math.gainPercent,
    curve: math.curve.map(({ year, months, value, contributions }) => ({ year, months, value, contributions })),
    explanation,
    explanationSource: source,
  });
});
