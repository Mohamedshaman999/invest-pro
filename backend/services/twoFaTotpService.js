import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import config from "../config/index.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";
import { ensureJwtSecretsConfigured } from "../utils/jwtSecrets.js";
import { logger } from "../utils/logger.js";

const SETUP_TOKEN_EXP = "10m";
const LOGIN_CHALLENGE_EXP = "5m";
const MAX_TOTP_FAILURES = 5;
const TOTP_LOCKOUT_MS = 7 * 60 * 1000;

const SETUP_TYP = "2fa_totp_setup";
const LOGIN_TYP = "2fa_login_challenge";

function issuerName() {
  return process.env.TOTP_ISSUER_NAME || "InvestPro";
}

export function totpLockoutMs() {
  return TOTP_LOCKOUT_MS;
}

export function maxTotpFailures() {
  return MAX_TOTP_FAILURES;
}

export async function clearExpiredTotpLockIfAny(user) {
  if (user.twoFaTotpLockedUntil && new Date(user.twoFaTotpLockedUntil) <= new Date()) {
    user.twoFaTotpLockedUntil = null;
    user.twoFaTotpFailedAttempts = 0;
    await user.save();
  }
}

export async function ensureTotpNotLocked(user) {
  await clearExpiredTotpLockIfAny(user);
  const until = user.twoFaTotpLockedUntil ? new Date(user.twoFaTotpLockedUntil) : null;
  if (until && until > new Date()) {
    throw new AppError("Too many invalid codes. Try again later.", 429, "TOTP_LOCKED");
  }
}

export async function registerTotpFailure(user) {
  user.twoFaTotpFailedAttempts = (Number(user.twoFaTotpFailedAttempts) || 0) + 1;
  if (user.twoFaTotpFailedAttempts >= MAX_TOTP_FAILURES) {
    user.twoFaTotpLockedUntil = new Date(Date.now() + TOTP_LOCKOUT_MS);
  }
  await user.save();
}

export async function resetTotpFailures(user) {
  user.twoFaTotpFailedAttempts = 0;
  user.twoFaTotpLockedUntil = null;
  await user.save();
}

export async function generateTotpSetupArtifacts(email, userName) {
  const issuer = issuerName();
  const label = `${issuer} (${String(email || "").trim()})`;
  const secret = speakeasy.generateSecret({
    name: label,
    issuer,
    length: 32,
  });
  const otpauthUrl = secret.otpauth_url;
  const dataUrl = await QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 });
  const qrCodeImage = dataUrl;
  const manualSecret = secret.base32;
  return { qrCodeImage, manualSecret, otpauthUrl, base32: secret.base32 };
}

export function signTotpSetupToken(userId, base32Secret) {
  return jwt.sign({ typ: SETUP_TYP, sub: userId, sec: base32Secret }, config.jwt.accessSecret, {
    expiresIn: SETUP_TOKEN_EXP,
  });
}

export function verifyTotpSetupToken(token) {
  try {
    const payload = jwt.verify(String(token || ""), config.jwt.accessSecret);
    if (!payload || payload.typ !== SETUP_TYP || !payload.sub || !payload.sec) {
      throw new AppError("Invalid or expired setup session", 400, "TOTP_SETUP_INVALID");
    }
    return { userId: Number(payload.sub), secretBase32: String(payload.sec) };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("Invalid or expired setup session", 400, "TOTP_SETUP_INVALID");
  }
}

export function signLoginChallengeToken(userId, tokenVersion) {
  ensureJwtSecretsConfigured();
  const tv = Number.isInteger(Number(tokenVersion)) && Number(tokenVersion) >= 0 ? Number(tokenVersion) : 0;
  try {
    return jwt.sign({ typ: LOGIN_TYP, sub: userId, tv }, config.jwt.accessSecret, { expiresIn: LOGIN_CHALLENGE_EXP });
  } catch (e) {
    logger.error(`signLoginChallengeToken failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
    throw new AppError("Could not issue login challenge token", 500, "JWT_SIGN_FAILED");
  }
}

export function verifyLoginChallengeToken(token) {
  try {
    const payload = jwt.verify(String(token || ""), config.jwt.accessSecret);
    if (!payload || payload.typ !== LOGIN_TYP || payload.sub == null) {
      throw new UnauthorizedError("Invalid or expired login session");
    }
    return { userId: Number(payload.sub), tv: Number(payload.tv) || 0 };
  } catch (e) {
    if (e instanceof UnauthorizedError) throw e;
    throw new UnauthorizedError("Invalid or expired login session");
  }
}

export function verifyTotpCode(base32Secret, otpCode) {
  const token = String(otpCode ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  if (!/^\d{6}$/.test(token)) return false;
  return speakeasy.totp.verify({
    secret: base32Secret,
    encoding: "base32",
    token,
    window: 1,
  });
}
