import * as assetService from "../services/assetService.js";
import * as stockSearchService from "../services/stockSearchService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAssets = asyncHandler(async (req, res) => {
  const assets = await assetService.listAssets();
  res.json({ assets });
});

/** GET /api/stocks/search?q= — jusqu’à 10 résultats (nom / ticker, cas insensitive). */
export const searchStocks = asyncHandler(async (req, res) => {
  const results = await stockSearchService.searchStocks(req.query.q);
  res.json(results);
});

export const getHistory = asyncHandler(async (req, res) => {
  const { ticker } = req.params;
  const history = await assetService.getHistoryByTicker(ticker);
  res.json(history);
});

export const getAssetDetail = asyncHandler(async (req, res) => {
  const { ticker } = req.params;
  const detail = await assetService.getAssetDetailByTicker(ticker);
  res.json(detail);
});
