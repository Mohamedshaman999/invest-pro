import axios from "axios";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

/**
 * @param {string} query
 * @param {"fr"|"en"} lang
 * @returns {Promise<Array<{ title: string; source: string; publishedAt: string }>>}
 */
export async function fetchStockNewsHeadlines(query, lang) {
  const key = config.gnews?.apiKey?.trim();
  if (!key || !query?.trim()) return [];

  const q = query.trim().slice(0, 120);
  const gnewsLang = lang === "en" ? "en" : "fr";

  try {
    const url = "https://gnews.io/api/v4/search";
    const res = await axios.get(url, {
      params: {
        q,
        lang: gnewsLang,
        max: 5,
        token: key,
      },
      timeout: config.gnews.timeoutMs,
      validateStatus: (s) => s >= 200 && s < 400,
    });

    const articles = Array.isArray(res.data?.articles) ? res.data.articles : [];
    return articles.slice(0, 5).map((a) => ({
      title: typeof a.title === "string" ? a.title.slice(0, 240) : "",
      source: typeof a.source?.name === "string" ? a.source.name : "",
      publishedAt: typeof a.publishedAt === "string" ? a.publishedAt : "",
    }));
  } catch (e) {
    logger.debug(`GNews fetch failed: ${e?.message || e}`);
    return [];
  }
}
