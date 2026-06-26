import * as assetService from "./assetService.js";

/** @typedef {{ symbol: string, price: number, change_pct: number|null, volume: number, volatility: number|null, quoteUpdatedAt: Date|string|null }} StructuredRow */

/**
 * Volatilité proxy (% échelle) depuis une courte série de prix.
 * @param {{ date?: string, price: number }[]} recentPrices
 */
export function estimateVolatilityFromPrices(recentPrices) {
  if (!recentPrices || recentPrices.length < 2) return null;
  const prices = recentPrices.map((p) => Number(p.price)).filter((x) => Number.isFinite(x) && x > 0);
  if (prices.length < 2) return null;
  const rets = [];
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1];
    const cur = prices[i];
    if (prev === 0) continue;
    rets.push((cur - prev) / prev);
  }
  if (!rets.length) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((s, r) => s + (r - mean) ** 2, 0) / rets.length;
  return Math.sqrt(variance) * 100;
}

function normMinMax(values, floorForNull = null) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) {
    return () => 0;
  }
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min || 1e-9;
  return (v) => {
    const x = Number.isFinite(v) ? v : floorForNull != null ? floorForNull : min - span;
    return (x - min) / span;
  };
}

/**
 * Score = 0.7 × Δprix norm + 0.2 × volume norm − 0.1 × pénalité volatilité norm.
 * @param {StructuredRow[]} rows
 */
export function rankMarketRows(rows) {
  if (!rows.length) return [];

  const chResolved = rows.map((r) =>
    r.change_pct != null && Number.isFinite(r.change_pct) ? r.change_pct : null
  );
  const chFloor =
    chResolved.some((v) => v != null) ? Math.min(...chResolved.filter((v) => v != null)) - 1 : -5;
  const chForNorm = chResolved.map((v) => (v != null ? v : chFloor - 0.01));
  const normCh = normMinMax(chForNorm);

  const logVol = rows.map((r) => Math.log1p(Math.max(0, Number(r.volume) || 0)));
  const normVol = normMinMax(logVol);

  const volPen = rows.map((r) => {
    if (r.volatility != null && Number.isFinite(r.volatility)) return Math.abs(r.volatility);
    if (r.change_pct != null && Number.isFinite(r.change_pct)) return Math.abs(r.change_pct);
    return 0;
  });
  const normPen = normMinMax(volPen);

  const scored = rows.map((r, i) => {
    const nc = normCh(chForNorm[i]);
    const nv = normVol(logVol[i]);
    const np = normPen(volPen[i]);
    const score = 0.7 * nc + 0.2 * nv - 0.1 * np;
    return {
      symbol: r.symbol,
      price: r.price,
      change_pct: r.change_pct,
      volume: r.volume,
      volatility: r.volatility,
      quoteUpdatedAt: r.quoteUpdatedAt,
      score,
    };
  });

  scored.sort((a, b) => b.score - a.score || String(a.symbol).localeCompare(String(b.symbol)));
  return scored.slice(0, 10);
}

function percentileRank(sortedAsc, value) {
  if (!sortedAsc.length || value == null || !Number.isFinite(value)) return 0;
  let below = 0;
  for (const x of sortedAsc) {
    if (x < value) below++;
    else break;
  }
  return sortedAsc.length <= 1 ? 0.5 : below / (sortedAsc.length - 1);
}

function bucket3(p) {
  if (p >= 0.67) return "high";
  if (p <= 0.33) return "low";
  return "mid";
}

/**
 * Libellés strictement ancrés dans les quantiles du jeu courant (pas de jargon de marché).
 * @param {"fr"|"en"} lang
 * @param {"high"|"mid"|"low"} chSeg
 * @param {"high"|"mid"|"low"} volSeg
 * @param {number} rankIndex 0-based
 * @param {number} rotation
 */
function factualRankingLine(lang, chSeg, volSeg, rankIndex, rotation) {
  const L = lang === "en" ? "en" : "fr";
  const r = rotation % 2;

  const rank =
    rankIndex === 0
      ? L === "en"
        ? ["#1 in snapshot ranking", "top line in snapshot ranking"][r]
        : ["#1 du classement (instantané)", "tête du classement sur cet instantané"][r]
      : L === "en"
        ? `#${rankIndex + 1} in snapshot ranking`
        : `#${rankIndex + 1} sur cet instantané`;

  const ch =
    L === "en"
      ? {
          high: ["session % upper third vs set", "change in top third of set"][r],
          mid: ["session % near median of set", "change near middle of set"][r],
          low: ["session % lower third vs set", "change in bottom third of set"][r],
        }
      : {
          high: ["variation % tiers supérieur du jeu", "hausse dans le tiers haut du jeu"][r],
          mid: ["variation % proche de la médiane du jeu", "changement autour de la médiane"][r],
          low: ["variation % tiers inférieur du jeu", "variation dans le tiers bas du jeu"][r],
        };

  const vol =
    L === "en"
      ? {
          high: ["volume upper third vs set", "volume top third in set"][r],
          mid: ["volume near median of set", "volume mid-range in set"][r],
          low: ["volume lower third vs set", "volume bottom third in set"][r],
        }
      : {
          high: ["volume tiers supérieur du jeu", "volume dans le tiers haut du jeu"][r],
          mid: ["volume proche de la médiane du jeu", "volume dans la zone médiane"][r],
          low: ["volume tiers inférieur du jeu", "volume dans le tiers bas du jeu"][r],
        };

  return `${rank}; ${ch[chSeg]}; ${vol[volSeg]}`;
}

