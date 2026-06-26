import { ForbiddenError } from "../utils/errors.js";
import { isAdminPatternEmail } from "../utils/investorTier.js";

export function requireAdmin(req, res, next) {
  const isAdmin = isAdminPatternEmail(req.user?.email);
  if (!isAdmin) {
    return next(new ForbiddenError("Admin only"));
  }
  next();
}
