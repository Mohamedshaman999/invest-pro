import { Router } from "express";
import * as aiController from "../controllers/aiController.js";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { forbidAdminInvestmentAccess } from "../middlewares/forbidAdminInvestmentMiddleware.js";
import { requireProInvestor } from "../middlewares/proInvestorMiddleware.js";

const router = Router();

router.post(
  "/ai/asset-info",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiController.postAssetInfo
);
router.post(
  "/ai/simulate",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiController.postSimulate
);

export default router;
