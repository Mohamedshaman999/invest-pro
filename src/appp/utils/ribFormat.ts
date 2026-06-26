/** Tunisian RIB: 20 digits in groups 2-3-13-2 (often described with this mask). */
export const RIB_DIGIT_COUNT = 20;
const GROUPS = [2, 3, 13, 2] as const;

export function normalizeRibDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, RIB_DIGIT_COUNT);
}

export function formatRibInput(value: string): string {
  const digits = normalizeRibDigits(value);
  const parts: string[] = [];
  let offset = 0;
  for (const len of GROUPS) {
    if (offset >= digits.length) break;
    parts.push(digits.slice(offset, offset + len));
    offset += len;
  }
  return parts.join(" ");
}

export function isCompleteRib(value: string): boolean {
  return normalizeRibDigits(value).length === RIB_DIGIT_COUNT;
}
