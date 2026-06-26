/**
 * @typedef {{ action: "BUY" | "SELL" | "HOLD"; confidence: number; reason?: string }} EngineSignal
 */

/**
 * @param {"low"|"medium"|"high"} riskLevel
 */
function riskLevelFactor(riskLevel) {
  if (riskLevel === "low") return -0.15;
  if (riskLevel === "high") return 0.15;
  return 0;
}

/**
 * Mode ai_strategy — score pondéré (spec).
 * @param {import("../../models/AiTradingBot.js").AiTradingBot | { riskLevel?: string }} bot
 * @param {{
 *   momentum: number;
 *   volatility: number;
 *   recentPerformance: number;
 *   trendDirection: string;
 * }} md
 * @returns {EngineSignal}
 */
export function evaluateAiStrategySignal(bot, md) {
  const risk = /** @type {"low"|"medium"|"high"} */ (
    ["low", "medium", "high"].includes(bot.riskLevel) ? bot.riskLevel : "medium"
  );
  const trendScore = md.trendDirection === "up" ? 0.6 : md.trendDirection === "down" ? -0.6 : 0;
  const momentumScore = Math.max(-1, Math.min(1, md.momentum * 8));
  const trendMomentum = (trendScore + momentumScore) / 2;
  const volPenalty = Math.max(-1, Math.min(1, -md.volatility * 40));
  const perf = Math.max(-1, Math.min(1, md.recentPerformance * 5));
  const riskAdj = riskLevelFactor(risk);

  const score =
    trendMomentum * 0.4 + volPenalty * 0.2 + perf * 0.2 + riskAdj * 0.2;

  const confidence = Math.min(1, Math.max(0, Math.abs(score)));

  if (score > 0.12) return { action: "BUY", confidence, reason: "ai_weighted_score_buy" };
  if (score < -0.12) return { action: "SELL", confidence, reason: "ai_weighted_score_sell" };
  return { action: "HOLD", confidence, reason: "ai_weighted_score_hold" };
}

/**
 * @param {import("../../models/AiTradingBot.js").AiTradingBot} bot
 * @param {import("../../models/AiTradingRule.js").AiTradingRule} rule
 * @param {{
 *   ok: boolean;
 *   price: number;
 *   variationPercent: number;
 *   momentum: number;
 *   volatility: number;
 *   trendDirection: string;
 *   recentPerformance: number;
 * }} md
 * @param {{ quantity: number; averagePurchasePrice: number } | null} position
 */
export function evaluateManualStrategy(bot, rule, md, position) {
  if (!md.ok || !Number.isFinite(md.price) || md.price <= 0) {
    return { action: "HOLD", confidence: 0, reason: "no_market" };
  }

  let buyHit = false;
  if (rule.buyConditionType === "percentage") {
    buyHit = md.variationPercent <= -Math.abs(rule.buyThreshold);
  } else if (rule.buyConditionType === "price") {
    buyHit = md.price <= rule.buyThreshold;
  } else if (rule.buyConditionType === "ai_signal") {
    buyHit = true;
  }

  if (rule.useAiBuySignal && bot.mode === "manual_strategy") {
    const sub = evaluateAiStrategySignal(bot, md);
    if (sub.action === "BUY" && sub.confidence >= 0.35) buyHit = true;
  }

  let sellHit = false;
  if (position && position.quantity > 0) {
    const avg = position.averagePurchasePrice;
    if (avg > 0) {
      const pnlPct = ((md.price - avg) / avg) * 100;
      if (rule.takeProfitPercent > 0 && pnlPct >= rule.takeProfitPercent) sellHit = true;
      if (rule.stopLossPercent > 0 && pnlPct <= -Math.abs(rule.stopLossPercent)) sellHit = true;
    }
    if (rule.sellConditionType === "percentage" && rule.sellThreshold > 0 && avg > 0) {
      const pnlPct = ((md.price - avg) / avg) * 100;
      if (pnlPct >= rule.sellThreshold) sellHit = true;
    } else if (rule.sellConditionType === "price" && md.price >= rule.sellThreshold) {
      sellHit = true;
    } else if (rule.sellConditionType === "ai_signal") {
      sellHit = false;
    }
    if (rule.useAiExit) {
      const sub = evaluateAiStrategySignal(bot, md);
      if (sub.action === "SELL" && sub.confidence >= 0.35) sellHit = true;
    }
  }

  if (sellHit) return { action: "SELL", confidence: 0.75, reason: "manual_exit_rules" };
  if (buyHit && (!position || position.quantity <= 0)) {
    return { action: "BUY", confidence: 0.65, reason: "manual_entry_rules" };
  }
  return { action: "HOLD", confidence: 0.2, reason: "manual_hold" };
}

/**
 * @param {import("../../models/AiTradingBot.js").AiTradingBot} bot
 * @param {import("../../models/AiTradingRule.js").AiTradingRule} rule
 * @param {Awaited<ReturnType<typeof import("./marketDataConsumer.service.js").fetchMarketSnapshot>>} md
 * @param {{ quantity: number; averagePurchasePrice: number } | null} position
 * @returns {EngineSignal}
 */
export function decideTradeAction(bot, rule, md, position) {
  if (!md.ok) {
    return { action: "HOLD", confidence: 0, reason: md.error || "market_unavailable" };
  }

  if (bot.mode === "ai_strategy") {
    const ai = evaluateAiStrategySignal(bot, md);
    if (ai.action === "BUY" && position && position.quantity > 0) {
      return { action: "HOLD", confidence: ai.confidence, reason: "already_in_position" };
    }
    if (ai.action === "SELL" && (!position || position.quantity <= 0)) {
      return { action: "HOLD", confidence: ai.confidence, reason: "no_position_to_exit" };
    }
    if (rule.stopLossPercent > 0 || rule.takeProfitPercent > 0) {
      const guard = evaluateManualStrategy(bot, rule, md, position);
      if (guard.action === "SELL") return guard;
    }
    return ai;
  }

  return evaluateManualStrategy(bot, rule, md, position);
}
