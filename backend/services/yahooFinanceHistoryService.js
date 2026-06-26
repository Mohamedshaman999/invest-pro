import config from "../config/index.js";
import { logger } from "../utils/logger.js";

const YAHOO_CHART = "https://query1.finance.yahoo.com/v8/finance/chart";

/** Annualized return fallback when history or API is insufficient (%). */
export const YAHOO_FALLBACK_ANNUAL_PCT = 7;

/**
 * Yahoo Finance symbol candidates (Tunis .TA, US, crypto pairs).
 * @param {string} ticker
 * @param {string} [category]
 * @returns {string[]}
 */
export function buildYahooSymbolCandidates(ticker, category = "") {
  const t = String(ticker || "")
    .trim()
    .toUpperCase();
  if (!t) return [];
  const cat = String(category || "").toLowerCase();
  if (cat.includes("crypto") || t === "BTC" || t === "ETH") {
    if (t === "BTC") return ["BTC-USD"];
    if (t === "ETH") return ["ETH-USD"];
    return [`${t}-USD`, t];
  }
  if (t.endsWith(".TA")) return [t];
  /** Prefer plain ticker (US / global), then Tunis (.TA) for BVMT-style codes. */
  return [t, `${t}.TA`];
}

/**
 * @param {unknown} v
 * @returns {number|null}
 */
function num(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Fetch weekly Yahoo chart and compute annualized return (%)
 * R = ((P_final / P_initial)^(1/years) - 1) * 100 using requested horizon `years`.
 *
 * @param {string[]} symbolCandidates
 * @param {number} years lookback / annualization horizon (typically 1–40)
 * @param {number} [timeoutMs]
 * @returns {Promise<number|null>} annualized return in percent, or null if insufficient
 */
export async function fetchAnnualizedReturnPercentFromYahoo(symbolCandidates, years, timeoutMs) {
  const timeout = Number(timeoutMs) || config.yahooFinance?.timeoutMs || 12000;
  const y = Math.max(0.25, Math.min(40, Number(years) || 5));
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - Math.ceil(y * 365.25 * 24 * 60 * 60);
  const graceSec = 120 * 24 * 60 * 60;

  for (const sym of symbolCandidates) {
    try {
      const url = `${YAHOO_CHART}/${encodeURIComponent(sym)}?period1=${period1}&period2=${period2}&interval=1wk`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(timeout),
        headers: {
          "User-Agent":
            config.yahooFinance?.userAgent ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) InvestPro/1.0",
          Accept: "application/json",
        },
      });
      if (!res.ok) continue;
      const json = await res.json();
      const result = json?.chart?.result?.[0];
      if (!result) continue;

      const ts = result.timestamp;
      const quote = result.indicators?.quote?.[0];
      const closes = quote?.close;
      if (!Array.isArray(ts) || !Array.isArray(closes) || ts.length < 2) continue;

      const minTs = ts[0];
      if (typeof minTs !== "number" || minTs > period1 + graceSec) continue;

      let idxStart = ts.findIndex((t) => typeof t === "number" && t >= period1);
      if (idxStart < 0) idxStart = 0;
      if (typeof ts[idxStart] === "number" && ts[idxStart] - period1 > graceSec) continue;

      let idxEnd = ts.length - 1;
      while (idxEnd > idxStart) {
        const c = num(closes[idxEnd]);
        if (c != null) break;
        idxEnd -= 1;
      }
      if (idxEnd <= idxStart) continue;

      const Pi = num(closes[idxStart]);
      const Pf = num(closes[idxEnd]);
      if (Pi == null || Pf == null) continue;

      const ratio = Pf / Pi;
      if (!(ratio > 0) || !Number.isFinite(ratio)) continue;

      const r = (Math.pow(ratio, 1 / y) - 1) * 100;
      if (!Number.isFinite(r) || r < -99.99 || r > 500) continue;

      return r;
    } catch (e) {
      logger.debug(`Yahoo chart failed for ${sym}: ${String(e?.message || e)}`);
    }
  }
  return null;
}
