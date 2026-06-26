/**
 * Accès « Pro » : rôle PRO_INVESTOR en base (les comptes admin ne sont pas traités comme Pro pour l’investissement).
 */
export function isAdminPatternEmail(email) {
  const e = String(email || "").toLowerCase();
  return e.startsWith("admin@") || e.endsWith("@admin.com") || e.includes("+admin@");
}

/**
 * @param {{ role?: string | null; isPro?: boolean | null; proExpiresAt?: Date | string | null }} user Modèle Sequelize User (déjà passé par syncProSubscriptionStatus dans authMiddleware).
 */
export function userHasProInvestorAccess(user) {
  if (!user) return false;
  const tier = user.role == null || user.role === "" ? "INVESTOR" : String(user.role);
  if (tier !== "PRO_INVESTOR") return false;
  if (user.isPro !== true) return false;
  const exp = user.proExpiresAt ? new Date(user.proExpiresAt).getTime() : null;
  if (exp != null && Number.isFinite(exp) && exp <= Date.now()) return false;
  return true;
}
