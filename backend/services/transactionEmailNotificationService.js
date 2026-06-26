import { User } from "../models/index.js";
import { logger } from "../utils/logger.js";
import { sendTransactionExecutedNotificationEmail } from "./emailService.js";

/**
 * After a successful trade, notify by email if the user opted in (never throws).
 */
export async function notifyTransactionEmailIfEnabled({
  userId,
  type,
  asset,
  quantity,
  priceAtExecution,
  date,
}) {
  try {
    const user = await User.findByPk(userId, {
      attributes: ["email", "name", "currency", "notifyTransactionEmail"],
    });
    if (!user?.email || user.notifyTransactionEmail === false) return;

    const ticker = String(asset?.ticker ?? "");
    const assetName = String(asset?.name ?? ticker);
    const cur = String(user.currency ?? "TND").toUpperCase();

    await sendTransactionExecutedNotificationEmail({
      to: user.email,
      name: user.name,
      type,
      ticker,
      assetName,
      quantity,
      priceAtExecution,
      date,
      currency: cur,
    });
  } catch (e) {
    logger.warn(`transaction notification email failed userId=${userId}: ${e?.message || e}`);
  }
}
