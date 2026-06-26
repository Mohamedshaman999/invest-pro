import bcrypt from "bcryptjs";
import config from "../config/index.js";
import { User, Wallet } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { findUserByNormalizedEmail } from "../utils/findUserByEmail.js";

function splitDemoName(name) {
  const trimmed = String(name || "").trim();
  const i = trimmed.indexOf(" ");
  if (i === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, i).trim(), lastName: trimmed.slice(i + 1).trim() };
}

/** RFC 2606 reserved domains — safe for examples and local dev. */
const DEMO_ACCOUNTS = [
  { email: "investor.demo@example.com", name: "Demo Investor", password: "Invest#demo1", role: "INVESTOR" },
  { email: "admin@example.com", name: "Demo Admin", password: "Admin#demo1", role: "INVESTOR" },
  { email: "pro.demo@example.com", name: "Demo Pro Investor", password: "Pro#demo1", role: "PRO_INVESTOR" },
];

export async function seedDemoUsersIfMissing() {
  const allowSeed = config.nodeEnv !== "production" || process.env.SEED_DEMO_USERS === "true";
  if (!allowSeed) return;

  for (const row of DEMO_ACCOUNTS) {
    const canonicalHash = await bcrypt.hash(row.password, config.bcryptRounds);
    const emailKey = String(row.email || "").trim().toLowerCase();
    let existing = await findUserByNormalizedEmail(emailKey);
    if (!existing) {
      existing = await findUserByNormalizedEmail(emailKey, { paranoid: false });
      if (existing?.deletedAt) {
        await existing.restore();
      }
    }
    if (existing) {
      const totpBlocksLogin =
        existing.twoFaEnabled === true &&
        existing.twoFaMethod === "totp" &&
        Boolean(existing.twoFaSecret);

      /** À chaque démarrage : mot de passe canonique + vérifié (évite « Invalid credentials » sur démo). */
      const patch = {
        password: canonicalHash,
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      };
      if (Object.prototype.hasOwnProperty.call(row, "role") && row.role) {
        const expMs = existing.proExpiresAt ? new Date(existing.proExpiresAt).getTime() : null;
        const hasFuturePro =
          expMs != null && Number.isFinite(expMs) && expMs > Date.now();
        /** Ne pas écraser un passage Pro réel (ex. upgrade sur compte démo) au redémarrage API. */
        if (!hasFuturePro) {
          patch.role = row.role;
          patch.isPro = row.role === "PRO_INVESTOR";
        }
      }
      if (totpBlocksLogin) {
        patch.twoFaEnabled = false;
        patch.twoFaMethod = "email";
        patch.twoFaSecret = null;
        patch.twoFaTotpFailedAttempts = 0;
        patch.twoFaTotpLockedUntil = null;
      }
      Object.assign(patch, splitDemoName(row.name));
      await existing.update(patch);
      logger.info(`Compte démo synchronisé (mot de passe / état): ${row.email}`);

      const hasWallet = await Wallet.findOne({ where: { userId: existing.id } });
      if (!hasWallet) {
        await Wallet.create({ userId: existing.id, balance: 0 });
        logger.info(`Added missing wallet for existing demo user: ${row.email}`);
      }
      continue;
    }

    const hash = canonicalHash;
    const user = await User.create({
      name: row.name,
      ...splitDemoName(row.name),
      email: row.email,
      password: hash,
      currency: "TND",
      isVerified: true,
      verificationCode: null,
      verificationCodeExpiresAt: null,
      passwordResetCode: null,
      passwordResetExpiresAt: null,
      role: row.role ?? "INVESTOR",
      isPro: row.role === "PRO_INVESTOR",
    });
    await Wallet.create({ userId: user.id, balance: 0 });
    logger.info(`Seeded demo user (development only): ${row.email}`);
  }
}
