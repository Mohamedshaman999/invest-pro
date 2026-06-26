import config from "../config/index.js";

function trimKey(k) {
  return typeof k === "string" ? k.trim() : "";
}

/** @returns {{ baseUrl: string, apiKey: string, model: string }[]} */
function buildProviderChain() {
  const chain = [];
  const oa = config.openai;
  if (trimKey(oa?.apiKey)) {
    chain.push({
      baseUrl: oa.baseUrl || "https://api.openai.com/v1",
      apiKey: oa.apiKey.trim(),
      model: oa.model || "gpt-4o-mini",
    });
  }
  const g = config.groq;
  if (trimKey(g?.apiKey)) {
    chain.push({
      baseUrl: g.baseUrl || "https://api.groq.com/openai/v1",
      apiKey: g.apiKey.trim(),
      model: g.model || "llama-3.3-70b-versatile",
    });
  }
  const t = config.together;
  if (trimKey(t?.apiKey)) {
    chain.push({
      baseUrl: t.baseUrl || "https://api.together.xyz/v1",
      apiKey: t.apiKey.trim(),
      model: t.model || "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    });
  }
  const h = config.huggingface;
  if (trimKey(h?.apiKey) && trimKey(h?.model)) {
    chain.push({
      baseUrl: h.baseUrl || "https://router.huggingface.co/v1",
      apiKey: h.apiKey.trim(),
      model: h.model.trim(),
    });
  }
  const f = config.openaiCompatibleFallback;
  if (trimKey(f?.apiKey) && trimKey(f?.baseUrl) && trimKey(f?.model)) {
    chain.push({
      baseUrl: f.baseUrl.trim(),
      apiKey: f.apiKey.trim(),
      model: f.model.trim(),
    });
  }
  return chain;
}

/**
 * OpenAI-compatible chat/completions across configured providers (primary first, then fallbacks).
 * @param {Array<{ role: string, content: string }>} messages
 * @param {{ temperature?: number, max_tokens?: number }} [opts]
 * @returns {Promise<string|null>} Assistant text, or null if every provider fails.
 */
export async function completeChat(messages, opts = {}) {
  const temperature = opts.temperature ?? 0.25;
  const max_tokens = opts.max_tokens ?? 900;
  const chain = buildProviderChain();

  for (const p of chain) {
    const url = `${String(p.baseUrl).replace(/\/$/, "")}/chat/completions`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${p.apiKey}`,
        },
        body: JSON.stringify({
          model: p.model,
          temperature,
          max_tokens,
          messages,
        }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (typeof text === "string" && text.trim()) return text.trim();
    } catch {
      /* try next provider */
    }
  }
  return null;
}
