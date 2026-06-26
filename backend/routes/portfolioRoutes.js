import { Router } from "express";
import * as portfolioController from "../controllers/portfolioController.js";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { forbidAdminInvestmentAccess } from "../middlewares/forbidAdminInvestmentMiddleware.js";
import { requireProInvestor } from "../middlewares/proInvestorMiddleware.js";

const router = Router();

router.get(
  "/portfolio/performance",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  portfolioController.getPerformance
);
router.get(
  "/portfolio/expected-return",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  portfolioController.getExpectedReturn
);
router.get(
  "/portfolio",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  portfolioController.getPortfolio
);

export default router;
