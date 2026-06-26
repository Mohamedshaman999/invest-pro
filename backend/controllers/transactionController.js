import { Transaction, Asset } from "../models/index.js";
import * as transactionService from "../services/transactionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function toNum(v) {
  return typeof v === "number" ? v : Number(v);
}

export const listTransactions = asyncHandler(async (req, res) => {
  const rows = await Transaction.findAll({
    where: { userId: req.user.id },
    include: [{ model: Asset, as: "asset", required: true }],
    order: [
      ["date", "DESC"],
      ["id", "DESC"],
    ],
  });
  res.json({
    transactions: rows.map((t) => ({
      id: String(t.id),
      assetSymbol: t.asset.ticker,
      assetName: t.asset.name,
      type: t.type === "BUY" ? "buy" : "sell",
      quantity: toNum(t.quantity),
      price: toNum(t.priceAtExecution),
      date: t.date,
      total: toNum(t.quantity) * toNum(t.priceAtExecution),
    })),
  });
});

export const buy = asyncHandler(async (req, res) => {
  await transactionService.requireVerifiedUser(req.user);
  const out = await transactionService.executeBuy({
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json(out);
});

export const sell = asyncHandler(async (req, res) => {
  await transactionService.requireVerifiedUser(req.user);
  const out = await transactionService.executeSell({
    userId: req.user.id,
    ...req.body,
  });
  res.status(201).json(out);
});
