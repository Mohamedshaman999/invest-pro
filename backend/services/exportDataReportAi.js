import config from "../config/index.js";
import { logger } from "../utils/logger.js";
import { AppError } from "../utils/errors.js";

const SYSTEM_PROMPT =
  "You are a professional financial analyst generating a structured investment report. Be factual, concise, and do not invent missing data.";

const OUTPUT_INSTRUCTION = `Return ONLY valid JSON matching exactly this shape (no markdown, no prose outside JSON):
{
  "title": string,
  "summary": string,
  "sections": [ { "heading": string, "content": string } ],
  "keyMetrics": {
    "totalValue": number,
    "diversificationScore": number,
    "riskLevel": "Low" | "Medium" | "High"
  }
}`;

function extractJsonText(raw) {
  const t = String(raw).trim();
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(t);
  return fence ? fence[1].trim() : t;
}

function normalizeRiskLevel(v) {
  const s = String(v || "").toLowerCase();
  if (s === "low" || s === "medium" || s === "high") {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  return "Medium";
}

function clamp(n, min, max) {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  return Math.min(max, Math.max(min, x));
}

/**
 * @param {unknown} parsed
 * @param {{ portfolio: { summary: { totalValue: number } }, computedHints?: { diversificationScoreHint: number } | null }} dataset
 */
export function normalizeAndEnforceFacts(parsed, dataset) {
  const factualTotal = Number(dataset?.portfolio?.summary?.totalValue) || 0;
  const hint = dataset?.computedHints?.diversificationScoreHint;

  if (!parsed || typeof parsed !== "object") {
    throw new AppError("Invalid AI report shape", 502, "REPORT_PARSE_ERROR");
  }
  const o = /** @type {Record<string, unknown>} */ (parsed);
  const title = typeof o.title === "string" && o.title.trim() ? o.title.trim() : "Investment report";
  const summary = typeof o.summary === "string" && o.summary.trim() ? o.summary.trim() : "";
  let sections = Array.isArray(o.sections) ? o.sections : [];
  sections = sections
    .filter((s) => s && typeof s === "object")
    .map((s) => {
      const r = /** @type {Record<string, unknown>} */ (s);
      return {
        heading: typeof r.heading === "string" ? r.heading : "Section",
        content: typeof r.content === "string" ? r.content : "",
      };
    })
    .filter((s) => s.heading || s.content);
  if (!sections.length) {
    sections = [{ heading: "Overview", content: summary || "No additional structured sections were returned." }];
  }

  const km = o.keyMetrics && typeof o.keyMetrics === "object" ? /** @type {Record<string, unknown>} */ (o.keyMetrics) : {};
  const diversificationScore = clamp(
    Number.isFinite(Number(km.diversificationScore)) ? Number(km.diversificationScore) : hint ?? 0,
    0,
    100
  );

  return {
    title,
    summary,
    sections,
    keyMetrics: {
      totalValue: factualTotal,
      diversificationScore,
      riskLevel: normalizeRiskLevel(km.riskLevel),
    },
  };
}

function parseReportJson(text) {
  const jsonStr = extractJsonText(text);
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    logger.warn("export report JSON parse failed", { err: String(e), sample: jsonStr.slice(0, 240) });
    throw new AppError("Could not parse AI report", 502, "REPORT_PARSE_ERROR");
  }
}

/** @param {Awaited<ReturnType<typeof import("./exportDataReportDataset.js").buildExportDataset>>} dataset */
export async function generateStructuredReportJson(dataset) {
  const key = config.openai?.apiKey?.trim();
  if (!key) {
    throw new AppError("AI report generation is not configured", 503, "AI_UNAVAILABLE");
  }

  const body = {
    model: config.openai.model,
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: `${SYSTEM_PROMPT}\n\n${OUTPUT_INSTRUCTION}` },
      {
        role: "user",
        content: `Full user dataset (JSON):\n${JSON.stringify(dataset)}`,
      },
    ],
  };

  const url = `${String(config.openai.baseUrl || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;

  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    logger.warn("OpenAI export report network error", { err: String(e) });
    throw new AppError("Failed to reach AI service", 502, "AI_REQUEST_FAILED");
  }

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    logger.warn("OpenAI export report HTTP error", { status: res.status, body: t.slice(0, 500) });
    throw new AppError("Failed to generate AI report", 502, "AI_REQUEST_FAILED");
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new AppError("Empty AI response", 502, "AI_REQUEST_FAILED");
  }

  const parsed = parseReportJson(text);
  return normalizeAndEnforceFacts(parsed, dataset);
}

/** Rapport déterministe si l’API OpenAI est indisponible ou renvoie une erreur. */
export function buildFallbackStructuredReport(dataset) {
  const p = dataset.portfolio;
  const s = p.summary || {};
  const positions = p.positions || [];
  const cur = p.currency || "TND";

  const posLines = positions
    .map(
      (x) =>
        `• ${x.ticker} — ${x.name}: ${Number(x.lineValue).toFixed(2)} ${cur}` +
        (x.linePnL != null ? ` (P&L ${Number(x.linePnL).toFixed(2)} ${cur})` : "")
    )
    .join("\n");

  const allocText =
    (dataset.assetAllocation || [])
      .map((a) => `• ${a.category}: ${a.weightPercent}% (~${Number(a.value).toFixed(2)} ${cur})`)
      .join("\n") || "No category breakdown available.";

  const perf = dataset.performanceSummary;
  const perfText = perf
    ? `From ${perf.startDate} to ${perf.endDate}, aggregate portfolio value moved from ${Number(perf.startValue).toFixed(2)} to ${Number(perf.endValue).toFixed(2)}` +
        (perf.changePercent != null ? ` (${perf.changePercent > 0 ? "+" : ""}${perf.changePercent}%).` : ".")
    : "Not enough historical data to describe a performance trend.";

  const txCount = (dataset.transactions || []).length;
  const txText =
    txCount > 0
      ? `${txCount} recent transaction(s) on file (export capped).`
      : "No transactions returned for this export.";

  const hint = dataset.computedHints?.diversificationScoreHint ?? 0;
  const riskGuess = hint >= 70 ? "Low" : hint >= 35 ? "Medium" : "High";

  return normalizeAndEnforceFacts(
    {
      title: "InvestPro — Portfolio investment report",
      summary: [
        `You hold ${positions.length} position(s) with a total market value of ${Number(s.totalValue).toFixed(2)} ${cur}.`,
        `Cost basis approximately ${Number(s.investedAmount).toFixed(2)} ${cur}; mark-to-market P&L approximately ${Number(s.profitLoss).toFixed(2)} ${cur}.`,
        perfText,
      ].join(" "),
      sections: [
        { heading: "Holdings", content: posLines || "No line items." },
        { heading: "Allocation by category", content: allocText },
        { heading: "Transactions & performance context", content: `${txText}\n\n${perfText}` },
      ],
      keyMetrics: {
        totalValue: Number(s.totalValue) || 0,
        diversificationScore: hint,
        riskLevel: riskGuess,
      },
    },
    dataset
  );
}
