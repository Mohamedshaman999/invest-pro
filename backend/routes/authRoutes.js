import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { validateBody } from "../middlewares/validate.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authLimiter, strictAuthLimiter } from "../middlewares/rateLimiters.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestPasswordChangeSchema,
  confirmPasswordChangeSchema,
  totpSetupSchema,
  totpVerifySetupSchema,
  totpVerifyLoginSchema,
  totpDisableSchema,
} from "../validators/schemas.js";

const router = Router();

router.post(
  "/register",
  strictAuthLimiter,
  validateBody(registerSchema),
  authController.register
);
router.post("/login", strictAuthLimiter, validateBody(loginSchema), authController.login);
router.post(
  "/verify-email",
  strictAuthLimiter,
  validateBody(verifyEmailSchema),
  authController.verifyEmail
);
router.post("/refresh", authLimiter, validateBody(refreshSchema), authController.refresh);
router.post(
  "/forgot-password",
  strictAuthLimiter,
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  strictAuthLimiter,
  validateBody(resetPasswordSchema),
  authController.resetPassword
);
router.post(
  "/request-password-change",
  strictAuthLimiter,
  authMiddleware,
  validateBody(requestPasswordChangeSchema),
  authController.requestPasswordChange
);
router.post(
  "/confirm-password-change",
  strictAuthLimiter,
  authMiddleware,
  validateBody(confirmPasswordChangeSchema),
  authController.confirmPasswordChange
);

router.post(
  "/2fa/totp/setup",
  strictAuthLimiter,
  authMiddleware,
  validateBody(totpSetupSchema),
  authController.totpSetup
);
router.post(
  "/2fa/totp/verify-setup",
  strictAuthLimiter,
  authMiddleware,
  validateBody(totpVerifySetupSchema),
  authController.totpVerifySetup
);
router.post(
  "/2fa/totp/verify-login",
  strictAuthLimiter,
  validateBody(totpVerifyLoginSchema),
  authController.totpVerifyLogin
);
router.post(
  "/2fa/totp/disable",
  strictAuthLimiter,
  authMiddleware,
  validateBody(totpDisableSchema),
  authController.totpDisable
);

export default router;
