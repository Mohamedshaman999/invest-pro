import { Op } from "sequelize";
import { Asset } from "../models/index.js";

const MAX_QUERY_LEN = 64;
const MAX_RESULTS = 10;

/**
 * Normalise et limite la requête (pas d’injection : caractères typiques des noms / tickers seulement).
 * @param {unknown} raw
 * @returns {string}
 */
export function sanitizeStockSearchQuery(raw) {
  if (raw == null) return "";
  const s0 = String(raw).normalize("NFKC").trim().slice(0, 128);
  const noNull = s0.replace(/\0/g, "");
  const cleaned = noNull.replace(/[^\p{L}\p{N}\s.\-&'′]/gu, "").trim();
  return cleaned.slice(0, MAX_QUERY_LEN);
}

function escapeLikePattern(s) {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

/**
 * Recherche partielle insensible à la casse sur nom et ticker (PostgreSQL ILIKE).
 * @param {unknown} query
 * @returns {Promise<Array<{ id: number; name: string; symbol: string; price: number; change_24h: number | null; logo: null }>>}
 */
export async function searchStocks(query) {
  const q = sanitizeStockSearchQuery(query);
  if (!q) return [];

  const pattern = `%${escapeLikePattern(q)}%`;

  const rows = await Asset.findAll({
    where: {
      [Op.or]: [{ name: { [Op.iLike]: pattern } }, { ticker: { [Op.iLike]: pattern } }],
    },
    limit: MAX_RESULTS,
    order: [["ticker", "ASC"]],
  });

  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    symbol: a.ticker,
    price: Number(a.currentPrice),
    change_24h: a.variationPercent != null ? Number(a.variationPercent) : null,
    logo: null,
  }));
}
