import { Transaction as SequelizeTransaction } from "sequelize";
import { sequelize, Wallet, User } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function roundMoney(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

function toNum(v) {
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Returns the wallet row for this user only, locked for update.
 * Creates a row with balance 0 if missing (idempotent, no duplicate per user_id).
 */
export async function findOrCreateWalletForUser(userId, t) {
  const row = await Wallet.findOne({
    where: { userId },
    transaction: t,
    lock: SequelizeTransaction.LOCK.UPDATE,
  });
  if (row) return row;
  try {
    return await Wallet.create({ userId, balance: 0 }, { transaction: t });
  } catch (e) {
    if (e?.name === "SequelizeUniqueConstraintError") {
      const retry = await Wallet.findOne({
        where: { userId },
        transaction: t,
        lock: SequelizeTransaction.LOCK.UPDATE,
      });
      if (retry) return retry;
    }
    throw e;
  }
}

export async function getWalletForUser(userId) {
  return sequelize.transaction(async (t) => {
    const w = await findOrCreateWalletForUser(userId, t);
    return { balance: roundMoney(toNum(w.balance)) };
  });
}

export async function depositForUser(userId, amountRaw) {
  const amount = roundMoney(toNum(amountRaw));
  if (amount <= 0 || !Number.isFinite(amount)) {
    throw new AppError("Invalid amount", 400, "INVALID_INPUT");
  }
  return sequelize.transaction(async (t) => {
    const w = await findOrCreateWalletForUser(userId, t);
    const next = roundMoney(toNum(w.balance) + amount);
    w.balance = next;
    await w.save({ transaction: t });
    return { balance: next };
  });
}

/** One-time / startup: create a wallet row for any user missing one (e.g. pre-migration accounts). */
export async function ensureWalletsForUsersWithoutOne() {
  const users = await User.findAll({
    attributes: ["id"],
    include: [{ model: Wallet, as: "wallet", required: false, attributes: ["id"] }],
  });
  for (const u of users) {
    if (u.wallet) continue;
    try {
      await Wallet.create({ userId: u.id, balance: 0 });
      logger.info(`Backfilled wallet for userId=${u.id}`);
    } catch (e) {
      if (e?.name !== "SequelizeUniqueConstraintError") {
        logger.warn(`Wallet backfill skipped for userId=${u.id}: ${e?.message || e}`);
      }
    }
  }
}

export async function withdrawForUser(userId, amountRaw) {
  const amount = roundMoney(toNum(amountRaw));
  if (amount <= 0 || !Number.isFinite(amount)) {
    throw new AppError("Invalid amount", 400, "INVALID_INPUT");
  }
  return sequelize.transaction(async (t) => {
    const w = await findOrCreateWalletForUser(userId, t);
    const bal = roundMoney(toNum(w.balance));
    if (bal + 1e-9 < amount) {
      throw new AppError("Insufficient wallet balance", 400, "INSUFFICIENT_FUNDS");
    }
    const next = roundMoney(bal - amount);
    w.balance = next;
    await w.save({ transaction: t });
    return { balance: next };
  });
}
