import config from "../config/index.js";
import { AppError } from "./errors.js";

/** Vérifie les secrets JWT avant toute signature (évite un crash brut si l’env est vide). */
export function ensureJwtSecretsConfigured() {
  const access = config.jwt?.accessSecret;
  const refresh = config.jwt?.refreshSecret;
  if (typeof access !== "string" || !access.trim()) {
    throw new AppError("JWT signing is not configured (JWT_ACCESS_SECRET)", 500, "JWT_MISCONFIGURED");
  }
  if (typeof refresh !== "string" || !refresh.trim()) {
    throw new AppError("JWT signing is not configured (JWT_REFRESH_SECRET)", 500, "JWT_MISCONFIGURED");
  }
}
