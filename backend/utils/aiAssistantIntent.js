/** Mots anglais courants en majuscules à ignorer comme faux tickers. */
const EN_STOP_UPPER = new Set([
  "THE",
  "AND",
  "FOR",
  "YOU",
  "ARE",
  "BUT",
  "NOT",
  "ALL",
  "CAN",
  "HER",
  "WAS",
  "ONE",
  "OUR",
  "OUT",
  "DAY",
  "GET",
  "HAS",
  "HIM",
  "HIS",
  "HOW",
  "ITS",
  "LET",
  "MAY",
  "NEW",
  "NOW",
  "OLD",
  "SEE",
  "WAY",
  "WHO",
  "WHY",
  "YES",
  "SUP",
  "WHAT",
  "THAT",
  "THIS",
  "WITH",
  "FROM",
  "HAVE",
  "BEEN",
  "LIKE",
  "JUST",
  "WHEN",
  "THAN",
  "THEN",
  "THEM",
  "THESE",
  "THOSE",
  "HERE",
  "COME",
  "MAKE",
  "INTO",
  "OVER",
  "ALSO",
  "BACK",
  "ONLY",
  "KNOW",
  "TAKE",
  "YEAR",
  "WORK",
  "SUCH",
  "GIVE",
  "MOST",
  "VERY",
  "AFTER",
  "WELL",
  "MORE",
  "LOVE",
  "HELP",
  "PLEASE",
  "TELL",
  "ABOUT",
  "GOOD",
  "BAD",
  "ANY",
  "SOME",
]);

/**
 * Séquence type ticker en capitales (plateforme BVMT / symboles courts).
 * @param {string} msg
 */
function hasLikelyTickerToken(msg) {
  const matches = msg.match(/\b[A-Z]{3,5}\b/g);
  if (!matches || matches.length > 6) return false;
  return matches.some((t) => !EN_STOP_UPPER.has(t));
}

/**
 * @param {string} rawMessage
 * @param {{ stockContextTicker?: boolean }} [opts]
 * @returns {"financial"|"casual"}
 */
export function classifyAiAssistantIntent(rawMessage, opts = {}) {
  const m = String(rawMessage || "").trim();
  const lower = m.toLowerCase();

  if (opts.stockContextTicker) return "financial";

  const financial =
    /(best\s+perform|top\s*\d+|top\s+(?:ten|10|dix|stock\b|stocks?)|meilleur|performeur|classement|portefeuille|portfolio|performance\s+(?:du\s+)?portefeuille|cours\b|prix\s+d.*action|variation\b|volatilité|volatility|investissement|\bstock\b|\bstocks\b|\baction\b|\bactions\b|\bmarché\b|\bmarkets?\b|bvmt|bourse|capitalisation|symbole|ticker|chandelier|candlestick|rsi\b|macd\b|analyse\s+technique|technical\s+analysis|tell\s+me\s+about|parle[\s-]?moi\s+de|résume|resume\s+stock)/i.test(
      m
    ) ||
    /(combien|what\s+is\s+the\s+price|quel\s+cours|valeur\s+de\s+l.*action)/i.test(lower);

  if (financial) return "financial";

  if (hasLikelyTickerToken(m)) return "financial";

  const casualCue =
    /^(?:hi|hello|hey|bonjour|salut|coucou|good\s+(?:morning|afternoon|evening)|bonne\s+journée)[\s!,?.]*$/i.test(m) ||
    /how\s+are\s+you|what'?s\s+up|^sup\b|ça\s+va\b|comment\s+allez-vous|comment\s+tu\s+vas|comment\s+ça\s+va/i.test(lower) ||
    /^(?:thanks|thank\s+you|merci|thx|bye|goodbye|au\s+revoir|à\s+bientôt)[\s!.]*$/i.test(m);

  if (casualCue) return "casual";

  /** Questions générales sans lexique marché : rester conversationnel. */
  if (
    m.length < 220 &&
    !/\d/.test(m) &&
    !/(€|\$|%|points?\b|basis)/i.test(m) &&
    !financial
  ) {
    return "casual";
  }

  return "financial";
}

/**
 * @param {"fr"|"en"} lang
 * @param {string} rawMessage
 */
export function buildCasualAssistantReply(lang, rawMessage) {
  const lower = String(rawMessage || "").trim().toLowerCase();

  if (lang === "en") {
    if (/how\s+are\s+you|what'?s\s+up|^sup\b/.test(lower)) {
      return "I'm doing well — how can I help you with the markets today?";
    }
    if (/^(hi|hello|hey)\b/.test(lower)) {
      return "Hi — how can I help you with the markets today?";
    }
    if (/^(thanks|thank\s+you|thx)\b/.test(lower)) {
      return "You're welcome — happy to help anytime.";
    }
    if (/^(bye|goodbye)\b/.test(lower)) {
      return "Goodbye — reach out whenever you need market insights.";
    }
    return "I'm here to help — what would you like to know about stocks or your portfolio?";
  }

  if (/comment\s+allez-vous|comment\s+tu\s+vas|comment\s+ça\s+va|\bça\s+va\b/.test(lower)) {
    return "Je vais bien — comment puis-je vous aider sur les marchés aujourd'hui ?";
  }
  if (/^(salut|bonjour|coucou|hey)\b/.test(lower)) {
    return "Bonjour — comment puis-je vous aider sur les marchés aujourd'hui ?";
  }
  if (/^(merci|thanks|thank\s+you)\b/.test(lower)) {
    return "Avec plaisir — je reste disponible.";
  }
  if (/^(au\s+revoir|bye|à\s+bientôt)\b/.test(lower)) {
    return "À bientôt — revenez quand vous voulez pour le marché.";
  }
  return "Je suis là pour vous aider — que souhaitez-vous savoir sur les actions ou votre portefeuille ?";
}
