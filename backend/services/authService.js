import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { Sequelize } from "sequelize";
import config from "../config/index.js";
import { sequelize, User, Wallet, RefreshToken, KnownDevice } from "../models/index.js";
import { AppError, UnauthorizedError } from "../utils/errors.js";
import { auditAuth } from "../utils/auditLog.js";
import { reportAuthCritical } from "../utils/monitoring.js";
import { generateVerificationCode, hashToken, randomRefreshToken, deviceFingerprint } from "../utils/cryptoUtils.js";
import { newDeviceAlertEmail } from "../utils/emailTemplates.js";
import {
  sendMail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordResetNoAccountEmail,
  sendPasswordChangeAlertEmail,
  sendPasswordChangeVerifyEmail,
} from "./emailService.js";
import { isKnownDevice, recordKnownDevice } from "./deviceService.js";
import { logger } from "../utils/logger.js";
import { addJwtStyleDuration } from "../utils/time.js";
import {
  generateTotpSetupArtifacts,
  signTotpSetupToken,
  verifyTotpSetupToken,
  signLoginChallengeToken,
  verifyLoginChallengeToken,
  verifyTotpCode,
  ensureTotpNotLocked,
  registerTotpFailure,
  resetTotpFailures,
} from "./twoFaTotpService.js";
import { findUserByNormalizedEmail } from "../utils/findUserByEmail.js";
import { ensureJwtSecretsConfigured } from "../utils/jwtSecrets.js";
import { syncProSubscriptionStatus } from "./proSubscriptionService.js";
import { recordFailedLoginAttempt, evaluateBruteForceAfterFailure } from "./loginSecurityService.js";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_CHANGE_OTP_TTL_MS = 10 * 60 * 1000;
/** Minimum delay before starting another password-change request (same user). */
const PASSWORD_CHANGE_COOLDOWN_MS = 120 * 1000;
const PASSWORD_CHANGE_LOCKOUT_MS = 30 * 60 * 1000;
const MAX_PASSWORD_CHANGE_CONFIRM_FAILURES = 5;
const MAX_FAILED_PASSWORD_BEFORE_LOCK = 5;

const GENERIC_RESET_SENT_MESSAGE = "If the email exists, a reset code has been sent.";

async function tryRecordFailedLoginAttempt(args) {
  try {
    await recordFailedLoginAttempt(args);
  } catch (e) {
    logger.warn(`LoginAttemptLog unavailable (non-blocking): ${e?.message || e}`);
  }
}

function splitDisplayName(name) {
  const trimmed = String(name || "").trim();
  const i = trimmed.indexOf(" ");
  if (i === -1) return { firstName: trimmed, lastName: "" };
  return { firstName: trimmed.slice(0, i).trim(), lastName: trimmed.slice(i + 1).trim() };
}

function passwordChangeContextHash(ip, userAgent) {
  return String(deviceFingerprint(ip || "", userAgent || "")).toLowerCase();
}

/** Removes OTP + binding (requestId, device context). Does not clear lockout counters. */
function clearPasswordChangeOtpBind(user) {
  user.passwordChangeOtpHash = null;
  user.passwordChangeOtpExpiresAt = null;
  user.passwordChangeOtpAttempts = 0;
  user.passwordChangeRequestId = null;
  user.passwordChangeContextHash = null;
}

function applyPasswordChangeStrike(user) {
  user.passwordChangeConfirmFailures = (Number(user.passwordChangeConfirmFailures) || 0) + 1;
  if (user.passwordChangeConfirmFailures >= MAX_PASSWORD_CHANGE_CONFIRM_FAILURES) {
    user.passwordChangeLockedUntil = new Date(Date.now() + PASSWORD_CHANGE_LOCKOUT_MS);
  }
}

