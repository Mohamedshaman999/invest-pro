import * as authService from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

function clientIp(req) {
  return req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "";
}

export const register = asyncHandler(async (req, res) => {
  const out = await authService.register(req.body);
  res.status(201).json(out);
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const out = await authService.verifyEmail(req.body);
  res.json(out);
});

export const login = asyncHandler(async (req, res) => {
  try {
    const out = await authService.login({
      ...req.body,
      ip: clientIp(req),
      userAgent: req.headers["user-agent"] || "",
    });
    res.json(out);
  } catch (error) {
    if (error instanceof AppError && error.isOperational) {
      return res.status(error.statusCode).json({
        message: error.message,
        code: error.code,
      });
    }
    console.error("LOGIN ERROR:", error);
    logger.error(
      `login route critical failure: ${error?.message || error}${error?.stack ? `\n${error.stack}` : ""}`
    );
    return res.status(500).json({
      message: "Internal server error during login",
    });
  }
});

export const refresh = asyncHandler(async (req, res) => {
  const out = await authService.refreshSession(req.body.refreshToken);
  res.json(out);
});

export const forgotPassword = asyncHandler(async (req, res) => {
  try {
    const out = await authService.requestPasswordReset(req.body.email);
    res.json({ message: out?.message ?? "If the email exists, a reset code has been sent." });
  } catch (e) {
    console.error("Forgot password error:", e?.message || e, e?.stack || "");
    logger.error(`forgotPassword route critical failure: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
    res.status(500).json({ message: "Internal server error" });
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const out = await authService.resetPassword(req.body);
  res.json(out);
});

export const requestPasswordChange = asyncHandler(async (req, res) => {
  const out = await authService.requestAuthenticatedPasswordChange({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] || "",
  });
  res.json(out);
});

export const confirmPasswordChange = asyncHandler(async (req, res) => {
  const out = await authService.confirmAuthenticatedPasswordChange({
    userId: req.user.id,
    requestId: req.body.requestId,
    code: req.body.code,
    newPassword: req.body.newPassword,
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] || "",
  });
  res.json(out);
});

export const totpSetup = asyncHandler(async (req, res) => {
  const out = await authService.totpSetupStart({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
  });
  res.json(out);
});

export const totpVerifySetup = asyncHandler(async (req, res) => {
  const out = await authService.totpSetupFinish({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    setupToken: req.body.setupToken,
    otpCode: req.body.otpCode,
  });
  res.json(out);
});

export const totpVerifyLogin = asyncHandler(async (req, res) => {
  const out = await authService.verifyTotpLogin({
    loginChallengeToken: req.body.loginChallengeToken,
    userId: req.body.userId,
    otpCode: req.body.otpCode,
    ip: clientIp(req),
    userAgent: req.headers["user-agent"] || "",
  });
  res.json(out);
});

export const totpDisable = asyncHandler(async (req, res) => {
  const out = await authService.totpDisable({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
  });
  res.json(out);
});
