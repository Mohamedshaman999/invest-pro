import { Op } from "sequelize";
import { Portfolio, Asset, AssetPriceHistory } from "../models/index.js";
function toNum(v) {
  return typeof v === "number" ? v : Number(v);
}

function numOrNull(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function getPortfolioForUser(userId, currency = "TND") {
  const rows = await Portfolio.findAll({
    where: { userId },
    include: [{ model: Asset, as: "asset", required: true }],
    order: [[{ model: Asset, as: "asset" }, "ticker", "ASC"]],
  });

  let totalValue = 0;
  let investedAmount = 0;
  const assets = [];

  for (const p of rows) {
    const qty = toNum(p.totalQuantity);
    const avg = toNum(p.averagePurchasePrice);
    const price = toNum(p.asset.currentPrice);
    const lineValue = qty * price;
    const lineInvested = qty * avg;
    totalValue += lineValue;
    investedAmount += lineInvested;
    assets.push({
      assetId: p.assetId,
      ticker: p.asset.ticker,
      name: p.asset.name,
      category: p.asset.category,
      quantity: qty,
      averagePurchasePrice: avg,
      currentPrice: price,
      lineValue,
      lineInvested,
      linePnL: lineValue - lineInvested,
      variationPercent: numOrNull(p.asset.variationPercent),
      volume: p.asset.lastVolume != null ? numOrNull(p.asset.lastVolume) : null,
      quoteUpdatedAt: p.asset.quoteUpdatedAt ?? null,
    });
  }

  const pnl = totalValue - investedAmount;

  return {
    currency,
    summary: {
      totalValue,
      investedAmount,
      profitLoss: pnl,
    },
    assets,
  };
}

export async function getPortfolioPerformanceSeries(userId) {
  const positions = await Portfolio.findAll({
    where: { userId },
    include: [{ model: Asset, as: "asset", required: true }],
  });

  if (!positions.length) {
    return [];
  }

  const assetIds = positions.map((p) => p.assetId);
  const histories = await AssetPriceHistory.findAll({
    where: { assetId: { [Op.in]: assetIds } },
    order: [["date", "ASC"]],
  });

  const byDate = new Map();
  for (const h of histories) {
    const key = String(h.date);
    if (!byDate.has(key)) byDate.set(key, {});
    byDate.get(key)[h.assetId] = Number(h.price);
  }

  const sortedDates = [...byDate.keys()].sort();
  const lastPrice = new Map();
  const series = [];

  for (const d of sortedDates) {
    const day = byDate.get(d);
    for (const aid of Object.keys(day)) {
      lastPrice.set(Number(aid), day[aid]);
    }
    let total = 0;
    for (const p of positions) {
      const pr = lastPrice.get(p.assetId);
      if (pr != null) total += toNum(p.totalQuantity) * pr;
    }
    series.push({ date: d, value: Number(total.toFixed(2)) });
  }

  const investedBaseline = positions.reduce(
    (sum, p) => sum + toNum(p.totalQuantity) * toNum(p.averagePurchasePrice),
    0
  );

  if (!series.length) {
    let v = 0;
    for (const p of positions) {
      v += toNum(p.totalQuantity) * toNum(p.asset.currentPrice);
    }
    const today = new Date().toISOString().slice(0, 10);
    series.push({ date: today, value: Number(v.toFixed(2)) });
  }

  /** Une seule date d'historique → courbe plate côté dashboard : ajouter un point de départ (coût d'entrée). */
  if (series.length === 1) {
    const end = series[0];
    const anchor = new Date(String(end.date) + "T12:00:00");
    anchor.setMonth(anchor.getMonth() - 6);
    const startDate = anchor.toISOString().slice(0, 10);
    return [
      { date: startDate, value: Number(investedBaseline.toFixed(2)) },
      { date: end.date, value: end.value },
    ];
  }

  return series;
}

