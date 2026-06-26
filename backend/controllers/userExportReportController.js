import { asyncHandler } from "../utils/asyncHandler.js";
import * as exportDataReportService from "../services/exportDataReportService.js";

export const exportDataReport = asyncHandler(async (req, res) => {
  const { buffer, filename } = await exportDataReportService.generateExportDataReportPdfForUser(req.user);
  res.status(200);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(buffer);
});
