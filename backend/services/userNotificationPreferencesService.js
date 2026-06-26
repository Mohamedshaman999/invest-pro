import { User } from "../models/index.js";
import { NotFoundError } from "../utils/errors.js";

function coerceBool(v, fallback) {
  if (typeof v === "boolean") return v;
  if (v === undefined || v === null) return fallback;
  return Boolean(v);
}

export async function getNotificationPreferences(userId) {
  const u = await User.findByPk(userId, {
    attributes: ["notifyTransactionEmail", "notifyPriceAlertEmail"],
  });
  if (!u) throw new NotFoundError("User not found");
  return {
    notifyTransactionEmail: coerceBool(u.notifyTransactionEmail, true),
    notifyPriceAlertEmail: coerceBool(u.notifyPriceAlertEmail, true),
  };
}

export async function patchNotificationPreferences(userId, body) {
  const u = await User.findByPk(userId, {
    attributes: ["id", "notifyTransactionEmail", "notifyPriceAlertEmail"],
  });
  if (!u) throw new NotFoundError("User not found");

  if (Object.prototype.hasOwnProperty.call(body, "notifyTransactionEmail")) {
    u.notifyTransactionEmail = Boolean(body.notifyTransactionEmail);
  }
  if (Object.prototype.hasOwnProperty.call(body, "notifyPriceAlertEmail")) {
    u.notifyPriceAlertEmail = Boolean(body.notifyPriceAlertEmail);
  }

  await u.save();
  return getNotificationPreferences(userId);
}
