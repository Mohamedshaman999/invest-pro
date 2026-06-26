import config from "../config/index.js";
import { sendTestEmailNow } from "../services/emailService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const sendTestEmail = asyncHandler(async (req, res) => {
  if (config.nodeEnv === "production" && process.env.ENABLE_DEBUG_EMAIL !== "true") {
    return res.status(403).json({ message: "Debug email disabled in production", code: "FORBIDDEN" });
  }
  const { email } = req.body;
  const out = await sendTestEmailNow(email.trim().toLowerCase());
  if (!out.delivered) {
    return res.status(502).json({
      message: "Email was not delivered — see server logs (SMTP ERROR / NO SMTP CONFIG)",
      delivered: false,
      reason: out.reason ?? "unknown",
    });
  }
  res.json({ delivered: true, messageId: out.messageId });
});
