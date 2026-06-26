import cron from "node-cron";
import config from "../config/index.js";
import { updateAllAssetPrices } from "../services/bvmtService.js";
import { logger } from "../utils/logger.js";

let task = null;

export function startPriceUpdateJob() {
  if (task) return;
  const expr = config.bvmt.cron;
  if (!cron.validate(expr)) {
    logger.warn(`Invalid BVMT cron expression "${expr}"; using default */7 * * * *`);
  }
  const schedule = cron.validate(expr) ? expr : "*/7 * * * *";
  task = cron.schedule(
    schedule,
    async () => {
      try {
        await updateAllAssetPrices();
      } catch (e) {
        logger.error(`Scheduled price update failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
      }
    },
    { timezone: process.env.CRON_TZ || "Africa/Tunis" }
  );
  logger.info(`BVMT price cron started (schedule=${schedule})`);
}

export async function runPriceUpdateOnce() {
  try {
    return await updateAllAssetPrices();
  } catch (e) {
    logger.error(`Initial price update failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
    throw e;
  }
}
