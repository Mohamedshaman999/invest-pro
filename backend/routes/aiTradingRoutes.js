import { Router } from "express";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { forbidAdminInvestmentAccess } from "../middlewares/forbidAdminInvestmentMiddleware.js";
import { requireProInvestor } from "../middlewares/proInvestorMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import * as aiTradingController from "../controllers/aiTradingController.js";
import {
  createAiTradingBotSchema,
  patchAiTradingBotStatusSchema,
} from "../validators/aiTradingSchemas.js";

const router = Router();

router.get(
  "/ai-trading/bots",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiTradingController.listBots
);
router.post(
  "/ai-trading/bots",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  validateBody(createAiTradingBotSchema),
  aiTradingController.createBot
);
router.patch(
  "/ai-trading/bots/:id/status",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  validateBody(patchAiTradingBotStatusSchema),
  aiTradingController.patchBotStatus
);
router.get(
  "/ai-trading/bots/:id/transactions",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiTradingController.listBotTransactions
);

export default router;
