import { ForbiddenError } from "../utils/errors.js";
import { isAdminPatternEmail } from "../utils/investorTier.js";

/** Messagerie réservée aux comptes investisseurs (pas aux emails admin). */
export function requireMessagingInvestor(req, res, next) {
  if (isAdminPatternEmail(req.user?.email)) {
    return next(new ForbiddenError("Admin accounts must use the admin messaging panel"));
  }
  next();
}
