import { AppError } from "../utils/errors.js";
import { userHasProInvestorAccess } from "../utils/investorTier.js";

/**
 * Bloque toute exécution métier si l’utilisateur n’est pas Pro Investisseur.
 * Dépend de authMiddleware (req.user défini).
 */
export function requireProInvestor(req, res, next) {
  if (!req.user) {
    return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }
  if (!userHasProInvestorAccess(req.user)) {
    return next(new AppError("Upgrade to Pro to access this feature", 403, "PRO_REQUIRED"));
  }
  next();
}
