import { UnauthorizedError } from "./errors.js";

/**
 * Strict JWT access version: `tv` MUST be present and MUST equal `user.token_version`.
 * Legacy tokens without `tv` are always rejected (no bypass).
 */
export function assertAccessTokenVersionMatches(user, payload) {
  const dbTv = Number(user.tokenVersion ?? 0);
  if (!Number.isInteger(dbTv) || dbTv < 0) {
    throw new UnauthorizedError("Session expired");
  }
  const jwtTv = payload.tv;
  if (typeof jwtTv !== "number" || !Number.isInteger(jwtTv) || jwtTv < 0) {
    throw new UnauthorizedError("Session expired");
  }
  if (jwtTv !== dbTv) {
    throw new UnauthorizedError("Session expired");
  }
}
