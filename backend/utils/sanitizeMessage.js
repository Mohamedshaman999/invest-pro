const MAX_LEN = 8000;

/**
 * Texte brut pour stockage / JSON : retire les chevrons pour limiter le XSS,
 * normalise les espaces et borne la longueur.
 */
export function sanitizeMessageContent(raw) {
  let s = String(raw ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .replace(/\s+/g, " ");
  s = s.replace(/</g, "").replace(/>/g, "");
  if (s.length > MAX_LEN) s = s.slice(0, MAX_LEN);
  return s;
}
