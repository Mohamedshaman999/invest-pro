import { Asset, AssetPriceHistory, sequelize } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { absVariationMeetsThreshold } from "./priceAlertEmailNotificationService.js";

function todayUtcDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Upserts into `assets` (conflict on `ticker`) and ensures a row exists for today in `asset_price_history`.
 *
 * @param {Array<{ ticker: string, name: string, lastPrice: number, variationPct: number|null, volume: number|null, marketCap: number|null }>} rows
 */
/** Columns written on INSERT and updated again on ON CONFLICT (ticker). */
const ASSET_UPSERT_UPDATE_FIELDS = [
  "ticker",
  "name",
  "category",
  "currentPrice",
  "variationPercent",
  "lastVolume",
  "marketCap",
  "quoteUpdatedAt",
];

export async function upsertMarketWatchRows(rows) {
  if (!rows.length) {
    logger.warn("upsertMarketWatchRows: empty input");
    return { upserted: 0, alertAssetIds: [] };
  }

  const now = new Date();
  const today = todayUtcDateOnly();
  let count = 0;
  const alertAssetIds = [];

  await sequelize.transaction(async (t) => {
    for (const r of rows) {
      if (r.lastPrice == null || !Number.isFinite(r.lastPrice)) continue;

      const upsertResult = await Asset.upsert(
        {
          ticker: r.ticker,
          name: r.name,
          category: "Stock",
          currentPrice: r.lastPrice,
          variationPercent: r.variationPct,
          lastVolume: r.volume,
          marketCap: r.marketCap,
          quoteUpdatedAt: now,
        },
        {
          transaction: t,
          conflictFields: ["ticker"],
          returning: true,
          fields: ASSET_UPSERT_UPDATE_FIELDS,
        }
      );
      const asset = Array.isArray(upsertResult) ? upsertResult[0] : upsertResult;
      if (!asset?.id) {
        throw new Error(`Asset upsert did not return id for ticker=${r.ticker}`);
      }

      const [hist, histCreated] = await AssetPriceHistory.findOrCreate({
        where: { assetId: asset.id, date: today },
        defaults: { price: r.lastPrice },
        transaction: t,
      });
      if (!histCreated) {
        hist.price = r.lastPrice;
        await hist.save({ transaction: t });
      }

      if (absVariationMeetsThreshold(r.variationPct)) {
        alertAssetIds.push(asset.id);
      }

      count += 1;
    }
  });

  logger.info(`Market Watch DB sync complete, rows=${count}`);
  return { upserted: count, alertAssetIds };
}