function signAccessToken(userId, tokenVersion) {
  ensureJwtSecretsConfigured();
  const tv = Number.isInteger(Number(tokenVersion)) && Number(tokenVersion) >= 0 ? Number(tokenVersion) : 0;
  try {
    return jwt.sign({ sub: userId, typ: "access", tv }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });
  } catch (e) {
    logger.error(`JWT access sign failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
    throw new AppError("Could not issue session token", 500, "JWT_SIGN_FAILED");
  }
}

export async function register({ name, email, password, currency }) {
  const existing = await findUserByNormalizedEmail(String(email || "").trim().toLowerCase());
  if (existing) {
    throw new AppError("Email already registered", 409, "EMAIL_TAKEN");
  }
  const hash = await bcrypt.hash(password, config.bcryptRounds);
  const autoVerify = Boolean(config.devAutoVerifyEmail);
  const code = autoVerify ? null : generateVerificationCode();
  const expires = autoVerify ? null : new Date(Date.now() + VERIFY_TTL_MS);

  const { firstName, lastName } = splitDisplayName(name);
  const t = await sequelize.transaction();
  let user;
  try {
    user = await User.create(
      {
        name,
        firstName,
        lastName,
        email: String(email || "").trim().toLowerCase(),
        password: hash,
        currency: currency || "TND",
        isVerified: autoVerify,
        verificationCode: code,
        verificationCodeExpiresAt: expires,
      },
      { transaction: t }
    );
    await Wallet.create({ userId: user.id, balance: 0 }, { transaction: t });
    await t.commit();
  } catch (e) {
    if (!t.finished) await t.rollback();
    throw e;
  }

  if (!autoVerify) {
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name,
      code,
    });
    if (!emailResult.delivered) {
      logger.warn(
        `Verification email not delivered — userId=${user.id} email=${user.email} reason=${emailResult.reason ?? "unknown"}; check SMTP logs and console fallback code`
      );
    }
  } else {
    logger.info(`Inscription dev sans e-mail de confirmation — userId=${user.id} email=${user.email} (compte déjà vérifié)`);
  }

  return {
    id: user.id,
    email: user.email,
    message: autoVerify
      ? "Registration successful. You can sign in (development: email verification skipped)."
      : "Registration successful. Check your email for the verification code.",
  };
}

export async function requestPasswordReset(emailRaw) {
  const email = String(emailRaw || "").trim().toLowerCase();
  logger.info(`[passwordReset] incoming email (normalized): ${email}`);

  try {
    const user = await findUserByNormalizedEmail(email);
    let recipientName = "InvestPro user";
    let emailResult;

    if (user) {
      recipientName = user.name;
      const code = generateVerificationCode();
      logger.info(`[passwordReset] user found userId=${user.id} — storing hashed reset code (OTP not logged)`);
      user.passwordResetCode = hashToken(code);
      user.passwordResetExpiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
      await user.save();
      logger.info(`[passwordReset] DB save OK userId=${user.id}`);
      emailResult = await sendPasswordResetEmail({
        to: email,
        name: recipientName,
        code,
      });
    } else {
      logger.info(`[passwordReset] no user row for normalized email=${email} — generic notice email (no code)`);
      emailResult = await sendPasswordResetNoAccountEmail({
        to: email,
        name: recipientName,
      });
    }
    logger.info(
      `[passwordReset] email attempt finished delivered=${Boolean(emailResult?.delivered)} reason=${emailResult?.reason ?? "ok"}`
    );

    return { message: GENERIC_RESET_SENT_MESSAGE };
  } catch (e) {
    logger.error(`[passwordReset] unexpected error: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
    console.error("[passwordReset] unexpected:", e?.message || e, e?.stack || "");
    return { message: GENERIC_RESET_SENT_MESSAGE };
  }
}

export async function resetPassword({ email, code, newPassword }) {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const t = await sequelize.transaction();
  try {
    const user = await User.findOne({
      where: Sequelize.where(
        Sequelize.fn("LOWER", Sequelize.fn("TRIM", Sequelize.col("email"))),
        normalizedEmail
      ),
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!user) {
      throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET");
    }
    const entered = String(code ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    const hashedInput = hashToken(entered).toLowerCase();
    const stored = (user.passwordResetCode != null ? String(user.passwordResetCode).trim() : "").toLowerCase();
    if (!stored || stored !== hashedInput) {
      throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET");
    }
    if (!user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
      throw new AppError("Invalid or expired reset code", 400, "INVALID_RESET");
    }

    const hash = await bcrypt.hash(newPassword, config.bcryptRounds);
    user.password = hash;
    user.passwordResetCode = null;
    user.passwordResetExpiresAt = null;
    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save({ transaction: t });
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId: user.id, revokedAt: null }, transaction: t });
    await t.commit();
    auditAuth("password_reset_completed", { userId: user.id, ip: "n/a", detail: "email_flow" });
    return { message: "Password updated successfully" };
  } catch (e) {
    if (!t.finished) await t.rollback();
    throw e;
  }
}

