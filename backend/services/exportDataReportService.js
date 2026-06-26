import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { buildExportDataset } from "./exportDataReportDataset.js";
import { buildFallbackStructuredReport, generateStructuredReportJson } from "./exportDataReportAi.js";
import { renderExportReportPdfBuffer } from "./exportDataReportPdf.js";
import { buildPdfTransactionRowsForExport } from "./exportDataReportTransactionsPdf.js";

function hasPortfolioPositions(dataset) {
  const positions = dataset?.portfolio?.positions;
  return Array.isArray(positions) && positions.length > 0;
}

/** @param {{ id: number; name?: string; email?: string }} user */
export async function generateExportDataReportPdfForUser(user) {
  const userId = user.id;
  const dataset = await buildExportDataset(user, userId);

  if (!hasPortfolioPositions(dataset)) {
    throw new AppError("No portfolio data available to generate report", 400, "NO_PORTFOLIO_DATA");
  }

  let report;
  try {
    report = await generateStructuredReportJson(dataset);
  } catch (e) {
    logger.warn("export-data-report: AI step failed, using deterministic fallback", {
      message: e?.message,
      code: e?.code,
    });
    report = buildFallbackStructuredReport(dataset);
  }
  const transactionRows = buildPdfTransactionRowsForExport(dataset.transactions);
  const buffer = await renderExportReportPdfBuffer(report, {
    currency: dataset.portfolio?.currency,
    transactionRows,
  });

  const safeDate = new Date().toISOString().slice(0, 10);
  const filename = `investpro-investment-report-${safeDate}.pdf`;

  return { buffer, filename };
}
