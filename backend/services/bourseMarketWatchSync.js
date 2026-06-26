import { fetchMarketWatchRows } from "./bourseMarketWatchClient.js";
import { upsertMarketWatchRows } from "./bourseMarketWatchDb.js";
import { logger } from "../utils/logger.js";
import { notifyUsersOfPortfolioPriceAlertsForAssetIds } from "./priceAlertEmailNotificationService.js";

/**
 * Fetches Tunis Market Watch data and persists it. Swallows scrape/parse errors so callers can log once.
 */
export async function syncBourseMarketWatchOnce() {
  try {
    const { rows, source } = await fetchMarketWatchRows();
    if (!rows.length) {
      logger.warn(`Bourse Market Watch sync: no rows (source=${source})`);
      return { upserted: 0, source };
    }
    const { upserted, alertAssetIds } = await upsertMarketWatchRows(rows);
    await notifyUsersOfPortfolioPriceAlertsForAssetIds(alertAssetIds || []);
    return { upserted, source, fetched: rows.length };
  } catch (e) {
    logger.error(
      `Bourse Market Watch sync failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`
    );
    throw e;
  }
}
