import nodemailer from "nodemailer";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";
import { passwordChangeRequestedAlertEmail } from "../utils/emailTemplates.js";

/** Safe for HTML body injection (name, verification code). */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

let transporter = null;

/**
 * Normalize SMTP_HOST: reject accidental URLs (https://..., google search, etc.).
 */
function getSanitizedSmtpHost() {
  let raw = String(process.env.SMTP_HOST ?? "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw) || /google\.com\/search/i.test(raw)) {
    console.warn(
      "[emailService] SMTP_HOST must be a hostname only (e.g. smtp.gmail.com), not a full URL. Stripping protocol/path."
    );
  }
  raw = raw.replace(/^https?:\/\//i, "");
  raw = raw.split("/")[0].split("?")[0].trim();
  raw = raw.replace(/^mailto:/i, "");
  return raw;
}

export function isSmtpConfigured() {
  const host = getSanitizedSmtpHost();
  return Boolean(host && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
}

function smtpEffectivePort() {
  const port = Number(process.env.SMTP_PORT);
  return Number.isFinite(port) && port > 0 ? port : 587;
}

function mailboxFromFromHeader(from) {
  const s = String(from ?? "").trim();
  const m = s.match(/<([^>]+)>/);
  return (m ? m[1] : s).trim().toLowerCase();
}

function resolveFromForSmtp() {
  const user = process.env.SMTP_USER?.trim() ?? "";
  if (!user) {
    return String(config.email.from || "").trim() || "Portfolio <noreply@localhost>";
  }
  const rawFrom = process.env.EMAIL_FROM?.trim() ?? "";
  if (!rawFrom) {
    return `InvestPro <${user}>`;
  }
  const fromMailbox = mailboxFromFromHeader(rawFrom);
  if (fromMailbox !== user.toLowerCase()) {
    console.warn(
      `[emailService] EMAIL_FROM (${fromMailbox}) must match SMTP_USER (${user}) for Gmail — using InvestPro <${user}>`
    );
    return `InvestPro <${user}>`;
  }
  return rawFrom;
}

/**
 * Lazy transporter: return cached instance, or build after env validation.
 */
export function getMailTransporter() {
  if (transporter) {
    return transporter;
  }

  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
    console.warn("SMTP NOT CONFIGURED");
    return null;
  }

  const host = getSanitizedSmtpHost();
  if (!host) {
    console.warn("SMTP NOT CONFIGURED (invalid SMTP_HOST)");
    return null;
  }

  const validPort = smtpEffectivePort();
  
  transporter = nodemailer.createTransport({
    host,
    port: validPort,
    secure: validPort === 465 || process.env.SMTP_SECURE === "true",
    requireTLS: validPort === 587,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS?.trim()
    },
  });

  return transporter;
}

export function logSmtpConfigAtStartup() {
  const hostRaw = process.env.SMTP_HOST;
  const hostSan = getSanitizedSmtpHost();
  console.log("SMTP CONFIG:");
  console.log("HOST (raw):", hostRaw);
  console.log("HOST (sanitized):", hostSan || "(empty)");
  console.log("PORT (env):", process.env.SMTP_PORT);
  console.log("PORT (effective):", smtpEffectivePort());
  console.log("USER:", process.env.SMTP_USER);
  console.log("PASS:", process.env.SMTP_PASS ? "SET" : "MISSING");
  console.log("FROM:", process.env.EMAIL_FROM);
}

export async function verifySmtpConnection() {
  const t = getMailTransporter();
  if (!t) {
    console.error("SMTP ERROR: not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)");
    return;
  }
  try {
    await t.verify();
    console.log("SMTP READY");
  } catch (err) {
    console.error("SMTP ERROR:", err?.message || err);
    console.error(err?.stack || "");
  }
}

/**
 * Single choke point for outbound mail: logs every attempt, never throws.
 */
export async function safeSendMail(options) {
  const to = options?.to;
  const subject = options?.subject ?? "";
  console.log(`[email] attempt recipient=${to} subject=${subject}`);

  const t = getMailTransporter();
  if (!t) {
    console.error("NO SMTP CONFIG");
    return { delivered: false, reason: "no_smtp" };
  }

  const from = options.from || resolveFromForSmtp();
  try {
    const info = await t.sendMail({ ...options, from });
    console.log("EMAIL SENT:", info.messageId, "recipient=", to, "subject=", subject);
    logger.info(`email sent to=${to} subject=${subject} messageId=${info.messageId}`);
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error("EMAIL ERROR:", err?.message || err);
    console.error(err?.stack || "");
    logger.error(`email failed to=${to} subject=${subject}: ${err?.message || err}${err?.stack ? `\n${err.stack}` : ""}`);
    console.log("===== FALLBACK EMAIL =====");
    console.log("TO:", to);
    console.log("SUBJECT:", subject);
    console.log("TEXT:", options.text ?? "(html only)");
    console.log("==========================");
    return { delivered: false, reason: "smtp_failed" };
  }
}

