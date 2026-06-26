import cron from "node-cron";
import config from "../config/index.js";
import { syncBourseMarketWatchOnce } from "../services/bourseMarketWatchSync.js";
import { logger } from "../utils/logger.js";

const TUNIS_TZ = "Africa/Tunis";

let task = null;

/**
 * BVMT cash session (typical): Mon–Fri, 09:00–14:30 Tunis time.
 */
export function isWithinTunisMarketWindow(date = new Date()) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TUNIS_TZ, weekday: "short" }).format(date);
  if (weekday === "Sat" || weekday === "Sun") return false;

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TUNIS_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "hour") hour = Number(p.value);
    if (p.type === "minute") minute = Number(p.value);
  }

  const mins = hour * 60 + minute;
  const start = 9 * 60;
  const end = 14 * 60 + 30;
  return mins >= start && mins <= end;
}

export function startBourseMarketWatchJob() {
  if (task) return;
  if (!config.bourseMarketWatch.runOnApiServer) {
    logger.info("Bourse Market Watch cron: disabled on API server (BOURSE_MARKET_WATCH_RUN_ON_SERVER=false)");
    return;
  }

  const expr = config.bourseMarketWatch.cron;
  if (!cron.validate(expr)) {
    logger.error(`Invalid cron expression for Market Watch: ${expr}`);
    return;
  }

  task = cron.schedule(
    expr,
    async () => {
      if (!isWithinTunisMarketWindow()) {
        return;
      }
      try {
        const r = await syncBourseMarketWatchOnce();
        logger.info(
          `Bourse Market Watch cron tick: upserted=${r.upserted ?? 0} source=${r.source ?? "?"} fetched=${r.fetched ?? "?"}`
        );
      } catch (e) {
        logger.error(`Bourse Market Watch cron error: ${e?.message || e}`);
      }
    },
    { timezone: TUNIS_TZ }
  );

  logger.info(`Bourse Market Watch cron started (${expr}, ${TUNIS_TZ}, window 09:00–14:30)`);
}

export async function runBourseMarketWatchOnceFromJob() {
  return syncBourseMarketWatchOnce();
}
