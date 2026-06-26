import { Router } from "express";
import * as walletController from "../controllers/walletController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { forbidAdminInvestmentAccess } from "../middlewares/forbidAdminInvestmentMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { walletAmountSchema } from "../validators/schemas.js";

const router = Router();

router.get("/wallet", authMiddleware, forbidAdminInvestmentAccess, walletController.getWallet);
router.get("/balance", authMiddleware, forbidAdminInvestmentAccess, walletController.getBalance);
router.post("/deposit", authMiddleware, forbidAdminInvestmentAccess, validateBody(walletAmountSchema), walletController.deposit);
router.post("/withdraw", authMiddleware, forbidAdminInvestmentAccess, validateBody(walletAmountSchema), walletController.withdraw);

export default router;
