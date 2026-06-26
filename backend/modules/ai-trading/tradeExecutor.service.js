import crypto from "crypto";
import { Asset, Portfolio, AiTradingTransaction } from "../../models/index.js";
import * as transactionService from "../../services/transactionService.js";
import { roundMoney } from "../../services/walletService.js";
import { emitAiTradingToUser } from "../../services/aiTradingRealtime.js";
import { assertCanOpenTrade, registerRealizedLoss, tradeCooldownMs } from "./riskManager.service.js";
import { logAiTrading, logAiTradingError } from "./aiTradingLog.service.js";

function toNum(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {string} botId
 * @param {string} symbol
 * @param {"buy"|"sell"} action
 * @param {number} cooldownMs
 */
function buildIdempotencyKey(botId, symbol, action, cooldownMs) {
  const bucket = Math.floor(Date.now() / Math.max(5_000, cooldownMs));
  return crypto.createHash("sha256").update(`${botId}|${symbol}|${action}|${bucket}`).digest("hex");
}

/**
 * @param {import("sequelize").Model<any>} bot
 * @param {import("sequelize").Model<any>} rule
 * @param {"buy"|"sell"} action
 * @param {number} quantity
 * @param {number} price
 */
export async function executeAiTrade({ bot, rule, action, quantity, price }) {
  const userId = bot.userId;
  const symbol = String(rule.assetSymbol).toUpperCase();
  const qty = roundMoney(toNum(quantity));
  const px = toNum(price);
  const amountTnd = roundMoney(qty * px);

  const cooldownMs = tradeCooldownMs(bot.riskLevel);
  const idempotencyKey = buildIdempotencyKey(bot.id, symbol, action, cooldownMs);

  const existing = await AiTradingTransaction.findOne({ where: { idempotencyKey } });
  if (existing) {
    logAiTrading("executor_skip_duplicate", { botId: bot.id, symbol, action });
    return { skipped: true, reason: "duplicate_idempotency" };
  }

  if (action === "buy") {
    const risk = await assertCanOpenTrade(bot, userId, amountTnd, { cooldownMs });
    if (!risk.ok) {
      logAiTrading("executor_risk_block", { botId: bot.id, code: risk.code });
      return { skipped: true, reason: risk.code, message: risk.message };
    }
  } else {
    const risk = await assertCanOpenTrade(bot, userId, 0, { cooldownMs });
    if (!risk.ok) {
      logAiTrading("executor_risk_block_sell", { botId: bot.id, code: risk.code });
      return { skipped: true, reason: risk.code, message: risk.message };
    }
  }

  let pending;
  try {
    pending = await AiTradingTransaction.create({
      botId: bot.id,
      userId,
      assetSymbol: symbol,
      action,
      amount: amountTnd,
      price: px,
      quantity: qty,
      tradeTimestamp: new Date(),
      status: "pending",
      idempotencyKey,
    });
  } catch (e) {
    if (e?.name === "SequelizeUniqueConstraintError") {
      return { skipped: true, reason: "duplicate_idempotency" };
    }
    logAiTradingError("executor_pending_log", e, { botId: bot.id, symbol });
    return { skipped: true, reason: "log_failed" };
  }

  const asset = await Asset.findOne({ where: { ticker: symbol } });
  if (!asset) {
    pending.status = "failed";
    pending.errorMessage = "Asset not found";
    await pending.save();
    return { skipped: true, reason: "ASSET_NOT_FOUND" };
  }

  let portfolioBefore = null;
  if (action === "sell") {
    portfolioBefore = await Portfolio.findOne({ where: { userId, assetId: asset.id } });
  }

  try {
    if (action === "buy") {
      await transactionService.executeBuy({
        userId,
        assetId: asset.id,
        quantity: qty,
        priceAtExecution: px,
      });
    } else {
      await transactionService.executeSell({
        userId,
        assetId: asset.id,
        quantity: qty,
        priceAtExecution: px,
      });
    }

    pending.status = "success";
    pending.errorMessage = null;
    await pending.save();

    bot.lastTradeAt = new Date();
    await bot.save();

    if (action === "sell" && portfolioBefore) {
      const avg = toNum(portfolioBefore.averagePurchasePrice);
      const loss = roundMoney((avg - px) * qty);
      if (loss > 0) {
        const halt = await registerRealizedLoss(bot, loss);
        if (halt.halted) {
          emitAiTradingToUser(userId, "loss_limit_triggered", {
            botId: bot.id,
            dailyRealizedLossTnd: toNum(bot.dailyRealizedLossTnd),
            maxDailyLossTnd: halt.maxDailyLossTnd,
          });
        }
      }
    }

    emitAiTradingToUser(userId, "trade_executed", {
      botId: bot.id,
      transactionId: pending.id,
      assetSymbol: symbol,
      action,
      amount: amountTnd,
      price: px,
      quantity: qty,
      status: "success",
      timestamp: pending.tradeTimestamp,
    });

    return { skipped: false, transactionId: pending.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    try {
      pending.status = "failed";
      pending.errorMessage = msg.slice(0, 2000);
      await pending.save();
    } catch (e2) {
      logAiTradingError("executor_failed_update", e2, { botId: bot.id });
    }

    logAiTradingError("executor_trade_failed", e, { botId: bot.id, symbol, action });

    emitAiTradingToUser(userId, "trade_executed", {
      botId: bot.id,
      transactionId: pending.id,
      assetSymbol: symbol,
      action,
      amount: amountTnd,
      price: px,
      quantity: qty,
      status: "failed",
      error: msg,
      timestamp: pending.tradeTimestamp,
    });

    return { skipped: false, failed: true, message: msg };
  }
}
