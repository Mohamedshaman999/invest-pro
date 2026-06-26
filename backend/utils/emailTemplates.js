export function newDeviceAlertEmail({ name, ip, userAgent, when }) {
  const subject = "New sign-in to your InvestPro account";
  const text = `Hello ${name},\n\nWe noticed a sign-in from a new device.\n\nTime: ${when}\nIP: ${ip}\nDevice: ${userAgent}\n\nIf this was you, no action is needed. If not, change your password immediately.`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f4f6f8; margin:0; padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; padding:32px; box-shadow:0 4px 24px rgba(15,23,42,.08);">
        <tr><td>
          <p style="margin:0 0 8px; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#64748b;">InvestPro Security</p>
          <h1 style="margin:0 0 16px; font-size:22px; color:#0f172a;">New device sign-in</h1>
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#334155;">Hello ${escapeHtml(name)}, we detected a login from a device we have not seen before on your account.</p>
          <table style="width:100%; font-size:14px; color:#334155; border-collapse:collapse;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;"><strong>Time</strong></td><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">${escapeHtml(when)}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;"><strong>IP address</strong></td><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">${escapeHtml(ip)}</td></tr>
            <tr><td style="padding:8px 0;"><strong>Device</strong></td><td style="padding:8px 0; word-break:break-all;">${escapeHtml(userAgent)}</td></tr>
          </table>
          <p style="margin:24px 0 0; font-size:13px; color:#64748b;">If this was you, you can ignore this email. If not, secure your account by resetting your password.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Immediate alert when an authenticated user starts a password change (no OTP in this email). */
export function passwordChangeRequestedAlertEmail({ name, when, ip, userAgent }) {
  const subject = "Password Change Requested";
  const text = `Hello ${name},\n\nA request to change your password was made.\n\nTimestamp: ${when}\nIP address: ${ip}\nDevice: ${userAgent}\n\nIf this was not you, secure your account immediately.\n\n— InvestPro`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; background:#f4f6f8; margin:0; padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border-radius:12px; padding:32px; box-shadow:0 4px 24px rgba(15,23,42,.08);">
        <tr><td>
          <p style="margin:0 0 8px; font-size:13px; letter-spacing:.08em; text-transform:uppercase; color:#64748b;">InvestPro Security</p>
          <h1 style="margin:0 0 16px; font-size:22px; color:#0f172a;">Password change requested</h1>
          <p style="margin:0 0 16px; font-size:15px; line-height:1.6; color:#334155;">A request to change your password was made. If this was not you, secure your account immediately.</p>
          <table style="width:100%; font-size:14px; color:#334155; border-collapse:collapse;">
            <tr><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;"><strong>Timestamp</strong></td><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">${escapeHtml(when)}</td></tr>
            <tr><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;"><strong>IP address</strong></td><td style="padding:8px 0; border-bottom:1px solid #e2e8f0;">${escapeHtml(ip)}</td></tr>
            <tr><td style="padding:8px 0;"><strong>Device</strong></td><td style="padding:8px 0; word-break:break-all;">${escapeHtml(userAgent)}</td></tr>
          </table>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  return { subject, text, html };
}
