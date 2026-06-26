import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import * as portfolioService from "./portfolioService.js";
import {
  buildYahooSymbolCandidates,
  fetchAnnualizedReturnPercentFromYahoo,
  YAHOO_FALLBACK_ANNUAL_PCT,
} from "./yahooFinanceHistoryService.js";
import config from "../config/index.js";

/**
 * @typedef {{ symbol: string; weight: number; return: number }} ExpectedReturnBreakdownRow
 */

/**
 * @param {number} userId
 * @param {number} years
 * @param {string} [currency]
 * @returns {Promise<{ expectedReturn: number; breakdown: ExpectedReturnBreakdownRow[] }>}
 */
export async function computePortfolioExpectedReturn(userId, years, currency = "TND") {
  const y = Math.max(1, Math.min(40, Number(years) || 5));
  const portfolio = await portfolioService.getPortfolioForUser(userId, currency);
  const totalValue = portfolio.summary?.totalValue ?? 0;

  if (!portfolio.assets?.length || !(totalValue > 0)) {
    throw new AppError("Portfolio is empty or has no market value. Add positions before running the simulator.", 400, "EMPTY_PORTFOLIO");
  }

  const eligible = portfolio.assets.filter((a) => Number(a.lineValue) > 0);

  const timeoutMs = config.yahooFinance?.timeoutMs || 12000;

  const tasks = eligible.map((a) =>
    (async () => {
      const symbol = String(a.ticker || "").trim().toUpperCase();
      const weight = Number(a.lineValue) / totalValue;
      const candidates = buildYahooSymbolCandidates(symbol, a.category);
      let returnPct = YAHOO_FALLBACK_ANNUAL_PCT;
      try {
        const fromYahoo = await fetchAnnualizedReturnPercentFromYahoo(candidates, y, timeoutMs);
        if (fromYahoo != null && Number.isFinite(fromYahoo)) {
          returnPct = fromYahoo;
        }
      } catch (e) {
        logger.warn(`Expected return fetch error for ${symbol}: ${String(e?.message || e)}`);
      }
      return { symbol, weight, return: returnPct };
    })()
  );

  const rows = await Promise.all(tasks);

  let expectedReturn = 0;
  for (const row of rows) {
    expectedReturn += row.weight * row.return;
  }

  const breakdown = rows.map((r) => ({
    symbol: r.symbol,
    weight: Number(r.weight.toFixed(6)),
    return: Number(Number(r.return).toFixed(4)),
  }));

  expectedReturn = Number(expectedReturn.toFixed(4));

  return { expectedReturn, breakdown };
}
