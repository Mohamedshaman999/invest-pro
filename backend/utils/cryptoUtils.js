import crypto from "crypto";

export function hashToken(token) {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex");
}

export function deviceFingerprint(ip, userAgent) {
  const raw = `${ip || ""}|${userAgent || ""}`;
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

export function randomRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

/** Cryptographically secure 6-digit numeric code (000000–999999). */
export function generateVerificationCode() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}
