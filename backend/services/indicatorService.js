import { AssetPriceHistory } from "../models/index.js";

/**
 * @param {number[]} closes chronological (oldest → newest)
 * @param {number} period
 * @returns {number|null}
 */
function simpleMovingAverage(closes, period) {
  if (!closes.length || closes.length < period) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Wilder-smoothed RSI (14).
 * @param {number[]} closes chronological, oldest first
 * @param {number} period
 * @returns {number|null}
 */
function relativeStrengthIndex(closes, period = 14) {
  if (closes.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) avgGain += ch;
    else avgLoss -= ch;
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const ch = closes[i] - closes[i - 1];
    const g = ch > 0 ? ch : 0;
    const l = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }

  if (avgLoss === 0) return avgGain === 0 ? 50 : 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function deriveStatus(lastClose, sma20, rsi14) {
  if (sma20 == null || rsi14 == null) return "Neutral";
  let score = 0;
  if (lastClose > sma20) score += 1;
  else if (lastClose < sma20) score -= 1;
  if (rsi14 > 55) score += 1;
  else if (rsi14 < 45) score -= 1;
  if (rsi14 >= 70 || rsi14 <= 30) return "Neutral";
  if (score >= 2) return "Bullish";
  if (score <= -2) return "Bearish";
  return "Neutral";
}

/**
 * Loads up to 50 latest daily closes and returns SMA(20), RSI(14), and a coarse status.
 * @param {number} assetId
 * @returns {Promise<{
 *   status: string,
 *   insufficientData: boolean,
 *   sma20: number|null,
 *   rsi14: number|null,
 *   closesUsed: number,
 *   lastClose: number|null,
 * }>}
 */
export async function calculateTechnicalSummary(assetId) {
  const rows = await AssetPriceHistory.findAll({
    where: { assetId },
    order: [
      ["date", "DESC"],
      ["id", "DESC"],
    ],
    limit: 50,
  });

  const chronological = [...rows].reverse();
  const closes = chronological.map((r) => Number(r.price)).filter((p) => Number.isFinite(p));

  if (closes.length < 14) {
    return {
      status: "Neutral",
      insufficientData: true,
      sma20: null,
      rsi14: null,
      closesUsed: closes.length,
      lastClose: closes.length ? closes[closes.length - 1] : null,
    };
  }

  const sma20 = simpleMovingAverage(closes, 20);
  const rsi14 = relativeStrengthIndex(closes, 14);
  const lastClose = closes[closes.length - 1];
  const status = deriveStatus(lastClose, sma20, rsi14);

  return {
    status,
    insufficientData: false,
    sma20: sma20 != null ? Number(sma20.toFixed(4)) : null,
    rsi14: rsi14 != null ? Number(rsi14.toFixed(2)) : null,
    closesUsed: closes.length,
    lastClose,
  };
}
