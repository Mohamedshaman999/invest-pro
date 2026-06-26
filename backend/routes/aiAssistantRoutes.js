import { Router } from "express";
import * as aiAssistantController from "../controllers/aiAssistantController.js";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { forbidAdminInvestmentAccess } from "../middlewares/forbidAdminInvestmentMiddleware.js";
import { requireProInvestor } from "../middlewares/proInvestorMiddleware.js";
import { aiChatLimiter } from "../middlewares/rateLimiters.js";

const router = Router();

router.post(
  "/ai/chat",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiChatLimiter,
  aiAssistantController.postAiChat
);
router.get(
  "/ai/conversations",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiAssistantController.listAiConversations
);
router.get(
  "/ai/conversations/:id",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiAssistantController.getAiConversation
);
router.delete(
  "/ai/conversations/:id",
  authMiddleware,
  requireVerified,
  forbidAdminInvestmentAccess,
  requireProInvestor,
  aiChatLimiter,
  aiAssistantController.deleteAiConversation
);

export default router;
