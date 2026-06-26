import { Router } from "express";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { requireMessagingInvestor } from "../middlewares/requireMessagingUser.js";
import { messagingCreateLimiter, messagingSendLimiter } from "../middlewares/rateLimiters.js";
import {
  createMessagingConversationSchema,
  sendMessagingMessageSchema,
} from "../validators/schemas.js";
import * as messagingController from "../controllers/messagingController.js";

const router = Router();

router.post(
  "/conversations",
  authMiddleware,
  requireVerified,
  requireMessagingInvestor,
  messagingCreateLimiter,
  validateBody(createMessagingConversationSchema),
  messagingController.postConversation
);

router.get(
  "/conversations",
  authMiddleware,
  requireVerified,
  requireMessagingInvestor,
  messagingController.getConversations
);

router.get(
  "/conversations/:id",
  authMiddleware,
  requireVerified,
  requireMessagingInvestor,
  messagingController.getConversationMessages
);

router.post(
  "/messages",
  authMiddleware,
  requireVerified,
  requireMessagingInvestor,
  messagingSendLimiter,
  validateBody(sendMessagingMessageSchema),
  messagingController.postMessage
);

export default router;
