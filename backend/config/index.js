import dotenv from "dotenv";

dotenv.config();

/** Access JWT must not exceed 15 minutes (defense in depth vs env misconfiguration). */
function clampAccessExpiresIn(raw) {
  const fallback = "15m";
  const s = String(raw || fallback).trim().toLowerCase();
  const m = /^(\d+)\s*([smhd])$/.exec(s);
  if (!m) return fallback;
  const n = parseInt(m[1], 10);
  const u = m[2];
  const mult = { s: 1, m: 60, h: 3600, d: 86400 };
  const sec = n * (mult[u] ?? 0);
  if (!Number.isFinite(sec) || sec < 60) return fallback;
  if (sec > 15 * 60) return fallback;
  return s;
}

function required(name, fallback = null) {
  const v = process.env[name] ?? fallback;
  if (v === null || v === undefined || v === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return v;
}

const nodeEnv = process.env.NODE_ENV || "development";

export default {
  nodeEnv,
  port: Number(process.env.PORT) || 4000,
  /**
   * Hors production : les nouvelles inscriptions sont marquées vérifiées tout de suite.
   * Désactiver avec DEV_AUTO_VERIFY_EMAIL=false (test du flux e-mail réel).
   */
  devAutoVerifyEmail: nodeEnv !== "production" && process.env.DEV_AUTO_VERIFY_EMAIL !== "false",
  database: {
    url: required("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/portfolio_db"),
  },
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),
    accessExpiresIn: clampAccessExpiresIn(process.env.JWT_ACCESS_EXPIRES_IN || "15m"),
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  email: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || "Portfolio <noreply@localhost>",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  bvmt: {
    scrapeUrl: process.env.BVMT_SCRAPE_URL || "https://www.bvmt.com.tn/en/cours",
    cron: process.env.BVMT_CRON || "*/7 * * * *",
    requestTimeoutMs: Number(process.env.BVMT_TIMEOUT_MS) || 15000,
  },
  bourseMarketWatch: {
    /** When false, no in-process cron is registered on the API server (use scripts/runMarketWatchSync.js from system cron instead). */
    runOnApiServer: process.env.BOURSE_MARKET_WATCH_RUN_ON_SERVER !== "false",
    requestTimeoutMs: Number(process.env.BOURSE_MARKET_WATCH_TIMEOUT_MS) || 20000,
    /** Portal page used to resolve the Market Station iframe (optional discovery). */
    portalUrl: process.env.BOURSE_MARKET_PORTAL_URL || "http://www.bourse.tn/market-place",
    /**
     * REST endpoint used by the official Market Station SPA (ag-grid), not rendered as static HTML.
     * Default groups match the site’s “Global” filter: 11,12,52,95,99.
     */
    restMarketUrl:
      process.env.BOURSE_MARKET_REST_URL ||
      "http://www.bourse.tn/rest_api/rest/market/groups/11,12,52,95,99",
    userAgent:
      process.env.BOURSE_MARKET_USER_AGENT ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 BVMT-MarketWatchSync/1.0",
  },
  dbSync: process.env.DB_SYNC === "true",
  trustProxy: process.env.TRUST_PROXY === "true",
  /** Optional: when set, POST /api/ai/simulate uses OpenAI for narrative; otherwise a deterministic template is returned. */
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  },
  /** Optional LLM fallbacks (OpenAI-compatible /chat/completions). Used by assistant chat when primary fails or key missing. */
  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    baseUrl: process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1",
  },
  together: {
    apiKey: process.env.TOGETHER_API_KEY || "",
    model: process.env.TOGETHER_MODEL || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    baseUrl: process.env.TOGETHER_BASE_URL || "https://api.together.xyz/v1",
  },
  huggingface: {
    apiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN || "",
    model: process.env.HF_CHAT_MODEL || "",
    baseUrl: process.env.HF_CHAT_BASE_URL || "https://router.huggingface.co/v1",
  },
  /** Any OpenAI-compatible endpoint (LM Studio, local, etc.): requires all three. */
  openaiCompatibleFallback: {
    apiKey: process.env.LLM_FALLBACK_API_KEY || "",
    model: process.env.LLM_FALLBACK_MODEL || "",
    baseUrl: process.env.LLM_FALLBACK_BASE_URL || "",
  },
  /** Optional GNews token for AI Assistant headlines (https://gnews.io). */
  gnews: {
    apiKey: process.env.GNEWS_API_KEY || "",
    timeoutMs: Number(process.env.GNEWS_TIMEOUT_MS) || 9000,
  },
  /** Yahoo Finance chart API (unofficial) — used for portfolio expected return. */
  yahooFinance: {
    timeoutMs: Number(process.env.YAHOO_FINANCE_TIMEOUT_MS) || 12000,
    userAgent:
      process.env.YAHOO_FINANCE_USER_AGENT ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 InvestPro/1.0",
  },
  /** Email alerts when |variation_percent| on an asset meets or exceeds this (user must hold the asset + opt in). */
  priceAlerts: {
    minAbsVariationPct: Number(process.env.PRICE_ALERT_MIN_ABS_VARIATION_PCT) || 5,
  },
  /** Tâche planifiée pour l’orchestrateur de bots IA (cron node-cron, 5 champs). */
  aiTrading: {
    enabled: process.env.AI_TRADING_ENABLED !== "false",
    cron: process.env.AI_TRADING_CRON || "*/1 * * * *",
  },
  /** Snapshot côté assistant : âge max des cotations pour considérer les données « une séance » (re-classement systématique). */
  aiAssistant: {
    quoteMaxSessionAgeMs: Number(process.env.AI_QUOTE_MAX_SESSION_MS) || 86400000,
  },
};
