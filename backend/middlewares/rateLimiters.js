import rateLimit from "express-rate-limit";
import config from "../config/index.js";

const devRelaxed = config.nodeEnv !== "production";

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: devRelaxed ? 120 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, try again later" },
});

export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: devRelaxed ? 200 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many authentication attempts, try again later" },
});

/** Limitation envoi de messages (anti-spam). */
export const messagingSendLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: devRelaxed ? 45 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id ?? req.ip ?? "anon"),
  message: { message: "Too many messages, slow down", code: "RATE_LIMIT" },
});

export const messagingCreateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: devRelaxed ? 15 : 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id ?? req.ip ?? "anon"),
  message: { message: "Too many new conversations, try again later", code: "RATE_LIMIT" },
});

/** Assistant IA : 20 requêtes / minute / utilisateur (anti-abus). */
export const aiChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id ?? req.ip ?? "anon"),
  message: { message: "Too many AI requests, slow down", code: "RATE_LIMIT" },
});
