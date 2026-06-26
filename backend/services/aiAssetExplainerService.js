import { Asset, AssetPriceHistory } from "../models/index.js";
import { calculateTechnicalSummary } from "./indicatorService.js";

const CRYPTO = new Set(["BTC", "ETH"]);

function normalizeTicker(ticker) {
  return String(ticker || "")
    .trim()
    .toUpperCase()
    .slice(0, 32);
}

function inferCategoryFromTicker(ticker) {
  if (CRYPTO.has(ticker)) return "crypto";
  return "stock";
}

/** @param {number[]} arr */
function mean(arr) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/** @param {number[]} arr */
function sampleStdev(arr) {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

/**
 * Annualized volatility from daily closes (log returns), trading days ~252.
 * @param {number[]} closes chronological oldest first
 */
function annualizedVolPercent(closes) {
  if (closes.length < 5) return null;
  const logR = [];
  for (let i = 1; i < closes.length; i++) {
    const a = closes[i - 1];
    const b = closes[i];
    if (a > 0 && b > 0) logR.push(Math.log(b / a));
  }
  if (logR.length < 2) return null;
  const daily = sampleStdev(logR);
  return daily * Math.sqrt(252) * 100;
}

/**
 * Max drawdown as positive fraction (e.g. 0.35 = 35% peak to trough).
 * @param {number[]} closes
 */
function maxDrawdownFraction(closes) {
  if (!closes.length) return null;
  let peak = closes[0];
  let maxDd = 0;
  for (const p of closes) {
    if (p > peak) peak = p;
    if (peak > 0) {
      const dd = (peak - p) / peak;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

/**
 * @param {Date|string} a
 * @param {Date|string} b
 */
function yearsBetween(a, b) {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.max(1 / 365, (t2 - t1) / (365.25 * 24 * 3600 * 1000));
}

/**
 * Heuristic sector / theme lines (BVMT-style names, no live news API).
 * @param {string} name
 * @param {string} ticker
 * @param {boolean} isCrypto
 * @param {"fr"|"en"} lang
 */
function sectorAndMarketContext(name, ticker, isCrypto, lang) {
  const isFr = lang === "fr";
  if (isCrypto) {
    return isFr
      ? "Les cryptos ne sont pas le profil d'une action classique : liquidité globale, réglementation et cycles spéculatifs peuvent provoquer des mouvements très larges en peu de temps."
      : "Crypto is not like a traditional stock — global liquidity, regulation, and speculative cycles can produce very large, fast moves.";
  }

  const blob = `${name} ${ticker}`.toLowerCase();
  const tests = [
    {
      re: /banque|bank|bna|attijari|amen|biat|stb|bh\b|ubci|zitouna|sousse|tqb/i,
      fr: "Le secteur bancaire est sensible aux taux, à la qualité des créances et aux annonces de résultats trimestrielles ; l'activité crédit et les indications de la Banque centrale peuvent influencer le titre.",
      en: "Banks are sensitive to rates, asset quality, and earnings; lending trends and central-bank guidance often move the share price.",
    },
    {
      re: /assur|insur|maghrebia/i,
      fr: "L'assurance dépend des sinistres, des placements financiers de la compagnie et du cadre réglementaire : les bilans publient des chiffres que le marché compare d'une année sur l'autre.",
      en: "Insurers depend on claims experience, investment income, and regulation — investors often compare published results year over year.",
    },
    {
      re: /telecom|ooredoo|orange/i,
      fr: "Les télécoms réagissent au nombre d'abonnés, aux investissements réseau et à la concurrence sur les tarifs ; les dépenses d'infrastructure pèsent sur les marges.",
      en: "Telcos react to subscriber trends, network capex, and pricing competition; infrastructure spending can squeeze margins.",
    },
    {
      re: /ciment|carthage|ciments|lafarge/i,
      fr: "Le ciment dépend surtout de la construction locale, des coûts énergétiques et des volumes : la conjoncture immobilière et les grands projets publics orientent souvent la demande.",
      en: "Cement tracks local construction, energy costs, and volumes — public projects and housing often drive demand.",
    },
    {
      re: /agro|huile|conserves|delice|poulina|sotuver/i,
      fr: "L'agroalimentaire est exposé aux matières premières, aux contrats grande distribution et à la consommation domestique ; un choc sur les coûts peut vite se voir sur la marge.",
      en: "Food producers face commodity costs, retail contracts, and local demand; margin pressure can follow input-price shocks.",
    },
  ];

  for (const t of tests) {
    if (t.re.test(blob)) return isFr ? t.fr : t.en;
  }

  return isFr
    ? "Sur le marché tunisien, une valeur peut réagir aux publications de résultats, au contrôle de la liquidité sur le carnet d'ordres et au climat macroéconomique régional ; ces facteurs se combinent avec la confiance des investisseurs à court terme."
    : "On the Tunisian market, a stock may react to earnings releases, order-book liquidity, and regional macro sentiment — these combine with short-term investor confidence.";
}

/**
 * @param {string} status from deriveStatus
 * @param {"fr"|"en"} lang
 */
function technicalNarrative(status, rsi, sma20, lastClose, lang) {
  const isFr = lang === "fr";
  const rsiPart =
    rsi != null
      ? isFr
        ? `Le RSI 14 jours se situe vers ${rsi.toFixed(1)}`
        : `The 14-day RSI is around ${rsi.toFixed(1)}`
      : isFr
        ? "Le RSI n'a pas pu être calculé faute de suffisamment de points"
        : "RSI could not be computed (not enough points)";

  let bias = "";
  if (status === "Bullish")
    bias = isFr
      ? " : les derniers cours sont au-dessus de la moyenne mobile 20 séances, ce que l'on interprète souvent comme une phase favorable sur l'échelle de quelques semaines."
      : ": price is above its 20-day average — often read as supportive over a few weeks.";
  else if (status === "Bearish")
    bias = isFr
      ? " : sous la moyenne mobile 20 séances, ce qui correspond à une phase plus tendue récemment."
      : ": below the 20-day average — a more pressured recent phase.";
  else
    bias = isFr
      ? " ; la lecture reste mitigée entre prix court terme et momentum (ni clairement surchauffé ni effondré sur ces indicateurs simples)."
      : "; the picture is mixed between short price level and momentum (not clearly overheated or broken on these simple gauges).";

  const lvl =
    sma20 != null && lastClose != null
      ? isFr
        ? ` Cours récent ≈ ${lastClose.toFixed(3)} TND, moyenne 20 jours ≈ ${sma20.toFixed(3)}.`
        : ` Recent price ≈ ${lastClose.toFixed(3)} TND vs 20-day mean ≈ ${sma20.toFixed(3)}.`
      : "";

  return `${rsiPart}${bias}${lvl}`;
}

/**
 * @param {number} volPct
 * @param {boolean} isCrypto
 * @param {"fr"|"en"} lang
 */
function riskLabelFromMetrics(volPct, maxDdPct, isCrypto, lang) {
  const isFr = lang === "fr";
  const v = volPct != null ? volPct : isCrypto ? 55 : 22;
  const dd = maxDdPct != null ? maxDdPct : null;

  let tier = "modéré";
  if (isCrypto || v >= 45) tier = "élevé";
  else if (v >= 25) tier = "marqué";

  const ddBit =
    dd != null
      ? isFr
        ? ` Pire baisse observée depuis un sommet sur l'historique disponible : environ ${dd.toFixed(1)} %.`
        : ` Worst peak-to-trough drop on record: about ${dd.toFixed(1)}%.`
      : "";

  if (isFr) {
    if (tier === "élevé") {
      return `Niveau de risque ${tier} sur la base des données historiques : volatilité annualisée d'environ ${v.toFixed(1)} % (écarts des cours jour après jour).${ddBit} Les actifs très volatils ne conviennent pas à tout le monde.`;
    }
    if (tier === "marqué") {
      return `Risque ${tier} : volatilité annualisée estimée à ~${v.toFixed(1)} % sur la période analysée.${ddBit} Les fluctuations restent significatives par rapport à l'épargne réglementée.`;
    }
    return `Risque plutôt modéré d'après l'historique : volatilité annualisée d'environ ${v.toFixed(1)} %.${ddBit} Cela ne garantit pas la stabilité future.`;
  }

  if (tier === "élevé" || isCrypto) {
    return `Risk looks high from historical data: annualized volatility around ${v.toFixed(1)}% (day-to-day price dispersion).${ddBit} Very volatile assets are not suitable for everyone.`;
  }
  if (tier === "marqué") {
    return `Risk is material: annualized volatility about ${v.toFixed(1)}% over the sample.${ddBit} Swings can still be large versus cash-like instruments.`;
  }
  return `Risk appears relatively moderate in the sample: annualized volatility near ${v.toFixed(1)}%.${ddBit} Past calm does not guarantee future stability.`;
}

/**
 * @param {number} totalReturnPct
 * @param {number|null} cagr
 * @param {number} vol
 * @param {number} maxDdPct
 * @param {string} techLine
 * @param {string} sectorLine
 * @param {"fr"|"en"} lang
 */
function buildDescription({
  name,
  ticker,
  isCrypto,
  firstDate,
  lastDate,
  nPoints,
  totalReturnPct,
  cagr,
  vol,
  maxDdPct,
  techLine,
  sectorLine,
  insufficient,
  lang,
}) {
  const isFr = lang === "fr";

  const intro = isFr
    ? `${name} (${ticker}) — ${isCrypto ? "actif numérique" : "titre coté"} dont le prix reflète l'offre, la demande et les attentes sur l'entreprise ou l'actif sous-jacent.`
    : `${name} (${ticker}) — ${isCrypto ? "a digital asset" : "a listed security"} whose price reflects supply, demand, and expectations.`;

  if (insufficient || nPoints < 8) {
    const tail = isFr
      ? " Peu de points d'historique sont stockés en base : l'analyse quantitative longue est limitée. Lecture technique récente : "
      : " Limited stored history: long-horizon stats are thin. Recent technical read: ";
    return (
      intro +
      tail +
      techLine +
      " " +
      sectorLine +
      (isFr
        ? " Synthèse pédagogique, sans conseil personnalisé."
        : " Educational summary — not personal advice.")
    );
  }

  const period = isFr
    ? `Sur la fenêtre du ${firstDate} au ${lastDate} (${nPoints} séances en base), `
    : `From ${firstDate} to ${lastDate} (${nPoints} sessions in our database), `;

  const perf =
    totalReturnPct >= 0
      ? isFr
        ? `le cours a gagné environ ${totalReturnPct.toFixed(1)} % en cumulé`
        : `price rose roughly ${totalReturnPct.toFixed(1)}% cumulatively`
      : isFr
        ? `le cours a perdu environ ${Math.abs(totalReturnPct).toFixed(1)} % en cumulé`
        : `price fell roughly ${Math.abs(totalReturnPct).toFixed(1)}% cumulatively`;

  const cagrBit =
    cagr != null && Number.isFinite(cagr)
      ? isFr
        ? ` ; cela correspond à une moyenne géométrique d'environ ${cagr.toFixed(1)} % par an sur toute la période (ordre de grandeur, selon les dates).`
        : ` ; that is about ${cagr.toFixed(1)}% per year geometric mean over the window (ballpark).`
      : ".";

  const volBit =
    vol != null
      ? isFr
        ? ` La volatilité annualisée calculée sur les rendements journaliers est d'environ ${vol.toFixed(1)} % (mesure de dispersion, pas une prévision).`
        : ` Annualized volatility from daily returns is near ${vol.toFixed(1)}% (dispersion measure, not a forecast).`
      : "";

  const ddBit =
    maxDdPct != null
      ? isFr
        ? ` La plus forte baisse depuis un pic sur cet historique atteint environ ${maxDdPct.toFixed(1)} % du sommet au creux le plus défavorable.`
        : ` The worst peak-to-trough drawdown in this sample is about ${maxDdPct.toFixed(1)}%.`
      : "";

  const tech = isFr ? ` Conditions récentes (indicateurs simples sur les dernières séances) : ` : ` Recent conditions (simple indicators on latest sessions): `;

  return (
    intro +
    " " +
    period +
    perf +
    cagrBit +
    volBit +
    ddBit +
    tech +
    techLine +
    " " +
    sectorLine +
    (isFr
      ? " Ce texte synthétise des données techniques et un cadre de marché général, pas des nouvelles en temps réel ni un conseil en investissement."
      : " This bundles stored price data and general market context — not live headlines or personal investment advice.")
  );
}

/**
 * @param {Parameters<typeof buildDescription>[0]} params
 * @param {"fr"|"en"} lang
 */
function buildWhyInvest(params, lang) {
  const {
    totalReturnPct,
    cagr,
    vol,
    maxDdPct,
    firstDate,
    lastDate,
    insufficient,
    isCrypto,
    name,
    nPoints,
  } = params;
  const isFr = lang === "fr";
  const out = [];

  if (!insufficient && nPoints >= 8) {
    if (totalReturnPct > 5 && cagr != null && cagr > 0) {
      out.push(
        isFr
          ? `L'historique disponible montre une trajectoire globalement positive (≈ ${totalReturnPct.toFixed(1)} % sur la période, soit ~${cagr.toFixed(1)} % / an en moyenne géométrique) : un investisseur cherchant l'exposition au titre aurait observé cette tendance dans les données stockées.`
          : `Stored history skews positive (≈${totalReturnPct.toFixed(1)}% over the window, ~${cagr.toFixed(1)}% annualized geometric mean) — that is what a long-only view of our data would have shown.`
      );
    } else if (totalReturnPct < -5) {
      out.push(
        isFr
          ? `Les données historiques montrent un bilan cumulé négatif (≈ ${totalReturnPct.toFixed(1)} %) entre ${firstDate} et ${lastDate} : certaines stratégies visent un rebond ou une sous-évaluation ; d'autres évitent une valeur en tendance baissière — ce n'est qu'une lecture quantitative.`
          : `Cumulative performance in our data is negative (≈${totalReturnPct.toFixed(1)}%) from ${firstDate} to ${lastDate} — some investors buy dips; others avoid downtrends; this is only a quantitative read.`
      );
    } else {
      out.push(
        isFr
          ? `Sur ${firstDate} – ${lastDate}, la performance cumulée reste proche de l'équilibre (≈ ${totalReturnPct.toFixed(1)} %) : le titre n'a pas montré une tendance très marquée sur toute la fenêtre disponible.`
          : `From ${firstDate} to ${lastDate}, cumulative return is near flat (≈${totalReturnPct.toFixed(1)}%) — no strong one-way trend across the full stored window.`
      );
    }

    out.push(
      isFr
        ? `Le risque mesuré par la dispersion des cours (volatilité annualisée ~${vol != null ? vol.toFixed(1) : "?"} %) et la profondeur des replis (jusqu'à ~${maxDdPct != null ? maxDdPct.toFixed(1) : "?"} % depuis un sommet) doit être comparé à votre capacité à tenir la position dans le temps.`
        : `Measured risk — volatility near ${vol != null ? vol.toFixed(1) : "?"}% annualized and drawdowns up to ~${maxDdPct != null ? maxDdPct.toFixed(1) : "?"}% from peaks — should match your time horizon and tolerance.`
    );
  } else {
    out.push(
      isFr
        ? `Pour ${name}, l'historique en base est encore court : les arguments tiennent surtout au secteur et au cadre de marché plutôt qu'à une statistique longue.`
        : `For ${name}, stored history is still short — the thesis leans more on sector and market structure than long-run statistics.`
    );
    out.push(
      isFr
        ? isCrypto
          ? "Les cryptos restent un créneau à forte amplitude : n'exposez que le capital dont vous pourriez vous passer."
          : "Les actions exposent au risque de marché et à la société : diversifiez et gardez une épargne de précaution à côté."
        : isCrypto
          ? "Crypto slots remain high amplitude — only risk capital you can afford to lose."
          : "Equities carry market and company risk — diversify and keep an emergency buffer."
    );
  }

  out.push(
    isFr
      ? "Actualités récentes : cet outil ne consulte pas un fil live ; pour les annonces précises (résultats, régulation, événements externes), complétez avec des sources officielles et la documentation de l'émetteur."
      : "Recent headlines: this tool does not stream news. Cross-check issuer filings and trusted outlets for timely events."
  );

  return out.slice(0, 3);
}

/**
 * @param {number} assetId
 * @returns {Promise<{ dates: string[], prices: number[] }>}
 */
async function loadFullHistory(assetId) {
  const rows = await AssetPriceHistory.findAll({
    where: { assetId },
    order: [
      ["date", "ASC"],
      ["id", "ASC"],
    ],
  });
  const dates = [];
  const prices = [];
  for (const r of rows) {
    const p = Number(r.price);
    if (!Number.isFinite(p) || p <= 0) continue;
    dates.push(String(r.date));
    prices.push(p);
  }
  return { dates, prices: prices };
}

/**
 * Explications basées sur l'historique en base + indicateurs simples (pas un conseil personnalisé).
 * @param {"fr"|"en"} lang
 */
export async function buildAssetInfo(tickerRaw, lang = "fr") {
  const ticker = normalizeTicker(tickerRaw);
  const L = lang === "en" ? "en" : "fr";

  let name = ticker;
  let category = inferCategoryFromTicker(ticker);

  const row = await Asset.findOne({ where: { ticker } });
  if (row) {
    name = row.name || name;
    const cat = String(row.category || "").toLowerCase();
    if (cat === "crypto" || cat.includes("crypto")) category = "crypto";
    else if (cat) category = cat;
  }

  const isCrypto = category === "crypto" || CRYPTO.has(ticker);

  const tech = row
    ? await calculateTechnicalSummary(row.id)
    : {
        status: "Neutral",
        insufficientData: true,
        sma20: null,
        rsi14: null,
        lastClose: null,
      };

  const techLine = technicalNarrative(
    tech.status,
    tech.rsi14,
    tech.sma20,
    tech.lastClose,
    L
  );
  const sectorLine = sectorAndMarketContext(name, ticker, isCrypto, L);

  let dates = [];
  let prices = [];
  if (row) {
    const loaded = await loadFullHistory(row.id);
    dates = loaded.dates;
    prices = loaded.prices;
  }

  const n = prices.length;
  const first = n ? prices[0] : null;
  const last = n ? prices[n - 1] : null;
  const firstDate = n ? dates[0] : null;
  const lastDate = n ? dates[n - 1] : null;

  const totalReturnPct =
    first != null && last != null && first > 0 ? ((last / first - 1) * 100) : 0;
  const yr = firstDate && lastDate ? yearsBetween(firstDate, lastDate) : 1;
  const cagr =
    first != null && last != null && first > 0 && yr > 0
      ? (Math.pow(last / first, 1 / yr) - 1) * 100
      : null;

  const vol = n >= 8 ? annualizedVolPercent(prices) : null;
  const maxDdFrac = n >= 5 ? maxDrawdownFraction(prices) : null;
  const maxDdPct = maxDdFrac != null ? maxDdFrac * 100 : null;

  const insufficient = n < 8;

  const riskLevel = riskLabelFromMetrics(
    vol != null ? vol : isCrypto ? 50 : 20,
    maxDdPct,
    isCrypto,
    L
  );

  const description = buildDescription({
    name,
    ticker,
    isCrypto,
    firstDate: firstDate || "—",
    lastDate: lastDate || "—",
    nPoints: n,
    totalReturnPct,
    cagr,
    vol,
    maxDdPct,
    techLine,
    sectorLine,
    insufficient,
    lang: L,
  });

  const whyInvest = buildWhyInvest(
    {
      name,
      ticker,
      isCrypto,
      totalReturnPct,
      cagr,
      vol,
      maxDdPct,
      firstDate: firstDate || "",
      lastDate: lastDate || "",
      nPoints: n,
      insufficient,
    },
    L
  );

  return {
    description,
    riskLevel,
    whyInvest,
  };
}
