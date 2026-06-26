#!/usr/bin/env node
/**
 * One-shot Market Watch sync (bourse.tn REST → PostgreSQL).
 * Run via: npm run market-watch:sync
 */
import "dotenv/config";
import { connectDatabase } from "../config/database.js";
import "../models/index.js";
import { sequelize } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { syncBourseMarketWatchOnce } from "../services/bourseMarketWatchSync.js";

async function main() {
  await connectDatabase();

  const result = await syncBourseMarketWatchOnce();
  logger.info(`Market Watch sync finished: ${JSON.stringify(result)}`);
  await sequelize.close();
  process.exit(0);
}

main().catch(async (e) => {
  logger.error(`runMarketWatchSync: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
  try {
    await sequelize.close();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
