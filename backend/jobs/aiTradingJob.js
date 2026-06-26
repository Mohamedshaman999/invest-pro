import cron from "node-cron";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";
import { runAiTradingOrchestratorTick } from "../modules/ai-trading/aiTradingOrchestrator.service.js";

let task = null;

export function startAiTradingJob() {
  if (!config.aiTrading.enabled) {
    logger.info("AI trading cron disabled (AI_TRADING_ENABLED=false)");
    return;
  }
  if (task) return;
  const expr = config.aiTrading.cron;
  if (!cron.validate(expr)) {
    logger.warn(`Invalid AI trading cron "${expr}"; using */1 * * * *`);
  }
  const schedule = cron.validate(expr) ? expr : "*/1 * * * *";
  task = cron.schedule(
    schedule,
    async () => {
      try {
        await runAiTradingOrchestratorTick();
      } catch (e) {
        logger.error(`AI trading tick failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
      }
    },
    { timezone: process.env.CRON_TZ || "Africa/Tunis" }
  );
  logger.info(`AI trading cron started (schedule=${schedule})`);
}
