import * as portfolioService from "../services/portfolioService.js";
import * as portfolioExpectedReturnService from "../services/portfolioExpectedReturnService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getPortfolio = asyncHandler(async (req, res) => {
  const data = await portfolioService.getPortfolioForUser(req.user.id, req.user.currency);
  res.json(data);
});

export const getPerformance = asyncHandler(async (req, res) => {
  const series = await portfolioService.getPortfolioPerformanceSeries(req.user.id);
  res.json(series);
});

export const getExpectedReturn = asyncHandler(async (req, res) => {
  const raw = req.query?.years;
  const parsed = raw != null && raw !== "" ? Number(raw) : 5;
  const years = Number.isFinite(parsed) && parsed > 0 ? Math.min(40, Math.max(1, parsed)) : 5;
  const data = await portfolioExpectedReturnService.computePortfolioExpectedReturn(req.user.id, years, req.user.currency);
  res.json(data);
});