/** One-shot SMTP test (debug route). */
export async function sendTestEmailNow(to) {
  const subject = "InvestPro API — SMTP test";
  const text = "If you receive this, outbound SMTP from the API is working.";
  const html = `<p style="font-family:sans-serif">${escapeHtml(text)}</p>`;
  return safeSendMail({ to, subject, text, html });
}

function buildPasswordChangeVerifyEmailPayload({ name, code, when, ip, userAgent, requestId }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const safeWhen = escapeHtml(when);
  const safeIp = escapeHtml(ip);
  const safeUa = escapeHtml(userAgent);
  const safeReq = escapeHtml(requestId);
  const subject = "Verify Your Password Change";
  const text = `Hello ${String(name ?? "")},\n\nYour verification code is: ${String(code ?? "")}\n\nReference ID (enter in the app if asked): ${String(requestId ?? "")}\n\nThis code expires in 10 minutes.\n\nRequest context:\nTime: ${String(when ?? "")}\nIP: ${String(ip ?? "")}\nDevice: ${String(userAgent ?? "")}\n\nIf you did not request a password change, secure your account immediately.\n\n— InvestPro`;

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0; padding:0; background-color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" style="max-width:560px; background-color:#1e293b; border-radius:16px; border:1px solid #334155;">
<tr><td style="padding:40px; font-family:Arial, Helvetica, sans-serif;">
<p style="margin:0 0 8px; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#64748b;">InvestPro</p>
<p style="margin:0 0 16px; font-size:22px; font-weight:bold; color:#f8fafc;">Verify your password change</p>
<p style="margin:0 0 24px; font-size:15px; line-height:24px; color:#94a3b8;">Hi <span style="color:#e2e8f0;">${safeName}</span>, enter this code in the app to confirm your new password.</p>
<table role="presentation" width="100%" style="background-color:#0f172a; border-radius:12px; border:1px solid #334155;"><tr><td align="center" style="padding:28px 24px; font-family:monospace; font-size:36px; font-weight:bold; letter-spacing:8px; color:#38bdf8;">${safeCode}</td></tr></table>
<p style="margin:16px 0 0; font-size:13px; color:#94a3b8;"><strong>Reference ID</strong><br/><span style="font-family:monospace; color:#e2e8f0;">${safeReq}</span></p>
<table role="presentation" width="100%" style="margin-top:20px; font-size:13px; color:#94a3b8;"><tr><td><strong>Time</strong> ${safeWhen}</td></tr><tr><td><strong>IP</strong> ${safeIp}</td></tr><tr><td style="word-break:break-all;"><strong>Device</strong> ${safeUa}</td></tr></table>
<p style="margin:24px 0 0; font-size:13px; line-height:20px; color:#64748b;">This code expires in <strong style="color:#94a3b8;">10 minutes</strong>. Never share it with anyone.</p>
</td></tr>
<tr><td style="padding:0 40px 32px; border-top:1px solid #334155; font-size:12px; line-height:18px; color:#64748b; text-align:center;">If you did not start this change, someone may have access to your account.</td></tr>
</table>
</td></tr>
</table>
</body></html>`;

  return { subject, text, html };
}

function buildVerificationEmailPayload({ name, code }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const subject = "Verify your InvestPro account";
  const text = `Hello ${String(name ?? "")},\n\nYour verification code is: ${String(code ?? "")}\n\nThis code expires in 1 hour.\n\nIf you did not request this, you can ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(subject)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0; padding:0; width:100%; background-color:#0f172a; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0; padding:0; width:100%; background-color:#0f172a; border-collapse:collapse;">
<tr>
<td align="center" style="padding:32px 16px 48px 16px; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%; max-width:560px; border-collapse:collapse;">
<tr>
<td style="padding:0 0 24px 0; text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td align="center" style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#64748b;">InvestPro</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#1e293b; border-radius:16px; border:1px solid #334155; overflow:hidden;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:40px 40px 32px 40px; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:22px; line-height:28px; font-weight:bold; color:#f8fafc;">Verify your identity</td>
</tr>
<tr>
<td style="padding:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:24px; color:#94a3b8;">Welcome, <span style="color:#e2e8f0;">${safeName}</span>. Use the code below to complete your email verification and secure your account.</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background-color:#0f172a; border-radius:12px; border:1px solid #334155;">
<tr>
<td align="center" style="padding:28px 24px 28px 24px; font-family:Arial, Helvetica, 'Courier New', monospace; font-size:36px; line-height:44px; font-weight:bold; letter-spacing:8px; color:#38bdf8;">${safeCode}</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:24px 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#64748b;">This verification code expires in <span style="color:#94a3b8;">1 hour</span> for your security.</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0 auto; border-collapse:collapse;">
<tr>
<td align="center" bgcolor="#2563eb" style="border-radius:10px; background-color:#2563eb;">
<a href="#" style="display:inline-block; padding:14px 40px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:10px;">Verify</a>
</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:20px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#64748b; text-align:center;">This button is for display only - enter the code above in the app to continue.</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 40px 32px 40px; border-top:1px solid #334155; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#64748b; text-align:center;">If you didn&#39;t request this email, you can safely ignore it. No changes will be made to your account.</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:28px 16px 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:11px; line-height:16px; color:#475569; text-align:center;">&copy; InvestPro. Secure investing. This message was sent to a registered address.</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

function buildPasswordResetEmailPayload({ name, code }) {
  const safeName = escapeHtml(name);
  const safeCode = escapeHtml(code);
  const subject = "Reset your InvestPro password";
  const text = `Hello ${String(name ?? "")},\n\nYour password reset code is: ${String(code ?? "")}\n\nThis code expires in 1 hour.\n\nIf you did not request a reset, you can ignore this email.`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<title>${escapeHtml(subject)}</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
</head>
<body style="margin:0; padding:0; width:100%; background-color:#0f172a; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0; padding:0; width:100%; background-color:#0f172a; border-collapse:collapse;">
<tr>
<td align="center" style="padding:32px 16px 48px 16px; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%; max-width:560px; border-collapse:collapse;">
<tr>
<td style="padding:0 0 24px 0; text-align:center;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td align="center" style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#64748b;">InvestPro</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="background-color:#1e293b; border-radius:16px; border:1px solid #334155; overflow:hidden;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:40px 40px 32px 40px; font-family:Arial, Helvetica, sans-serif;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:0 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:22px; line-height:28px; font-weight:bold; color:#f8fafc;">Reset your password</td>
</tr>
<tr>
<td style="padding:0 0 24px 0; font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:24px; color:#94a3b8;">Hi <span style="color:#e2e8f0;">${safeName}</span>, we received a request to reset your password. Enter the code below in the app to choose a new password.</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse; background-color:#0f172a; border-radius:12px; border:1px solid #334155;">
<tr>
<td align="center" style="padding:28px 24px 28px 24px; font-family:Arial, Helvetica, 'Courier New', monospace; font-size:36px; line-height:44px; font-weight:bold; letter-spacing:8px; color:#38bdf8;">${safeCode}</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:24px 0 8px 0; font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#64748b;">This reset code expires in <span style="color:#94a3b8;">1 hour</span>. If you did not request this, you can ignore this message.</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 0 auto; border-collapse:collapse;">
<tr>
<td align="center" bgcolor="#7c3aed" style="border-radius:10px; background-color:#7c3aed;">
<span style="display:inline-block; padding:14px 40px; font-family:Arial, Helvetica, sans-serif; font-size:14px; line-height:18px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:10px;">Reset password</span>
</td>
</tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;">
<tr>
<td style="padding:20px 0 0 0; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#64748b; text-align:center;">For your security, never share this code. Enter it only in the official InvestPro app.</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:24px 40px 32px 40px; border-top:1px solid #334155; font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:18px; color:#64748b; text-align:center;">If you didn&#39;t request a password reset, your password will stay the same.</td>
</tr>
</table>
</td>
</tr>
<tr>
<td style="padding:28px 16px 0 16px; font-family:Arial, Helvetica, sans-serif; font-size:11px; line-height:16px; color:#475569; text-align:center;">&copy; InvestPro. Secure investing. This message was sent to a registered address.</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

/** When no account exists: same anti-enumeration goal as before, but no fake 6-digit code. */
function buildPasswordResetNoAccountPayload({ name }) {
  const safeName = escapeHtml(name);
  const subject = "InvestPro password reset request";
  const text = `Hello,\n\nWe received a password reset request for this email address.\n\nIf you have an InvestPro account, make sure you use the exact same email you registered with (no typos), then request a new code from the app.\n\nIf you do not have an account with us, you can ignore this message.\n\n— InvestPro`;

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0; padding:0; background-color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a; padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" style="max-width:560px; background-color:#1e293b; border-radius:16px; border:1px solid #334155;">
<tr><td style="padding:40px; font-family:Arial, Helvetica, sans-serif;">
<p style="margin:0 0 16px 0; font-size:22px; font-weight:bold; color:#f8fafc;">Password reset request</p>
<p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#94a3b8;">Hi <span style="color:#e2e8f0;">${safeName}</span>, we received a request to reset a password for this address.</p>
<p style="margin:0 0 16px 0; font-size:15px; line-height:24px; color:#94a3b8;">If you have an InvestPro account, open the app and request a new reset code, using the <strong style="color:#e2e8f0;">same email you used when you signed up</strong> (check spelling).</p>
<p style="margin:0; font-size:15px; line-height:24px; color:#94a3b8;">If you did not ask for this, you can ignore this email.</p>
</td></tr>
<tr><td style="padding:0 40px 32px 40px; border-top:1px solid #334155; font-size:12px; line-height:18px; color:#64748b; text-align:center;">&copy; InvestPro</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject, text, html };
}

export async function sendPasswordResetNoAccountEmail({ to, name }) {
  const tpl = buildPasswordResetNoAccountPayload({ name });
  console.log("[emailService] password reset (no matching account) to=", to);

  const result = await safeSendMail({
    to,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });

  if (!result.delivered) {
    console.log("[emailService] password reset no-account email not delivered:", result.reason ?? "unknown");
    return {
      delivered: false,
      reason: result.reason === "no_smtp" ? "smtp_not_configured" : "smtp_send_failed",
      skipped: true,
    };
  }
  return { delivered: true, messageId: result.messageId };
}

export async function sendMail({ to, subject, text, html }) {
  const result = await safeSendMail({ to, subject, text, html });
  if (result.delivered) {
    return { skipped: false, messageId: result.messageId };
  }
  if (result.reason === "no_smtp") {
    return { skipped: true, reason: "smtp_not_configured" };
  }
  const err = new Error(`sendMail failed: ${result.reason}`);
  throw err;
}

export async function sendVerificationEmail({ to, name, code }) {
  const tpl = buildVerificationEmailPayload({ name, code });
  const result = await safeSendMail({
    to,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });

  if (!result.delivered) {
    logger.warn(`Verification email not delivered to=${to} reason=${result.reason ?? "unknown"} (code not logged)`);
    return {
      delivered: false,
      reason: result.reason === "no_smtp" ? "smtp_not_configured" : "smtp_send_failed",
      skipped: true,
    };
  }
  return { delivered: true, messageId: result.messageId };
}

export async function sendPasswordChangeAlertEmail({ to, name, when, ip, userAgent }) {
  const tpl = passwordChangeRequestedAlertEmail({ name, when, ip, userAgent });
  const result = await safeSendMail({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
  if (!result.delivered) {
    logger.warn(`Password-change alert not delivered to=${to} reason=${result.reason ?? "unknown"}`);
    return { delivered: false, reason: result.reason };
  }
  return { delivered: true, messageId: result.messageId };
}

export async function sendPasswordChangeVerifyEmail({ to, name, code, when, ip, userAgent, requestId }) {
  const tpl = buildPasswordChangeVerifyEmailPayload({ name, code, when, ip, userAgent, requestId });
  const result = await safeSendMail({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
  if (!result.delivered) {
    logger.warn(`Password-change OTP email not delivered to=${to} reason=${result.reason ?? "unknown"} (code not logged)`);
    return {
      delivered: false,
      reason: result.reason === "no_smtp" ? "smtp_not_configured" : "smtp_send_failed",
      skipped: true,
    };
  }
  return { delivered: true, messageId: result.messageId };
}

export async function sendPasswordResetEmail({ to, name, code }) {
  const tpl = buildPasswordResetEmailPayload({ name, code });
  const result = await safeSendMail({
    to,
    subject: tpl.subject,
    text: tpl.text,
    html: tpl.html,
  });

  if (!result.delivered) {
    logger.warn(`Password reset email not delivered to=${to} reason=${result.reason ?? "unknown"} (reset code not logged)`);
    return {
      delivered: false,
      reason: result.reason === "no_smtp" ? "smtp_not_configured" : "smtp_send_failed",
      skipped: true,
    };
  }
  return { delivered: true, messageId: result.messageId };
}

function buildTransactionExecutedNotificationPayload({
  name,
  type,
  ticker,
  assetName,
  quantity,
  priceAtExecution,
  date,
  currency,
}) {
  const safeName = escapeHtml(name);
  const label = type === "BUY" ? "Achat" : "Vente";
  const safeTicker = escapeHtml(ticker);
  const safeAsset = escapeHtml(assetName);
  const safeDate = escapeHtml(date);
  const cur = escapeHtml(String(currency ?? "TND"));
  const qty = escapeHtml(String(quantity));
  const px = escapeHtml(String(priceAtExecution));
  const subject = `InvestPro — ${label} ${String(ticker ?? "").trim()}`;
  const text = `Bonjour ${String(name ?? "")},\n\n${label} enregistré(e) sur votre compte.\n\nActif : ${ticker} — ${assetName}\nQuantité : ${quantity}\nPrix : ${priceAtExecution} ${currency}\nDate : ${date}\n\n— InvestPro`;
  const html = `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#e2e8f0;">Bonjour ${safeName},</p>
<p style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#94a3b8;"><strong style="color:#e2e8f0;">${escapeHtml(
    label
  )}</strong> enregistré(e) sur votre compte.</p>
<table style="font-family:Arial,sans-serif;font-size:14px;color:#cbd5e1;margin:12px 0;border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Actif</td><td>${safeTicker} — ${safeAsset}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Quantité</td><td>${qty}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Prix</td><td>${px} ${cur}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Date</td><td>${safeDate}</td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">— InvestPro</p>`;
  return { subject, text, html };
}

/** Outbound notification after a trade; uses safeSendMail (never throws). */
export async function sendTransactionExecutedNotificationEmail({
  to,
  name,
  type,
  ticker,
  assetName,
  quantity,
  priceAtExecution,
  date,
  currency,
}) {
  const tpl = buildTransactionExecutedNotificationPayload({
    name,
    type,
    ticker,
    assetName,
    quantity,
    priceAtExecution,
    date,
    currency,
  });
  return safeSendMail({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
}

function buildPriceVariationPortfolioAlertPayload({ name, ticker, assetName, variationPercent, currentPrice }) {
  const safeName = escapeHtml(name);
  const safeTicker = escapeHtml(ticker);
  const safeAsset = escapeHtml(assetName);
  const v = Number(variationPercent);
  const vStr = Number.isFinite(v) ? v.toFixed(2) : String(variationPercent);
  const px = Number(currentPrice);
  const pxStr = Number.isFinite(px) ? px.toFixed(4) : String(currentPrice);
  const subject = `InvestPro — Alerte prix : ${String(ticker ?? "").trim()} (${vStr}%)`;
  const text = `Bonjour ${String(name ?? "")},\n\nVariation importante sur un titre de votre portefeuille.\n\n${ticker} — ${assetName}\nVariation : ${vStr}%\nCours : ${pxStr}\n\n— InvestPro`;
  const html = `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#e2e8f0;">Bonjour ${safeName},</p>
<p style="font-family:Arial,sans-serif;font-size:15px;line-height:22px;color:#94a3b8;">Variation importante sur un titre de <strong style="color:#e2e8f0;">votre portefeuille</strong>.</p>
<table style="font-family:Arial,sans-serif;font-size:14px;color:#cbd5e1;margin:12px 0;border-collapse:collapse;">
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Titre</td><td>${safeTicker} — ${safeAsset}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Variation</td><td>${escapeHtml(vStr)}%</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Cours</td><td>${escapeHtml(pxStr)}</td></tr>
</table>
<p style="font-family:Arial,sans-serif;font-size:12px;color:#64748b;">— InvestPro</p>`;
  return { subject, text, html };
}

export async function sendPriceVariationPortfolioAlertEmail({
  to,
  name,
  ticker,
  assetName,
  variationPercent,
  currentPrice,
}) {
  const tpl = buildPriceVariationPortfolioAlertPayload({
    name,
    ticker,
    assetName,
    variationPercent,
    currentPrice,
  });
  return safeSendMail({ to, subject: tpl.subject, text: tpl.text, html: tpl.html });
}
