import { Router } from "express";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { completeProSubscriptionSchema } from "../validators/schemas.js";
import * as subscriptionController from "../controllers/subscriptionController.js";

const router = Router();

router.post(
  "/subscriptions/pro/complete",
  authMiddleware,
  requireVerified,
  validateBody(completeProSubscriptionSchema),
  subscriptionController.postCompleteProSubscription
);

export default router;