function formatPct(changePct) {
  if (changePct == null || !Number.isFinite(changePct)) return "n/d";
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${Number(changePct).toFixed(1)}%`;
}

/**
 * @param {StructuredRow[]} universe rows avant top-10 (pour percentiles volume/variation)
 * @param {ReturnType<typeof rankMarketRows>} ranked
 */
export function formatRankedPerformersBlock(lang, universe, ranked, rotation = 0) {
  const L = lang === "en" ? "en" : "fr";
  const chSorted = universe.map((r) => r.change_pct).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  const volSorted = universe.map((r) => r.volume).filter((x) => Number.isFinite(x)).sort((a, b) => a - b);

  const title = L === "fr" ? "Titres les plus performants" : "Top Performing Stocks";

  const lines = [title, ""];
  ranked.forEach((r, idx) => {
    const chP = percentileRank(chSorted, r.change_pct ?? NaN);
    const vP = percentileRank(volSorted, r.volume);
    const chSeg = bucket3(Number.isFinite(chP) ? chP : 0);
    const volSeg = bucket3(Number.isFinite(vP) ? vP : 0.5);
    const tail = factualRankingLine(lang, chSeg, volSeg, idx, rotation + idx);
    lines.push(`${r.symbol} – ${formatPct(r.change_pct)} · ${tail}`);
  });
  return lines.join("\n");
}

/**
 * Assemble la grille [{ symbol, price, change_pct, volume }] depuis portefeuille, titre contextuel ou marché complet.
 * @param {{ portfolioFull: object | null, stock: object | null, stockError: { ticker: string } | null }} ctx
 */
export async function gatherStructuredMarketRows(ctx) {
  /** @type {StructuredRow[]} */
  const out = [];
  const seen = new Set();

  const pf = ctx.portfolioFull;
  if (pf?.assets?.length) {
    for (const a of pf.assets) {
      const sym = String(a.ticker || "").toUpperCase();
      if (!sym || seen.has(sym)) continue;
      seen.add(sym);
      out.push({
        symbol: sym,
        price: Number(a.currentPrice),
        change_pct: a.variationPercent != null ? Number(a.variationPercent) : null,
        volume: a.volume != null ? Number(a.volume) : 0,
        volatility: null,
        quoteUpdatedAt: a.quoteUpdatedAt ?? null,
      });
    }
  }

  if (!out.length && ctx.stock && !ctx.stockError) {
    const sym = String(ctx.stock.ticker || "").toUpperCase();
    if (sym) {
      seen.add(sym);
      const vol = estimateVolatilityFromPrices(ctx.stock.recentPrices || []);
      out.push({
        symbol: sym,
        price: Number(ctx.stock.currentPrice),
        change_pct:
          ctx.stock.variationPercentSession != null ? Number(ctx.stock.variationPercentSession) : null,
        volume: ctx.stock.volume != null ? Number(ctx.stock.volume) : 0,
        volatility: vol,
        quoteUpdatedAt: ctx.stock.quoteUpdatedAt ?? null,
      });
    }
  }

  if (!out.length) {
    try {
      const market = await assetService.listAssets();
      for (const m of market) {
        const sym = String(m.ticker || "").toUpperCase();
        if (!sym || seen.has(sym)) continue;
        seen.add(sym);
        out.push({
          symbol: sym,
          price: Number(m.currentPrice),
          change_pct: m.variationPercent != null ? Number(m.variationPercent) : null,
          volume: m.volume != null ? Number(m.volume) : 0,
          volatility: null,
          quoteUpdatedAt: m.quoteUpdatedAt ?? null,
        });
      }
    } catch {
      return [];
    }
  }

  return out;
}

/**
 * Données JSON pour le LLM (ordre ≠ classement final ; le classement autoritaire est séparé).
 */
export function structuredRowsForPrompt(rows) {
  return rows.map((r) => ({
    symbol: r.symbol,
    price: Number.isFinite(r.price) ? Number(r.price.toFixed(4)) : r.price,
    change_pct: r.change_pct,
    volume: r.volume,
  }));
}

/**
 * Bloc classement figé pour le prompt — le modèle ne doit pas réordonner.
 */
export function authoritativeRankingForPrompt(ranked) {
  return ranked.map((r, i) => ({
    rank: i + 1,
    symbol: r.symbol,
    change_pct: r.change_pct,
    volume: r.volume,
  }));
}

/**
 * Réponse déterministe (fail-safe) : reclassement moteur uniquement, pas de liste codée en dur.
 * @param {"fr"|"en"} lang
 * @param {{ portfolioFull: object | null, stock: object | null, stockError: { ticker: string } | null }} ctx
 * @param {{ rotation?: number }} [opts]
 */
export async function buildGracefulDegradationReply(lang, ctx, opts = {}) {
  const rows = await gatherStructuredMarketRows(ctx);
  if (!rows.length) return null;

  const ranked = rankMarketRows(rows);
  if (!ranked.length) return null;

  const rotation = opts.rotation ?? 0;
  return formatRankedPerformersBlock(lang, rows, ranked, rotation);
}
