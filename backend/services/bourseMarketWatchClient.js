import axios from "axios";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

const DEFAULT_HEADERS = {
  Accept: "application/json",
  "User-Agent": config.bourseMarketWatch.userAgent,
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

const EXPLICIT_VOLUME_KEYS = [
  "quantite_totale",
  "volume_titres",
  "volumeTitres",
  "quantiteTotale",
  "volume_total",
  "volumeTotal",
  "qty_totale",
  "qtyTotale",
  "cumulated_volume",
  "cumulatedVolume",
];

/**
 * Cumulative session volume from named BVMT fields only (never `trVolume`).
 */
export function extractExplicitCumulativeVolume(m) {
  if (!m || typeof m !== "object") return null;
  for (const k of EXPLICIT_VOLUME_KEYS) {
    const raw = m[k];
    if (raw == null || raw === "") continue;
    const n = Math.trunc(Number(raw));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/**
 * BVMT REST sends `caps` in **thousands of TND** for capitalisation / turnover-style figures.
 * Session **titres** (share volume) implied by that notional: (caps × 1000 TND) / last (TND/share).
 * This matches session activity better than the REST `volume` field on some lines (often last-lot size).
 * We never use `trVolume` here.
 */
export function inferSessionVolumeFromCapsThousands(capsRaw, lastPrice) {
  const last = Number(lastPrice);
  const cap = Number(capsRaw);
  if (!Number.isFinite(last) || last <= 0 || !Number.isFinite(cap) || cap < 0) return null;
  const inferred = Math.round((cap * 1000) / last);
  return inferred > 0 ? inferred : null;
}

/**
 * Total daily / session cumulative volume (titres): explicit API fields first, else notional from caps×1000/last, else REST `volume` (never `trVolume` alone).
 */
export function resolveSessionVolumeShares(m) {
  const explicit = extractExplicitCumulativeVolume(m);
  if (explicit != null) return explicit;

  const capRaw = m?.cap_market ?? m?.caps;
  const inferred = inferSessionVolumeFromCapsThousands(capRaw, m?.last);
  if (inferred != null) return inferred;

  const main = m?.volume;
  if (main != null && main !== "") {
    const n = Math.trunc(Number(main));
    if (Number.isFinite(n) && n >= 0) return n;
  }
  return null;
}

/**
 * Raw monetary figure from API (`caps` / `cap_market`), in **thousands of TND**.
 * Persisted `market_cap` must multiply by 1000 (full TND).
 */
export function normalizeMarketCapThousandsToTnd(capRaw) {
  if (capRaw == null || capRaw === "") return null;
  const n = Number(capRaw);
  if (!Number.isFinite(n)) return null;
  return n * 1000;
}

/**
 * Maps one BVMT REST market object to a normalized row.
 */
export function mapMarketEntry(m) {
  const ref = m?.referentiel || {};
  const ticker = String(ref.ticker || "")
    .trim()
    .toUpperCase();
  if (!ticker) return null;

  const name = String(ref.stockName || ticker).trim() || ticker;
  const lastPrice = Number(m?.last);
  const variationPct = m?.change == null || m.change === "" ? null : Number(m.change);
  const capRaw = m?.cap_market ?? m?.caps;
  const marketCap = normalizeMarketCapThousandsToTnd(capRaw);
  const volume = resolveSessionVolumeShares(m);

  return {
    ticker,
    name,
    lastPrice: Number.isFinite(lastPrice) ? lastPrice : null,
    variationPct: variationPct != null && Number.isFinite(variationPct) ? variationPct : null,
    volume: volume != null && Number.isFinite(volume) ? volume : null,
    marketCap: marketCap != null && Number.isFinite(marketCap) ? marketCap : null,
  };
}

function parseRestPayload(data) {
  const markets = data?.markets;
  if (!Array.isArray(markets)) {
    throw new Error('Bourse REST: expected { "markets": [...] }');
  }
  const rows = [];
  for (const m of markets) {
    const row = mapMarketEntry(m);
    if (row && row.lastPrice != null) rows.push(row);
  }
  return rows;
}

async function fetchJson(url) {
  const { data, status } = await axios.get(url, {
    timeout: config.bourseMarketWatch.requestTimeoutMs,
    headers: DEFAULT_HEADERS,
    validateStatus: (s) => s === 200,
    responseType: "json",
  });
  if (status !== 200) {
    throw new Error(`HTTP ${status} from ${url}`);
  }
  return data;
}

/**
 * Fetches Market Watch JSON from bourse.tn REST (see config `bourseMarketWatch.restMarketUrl`).
 * @returns {Promise<{ rows: Array<{ticker:string,name:string,lastPrice:number,variationPct:number|null,volume:number|null,marketCap:number|null}>, source: string }>}
 */
export async function fetchMarketWatchRows() {
  const restUrl = config.bourseMarketWatch.restMarketUrl;
  const json = await fetchJson(restUrl);
  const rows = parseRestPayload(json);
  if (rows.length === 0) {
    logger.warn("Bourse Market Watch: REST returned zero rows");
  }
  return { rows, source: "rest_api" };
}
