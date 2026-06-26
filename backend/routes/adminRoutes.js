import { Router } from "express";
import * as adminController from "../controllers/adminController.js";
import * as adminUsersController from "../controllers/adminUsersController.js";
import * as adminMessagingController from "../controllers/adminMessagingController.js";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { adminAssetSchema, adminSendMessagingMessageSchema, patchMessagingConversationSchema } from "../validators/schemas.js";
import { messagingSendLimiter } from "../middlewares/rateLimiters.js";

const router = Router();

router.post(
  "/admin/assets",
  authMiddleware,
  requireVerified,
  requireAdmin,
  validateBody(adminAssetSchema),
  adminController.createAsset
);

router.delete(
  "/admin/assets/:ticker",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminController.deleteAssetByTicker
);

router.get(
  "/admin/users",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminUsersController.listAdminUsers
);

router.get(
  "/admin/users/:id",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminUsersController.getAdminUser
);

router.delete(
  "/admin/users/:id",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminUsersController.deleteAdminUser
);

router.patch(
  "/admin/users/:id/unlock",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminUsersController.unlockAdminUser
);

router.get(
  "/admin/conversations",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminMessagingController.getAdminConversations
);

router.get(
  "/admin/conversations/:id",
  authMiddleware,
  requireVerified,
  requireAdmin,
  adminMessagingController.getAdminConversationMessages
);

router.post(
  "/admin/messages",
  authMiddleware,
  requireVerified,
  requireAdmin,
  messagingSendLimiter,
  validateBody(adminSendMessagingMessageSchema),
  adminMessagingController.postAdminMessage
);

router.patch(
  "/admin/conversations/:id",
  authMiddleware,
  requireVerified,
  requireAdmin,
  validateBody(patchMessagingConversationSchema),
  adminMessagingController.patchAdminConversation
);

export default router;