/**
 * Step 1: verify current password; persist hashed OTP + requestId + device context. Sends emails — full rollback if delivery fails.
 */
export async function requestAuthenticatedPasswordChange({ userId, currentPassword, ip, userAgent }) {
  const auditIp = ip || "unknown";
  const devPrefix = passwordChangeContextHash(auditIp, userAgent || "").slice(0, 12);
  const t = await sequelize.transaction();
  let toEmail = "";
  let toName = "";
  let otpPlain = "";
  let requestId = "";

  try {
    const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.passwordChangeLockedUntil && new Date(user.passwordChangeLockedUntil) > new Date()) {
      auditAuth("password_change_request_denied", {
        userId,
        ip: auditIp,
        deviceHashPrefix: devPrefix,
        detail: "flow_locked",
      });
      throw new AppError("Password change temporarily locked. Try again later.", 429, "PASSWORD_CHANGE_LOCKED");
    }
    if (user.passwordChangeLockedUntil && new Date(user.passwordChangeLockedUntil) <= new Date()) {
      user.passwordChangeLockedUntil = null;
      user.passwordChangeConfirmFailures = 0;
    }

    const currentOk = await bcrypt.compare(String(currentPassword ?? ""), user.password);
    if (!currentOk) {
      auditAuth("password_change_request_denied", {
        userId,
        ip: auditIp,
        deviceHashPrefix: devPrefix,
        detail: "bad_current_password",
      });
      throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
    }

    const last = user.passwordChangeLastRequestedAt ? new Date(user.passwordChangeLastRequestedAt) : null;
    if (last && Date.now() - last.getTime() < PASSWORD_CHANGE_COOLDOWN_MS) {
      const waitSec = Math.ceil((PASSWORD_CHANGE_COOLDOWN_MS - (Date.now() - last.getTime())) / 1000);
      throw new AppError(`Please wait ${waitSec} seconds before requesting another code.`, 429, "PASSWORD_CHANGE_COOLDOWN");
    }

    otpPlain = generateVerificationCode();
    requestId = randomUUID();
    clearPasswordChangeOtpBind(user);
    user.passwordChangeRequestId = requestId;
    user.passwordChangeContextHash = passwordChangeContextHash(auditIp, userAgent || "");
    user.passwordChangeOtpHash = hashToken(otpPlain).toLowerCase();
    user.passwordChangeOtpExpiresAt = new Date(Date.now() + PASSWORD_CHANGE_OTP_TTL_MS);
    user.passwordChangeOtpAttempts = 0;
    user.passwordChangeLastRequestedAt = new Date();
    toEmail = user.email;
    toName = user.name;
    await user.save({ transaction: t });
    await t.commit();
  } catch (e) {
    if (!t.finished) await t.rollback();
    throw e;
  }

  const when = new Date().toISOString();
  const safeUa = userAgent || "unknown";
  const reqPrefix = requestId.slice(0, 8);

  const alert = await sendPasswordChangeAlertEmail({
    to: toEmail,
    name: toName,
    when,
    ip: auditIp,
    userAgent: safeUa,
  });
  const verify = await sendPasswordChangeVerifyEmail({
    to: toEmail,
    name: toName,
    code: otpPlain,
    when,
    ip: auditIp,
    userAgent: safeUa,
    requestId,
  });

  if (!alert.delivered || !verify.delivered) {
    let t2;
    try {
      t2 = await sequelize.transaction();
      const u = await User.findByPk(userId, { transaction: t2, lock: t2.LOCK.UPDATE });
      if (u) {
        clearPasswordChangeOtpBind(u);
        await u.save({ transaction: t2 });
      }
      await t2.commit();
    } catch (re) {
      if (t2 && !t2.finished) await t2.rollback();
      logger.error(`password_change email rollback failed: ${re?.message || re}`);
      reportAuthCritical("password_change_otp_rollback_failed", {
        userId,
        ip: auditIp,
        err: String(re?.message || re).slice(0, 200),
      });
    }
    auditAuth("password_change_request_aborted", {
      userId,
      ip: auditIp,
      requestIdPrefix: reqPrefix,
      deviceHashPrefix: devPrefix,
      detail: "email_delivery_failed",
    });
    reportAuthCritical("password_change_email_delivery_failed", { userId, ip: auditIp });
    throw new AppError("Unable to send security emails. No changes were made.", 503, "EMAIL_DELIVERY_FAILED");
  }

  otpPlain = "";
  auditAuth("password_change_requested", {
    userId,
    ip: auditIp,
    requestIdPrefix: reqPrefix,
    deviceHashPrefix: devPrefix,
    detail: "otp_issued",
  });
  return {
    message: "Check your email for a verification code to complete the password change.",
    requestId,
  };
}

