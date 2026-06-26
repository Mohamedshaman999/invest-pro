import { User } from "../models/index.js";
import { verifyAccessToken } from "../services/authService.js";
import { syncProSubscriptionStatus } from "../services/proSubscriptionService.js";
import { assertAccessTokenVersionMatches } from "../utils/accessTokenVersion.js";
import { UnauthorizedError, ForbiddenError } from "../utils/errors.js";
import { scheduleUserActivityTouch } from "./activityMiddleware.js";

function extractBearer(req) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) return null;
  return h.slice(7).trim();
}

export async function authMiddleware(req, res, next) {
  try {
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedError("Missing bearer token");
    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.sub);
    if (!user) throw new UnauthorizedError("User not found");
    assertAccessTokenVersionMatches(user, payload);
    await syncProSubscriptionStatus(user);
    req.user = user;
    scheduleUserActivityTouch(user.id);
    next();
  } catch (e) {
    next(e);
  }
}

export function requireVerified(req, res, next) {
  if (!req.user?.isVerified) {
    return next(new ForbiddenError("Verify your email to access this resource"));
  }
  next();
}
