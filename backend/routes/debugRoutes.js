import { Router } from "express";
import * as debugController from "../controllers/debugController.js";
import { validateBody } from "../middlewares/validate.js";
import { authLimiter } from "../middlewares/rateLimiters.js";
import { debugSendTestEmailSchema } from "../validators/schemas.js";

const router = Router();

router.post("/debug/send-test-email", authLimiter, validateBody(debugSendTestEmailSchema), debugController.sendTestEmail);

export default router;
