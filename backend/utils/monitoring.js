import { logger } from "./logger.js";

/**
 * Critical auth/security events for log aggregation / Sentry wiring.
 * Never pass passwords, OTPs, refresh tokens, or raw JWTs in `meta`.
 */
export function reportAuthCritical(event, meta = {}) {
  const safe = { ...meta };
  delete safe.password;
  delete safe.code;
  delete safe.otp;
  delete safe.token;
  delete safe.refreshToken;
  logger.error(
    JSON.stringify({
      type: "AUTH_CRITICAL",
      event,
      ts: new Date().toISOString(),
      ...safe,
    })
  );
}
