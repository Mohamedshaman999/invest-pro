import { NotFoundError } from "../utils/errors.js";

const MS_PER_DAY = 86400000;

/** Mensuel : 31 jours ; annuel : 365 jours (aligné spec). */
const PLAN_DURATION_DAYS = {
  monthly: 31,
  yearly: 365,
};

function toMs(d) {
  if (!d) return null;
  const t = new Date(d).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * Révoque ou répare l’état Pro selon `pro_expires_at` et données legacy.
 * Persiste si nécessaire. Recharge le user après mutation.
 * @param {import("sequelize").Model} user
 */
export async function syncProSubscriptionStatus(user) {
  if (!user) return;
  const now = Date.now();
  const expMs = toMs(user.proExpiresAt);

  // Abonnement daté : expiré → révoquer Pro
  if (expMs != null && expMs <= now && user.role === "PRO_INVESTOR") {
    user.isPro = false;
    user.role = "INVESTOR";
    await user.save();
    await user.reload();
    return;
  }

  if (expMs != null && expMs <= now && user.isPro === true) {
    user.isPro = false;
    if (user.role === "PRO_INVESTOR") user.role = "INVESTOR";
    await user.save();
    await user.reload();
    return;
  }

  // Legacy : PRO_INVESTOR sans fenêtre d’expiration (démo / anciennes lignes)
  if (user.role === "PRO_INVESTOR" && expMs == null && user.isPro !== true) {
    user.isPro = true;
    await user.save({ fields: ["isPro"] });
    await user.reload();
    return;
  }

  // Future expiry mais isPro faux → réaligner
  if (user.role === "PRO_INVESTOR" && expMs != null && expMs > now && user.isPro !== true) {
    user.isPro = true;
    await user.save({ fields: ["isPro"] });
    await user.reload();
    return;
  }

  // isPro incohérent sans rôle Pro
  if (user.role !== "PRO_INVESTOR" && user.isPro === true) {
    user.isPro = false;
    await user.save({ fields: ["isPro"] });
    await user.reload();
  }
}

/**
 * @param {Date} from
 * @param {"monthly"|"yearly"} planType
 */
export function computeProExpiry(from, planType) {
  const days = PLAN_DURATION_DAYS[planType] ?? PLAN_DURATION_DAYS.monthly;
  return new Date(from.getTime() + days * MS_PER_DAY);
}

/**
 * Active ou prolonge Pro après paiement confirmé.
 * @param {number} userId
 * @param {"monthly"|"yearly"} planType
 */
export async function activateProSubscription(userId, planType) {
  const { User } = await import("../models/index.js");
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError("User not found");

  const now = new Date();
  const prevExp = toMs(user.proExpiresAt);
  const extendingActive = prevExp != null && prevExp > now.getTime();
  const base = extendingActive ? new Date(prevExp) : now;

  user.isPro = true;
  user.role = "PRO_INVESTOR";
  /** Ne pas réinitialiser la date de début lors d’un renouvellement / prolongation. */
  if (!extendingActive) {
    user.proStartedAt = now;
  }
  user.proExpiresAt = computeProExpiry(base, planType);
  user.proPlanType = planType;

  await user.save({
    fields: ["isPro", "role", "proStartedAt", "proExpiresAt", "proPlanType"],
  });
  await user.reload();
  return user;
}
