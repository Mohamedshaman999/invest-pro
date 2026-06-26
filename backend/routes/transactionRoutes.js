import { Router } from "express";
import * as transactionController from "../controllers/transactionController.js";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { forbidAdminInvestmentAccess } from "../middlewares/forbidAdminInvestmentMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { buySchema, sellSchema } from "../validators/schemas.js";

const router = Router();

router.get(
  "/transactions",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  transactionController.listTransactions
);

router.post(
  "/transactions/buy",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  validateBody(buySchema),
  transactionController.buy
);
router.post(
  "/transactions/sell",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  validateBody(sellSchema),
  transactionController.sell
);

export default router;
