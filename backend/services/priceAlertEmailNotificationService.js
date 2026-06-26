import { UniqueConstraintError } from "sequelize";
import config from "../config/index.js";
import { Asset, Portfolio, PriceAlertEmailLog, User } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { sendPriceVariationPortfolioAlertEmail } from "./emailService.js";

function todayUtcDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export function absVariationMeetsThreshold(variationPercent) {
  const v = variationPercent;
  if (v == null || !Number.isFinite(Number(v))) return false;
  const min = Number(config.priceAlerts?.minAbsVariationPct);
  const threshold = Number.isFinite(min) && min > 0 ? min : 5;
  return Math.abs(Number(v)) >= threshold;
}

function variationMeetsThreshold(asset) {
  return absVariationMeetsThreshold(asset?.variationPercent);
}

/**
 * For each asset id, email users who hold it in portfolio, opted into price alert emails,
 * and have not yet received an alert for this asset on the current UTC day.
 */
export async function notifyUsersOfPortfolioPriceAlertsForAssetIds(assetIds) {
  const ids = [...new Set((assetIds || []).map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0))];
  if (!ids.length) return;

  const alertDate = todayUtcDateOnly();

  for (const assetId of ids) {
    const asset = await Asset.findByPk(assetId);
    if (!asset || !variationMeetsThreshold(asset)) continue;

    const rows = await Portfolio.findAll({
      where: { assetId },
      include: [{ model: User, as: "user", required: true, attributes: ["id", "email", "name", "notifyPriceAlertEmail"] }],
    });

    const variationPct = Number(asset.variationPercent);
    const ticker = String(asset.ticker ?? "");
    const assetName = String(asset.name ?? ticker);

    for (const row of rows) {
      const u = row.user;
      if (!u?.email || u.notifyPriceAlertEmail === false) continue;

      try {
        await PriceAlertEmailLog.create({
          userId: u.id,
          assetId: asset.id,
          alertDate,
        });
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          continue;
        }
        logger.warn(`price alert log create failed userId=${u.id} assetId=${asset.id}: ${e?.message || e}`);
        continue;
      }

      try {
        await sendPriceVariationPortfolioAlertEmail({
          to: u.email,
          name: u.name,
          ticker,
          assetName,
          variationPercent: variationPct,
          currentPrice: Number(asset.currentPrice),
        });
      } catch (e) {
        logger.warn(`price alert email failed userId=${u.id} assetId=${asset.id}: ${e?.message || e}`);
      }
    }
  }
}
