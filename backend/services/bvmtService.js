import axios from "axios";
import * as cheerio from "cheerio";
import { Op } from "sequelize";
import config from "../config/index.js";
import { Asset, AssetPriceHistory, sequelize } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { syncBourseMarketWatchOnce } from "./bourseMarketWatchSync.js";
import {
  absVariationMeetsThreshold,
  notifyUsersOfPortfolioPriceAlertsForAssetIds,
} from "./priceAlertEmailNotificationService.js";

const DEFAULT_MOCK = [
  { ticker: "BIAT", name: "Banque Internationale Arabe de Tunisie", category: "Stock", price: 12.45 },
  { ticker: "UIB", name: "Union Internationale de Banques", category: "Stock", price: 8.2 },
  { ticker: "STB", name: "Société Tunisienne de Banque", category: "Stock", price: 5.75 },
  { ticker: "ATL", name: "Arab Tunisian Lease", category: "Stock", price: 3.1 },
  { ticker: "SFBT", name: "Société Française de Banque en Tunisie", category: "Stock", price: 15.9 },
  { ticker: "BH", name: "Banque de l'Habitat", category: "Stock", price: 4.35 },
  { ticker: "LNDT", name: "Land'Or de Tunisie", category: "Stock", price: 6.8 },
];

function parseEnvMock() {
  const raw = process.env.BVMT_MOCK_JSON;
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return arr
      .filter((x) => x && x.ticker && x.price != null)
      .map((x) => ({
        ticker: String(x.ticker).toUpperCase().trim(),
        name: String(x.name || x.ticker).trim(),
        category: String(x.category || "Stock"),
        price: Number(x.price),
      }));
  } catch {
    return null;
  }
}

function baseMockQuotes() {
  return parseEnvMock() || DEFAULT_MOCK;
}

/**
 * Attempts to extract ticker → price from BVMT-style HTML tables.
 * Structure varies; failures fall back to mock data.
 */
export function parseQuotesFromHtml(html) {
  const $ = cheerio.load(html);
  const out = new Map();

  $("table tr").each((_, tr) => {
    const cells = $(tr).find("td, th").toArray().map((c) => $(c).text().replace(/\s+/g, " ").trim());
    if (cells.length < 2) return;
    for (let i = 0; i < cells.length - 1; i++) {
      const a = cells[i];
      const b = cells[i + 1];
      if (/^[A-Z]{2,6}$/.test(a) && /^[\d.,]+$/.test(b)) {
        const price = Number(b.replace(/\s/g, "").replace(",", "."));
        if (Number.isFinite(price) && price > 0) out.set(a, price);
      }
    }
  });

  $("[data-symbol], [data-ticker]").each((_, el) => {
    const sym = ($(el).attr("data-symbol") || $(el).attr("data-ticker") || "").toUpperCase();
    const txt = $(el).text();
    const m = txt.match(/[\d]+[.,][\d]+/);
    if (/^[A-Z]{2,6}$/.test(sym) && m) {
      const price = Number(m[0].replace(",", "."));
      if (Number.isFinite(price) && price > 0) out.set(sym, price);
    }
  });

  return out;
}

export async function fetchScrapedQuotes() {
  const url = config.bvmt.scrapeUrl;
  try {
    const { data, status } = await axios.get(url, {
      timeout: config.bvmt.requestTimeoutMs,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      validateStatus: () => true,
    });
    if (status !== 200 || typeof data !== "string") {
      logger.warn(`BVMT scrape: non-200 or unexpected body (status=${status})`);
      return new Map();
    }
    const parsed = parseQuotesFromHtml(data);
    if (parsed.size === 0) {
      logger.warn("BVMT scrape: no quotes parsed from HTML");
    }
    return parsed;
  } catch (e) {
    logger.warn(`BVMT scrape failed: ${e?.message || e}`);
    return new Map();
  }
}

