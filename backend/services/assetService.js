import { Asset, AssetPriceHistory } from "../models/index.js";
import { NotFoundError } from "../utils/errors.js";
import { buildSyntheticHistory } from "./bvmtService.js";
import { calculateTechnicalSummary } from "./indicatorService.js";

function numOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function listAssets() {
  const rows = await Asset.findAll({ order: [["ticker", "ASC"]] });
  return rows.map((a) => ({
    id: a.id,
    ticker: a.ticker,
    name: a.name,
    currentPrice: Number(a.currentPrice),
    category: a.category,
    updatedAt: a.updatedAt,
    quoteUpdatedAt: a.quoteUpdatedAt ?? null,
    /** Variation % (ex. séance ou clôture veille), colonne `variation_percent`. */
    variationPercent: numOrNull(a.variationPercent),
    /** Session volume from BVMT sync (shares). */
    volume: numOrNull(a.lastVolume),
    /** Capitalisation échangée (TND), column `market_cap`. */
    capMarket: numOrNull(a.marketCap),
  }));
}

export async function getHistoryByTicker(ticker) {
  const asset = await Asset.findOne({ where: { ticker: ticker.toUpperCase() } });
  if (!asset) throw new NotFoundError("Unknown ticker");

  const rows = await AssetPriceHistory.findAll({
    where: { assetId: asset.id },
    order: [["date", "ASC"]],
  });

  if (rows.length === 0) {
    return buildSyntheticHistory(asset.currentPrice, 30);
  }

  return rows.map((r) => ({
    date: r.date,
    price: Number(r.price),
  }));
}

/**
 * Stock detail: snapshot + last 50 history points + technical analysis (SMA20, RSI14).
 */
export async function getAssetDetailByTicker(ticker) {
  const asset = await Asset.findOne({ where: { ticker: ticker.toUpperCase() } });
  if (!asset) throw new NotFoundError("Unknown ticker");

  const rows = await AssetPriceHistory.findAll({
    where: { assetId: asset.id },
    order: [
      ["date", "DESC"],
      ["id", "DESC"],
    ],
    limit: 50,
  });
  const historyChrono = [...rows].reverse();
  const history = historyChrono.map((r) => ({
    date: r.date,
    price: Number(r.price),
  }));

  const analysis = await calculateTechnicalSummary(asset.id);

  return {
    id: asset.id,
    ticker: asset.ticker,
    name: asset.name,
    currentPrice: Number(asset.currentPrice),
    category: asset.category,
    updatedAt: asset.updatedAt,
    quoteUpdatedAt: asset.quoteUpdatedAt ?? null,
    variationPercent: numOrNull(asset.variationPercent),
    volume: numOrNull(asset.lastVolume),
    capMarket: numOrNull(asset.marketCap),
    history,
    analysis,
  };
}
