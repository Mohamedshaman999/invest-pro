export type CardType = "visa" | "mastercard" | "amex" | "discover" | "unknown";

export function normalizeDigits(value: string) {
  return value.replace(/\D/g, "");
}

/** Mastercard 51–55 or 2221–2720 (first four digits when length ≥ 4). */
function isMastercardBin(digits: string) {
  if (digits.length < 2) return false;
  const n2 = parseInt(digits.slice(0, 2), 10);
  if (n2 >= 51 && n2 <= 55) return true;
  if (digits.length >= 4) {
    const four = parseInt(digits.slice(0, 4), 10);
    if (four >= 2221 && four <= 2720) return true;
  }
  return false;
}

export function formatCardNumber(value: string) {
  const digits = normalizeDigits(value);
  const isAmex = /^3[47]/.test(digits);
  const maxLen = isAmex ? 15 : 19;
  const slice = digits.slice(0, maxLen);
  if (isAmex) {
    const a = slice.slice(0, 4);
    const b = slice.slice(4, 10);
    const c = slice.slice(10, 15);
    return [a, b, c].filter((p) => p.length > 0).join(" ");
  }
  return slice.replace(/(.{4})/g, "$1 ").trim();
}

/**
 * MM/YY with slash; corrects impossible months (e.g. 13 → 01/…) and rejects 00.
 */
export function formatExpiryDate(value: string) {
  let d = normalizeDigits(value).slice(0, 4);
  if (d.length === 0) return "";

  if (d.length >= 2) {
    let m = parseInt(d.slice(0, 2), 10);
    if (m > 12) {
      d = `0${d[0]}${d.slice(1)}`.slice(0, 4);
      m = parseInt(d.slice(0, 2), 10);
    }
    if (m === 0) {
      d = d.slice(0, 1);
    }
  }

  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}/${d.slice(2)}`;
}

export function getCardType(value: string): CardType {
  const digits = normalizeDigits(value);
  if (/^4/.test(digits)) return "visa";
  if (isMastercardBin(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  return "unknown";
}

/** Digits expected when advancing focus (Amex 15, most others 16). */
export function getCardNumberCompleteLength(cardType: CardType) {
  if (cardType === "amex") return 15;
  if (cardType === "unknown") return 16;
  return 16;
}

/** True when digit count exceeds the usual length for the detected brand (show inline error). */
export function cardNumberExceedsBrandLength(digits: string, cardType: CardType) {
  if (cardType === "amex") return digits.length > 15;
  if (cardType === "unknown") return digits.length > 19;
  return digits.length > 16;
}

export function isValidLuhn(value: string) {
  const digits = normalizeDigits(value);
  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return digits.length > 0 && sum % 10 === 0;
}

export function isValidCardNumber(value: string) {
  const digits = normalizeDigits(value);
  return digits.length >= 13 && digits.length <= 19 && isValidLuhn(digits);
}

export function isValidExpiryDate(value: string) {
  const digits = normalizeDigits(value);
  if (digits.length !== 4) return false;

  const month = Number(digits.slice(0, 2));
  const year = Number(digits.slice(2, 4));
  if (Number.isNaN(month) || Number.isNaN(year)) return false;
  if (month < 1 || month > 12) return false;

  const current = new Date();
  const currentYear = current.getFullYear() % 100;
  const currentMonth = current.getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;

  return true;
}

export function isValidCvv(value: string, cardType: CardType) {
  const digits = normalizeDigits(value);
  if (cardType === "amex") {
    return digits.length === 4;
  }
  return digits.length === 3;
}

export function isValidCardholderName(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[A-Za-zÀ-ÖØ-öø-ÿ ]+$/.test(trimmed);
}

export function sanitizeNameInput(value: string) {
  return value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ ]+/g, "");
}

export function formatCardholderNameInput(value: string) {
  return sanitizeNameInput(value).toUpperCase();
}
