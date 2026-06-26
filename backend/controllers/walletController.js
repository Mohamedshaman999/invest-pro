import * as walletService from "../services/walletService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { UnauthorizedError } from "../utils/errors.js";

function requireUserId(req) {
  const id = req.user?.id;
  if (id == null || !Number.isFinite(Number(id))) {
    throw new UnauthorizedError("Authenticated user required");
  }
  return Number(id);
}

export const getWallet = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { balance } = await walletService.getWalletForUser(userId);
  res.json({
    balance,
    currency: String(req.user.currency || "TND"),
  });
});

export const getBalance = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { balance } = await walletService.getWalletForUser(userId);
  res.json({ balance });
});

export const deposit = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { balance } = await walletService.depositForUser(userId, req.body.amount);
  res.status(201).json({ balance, message: "Deposit recorded" });
});

export const withdraw = asyncHandler(async (req, res) => {
  const userId = requireUserId(req);
  const { balance } = await walletService.withdrawForUser(userId, req.body.amount);
  res.json({ balance, message: "Withdrawal recorded" });
});
