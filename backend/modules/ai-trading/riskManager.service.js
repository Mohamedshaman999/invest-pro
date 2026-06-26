import { Op } from "sequelize";
import { AiTradingTransaction } from "../../models/index.js";
import { getWalletForUser, roundMoney } from "../../services/walletService.js";

function toNum(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function tradingDayKey(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: process.env.CRON_TZ || "Africa/Tunis" });
}

function dateOnlyFromModel(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

/**
 * @param {"low"|"medium"|"high"} risk
 */
function maxDailyLossFromRisk(risk, maxAllocationTnd) {
  const base = Math.max(0, toNum(maxAllocationTnd));
  const mult = risk === "low" ? 0.05 : risk === "high" ? 0.2 : 0.1;
  return roundMoney(base * mult);
}

/**
 * @param {"low"|"medium"|"high"} risk
 */
export function tradeCooldownMs(risk) {
  if (risk === "low") return 120_000;
  if (risk === "high") return 30_000;
  return 60_000;
}

/**
 * @param {import("sequelize").Model<any> & { lossResetDate?: string | null; dailyRealizedLossTnd?: unknown }} bot
 */
export async function ensureDailyLossWindow(bot) {
  const today = tradingDayKey();
  const reset = dateOnlyFromModel(bot.lossResetDate);
  if (reset !== today) {
    bot.dailyRealizedLossTnd = 0;
    bot.lossResetDate = today;
    await bot.save();
  }
}

/**
 * @param {import("sequelize").Model<any>} bot
 * @param {number} userId
 * @param {number} proposedAmountTnd
 * @param {{ cooldownMs?: number }} [opts]
 */
export async function assertCanOpenTrade(bot, userId, proposedAmountTnd, opts = {}) {
  const status = String(bot.status);
  if (status !== "active") {
    return { ok: false, code: "BOT_NOT_ACTIVE", message: "Bot is not active" };
  }

  await ensureDailyLossWindow(bot);

  const maxLoss = maxDailyLossFromRisk(bot.riskLevel, bot.maxAllocation);
  if (toNum(bot.dailyRealizedLossTnd) >= maxLoss - 1e-9) {
    return { ok: false, code: "RISK_DAILY_LOSS_LIMIT", message: "Risk limit reached" };
  }

  const cooldownMs = opts.cooldownMs ?? tradeCooldownMs(bot.riskLevel);
  if (bot.lastTradeAt) {
    const delta = Date.now() - new Date(bot.lastTradeAt).getTime();
    if (delta < cooldownMs) {
      return { ok: false, code: "RISK_COOLDOWN", message: "Execution delayed (cooldown)" };
    }
  }

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const count = await AiTradingTransaction.count({
    where: {
      botId: bot.id,
      status: "success",
      tradeTimestamp: { [Op.gte]: start },
    },
  });
  if (count >= bot.maxTransactionsPerDay) {
    return { ok: false, code: "MAX_TX_REACHED", message: "Max transactions per day reached" };
  }

  const wallet = await getWalletForUser(userId);
  const balance = roundMoney(toNum(wallet.balance));
  const amt = roundMoney(toNum(proposedAmountTnd));
  if (amt <= 0) {
    return { ok: false, code: "INVALID_AMOUNT", message: "Invalid trade size" };
  }
  if (balance + 1e-9 < amt) {
    return { ok: false, code: "INSUFFICIENT_FUNDS", message: "Insufficient wallet balance" };
  }

  const cap = roundMoney(toNum(bot.maxAllocation));
  if (cap > 0 && amt > cap + 1e-9) {
    return { ok: false, code: "MAX_ALLOCATION", message: "Exceeds max allocation per trade" };
  }

  return { ok: true, code: "OK", message: "" };
}

/**
 * Après une vente perdante, met à jour la perte cumulée du jour.
 * @param {import("sequelize").Model<any>} bot
 * @param {number} lossTnd positive number = loss
 */
export async function registerRealizedLoss(bot, lossTnd) {
  const v = Math.max(0, roundMoney(toNum(lossTnd)));
  if (v <= 0) return;
  await ensureDailyLossWindow(bot);
  bot.dailyRealizedLossTnd = roundMoney(toNum(bot.dailyRealizedLossTnd) + v);
  await bot.save();

  const maxLoss = maxDailyLossFromRisk(bot.riskLevel, bot.maxAllocation);
  if (toNum(bot.dailyRealizedLossTnd) >= maxLoss - 1e-9) {
    bot.status = "stopped";
    await bot.save();
    return { halted: true, maxDailyLossTnd: maxLoss };
  }
  return { halted: false, maxDailyLossTnd: maxLoss };
}

export { maxDailyLossFromRisk };
