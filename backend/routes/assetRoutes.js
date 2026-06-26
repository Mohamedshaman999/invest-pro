import { Router } from "express";
import * as assetController from "../controllers/assetController.js";

const router = Router();

router.get("/stocks/search", assetController.searchStocks);
router.get("/assets", assetController.listAssets);
router.get("/assets/:ticker/detail", assetController.getAssetDetail);
router.get("/assets/:ticker/history", assetController.getHistory);

export default router;