export function mergeQuotes(scrapedMap, mockList) {
  const merged = new Map();
  for (const m of mockList) {
    merged.set(m.ticker, { ...m });
  }
  for (const [ticker, price] of scrapedMap.entries()) {
    const upper = ticker.toUpperCase();
    const existing = merged.get(upper);
    if (existing) {
      existing.price = price;
      existing.source = "scrape";
    } else {
      merged.set(upper, {
        ticker: upper,
        name: upper,
        category: "Stock",
        price,
        source: "scrape",
      });
    }
  }
  return [...merged.values()];
}

export async function seedAssetsIfEmpty() {
  const count = await Asset.count();
  if (count > 0) return;
  const mock = baseMockQuotes();
  await Asset.bulkCreate(
    mock.map((m) => ({
      ticker: m.ticker,
      name: m.name,
      category: m.category,
      currentPrice: m.price,
    })),
    { ignoreDuplicates: true }
  );
  logger.info("Seeded default BVMT mock assets");
}

function todayUtcDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export async function updateAllAssetPrices() {
  const mock = baseMockQuotes();
  const scraped = await fetchScrapedQuotes();
  const quotes = mergeQuotes(scraped, mock);
  const today = todayUtcDateOnly();
  const alertAssetIds = [];

  await sequelize.transaction(async (t) => {
    for (const q of quotes) {
      const [asset, created] = await Asset.findOrCreate({
        where: { ticker: q.ticker },
        defaults: {
          ticker: q.ticker,
          name: q.name,
          category: q.category,
          currentPrice: q.price,
        },
        transaction: t,
      });
      if (!created) {
        asset.name = q.name || asset.name;
        asset.category = q.category || asset.category;
        asset.currentPrice = q.price;
      }
      const [hist, histCreated] = await AssetPriceHistory.findOrCreate({
        where: { assetId: asset.id, date: today },
        defaults: { price: q.price },
        transaction: t,
      });
      if (!histCreated) {
        hist.price = q.price;
        await hist.save({ transaction: t });
      }

      const prior = await AssetPriceHistory.findOne({
        where: { assetId: asset.id, date: { [Op.lt]: today } },
        order: [["date", "DESC"]],
        transaction: t,
      });
      const nowP = Number(q.price);
      if (prior != null && Number(prior.price) > 0 && Number.isFinite(nowP)) {
        const prevP = Number(prior.price);
        asset.variationPercent = Number((((nowP - prevP) / prevP) * 100).toFixed(4));
      }
      asset.quoteUpdatedAt = new Date();
      await asset.save({ transaction: t });
      if (absVariationMeetsThreshold(asset.variationPercent)) {
        alertAssetIds.push(asset.id);
      }
    }
  });

  await notifyUsersOfPortfolioPriceAlertsForAssetIds(alertAssetIds);

  let marketWatchUpserted = 0;
  try {
    const r = await syncBourseMarketWatchOnce();
    marketWatchUpserted = r.upserted ?? 0;
  } catch (e) {
    logger.warn(`Market Watch enrich after BVMT scrape skipped: ${e?.message || e}`);
  }

  logger.info(
    `Asset prices refreshed (BVMT job), count=${quotes.length}, marketWatchUpserted=${marketWatchUpserted}`
  );
  return quotes.length;
}

export function buildSyntheticHistory(currentPrice, days = 30) {
  const end = new Date();
  const target = Number(currentPrice) || 1;
  const out = [];
  let p = target * (0.9 + Math.random() * 0.08);
  for (let i = 0; i < days - 1; i++) {
    const d = new Date(end);
    d.setDate(d.getDate() - (days - 1 - i));
    p = Math.max(0.01, p * (1 + (Math.random() - 0.48) * 0.025));
    out.push({ date: d.toISOString().slice(0, 10), price: Number(p.toFixed(4)) });
  }
  out.push({ date: end.toISOString().slice(0, 10), price: Number(target.toFixed(4)) });
  return out;
}