/**
 * Step 2: strict binding (requestId + device) + OTP; single DB transaction for success path (password, tv++, revoke refresh, OTP wipe).
 * Any validation failure invalidates the OTP bind and increments strike counter (lockout after threshold).
 */
export async function confirmAuthenticatedPasswordChange({ userId, code, newPassword, requestId, ip, userAgent }) {
  const auditIp = ip || "unknown";
  const devPrefix = passwordChangeContextHash(auditIp, userAgent || "").slice(0, 12);
  const reqPrefix = String(requestId || "").slice(0, 8);
  const ctxLive = passwordChangeContextHash(auditIp, userAgent || "");

  const t = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    if (user.passwordChangeLockedUntil && new Date(user.passwordChangeLockedUntil) > new Date()) {
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "locked",
      });
      throw new AppError("Password change temporarily locked. Try again later.", 429, "PASSWORD_CHANGE_LOCKED");
    }

    if (!user.passwordChangeOtpHash || !user.passwordChangeRequestId) {
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "no_pending",
      });
      throw new AppError("No pending password change. Request a new code first.", 400, "NO_PENDING_CHANGE");
    }

    const storedCtx = String(user.passwordChangeContextHash || "").toLowerCase();
    if (!storedCtx || ctxLive !== storedCtx) {
      clearPasswordChangeOtpBind(user);
      applyPasswordChangeStrike(user);
      await user.save({ transaction: t });
      await t.commit();
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "context_mismatch",
      });
      throw new AppError("Invalid password change session.", 400, "PASSWORD_CHANGE_CONTEXT_INVALID");
    }

    if (String(requestId || "").trim().toLowerCase() !== String(user.passwordChangeRequestId).trim().toLowerCase()) {
      clearPasswordChangeOtpBind(user);
      applyPasswordChangeStrike(user);
      await user.save({ transaction: t });
      await t.commit();
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "request_id_mismatch",
      });
      throw new AppError("Invalid password change session.", 400, "PASSWORD_CHANGE_REQUEST_INVALID");
    }

    if (!user.passwordChangeOtpExpiresAt || new Date(user.passwordChangeOtpExpiresAt) < new Date()) {
      clearPasswordChangeOtpBind(user);
      applyPasswordChangeStrike(user);
      await user.save({ transaction: t });
      await t.commit();
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "otp_expired",
      });
      throw new AppError("Verification code expired. Start the process again.", 400, "CODE_EXPIRED");
    }

    const entered = String(code ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    const hashedInput = hashToken(entered).toLowerCase();
    const storedOtp = String(user.passwordChangeOtpHash).trim().toLowerCase();
    if (!storedOtp || storedOtp !== hashedInput) {
      clearPasswordChangeOtpBind(user);
      applyPasswordChangeStrike(user);
      await user.save({ transaction: t });
      await t.commit();
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "bad_otp",
      });
      throw new AppError("Invalid verification code", 400, "INVALID_OTP");
    }

    const sameAsCurrent = await bcrypt.compare(String(newPassword ?? ""), user.password);
    if (sameAsCurrent) {
      clearPasswordChangeOtpBind(user);
      applyPasswordChangeStrike(user);
      await user.save({ transaction: t });
      await t.commit();
      auditAuth("password_change_confirm_denied", {
        userId,
        ip: auditIp,
        requestIdPrefix: reqPrefix,
        deviceHashPrefix: devPrefix,
        detail: "same_password",
      });
      throw new AppError("New password must be different from your current password", 400, "SAME_PASSWORD");
    }

    const hash = await bcrypt.hash(String(newPassword ?? ""), config.bcryptRounds);
    user.password = hash;
    clearPasswordChangeOtpBind(user);
    user.passwordChangeLastRequestedAt = null;
    user.passwordChangeConfirmFailures = 0;
    user.passwordChangeLockedUntil = null;
    user.tokenVersion = (Number(user.tokenVersion) || 0) + 1;
    await user.save({ transaction: t });
    await RefreshToken.update({ revokedAt: new Date() }, { where: { userId, revokedAt: null }, transaction: t });
    await t.commit();
    auditAuth("password_change_completed", {
      userId,
      ip: auditIp,
      requestIdPrefix: reqPrefix,
      deviceHashPrefix: devPrefix,
      detail: "sessions_invalidated",
    });
    return { message: "Password updated successfully. Sign in again on all your devices." };
  } catch (e) {
    if (!t.finished) await t.rollback();
    throw e;
  }
}

