import { Transaction as SequelizeTransaction } from "sequelize";
import { sequelize, Transaction, Portfolio, Asset } from "../models/index.js";
import { AppError, ForbiddenError, NotFoundError } from "../utils/errors.js";
import { notifyTransactionEmailIfEnabled } from "./transactionEmailNotificationService.js";
import { findOrCreateWalletForUser, roundMoney } from "./walletService.js";

function toNum(v) {
  return typeof v === "number" ? v : Number(v);
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

export async function executeBuy({ userId, assetId, quantity, priceAtExecution, date }) {
  const qty = toNum(quantity);
  const asset = await Asset.findByPk(assetId);
  if (!asset) throw new NotFoundError("Asset not found");
  const price =
    priceAtExecution != null && priceAtExecution !== ""
      ? toNum(priceAtExecution)
      : toNum(asset.currentPrice);
  if (qty <= 0 || price < 0 || !Number.isFinite(price)) {
    throw new AppError("Invalid quantity or price", 400, "INVALID_INPUT");
  }

  const execDate = date || todayDateOnly();
  const cost = roundMoney(qty * price);

  await sequelize.transaction(async (t) => {
    const wallet = await findOrCreateWalletForUser(userId, t);
    const balance = roundMoney(toNum(wallet.balance));
    if (balance + 1e-9 < cost) {
      throw new AppError("Insufficient wallet balance", 400, "INSUFFICIENT_FUNDS");
    }
    wallet.balance = roundMoney(balance - cost);
    await wallet.save({ transaction: t });

    await Transaction.create(
      {
        userId,
        assetId,
        type: "BUY",
        quantity: qty,
        priceAtExecution: price,
        date: execDate,
      },
      { transaction: t }
    );

    const existing = await Portfolio.findOne({
      where: { userId, assetId },
      transaction: t,
      lock: SequelizeTransaction.LOCK.UPDATE,
    });

    if (!existing) {
      await Portfolio.create(
        {
          userId,
          assetId,
          totalQuantity: qty,
          averagePurchasePrice: price,
        },
        { transaction: t }
      );
    } else {
      const oldQty = toNum(existing.totalQuantity);
      const oldAvg = toNum(existing.averagePurchasePrice);
      const newQty = oldQty + qty;
      const newAvg = (oldQty * oldAvg + qty * price) / newQty;
      existing.totalQuantity = newQty;
      existing.averagePurchasePrice = newAvg;
      await existing.save({ transaction: t });
    }
  });

  await notifyTransactionEmailIfEnabled({
    userId,
    type: "BUY",
    asset,
    quantity: qty,
    priceAtExecution: price,
    date: execDate,
  });

  return { message: "Buy executed", assetId, quantity: qty, priceAtExecution: price };
}

export async function executeSell({ userId, assetId, quantity, priceAtExecution, date }) {
  const qty = toNum(quantity);
  const asset = await Asset.findByPk(assetId);
  if (!asset) throw new NotFoundError("Asset not found");
  const price =
    priceAtExecution != null && priceAtExecution !== ""
      ? toNum(priceAtExecution)
      : toNum(asset.currentPrice);
  if (qty <= 0 || price < 0 || !Number.isFinite(price)) {
    throw new AppError("Invalid quantity or price", 400, "INVALID_INPUT");
  }

  const execDate = date || todayDateOnly();

  await sequelize.transaction(async (t) => {
    const existing = await Portfolio.findOne({
      where: { userId, assetId },
      transaction: t,
      lock: SequelizeTransaction.LOCK.UPDATE,
    });
    if (!existing) throw new AppError("No position to sell", 400, "NO_POSITION");

    const owned = toNum(existing.totalQuantity);
    if (owned < qty) {
      throw new AppError("Cannot sell more than owned", 400, "INSUFFICIENT_QUANTITY");
    }

    await Transaction.create(
      {
        userId,
        assetId,
        type: "SELL",
        quantity: qty,
        priceAtExecution: price,
        date: execDate,
      },
      { transaction: t }
    );

    const proceeds = roundMoney(qty * price);
    const wallet = await findOrCreateWalletForUser(userId, t);
    wallet.balance = roundMoney(toNum(wallet.balance) + proceeds);
    await wallet.save({ transaction: t });

    const remaining = owned - qty;
    if (remaining === 0) {
      await existing.destroy({ transaction: t });
    } else {
      existing.totalQuantity = remaining;
      await existing.save({ transaction: t });
    }
  });

  await notifyTransactionEmailIfEnabled({
    userId,
    type: "SELL",
    asset,
    quantity: qty,
    priceAtExecution: price,
    date: execDate,
  });

  return { message: "Sell executed", assetId, quantity: qty, priceAtExecution: price };
}

export async function requireVerifiedUser(user) {
  if (!user.isVerified) {
    throw new ForbiddenError("Verify your email before trading");
  }
}
