import { logger } from "./logger.js";

/**
 * Structured security audit — never log passwords, OTPs, tokens, or full requestIds.
 */
export function auditAuth(action, { userId, ip, requestIdPrefix, deviceHashPrefix, detail }) {
  logger.info(
    JSON.stringify({
      type: "AUDIT",
      action,
      userId,
      ip: String(ip ?? "unknown").slice(0, 128),
      requestIdPrefix: requestIdPrefix ?? undefined,
      deviceHashPrefix: deviceHashPrefix ?? undefined,
      detail: detail != null ? String(detail).slice(0, 200) : undefined,
      ts: new Date().toISOString(),
    })
  );
}