export async function verifyEmail({ email, code }) {
  const user = await findUserByNormalizedEmail(String(email || "").trim().toLowerCase());
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  if (user.isVerified) {
    return { message: "Email already verified" };
  }
  const entered = String(code ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
  const stored = user.verificationCode != null ? String(user.verificationCode).trim() : "";
  if (!stored || stored !== entered) {
    throw new AppError("Invalid verification code", 400, "INVALID_CODE");
  }
  if (user.verificationCodeExpiresAt && new Date(user.verificationCodeExpiresAt) < new Date()) {
    throw new AppError("Verification code expired", 400, "CODE_EXPIRED");
  }
  user.isVerified = true;
  user.verificationCode = null;
  user.verificationCodeExpiresAt = null;
  await user.save();
  return { message: "Email verified successfully" };
}

async function issueRefreshToken(userId) {
  try {
    const raw = randomRefreshToken();
    const tokenHash = hashToken(raw);
    const expiresAt = addJwtStyleDuration(new Date(), config.jwt.refreshExpiresIn);
    await RefreshToken.create({ userId, tokenHash, expiresAt });
    return raw;
  } catch (e) {
    logger.error(`issueRefreshToken userId=${userId}: ${e?.message || e}`);
    throw new AppError(
      "Cannot save refresh token (check refresh_tokens table / run DB_SYNC=true once).",
      503,
      "REFRESH_TOKEN_DB_ERROR",
    );
  }
}

/** Évite RangeError sur toISOString() si la BDD contient une date invalide. */
function safeIsoOrNull(value) {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

function publicUserPayload(user) {
  const tier = user.role === "PRO_INVESTOR" ? "PRO_INVESTOR" : "INVESTOR";
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ? String(user.phone) : "",
    currency: user.currency,
    /** Toujours un booléen explicite (évite null / ambiguïté JSON côté client). */
    isVerified: user.isVerified === true,
    notifyTransactionEmail: user.notifyTransactionEmail !== false,
    notifyPriceAlertEmail: user.notifyPriceAlertEmail !== false,
    twoFaEnabled: user.twoFaEnabled === true,
    twoFaMethod: user.twoFaMethod === "totp" ? "totp" : "email",
    investorRole: tier,
    isPro: user.isPro === true,
    proStartedAt: safeIsoOrNull(user.proStartedAt),
    proExpiresAt: safeIsoOrNull(user.proExpiresAt),
    proPlanType: user.proPlanType === "yearly" || user.proPlanType === "monthly" ? user.proPlanType : null,
  };
}

async function completeLoginAfterPassword(user, ip, userAgent) {
  try {
    await syncProSubscriptionStatus(user);
  } catch (e) {
    logger.error(`syncProSubscriptionStatus (login) userId=${user?.id}: ${e?.message || e}`);
  }
  try {
    await user.reload();
  } catch (e) {
    logger.error(`user.reload (login) userId=${user?.id}: ${e?.message || e}`);
  }

  try {
    const priorDeviceCount = await KnownDevice.count({ where: { userId: user.id } });
    const { known, fingerprint } = await isKnownDevice(user.id, ip, userAgent);
    if (!known) {
      await recordKnownDevice(user.id, fingerprint);
      if (priorDeviceCount > 0) {
        const tpl = newDeviceAlertEmail({
          name: user.name,
          ip: ip || "unknown",
          userAgent: userAgent || "unknown",
          when: new Date().toISOString(),
        });
        try {
          const sent = await sendMail({ to: user.email, ...tpl });
          if (sent.skipped) {
            logger.warn(
              `New-device alert not sent for userId=${user.id} email=${user.email}: SMTP not configured (see prior emailService warnings)`
            );
          }
        } catch (e) {
          logger.error(
            `Failed to send new-device alert to ${user.email}: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`
          );
        }
      }
    }
  } catch (e) {
    logger.error(`KnownDevice / recordKnownDevice (login) userId=${user?.id}: ${e?.message || e}`);
  }

  const accessToken = signAccessToken(user.id, user.tokenVersion ?? 0);
  const refreshToken = await issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwt.accessExpiresIn,
    user: publicUserPayload(user),
  };
}

