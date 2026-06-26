/**
 * Section PDF « Transaction History » — tableau paginé, indépendant du contenu IA.
 */

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** Date et heure en UTC (24 h), fiable sans dépendance externe. */
function utcDateTimeParts(d) {
  return {
    date: `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`,
    time: `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`,
  };
}

function fmtQty(q) {
  if (!Number.isFinite(q)) return "—";
  const s = q.toFixed(8).replace(/\.?0+$/, "");
  return s || "0";
}

function fmtMoney(x) {
  if (!Number.isFinite(x)) return "—";
  return x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

/**
 * @param {Array<{
 *   id?: string;
 *   type?: string;
 *   assetSymbol?: string;
 *   quantity?: number;
 *   priceAtExecution?: number;
 *   date?: string;
 *   total?: number;
 *   createdAt?: string | Date | null;
 * }>} transactions
 */
export function buildPdfTransactionRowsForExport(transactions) {
  if (!Array.isArray(transactions) || !transactions.length) return [];

  const enriched = transactions.map((t, i) => {
    const created = t.createdAt != null ? new Date(t.createdAt) : null;
    const validCreated = created && !Number.isNaN(created.getTime());
    let dateStr;
    let timeStr;
    let sortKey;
    if (validCreated) {
      const p = utcDateTimeParts(created);
      dateStr = p.date;
      timeStr = p.time;
      sortKey = created.getTime();
    } else if (t.date) {
      const d = String(t.date).slice(0, 10);
      dateStr = d;
      timeStr = "00:00:00";
      sortKey = new Date(`${d}T00:00:00.000Z`).getTime();
    } else {
      dateStr = "—";
      timeStr = "—";
      sortKey = 0;
    }
    const qty = typeof t.quantity === "number" ? t.quantity : Number(t.quantity);
    const price = typeof t.priceAtExecution === "number" ? t.priceAtExecution : Number(t.priceAtExecution);
    const total = Number.isFinite(qty) && Number.isFinite(price) ? qty * price : Number(t.total);
    return {
      dateStr,
      timeStr,
      symbol: String(t.assetSymbol || "").slice(0, 16),
      type: String(t.type || "").toUpperCase(),
      quantity: qty,
      price,
      total: Number.isFinite(total) ? total : NaN,
      sortKey,
      id: Number.parseInt(String(t.id), 10) || i,
    };
  });

  enriched.sort((a, b) => {
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    return a.id - b.id;
  });
  return enriched;
}

/**
 * @param {*} doc
 * @param {number} y0
 * @param {{
 *   pageInnerW: number;
 *   MARGIN: number;
 *   PAGE_BOTTOM_GUARD: number;
 *   primary: string;
 *   text: string;
 *   muted: string;
 *   border: string;
 *   rows: ReturnType<typeof buildPdfTransactionRowsForExport>;
 * }} ctx
 * @returns {number} y après la section
 */
export function appendTransactionHistoryToPdf(doc, y0, ctx) {
  const { pageInnerW, MARGIN, PAGE_BOTTOM_GUARD, primary, text, muted, border, rows } = ctx;
  let y = y0;

  const ensureSpace = (needed) => {
    if (y + needed > doc.page.height - PAGE_BOTTOM_GUARD) {
      doc.addPage();
      y = MARGIN;
      return true;
    }
    return false;
  };

  ensureSpace(48);
  doc.font("Helvetica-Bold").fontSize(14).fillColor(primary).text("Transaction History", MARGIN, y, { width: pageInnerW });
  y = doc.y + 10;

  if (!rows.length) {
    doc.font("Courier").fontSize(9).fillColor(muted).text("No transactions available", MARGIN, y, { width: pageInnerW });
    y = doc.y + 20;
    return y;
  }

  const baseWidths = [68, 56, 52, 40, 76, 76, 88];
  const sumW = baseWidths.reduce((a, b) => a + b, 0);
  const scale = pageInnerW / sumW;
  const colW = baseWidths.map((w) => w * scale);
  const widthDrift = pageInnerW - colW.reduce((a, b) => a + b, 0);
  colW[colW.length - 1] += widthDrift;
  const headers = ["Date", "Time", "Asset", "Type", "Quantity", "Price", "Total"];
  const aligns = ["left", "left", "left", "center", "right", "right", "right"];
  const fontSize = rows.length > 220 ? 6 : rows.length > 130 ? 6.5 : 7;
  const rowH = fontSize + 5;
  const headerFontSize = fontSize + 0.5;

  let x = MARGIN;
  const cols = colW.map((w) => {
    const c = { left: x, width: w };
    x += w;
    return c;
  });

  const drawHeaderRow = () => {
    doc.font("Courier-Bold").fontSize(headerFontSize).fillColor(text);
    for (let i = 0; i < headers.length; i++) {
      const { left, width } = cols[i];
      doc.text(headers[i], left, y, {
        width,
        align: /** @type {"left"|"center"|"right"} */ (aligns[i]),
        lineBreak: false,
      });
    }
    y += rowH;
    doc.moveTo(MARGIN, y - 2).lineTo(MARGIN + pageInnerW, y - 2).strokeColor(border).lineWidth(0.5).stroke();
    y += 4;
  };

  drawHeaderRow();

  doc.font("Courier").fontSize(fontSize).fillColor(text);

  for (const r of rows) {
    const brokePage = ensureSpace(rowH + 4);
    if (brokePage) {
      drawHeaderRow();
      doc.font("Courier").fontSize(fontSize).fillColor(text);
    }

    const cells = [
      r.dateStr,
      r.timeStr,
      r.symbol,
      r.type,
      fmtQty(r.quantity),
      fmtMoney(r.price),
      fmtMoney(r.total),
    ];

    for (let i = 0; i < cells.length; i++) {
      const { left, width } = cols[i];
      doc.text(String(cells[i]), left, y, {
        width,
        align: /** @type {"left"|"center"|"right"} */ (aligns[i]),
        lineBreak: false,
        ellipsis: true,
      });
    }
    y += rowH;
  }

  y += 12;
  return y;
}
