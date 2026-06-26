const INJECTION_PATTERNS = [
  /\bignore (all )?(previous|prior|above) instructions\b/gi,
  /\bdisregard (all )?(previous|prior) rules\b/gi,
  /\bsystem\s*:\s*/gi,
  /\bassistant\s*:\s*/gi,
  /\[\[SYSTEM\]\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /\{\s*"role"\s*:\s*"system"/gi,
];

/**
 * @param {unknown} raw
 * @param {number} maxLen
 */
export function sanitizeAiUserMessage(raw, maxLen = 6000) {
  let s = String(raw ?? "")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLen);
  for (const p of INJECTION_PATTERNS) {
    s = s.replace(p, "[removed]");
  }
  return s.trim();
}