const INVALID_CREDENTIALS_MSG = "Invalid credentials";

export async function login({ email, password, ip, userAgent }) {
  ensureJwtSecretsConfigured();

  const emailNorm = String(email || "").trim().toLowerCase();
  const pwdPlain = String(password ?? "");

  console.log("LOGIN ATTEMPT:", emailNorm);

  let user;
  try {
    user = await findUserByNormalizedEmail(emailNorm);
  } catch (e) {
    logger.error(`login user lookup failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
    console.error("LOGIN ERROR:", e);
    throw new AppError("Login temporarily unavailable", 503, "LOGIN_DB_ERROR");
  }

  console.log("USER FOUND:", user ? "YES" : "NO");

  if (user && user.accountLocked === true) {
    throw new AppError("Account locked. Contact support", 403, "ACCOUNT_LOCKED");
  }

  if (!user) {
    await tryRecordFailedLoginAttempt({ userId: null, emailNorm, ip });
    throw new AppError(INVALID_CREDENTIALS_MSG, 400, "INVALID_CREDENTIALS");
  }

  if (user.password == null || typeof user.password !== "string" || !String(user.password).trim()) {
    logger.error(
      `login: misconfigured user id=${user.id} email=${user.email} — password hash missing or empty in database`
    );
    throw new AppError(
      "Account configuration error: password not set. Contact support.",
      500,
      "PASSWORD_HASH_MISSING"
    );
  }

  let ok = false;
  try {
    ok = await bcrypt.compare(pwdPlain, user.password);
  } catch (e) {
    logger.error(
      `bcrypt.compare failed for userId=${user.id}: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`
    );
    throw new AppError("Authentication subsystem error", 500, "PASSWORD_VERIFY_ERROR");
  }

  if (!ok) {
    await tryRecordFailedLoginAttempt({ userId: user.id, emailNorm, ip });
    user.failedLoginAttempts = (Number(user.failedLoginAttempts) || 0) + 1;
    if (user.failedLoginAttempts >= MAX_FAILED_PASSWORD_BEFORE_LOCK) {
      user.accountLocked = true;
      user.lockReason = "Too many failed attempts";
      user.lockUntil = null;
    }
    await user.save();

    if (user.failedLoginAttempts < MAX_FAILED_PASSWORD_BEFORE_LOCK) {
      try {
        await evaluateBruteForceAfterFailure(user, ip);
      } catch (e) {
        logger.warn(`evaluateBruteForceAfterFailure (non-blocking): ${e?.message || e}`);
      }
    }

    throw new AppError(INVALID_CREDENTIALS_MSG, 400, "INVALID_CREDENTIALS");
  }

  user.failedLoginAttempts = 0;
  await user.save();

  /** En développement, éviter les comptes « bloqués » sans code e-mail (SMTP absent). */
  if (config.devAutoVerifyEmail && user.isVerified !== true) {
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpiresAt = null;
    await user.save();
    await user.reload();
    logger.info(`Connexion dev : compte ${user.email} marqué vérifié automatiquement`);
  }

  if (user.twoFaEnabled === true && user.twoFaMethod === "totp") {
    return {
      status: "2FA_REQUIRED",
      twoFaMethod: "totp",
      loginChallengeToken: signLoginChallengeToken(user.id, user.tokenVersion ?? 0),
      userId: user.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  /**
   * Méthode e-mail : ici pourra vivre l’OTP e-mail à la connexion sans toucher au reste.
   * Comportement actuel inchangé : émission des jetons après mot de passe valide.
   */
  if (user.twoFaEnabled === true && user.twoFaMethod === "email") {
    return completeLoginAfterPassword(user, ip, userAgent);
  }

  return completeLoginAfterPassword(user, ip, userAgent);
}

export async function verifyTotpLogin({ loginChallengeToken, userId, otpCode, ip, userAgent }) {
  let parsed;
  try {
    parsed = verifyLoginChallengeToken(loginChallengeToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired login session");
  }
  if (Number(userId) !== parsed.userId) {
    throw new UnauthorizedError("Invalid or expired login session");
  }

  const user = await User.findByPk(parsed.userId);
  if (!user || user.twoFaEnabled !== true || user.twoFaMethod !== "totp") {
    throw new UnauthorizedError("Invalid or expired login session");
  }
  if (user.accountLocked === true) {
    throw new AppError("Account locked. Contact support", 403, "ACCOUNT_LOCKED");
  }
  if (!user.twoFaSecret) {
    throw new AppError("Two-factor authentication must be set up again.", 400, "TOTP_RESETUP_REQUIRED");
  }
  if ((Number(user.tokenVersion) || 0) !== parsed.tv) {
    throw new UnauthorizedError("Invalid or expired login session");
  }

  await ensureTotpNotLocked(user);
  if (!verifyTotpCode(user.twoFaSecret, otpCode)) {
    await registerTotpFailure(user);
    throw new AppError("Invalid verification code", 400, "INVALID_OTP");
  }
  await resetTotpFailures(user);
  return completeLoginAfterPassword(user, ip, userAgent);
}

export async function totpSetupStart({ userId, currentPassword }) {
  const user = await User.findByPk(userId);
  if (!user) throw new UnauthorizedError("User not found");
  const pwdOk = await bcrypt.compare(String(currentPassword ?? ""), user.password);
  if (!pwdOk) {
    throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
  }
  const { qrCodeImage, manualSecret, base32 } = await generateTotpSetupArtifacts(user.email, user.name);
  const setupToken = signTotpSetupToken(user.id, base32);
  return { qrCodeImage, manualSecret, setupToken };
}

export async function totpSetupFinish({ userId, currentPassword, setupToken, otpCode }) {
  const user = await User.findByPk(userId);
  if (!user) throw new UnauthorizedError("User not found");
  const pwdOk = await bcrypt.compare(String(currentPassword ?? ""), user.password);
  if (!pwdOk) {
    throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
  }

  const decoded = verifyTotpSetupToken(setupToken);
  if (decoded.userId !== userId) {
    throw new AppError("Invalid or expired setup session", 400, "TOTP_SETUP_INVALID");
  }

  await ensureTotpNotLocked(user);
  if (!verifyTotpCode(decoded.secretBase32, otpCode)) {
    await registerTotpFailure(user);
    throw new AppError("Invalid verification code", 400, "INVALID_OTP");
  }

  user.twoFaSecret = decoded.secretBase32;
  user.twoFaEnabled = true;
  user.twoFaMethod = "totp";
  await resetTotpFailures(user);
  await user.save();

  return {
    message: "Two-factor authentication enabled",
    twoFaEnabled: true,
    twoFaMethod: "totp",
  };
}

export async function totpDisable({ userId, currentPassword }) {
  const user = await User.findByPk(userId);
  if (!user) throw new UnauthorizedError("User not found");
  const pwdOk = await bcrypt.compare(String(currentPassword ?? ""), user.password);
  if (!pwdOk) {
    throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
  }
  user.twoFaSecret = null;
  user.twoFaEnabled = false;
  user.twoFaMethod = "email";
  await resetTotpFailures(user);
  await user.save();
  return {
    message: "Authenticator two-factor authentication disabled",
    twoFaEnabled: false,
    twoFaMethod: "email",
  };
}

export async function refreshSession(refreshTokenRaw) {
  if (!refreshTokenRaw) throw new UnauthorizedError("Refresh token required");
  const tokenHash = hashToken(refreshTokenRaw);
  const row = await RefreshToken.findOne({ where: { tokenHash } });
  if (!row || row.revokedAt) throw new UnauthorizedError("Invalid refresh token");
  if (new Date(row.expiresAt) < new Date()) throw new UnauthorizedError("Refresh token expired");

  row.revokedAt = new Date();
  await row.save();

  const user = await User.findByPk(row.userId);
  if (!user) throw new UnauthorizedError("Invalid refresh token");

  const accessToken = signAccessToken(user.id, user.tokenVersion ?? 0);
  const refreshToken = await issueRefreshToken(user.id);
  return { accessToken, refreshToken, expiresIn: config.jwt.accessExpiresIn };
}

export function verifyAccessToken(token) {
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret);
    if (payload.typ !== "access") throw new Error("wrong type");
    return payload;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
