import { Asset, AssetPriceHistory } from "../../models/index.js";
import { logAiTradingError } from "./aiTradingLog.service.js";

function toNum(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * @param {string} symbol
 * @returns {Promise<{
 *   ok: boolean;
 *   error?: string;
 *   symbol: string;
 *   price: number;
 *   variationPercent: number;
 *   volatility: number;
 *   momentum: number;
 *   trendDirection: "up" | "down" | "flat";
 *   recentPerformance: number;
 *   closes: number[];
 * }>}
 */
export async function fetchMarketSnapshot(symbol) {
  const ticker = String(symbol || "").trim().toUpperCase();
  if (!ticker) {
    return {
      ok: false,
      error: "INVALID_SYMBOL",
      symbol: "",
      price: 0,
      variationPercent: 0,
      volatility: 0,
      momentum: 0,
      trendDirection: "flat",
      recentPerformance: 0,
      closes: [],
    };
  }

  try {
    const asset = await Asset.findOne({ where: { ticker } });
    if (!asset) {
      return {
        ok: false,
        error: "ASSET_NOT_FOUND",
        symbol: ticker,
        price: 0,
        variationPercent: 0,
        volatility: 0,
        momentum: 0,
        trendDirection: "flat",
        recentPerformance: 0,
        closes: [],
      };
    }

    const price = toNum(asset.currentPrice);
    const variationPercent = asset.variationPercent != null ? toNum(asset.variationPercent) : 0;

    const history = await AssetPriceHistory.findAll({
      where: { assetId: asset.id },
      order: [["date", "DESC"]],
      limit: 40,
    });

    const closes = history.map((h) => toNum(h.price)).filter((p) => Number.isFinite(p) && p > 0).reverse();
    if (!Number.isFinite(price) || price <= 0) {
      return {
        ok: false,
        error: "MARKET_DATA_UNAVAILABLE",
        symbol: ticker,
        price: 0,
        variationPercent: 0,
        volatility: 0,
        momentum: 0,
        trendDirection: "flat",
        recentPerformance: 0,
        closes,
      };
    }

    let volatility = 0;
    let momentum = 0;
    let trendDirection = /** @type {"up" | "down" | "flat"} */ ("flat");
    let recentPerformance = 0;

    if (closes.length >= 5) {
      const rets = [];
      for (let i = 1; i < closes.length; i += 1) {
        const prev = closes[i - 1];
        const cur = closes[i];
        if (prev > 0) rets.push((cur - prev) / prev);
      }
      if (rets.length) {
        const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
        const varc =
          rets.reduce((acc, r) => acc + (r - mean) ** 2, 0) / Math.max(1, rets.length - 1);
        volatility = Math.sqrt(Math.max(0, varc));
        momentum = closes[closes.length - 1] / closes[Math.max(0, closes.length - 6)] - 1;
        const short = closes.slice(-5).reduce((a, b) => a + b, 0) / 5;
        const long = closes.reduce((a, b) => a + b, 0) / closes.length;
        if (short > long * 1.002) trendDirection = "up";
        else if (short < long * 0.998) trendDirection = "down";
        else trendDirection = "flat";
        recentPerformance = closes.length >= 10 ? closes[closes.length - 1] / closes[closes.length - 10] - 1 : momentum;
      }
    }

    return {
      ok: true,
      symbol: ticker,
      price,
      variationPercent: Number.isFinite(variationPercent) ? variationPercent : 0,
      volatility: Number.isFinite(volatility) ? volatility : 0,
      momentum: Number.isFinite(momentum) ? momentum : 0,
      trendDirection,
      recentPerformance: Number.isFinite(recentPerformance) ? recentPerformance : 0,
      closes,
    };
  } catch (e) {
    logAiTradingError("marketData", e, { ticker });
    return {
      ok: false,
      error: "MARKET_FETCH_FAILED",
      symbol: ticker,
      price: 0,
      variationPercent: 0,
      volatility: 0,
      momentum: 0,
      trendDirection: "flat",
      recentPerformance: 0,
      closes: [],
    };
  }
}
