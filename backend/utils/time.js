export function addJwtStyleDuration(baseDate, duration) {
  const s = String(duration || "7d").trim();
  const m = s.match(/^(\d+)([smhd])$/i);
  const d = new Date(baseDate);
  if (!m) {
    d.setDate(d.getDate() + 7);
    return d;
  }
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === "s") d.setSeconds(d.getSeconds() + n);
  else if (u === "m") d.setMinutes(d.getMinutes() + n);
  else if (u === "h") d.setHours(d.getHours() + n);
  else if (u === "d") d.setDate(d.getDate() + n);
  return d;
}
