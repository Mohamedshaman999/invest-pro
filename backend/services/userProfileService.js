import { User } from "../models/index.js";
import { AppError, NotFoundError } from "../utils/errors.js";
import { findUserByNormalizedEmail } from "../utils/findUserByEmail.js";
import { syncProSubscriptionStatus } from "./proSubscriptionService.js";

function publicProfile(u) {
  const tier = u.role === "PRO_INVESTOR" ? "PRO_INVESTOR" : "INVESTOR";
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || "",
    currency: u.currency,
    isVerified: u.isVerified === true,
    notifyTransactionEmail: u.notifyTransactionEmail !== false,
    notifyPriceAlertEmail: u.notifyPriceAlertEmail !== false,
    twoFaEnabled: u.twoFaEnabled === true,
    twoFaMethod: u.twoFaMethod === "totp" ? "totp" : "email",
    investorRole: tier,
    isPro: u.isPro === true,
    proStartedAt: u.proStartedAt ? new Date(u.proStartedAt).toISOString() : null,
    proExpiresAt: u.proExpiresAt ? new Date(u.proExpiresAt).toISOString() : null,
    proPlanType: u.proPlanType === "yearly" || u.proPlanType === "monthly" ? u.proPlanType : null,
  };
}

/**
 * @param {number} userId
 */
export async function getUserProfile(userId) {
  const u = await User.findByPk(userId);
  if (!u) throw new NotFoundError("User not found");
  await syncProSubscriptionStatus(u);
  return publicProfile(u);
}

const TN_NATIONAL_MOBILE = /^[2459]\d{7}$/;

/**
 * @param {number} userId
 * @param {{ name?: string; email?: string; phone?: string }} body
 */
export async function patchUserProfile(userId, body) {
  const u = await User.findByPk(userId);
  if (!u) throw new NotFoundError("User not found");

  if (Object.prototype.hasOwnProperty.call(body, "name")) {
    const n = String(body.name ?? "").trim();
    if (!n) throw new AppError("Name cannot be empty", 400, "INVALID_NAME");
    u.name = n;
  }

  if (Object.prototype.hasOwnProperty.call(body, "email")) {
    const next = String(body.email ?? "").trim().toLowerCase();
    if (!next) throw new AppError("Email cannot be empty", 400, "INVALID_EMAIL");
    const currentNorm = String(u.email ?? "").trim().toLowerCase();
    if (next !== currentNorm) {
      const other = await findUserByNormalizedEmail(next);
      if (other && other.id !== u.id) {
        throw new AppError("Email already in use", 409, "EMAIL_TAKEN");
      }
      u.email = next;
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, "phone")) {
    const raw = body.phone == null ? "" : String(body.phone).replace(/\D/g, "");
    if (!raw) {
      u.phone = null;
    } else if (!TN_NATIONAL_MOBILE.test(raw)) {
      throw new AppError("Invalid Tunisian mobile number", 400, "INVALID_PHONE");
    } else {
      u.phone = raw;
    }
  }

  await u.save();

  return publicProfile(u);
}
