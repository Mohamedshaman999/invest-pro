import { Router } from "express";
import { authMiddleware, requireVerified } from "../middlewares/authMiddleware.js";
import { validateBody } from "../middlewares/validate.js";
import { patchNotificationPreferencesSchema, patchUserProfileSchema } from "../validators/schemas.js";
import * as userExportReportController from "../controllers/userExportReportController.js";
import * as userNotificationPreferencesController from "../controllers/userNotificationPreferencesController.js";
import * as userProfileController from "../controllers/userProfileController.js";

const router = Router();

router.get("/user/profile", authMiddleware, userProfileController.getUserProfile);

router.get(
  "/user/export-data-report",
  authMiddleware,
  requireVerified,
  userExportReportController.exportDataReport
);

router.get("/user/notification-preferences", authMiddleware, userNotificationPreferencesController.getNotificationPreferences);

router.patch(
  "/user/profile",
  authMiddleware,
  validateBody(patchUserProfileSchema),
  userProfileController.patchUserProfile
);

router.patch(
  "/user/notification-preferences",
  authMiddleware,
  validateBody(patchNotificationPreferencesSchema),
  userNotificationPreferencesController.patchNotificationPreferences
);

export default router;
