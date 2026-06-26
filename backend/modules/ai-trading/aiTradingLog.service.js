import { logger } from "../../utils/logger.js";

/**
 * @param {string} scope
 * @param {Record<string, unknown>} meta
 */
export function logAiTrading(scope, meta = {}) {
  try {
    logger.info(`[ai-trading:${scope}] ${JSON.stringify(meta)}`);
  } catch {
    logger.info(`[ai-trading:${scope}] (meta serialization failed)`);
  }
}

/**
 * @param {string} scope
 * @param {Error | unknown} err
 * @param {Record<string, unknown>} [meta]
 */
export function logAiTradingError(scope, err, meta = {}) {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : "";
  logger.error(`[ai-trading:${scope}] ${msg} ${JSON.stringify(meta)}${stack ? `\n${stack}` : ""}`);
}
