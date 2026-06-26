import { AiTradingBot, AiTradingRule, Portfolio, Asset, User } from "../../models/index.js";
import { userHasProInvestorAccess } from "../../utils/investorTier.js";
import { fetchMarketSnapshot } from "./marketDataConsumer.service.js";
import { decideTradeAction } from "./aiTradingEngine.service.js";
import { executeAiTrade } from "./tradeExecutor.service.js";
import { logAiTradingError } from "./aiTradingLog.service.js";
import { roundMoney } from "../../services/walletService.js";

function toNum(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {import("sequelize").Model<any>} bot
 * @param {import("sequelize").Model<any>} rule
 * @param {number} price
 */
function computeBuyQuantity(bot, price) {
  const cap = roundMoney(toNum(bot.maxAllocation));
  const px = toNum(price);
  if (px <= 0 || cap <= 0) return 0;
  const raw = cap / px;
  return Math.max(0, Math.floor(raw * 10000) / 10000);
}

/**
 * @param {import("sequelize").Model<any>} bot
 * @param {import("sequelize").Model<any>} rule
 * @param {number} price
 * @param {number} ownedQty
 */
function computeSellQuantity(bot, rule, price, ownedQty) {
  const owned = roundMoney(toNum(ownedQty));
  if (owned <= 0) return 0;
  const cap = roundMoney(toNum(bot.maxAllocation));
  const px = toNum(price);
  if (px <= 0) return 0;
  const maxByCap = cap > 0 ? Math.floor((cap / px) * 10000) / 10000 : owned;
  return Math.min(owned, maxByCap > 0 ? maxByCap : owned);
}

/**
 * @param {import("sequelize").Model<any>} bot
 * @param {import("sequelize").Model<any>} rule
 * @param {{ quantity: number; averagePurchasePrice: number } | null} position
 */
async function processRule(bot, rule, position) {
  const md = await fetchMarketSnapshot(rule.assetSymbol);
  const decision = decideTradeAction(bot, rule, md, position);

  if (decision.action === "HOLD" || !md.ok) return;

  if (decision.action === "BUY") {
    const qty = computeBuyQuantity(bot, md.price);
    if (qty <= 0) return;
    await executeAiTrade({
      bot,
      rule,
      action: "buy",
      quantity: qty,
      price: md.price,
    });
    return;
  }

  if (decision.action === "SELL" && position && position.quantity > 0) {
    const qty = computeSellQuantity(bot, rule, md.price, position.quantity);
    if (qty <= 0) return;
    await executeAiTrade({
      bot,
      rule,
      action: "sell",
      quantity: qty,
      price: md.price,
    });
  }
}

/**
 * Un tick global : traite tous les bots actifs (erreurs isolées par bot).
 */
export async function runAiTradingOrchestratorTick() {
  let bots = [];
  try {
    bots = await AiTradingBot.findAll({
      where: { status: "active" },
      include: [{ model: AiTradingRule, as: "rules" }],
    });
  } catch (e) {
    logAiTradingError("orchestrator_load_bots", e, {});
    return;
  }

  let ownersById = new Map();
  try {
    const ids = [...new Set(bots.map((b) => b.userId).filter((id) => id != null))];
    if (ids.length > 0) {
      const owners = await User.findAll({ where: { id: ids } });
      ownersById = new Map(owners.map((u) => [u.id, u]));
    }
  } catch (e) {
    logAiTradingError("orchestrator_load_users", e, {});
    return;
  }

  for (const bot of bots) {
    const owner = ownersById.get(bot.userId);
    if (!userHasProInvestorAccess(owner)) {
      continue;
    }
    try {
      const rules = bot.rules || [];
      for (const rule of rules) {
        let position = null;
        try {
          const asset = await Asset.findOne({ where: { ticker: String(rule.assetSymbol).toUpperCase() } });
          if (asset) {
            const row = await Portfolio.findOne({ where: { userId: bot.userId, assetId: asset.id } });
            if (row) {
              position = {
                quantity: toNum(row.totalQuantity),
                averagePurchasePrice: toNum(row.averagePurchasePrice),
              };
            }
          }
        } catch (e) {
          logAiTradingError("orchestrator_portfolio", e, { botId: bot.id });
        }
        try {
          await processRule(bot, rule, position);
          await bot.reload();
          if (bot.status !== "active") break;
        } catch (e) {
          logAiTradingError("orchestrator_rule", e, { botId: bot.id, ruleId: rule.id });
        }
      }
    } catch (e) {
      logAiTradingError("orchestrator_bot", e, { botId: bot.id });
    }
  }
}
