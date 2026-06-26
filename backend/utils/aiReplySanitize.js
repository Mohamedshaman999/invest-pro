/**
 * Nettoie le texte assistant avant envoi au client (pas de métadonnées / fuites).
 * @param {string} raw
 * @param {{ userQuestion?: string }} [opts]
 */
export function sanitizeAssistantReply(raw, opts = {}) {
  if (typeof raw !== "string") return "";
  let s = raw.replace(/\r\n/g, "\n");

  s = s.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/gi, "");
  s = s.replace(/\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\b/g, "");
  s = s.replace(/\b\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\b/g, "");

  s = s.replace(/^\s*\{[^}]*"(?:level|timestamp|severity)"[^}]*\}\s*$/gm, "");
  s = s.replace(/^\s*\[[\dTZ:.+-]+\]\s*\[(?:warn|error|info|debug)\]/gim, "");

  const q = typeof opts.userQuestion === "string" ? opts.userQuestion.trim() : "";
  if (q.length >= 8) {
    const tail = s.trimEnd();
    if (tail.toLowerCase().endsWith(q.toLowerCase())) {
      s = tail.slice(0, tail.length - q.length).trimEnd();
    }
    const para = s.split(/\n\n+/);
    const filtered = para.filter((p) => p.trim().toLowerCase() !== q.toLowerCase());
    s = filtered.join("\n\n");
  }

  const lines = s.split("\n");
  const deduped = [];
  let prevNonEmpty = null;
  for (const line of lines) {
    const t = line.trim();
    if (t && prevNonEmpty === t) continue;
    deduped.push(line);
    if (t) prevNonEmpty = t;
  }
  s = deduped.join("\n");

  s = s.replace(/\bmoderate movement\b/gi, "");
  s = s.replace(/\bmouvement modéré\b/gi, "");

  const bannedJargon = [
    "auction tightens range",
    "balanced auction",
    "fair value flow",
    "fair-value flow",
    "two-way flow",
    "two-sided flow",
    "fair-value discovery",
    "around fair value",
    "anchoring the range",
    "volume clustering near current prints",
    "prints compress extremes",
    "enchère équilibrée",
    "flux bilatéral",
    "valeur équitable",
    "juste valeur",
  ];
  for (const phrase of bannedJargon) {
    const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    s = s.replace(new RegExp(esc, "gi"), "");
  }

  s = s.replace(/\s+\n/g, "\n").replace(/[ \t]{2,}/g, " ");

  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return s;
}
