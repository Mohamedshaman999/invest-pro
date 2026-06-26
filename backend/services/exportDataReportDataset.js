import { Transaction, Asset } from "../models/index.js";
import * as portfolioService from "./portfolioService.js";

function toNum(v) {
  return typeof v === "number" ? v : Number(v);
}

function buildAllocation(assets, totalValue) {
  if (!assets.length || !totalValue) return [];
  const byCat = new Map();
  for (const a of assets) {
    const cat = a.category || "Other";
    byCat.set(cat, (byCat.get(cat) || 0) + toNum(a.lineValue));
  }
  return [...byCat.entries()].map(([category, value]) => ({
    category,
    value: Number(value.toFixed(2)),
    weightPercent: Number(((value / totalValue) * 100).toFixed(2)),
  }));
}

function downsampleSeries(series, maxPoints) {
  if (!Array.isArray(series) || series.length <= maxPoints) return series || [];
  const out = [];
  const last = series.length - 1;
  const step = last / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.min(last, Math.round(i * step));
    out.push(series[idx]);
  }
  return out;
}

function performanceSummary(series) {
  if (!series?.length) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const v0 = toNum(first.value);
  const v1 = toNum(last.value);
  if (!Number.isFinite(v0) || !Number.isFinite(v1) || v0 === 0) {
    return { startDate: first.date, endDate: last.date, startValue: v0, endValue: v1, changePercent: null };
  }
  return {
    startDate: first.date,
    endDate: last.date,
    startValue: v0,
    endValue: v1,
    changePercent: Number((((v1 - v0) / v0) * 100).toFixed(2)),
  };
}

/**
 * Agrège les données disponibles pour l’utilisateur (sans lever d’erreur si une partie manque).
 * @param {import("../models/User.js").User} user
 * @param {number} userId
 */
export async function buildExportDataset(user, userId) {
  let portfolio = null;
  try {
    portfolio = await portfolioService.getPortfolioForUser(userId, "TND");
  } catch (e) {
    portfolio = { currency: "TND", summary: { totalValue: 0, investedAmount: 0, profitLoss: 0 }, assets: [] };
  }

  let transactions = [];
  try {
    const rows = await Transaction.findAll({
      where: { userId },
      include: [{ model: Asset, as: "asset", required: true }],
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
      limit: 500,
    });
    transactions = rows.map((t) => ({
      id: String(t.id),
      type: t.type,
      assetSymbol: t.asset.ticker,
      assetName: t.asset.name,
      quantity: toNum(t.quantity),
      priceAtExecution: toNum(t.priceAtExecution),
      date: t.date,
      createdAt: t.createdAt ?? null,
      total: toNum(t.quantity) * toNum(t.priceAtExecution),
    }));
  } catch {
    transactions = [];
  }

  let performanceSeries = null;
  try {
    performanceSeries = await portfolioService.getPortfolioPerformanceSeries(userId);
  } catch {
    performanceSeries = null;
  }
  performanceSeries = downsampleSeries(performanceSeries || [], 72);

  const totalValue = toNum(portfolio?.summary?.totalValue);
  const allocation = buildAllocation(portfolio?.assets || [], totalValue);

  const diversificationHint = (() => {
    const assets = portfolio?.assets || [];
    if (!assets.length || !totalValue) return null;
    const n = assets.length;
    let hhi = 0;
    for (const a of assets) {
      const w = toNum(a.lineValue) / totalValue;
      hhi += w * w;
    }
    const minHhi = 1 / n;
    const score =
      n <= 1 ? 0 : Math.max(0, Math.min(100, Math.round(((1 - hhi) / (1 - minHhi)) * 100)));
    return { diversificationScoreHint: score, concentrationHhi: Number(hhi.toFixed(4)) };
  })();

  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: userId,
      name: user?.name || null,
      email: user?.email || null,
    },
    portfolio: {
      currency: portfolio?.currency || "TND",
      summary: portfolio?.summary || { totalValue: 0, investedAmount: 0, profitLoss: 0 },
      positions: (portfolio?.assets || []).map((a) => ({
        ticker: a.ticker,
        name: a.name,
        category: a.category,
        quantity: a.quantity,
        averagePurchasePrice: a.averagePurchasePrice,
        currentPrice: a.currentPrice,
        lineValue: a.lineValue,
        lineInvested: a.lineInvested,
        linePnL: a.linePnL,
      })),
    },
    assetAllocation: allocation,
    transactions,
    performanceSeries: performanceSeries || [],
    performanceSummary: performanceSummary(performanceSeries),
    computedHints: diversificationHint,
  };
}
