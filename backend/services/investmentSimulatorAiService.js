import config from "../config/index.js";
import { logger } from "../utils/logger.js";

/**
 * @param {Record<string, unknown>} math
 * @param {"portfolio"|"custom"|undefined} returnSource
 */
function fallbackExplanation(math, lang, returnSource) {
  const isFr = lang === "fr";
  const { monthlyInvestment, years, annualReturnPercent, finalValue, totalContributions, gain, months } = math;
  const srcLine =
    returnSource === "portfolio"
      ? isFr
        ? "Le taux annuel affiché est une estimation basée sur votre portefeuille (historique externe agrégé, avec repli prudents si les données sont incomplètes)."
        : "The annual rate shown is estimated from your portfolio (external history aggregated, with conservative fallbacks when data is incomplete)."
      : returnSource === "custom"
        ? isFr
          ? "Le taux annuel affiché est une hypothèse manuelle que vous avez choisie."
          : "The annual rate shown is a manual assumption you selected."
        : "";
  if (isFr) {
    return [
      `Simulation sur ${years} an(s) (${months} mois), versement mensuel de ${monthlyInvestment.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} et rendement nominal annuel de ${annualReturnPercent} % capitalisé mensuellement.`,
      srcLine,
      `Capital investi cumulé : ${totalContributions.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}. Valeur projetée : ${finalValue.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}.`,
      `Intérêts composés (effet « intérêts sur intérêts ») : +${gain.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} par rapport aux seuls versements.`,
      "Rappel : projection mathématique, pas une garantie de performance future.",
    ]
      .filter(Boolean)
      .join("\n\n");
  }
  return [
    `Horizon ${years} year(s) (${months} months), ${monthlyInvestment.toLocaleString("en-US", { maximumFractionDigits: 2 })} contributed each month, ${annualReturnPercent}% nominal annual return compounded monthly.`,
    srcLine,
    `Total contributed: ${totalContributions.toLocaleString("en-US", { maximumFractionDigits: 2 })}. Projected ending balance: ${finalValue.toLocaleString("en-US", { maximumFractionDigits: 2 })}.`,
    `Compound growth vs contributions alone: +${gain.toLocaleString("en-US", { maximumFractionDigits: 2 })}.`,
    "Educational projection only — not a forecast or personal advice.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * @param {ReturnType<import("./investmentSimulationMath.js").computeInvestmentSimulation>} math
 * @param {"fr"|"en"} lang
 * @param {{ returnSource?: "portfolio"|"custom" }} [opts]
 */
export async function explainSimulation(math, lang, opts = {}) {
  const L = lang === "en" ? "en" : "fr";
  const returnSource = opts.returnSource;
  const key = config.openai?.apiKey?.trim();
  if (!key) {
    return { explanation: fallbackExplanation(math, L, returnSource), source: "template" };
  }

  const payload = {
    monthlyInvestment: math.monthlyInvestment,
    years: math.years,
    annualReturnPercent: math.annualReturnPercent,
    returnSource: returnSource ?? null,
    months: math.months,
    finalValue: math.finalValue,
    totalContributions: math.totalContributions,
    gain: math.gain,
    gainPercent: math.gainPercent,
    assumption: math.assumption,
    curveSample: (() => {
      const c = math.curve;
      if (c.length <= 12) return c;
      const mid = Math.floor(c.length / 2);
      return [c[0], c[mid], c[c.length - 1]];
    })(),
  };

  const body = {
    model: config.openai.model,
    temperature: 0.35,
    messages: [
      {
        role: "system",
        content:
          L === "fr"
            ? "Tu es un éducateur finance. Explique brièvement (3–5 courts paragraphes) une simulation d’investissement à versements mensuels et intérêts composés. Utilise uniquement les chiffres fournis. Rappelle que c’est une projection, pas un conseil personnalisé. Pas de Markdown."
            : "You are a finance educator. In 3–5 short paragraphs, explain the investment simulation using only the numbers provided. Stress it is a projection, not personal advice. No Markdown.",
      },
      {
        role: "user",
        content: `JSON metrics:\n${JSON.stringify(payload)}`,
      },
    ],
  };

  const url = `${config.openai.baseUrl.replace(/\/$/, "")}/chat/completions`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      logger.warn("OpenAI simulate explanation failed", { status: res.status, body: t.slice(0, 500) });
      return { explanation: fallbackExplanation(math, L, returnSource), source: "template" };
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) {
      return { explanation: text.trim(), source: "openai" };
    }
  } catch (e) {
    logger.warn("OpenAI simulate explanation error", { err: String(e) });
  }

  return { explanation: fallbackExplanation(math, L, returnSource), source: "template" };
}
