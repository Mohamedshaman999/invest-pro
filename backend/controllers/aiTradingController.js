import { AiTradingBot, AiTradingRule, AiTradingTransaction } from "../models/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import * as transactionService from "../services/transactionService.js";
import { emitAiTradingToUser } from "../services/aiTradingRealtime.js";

function toNum(v) {
  return typeof v === "number" ? v : Number(v);
}

export const listBots = asyncHandler(async (req, res) => {
  await transactionService.requireVerifiedUser(req.user);
  const rows = await AiTradingBot.findAll({
    where: { userId: req.user.id },
    include: [{ model: AiTradingRule, as: "rules" }],
    order: [["created_at", "DESC"]],
  });
  res.json({
    bots: rows.map((b) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      mode: b.mode,
      maxTransactionsPerDay: b.maxTransactionsPerDay,
      maxAllocation: toNum(b.maxAllocation),
      riskLevel: b.riskLevel,
      dailyRealizedLossTnd: toNum(b.dailyRealizedLossTnd),
      createdAt: b.createdAt,
      rules: (b.rules || []).map((r) => ({
        id: r.id,
        assetSymbol: r.assetSymbol,
        buyConditionType: r.buyConditionType,
        buyThreshold: r.buyThreshold,
        sellConditionType: r.sellConditionType,
        sellThreshold: r.sellThreshold,
        stopLossPercent: r.stopLossPercent,
        takeProfitPercent: r.takeProfitPercent,
        useAiBuySignal: r.useAiBuySignal,
        useAiExit: r.useAiExit,
      })),
    })),
  });
});

export const createBot = asyncHandler(async (req, res) => {
  await transactionService.requireVerifiedUser(req.user);
  const { name, mode, maxTransactionsPerDay, maxAllocation, riskLevel, rules } = req.body;

  const bot = await AiTradingBot.create({
    userId: req.user.id,
    name,
    status: "stopped",
    mode,
    maxTransactionsPerDay,
    maxAllocation,
    riskLevel,
  });

  for (const r of rules) {
    await AiTradingRule.create({
      botId: bot.id,
      assetSymbol: String(r.assetSymbol).trim().toUpperCase(),
      buyConditionType: r.buyConditionType,
      buyThreshold: r.buyThreshold,
      sellConditionType: r.sellConditionType,
      sellThreshold: r.sellThreshold,
      stopLossPercent: r.stopLossPercent,
      takeProfitPercent: r.takeProfitPercent,
      useAiBuySignal: Boolean(r.useAiBuySignal),
      useAiExit: Boolean(r.useAiExit),
    });
  }

  const full = await AiTradingBot.findByPk(bot.id, {
    include: [{ model: AiTradingRule, as: "rules" }],
  });

  res.status(201).json({ bot: full });
});

export const patchBotStatus = asyncHandler(async (req, res) => {
  await transactionService.requireVerifiedUser(req.user);
  const { id } = req.params;
  const { status } = req.body;

  const bot = await AiTradingBot.findOne({ where: { id, userId: req.user.id } });
  if (!bot) {
    return res.status(404).json({ message: "Bot not found", code: "NOT_FOUND" });
  }

  const prev = bot.status;
  bot.status = status;
  await bot.save();

  if (status === "active" && prev !== "active") {
    emitAiTradingToUser(req.user.id, "bot_started", { botId: bot.id, name: bot.name });
  } else if (status === "paused") {
    emitAiTradingToUser(req.user.id, "bot_paused", { botId: bot.id, name: bot.name });
  }

  res.json({ id: bot.id, status: bot.status });
});

export const listBotTransactions = asyncHandler(async (req, res) => {
  await transactionService.requireVerifiedUser(req.user);
  const { id } = req.params;
  const bot = await AiTradingBot.findOne({ where: { id, userId: req.user.id } });
  if (!bot) {
    return res.status(404).json({ message: "Bot not found", code: "NOT_FOUND" });
  }

  const rows = await AiTradingTransaction.findAll({
    where: { botId: id },
    order: [["trade_timestamp", "DESC"]],
    limit: 200,
  });

  res.json({
    transactions: rows.map((t) => ({
      id: t.id,
      assetSymbol: t.assetSymbol,
      action: t.action,
      amount: toNum(t.amount),
      price: toNum(t.price),
      quantity: toNum(t.quantity),
      status: t.status,
      timestamp: t.tradeTimestamp,
      errorMessage: t.errorMessage,
    })),
  });
});
