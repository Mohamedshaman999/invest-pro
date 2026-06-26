import Joi from "joi";

const ruleSchema = Joi.object({
  assetSymbol: Joi.string().trim().min(1).max(32).required(),
  buyConditionType: Joi.string().valid("percentage", "price", "ai_signal").required(),
  buyThreshold: Joi.number().required(),
  sellConditionType: Joi.string().valid("percentage", "price", "ai_signal").required(),
  sellThreshold: Joi.number().required(),
  stopLossPercent: Joi.number().min(0).max(100).required(),
  takeProfitPercent: Joi.number().min(0).max(500).required(),
  useAiBuySignal: Joi.boolean().optional(),
  useAiExit: Joi.boolean().optional(),
});

export const createAiTradingBotSchema = Joi.object({
  name: Joi.string().trim().min(1).max(128).required(),
  mode: Joi.string().valid("manual_strategy", "ai_strategy").required(),
  maxTransactionsPerDay: Joi.number().integer().min(1).max(500).required(),
  maxAllocation: Joi.number().positive().max(1_000_000_000).required(),
  riskLevel: Joi.string().valid("low", "medium", "high").required(),
  rules: Joi.array().items(ruleSchema).min(1).max(50).required(),
});

export const patchAiTradingBotStatusSchema = Joi.object({
  status: Joi.string().valid("active", "paused", "stopped").required(),
});
