import { ForbiddenError } from "../utils/errors.js";
import { isAdminPatternEmail } from "../utils/investorTier.js";

/** Bloque l’accès aux fonctionnalités d’investissement pour les comptes admin (même logique e-mail que requireAdmin). */
export function forbidAdminInvestmentAccess(req, res, next) {
  if (isAdminPatternEmail(req.user?.email)) {
    return next(new ForbiddenError("Admin accounts cannot access investment features"));
  }
  next();
}
