import { Transaction, Asset } from "../models/index.js";
import { AppError } from "../utils/errors.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createAsset = asyncHandler(async (req, res) => {
  const { ticker, name, category, currentPrice } = req.body;
  const t = String(ticker).toUpperCase().trim();
  const [asset, created] = await Asset.findOrCreate({
    where: { ticker: t },
    defaults: {
      ticker: t,
      name: name.trim(),
      category: category?.trim() || "Stock",
      currentPrice,
    },
  });
  if (!created) {
    asset.name = name.trim();
    if (category) asset.category = category.trim();
    asset.currentPrice = currentPrice;
    await asset.save();
  }
  res.status(201).json({
    id: asset.id,
    ticker: asset.ticker,
    name: asset.name,
    category: asset.category,
    currentPrice: Number(asset.currentPrice),
  });
});

export const deleteAssetByTicker = asyncHandler(async (req, res) => {
  const t = String(req.params.ticker || "")
    .toUpperCase()
    .trim();
  const asset = await Asset.findOne({ where: { ticker: t } });
  if (!asset) throw new AppError("Asset not found", 404, "NOT_FOUND");
  const count = await Transaction.count({ where: { assetId: asset.id } });
  if (count > 0) {
    throw new AppError("Cannot delete asset with existing transactions", 400, "HAS_TRANSACTIONS");
  }
  await asset.destroy();
  res.status(204).send();
});
