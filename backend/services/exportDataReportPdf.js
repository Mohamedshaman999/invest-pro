import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import { INVESTPRO_BRAND } from "../constants/investProTheme.js";
import { appendTransactionHistoryToPdf } from "./exportDataReportTransactionsPdf.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, "../assets/logo1.png");

const MARGIN = 50;
const PAGE_BOTTOM_GUARD = 80;

/**
 * @param {Awaited<ReturnType<import("./exportDataReportAi.js").generateStructuredReportJson>>} report
 * @param {{ currency?: string; transactionRows?: unknown[] }} [meta]
 */
export function renderExportReportPdfBuffer(report, meta = {}) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      info: { Title: report.title, Author: "InvestPro", Creator: "InvestPro" },
    });

    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const { primary, text, muted, border, surface } = INVESTPRO_BRAND;
    const pageInnerW = doc.page.width - MARGIN * 2;
    let y = MARGIN;

    const ensureSpace = (needed) => {
      if (y + needed > doc.page.height - PAGE_BOTTOM_GUARD) {
        doc.addPage();
        y = MARGIN;
        return true;
      }
      return false;
    };

    const drawHeader = () => {
      const pageW = doc.page.width;
      const logoExists = fs.existsSync(LOGO_PATH);
      if (logoExists) {
        const maxW = 140;
        const maxH = 52;
        doc.save();
        doc.translate(pageW / 2, y + maxH / 2);
        try {
          doc.image(LOGO_PATH, -maxW / 2, -maxH / 2, { fit: [maxW, maxH] });
        } catch {
          /* fichier corrompu : ignorer */
        }
        doc.restore();
        y += maxH + 18;
      } else {
        y += 8;
      }

      doc
        .font("Helvetica-Bold")
        .fontSize(22)
        .fillColor(primary)
        .text("InvestPro", MARGIN, y, { width: pageInnerW, align: "center" });
      y = doc.y + 10;

      doc.moveTo(MARGIN, y).lineTo(doc.page.width - MARGIN, y).strokeColor(primary).lineWidth(1).stroke();
      y += 16;
    };

    drawHeader();
    doc.y = y;

    doc.font("Helvetica-Bold").fontSize(20).fillColor(text).text(report.title, MARGIN, y, {
      width: pageInnerW,
      align: "center",
    });
    y = doc.y + 8;

    doc.font("Helvetica").fontSize(10).fillColor(muted).text(`Currency: ${meta.currency || "TND"}`, MARGIN, y, {
      width: pageInnerW,
      align: "center",
    });
    y = doc.y + 28;

    ensureSpace(120);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(primary).text("Summary", MARGIN, y);
    y = doc.y + 8;
    doc.font("Helvetica").fontSize(11).fillColor(text).text(report.summary, MARGIN, y, {
      width: pageInnerW,
      align: "justify",
      lineGap: 3,
    });
    y = doc.y + 24;

    ensureSpace(100);
    doc.font("Helvetica-Bold").fontSize(14).fillColor(primary).text("Key metrics", MARGIN, y);
    y = doc.y + 10;

    const boxH = 72;
    ensureSpace(boxH + 20);
    doc.roundedRect(MARGIN, y, pageInnerW, boxH, 8).fill(surface);
    doc.roundedRect(MARGIN, y, pageInnerW, boxH, 8).strokeColor(border).lineWidth(1).stroke();
    const innerPad = 14;
    const bx = MARGIN + innerPad;
    let by = y + innerPad;
    doc.font("Helvetica").fontSize(11).fillColor(text);
    doc.text(`Total portfolio value: ${Number(report.keyMetrics.totalValue).toLocaleString("en-US", { maximumFractionDigits: 2 })}`, bx, by);
    by += 18;
    doc.text(`Diversification score: ${report.keyMetrics.diversificationScore} / 100`, bx, by);
    by += 18;
    doc.text(`Assessed risk level: ${report.keyMetrics.riskLevel}`, bx, by);
    y += boxH + 28;

    doc.font("Helvetica-Bold").fontSize(14).fillColor(primary).text("Detailed analysis", MARGIN, y);
    y = doc.y + 10;

    for (const section of report.sections) {
      ensureSpace(48);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(text).text(section.heading, MARGIN, y, { width: pageInnerW });
      y = doc.y + 4;
      doc.font("Helvetica").fontSize(11).fillColor(muted).text(section.content, MARGIN, y, {
        width: pageInnerW,
        align: "justify",
        lineGap: 3,
      });
      y = doc.y + 18;
    }

    y = appendTransactionHistoryToPdf(doc, y, {
      pageInnerW,
      MARGIN,
      PAGE_BOTTOM_GUARD,
      primary,
      text,
      muted,
      border,
      rows: Array.isArray(meta.transactionRows) ? meta.transactionRows : [],
    });
    doc.y = y;

    ensureSpace(36);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(muted)
      .text(
        "This report is generated for informational purposes only and does not constitute financial advice.",
        MARGIN,
        y,
        { width: pageInnerW, align: "center" }
      );

    doc.end();
  });
}
