import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).required(),
  email: Joi.string().trim().email().max(255).required(),
  password: Joi.string().min(8).max(128).required(),
  currency: Joi.string().trim().uppercase().length(3).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().required(),
});

const sixDigitCode = Joi.string()
  .trim()
  .custom((value, helpers) => {
    const digits = String(value ?? "").replace(/\D/g, "").slice(0, 6);
    if (!/^\d{6}$/.test(digits)) {
      return helpers.error("any.invalid");
    }
    return digits;
  }, "six-digit code")
  .required();

export const verifyEmailSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  code: sixDigitCode,
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().trim().min(10).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
  code: sixDigitCode,
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[a-zA-Z]/)
    .pattern(/[0-9]/)
    .pattern(/[^a-zA-Z0-9]/)
    .required()
    .messages({
      "string.pattern.base": "Password must include letters, numbers, and a symbol",
    }),
});

/** Authenticated password change (step 2): strong password policy. */
export const strongNewPasswordSchema = Joi.string()
  .min(8)
  .max(128)
  .pattern(/[a-zA-Z]/)
  .pattern(/[0-9]/)
  .pattern(/[^a-zA-Z0-9]/)
  .required()
  .messages({
    "string.pattern.base": "Password must include letters, numbers, and a symbol",
  });

export const requestPasswordChangeSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
});

const uuidV4 = Joi.string()
  .trim()
  .max(40)
  .custom((value, helpers) => {
    const s = String(value ?? "").trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)) {
      return helpers.error("any.invalid");
    }
    return s;
  }, "uuid v4")
  .required();

export const confirmPasswordChangeSchema = Joi.object({
  requestId: uuidV4,
  code: sixDigitCode,
  newPassword: strongNewPasswordSchema,
  confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
    "any.only": "Passwords do not match",
  }),
});

export const totpSetupSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
});

export const totpVerifySetupSchema = Joi.object({
  setupToken: Joi.string().trim().min(20).required(),
  otpCode: sixDigitCode,
  currentPassword: Joi.string().min(1).max(128).required(),
});

export const totpVerifyLoginSchema = Joi.object({
  loginChallengeToken: Joi.string().trim().min(20).required(),
  userId: Joi.number().integer().positive().required(),
  otpCode: sixDigitCode,
});

export const totpDisableSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(128).required(),
});

export const debugSendTestEmailSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(255).required(),
});

export const patchNotificationPreferencesSchema = Joi.object({
  notifyTransactionEmail: Joi.boolean().optional(),
  notifyPriceAlertEmail: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one preference field is required",
  });

export const patchUserProfileSchema = Joi.object({
  name: Joi.string().trim().min(1).max(255).optional(),
  email: Joi.string().trim().email().max(255).optional(),
  phone: Joi.string().trim().allow("").max(32).optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one profile field is required",
  });

const dateOnly = Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/);

export const walletAmountSchema = Joi.object({
  amount: Joi.number().positive().max(1e12).required(),
});

export const buySchema = Joi.object({
  assetId: Joi.number().integer().positive().required(),
  quantity: Joi.number().positive().required(),
  priceAtExecution: Joi.number().min(0).optional(),
  date: dateOnly.optional(),
});

export const sellSchema = Joi.object({
  assetId: Joi.number().integer().positive().required(),
  quantity: Joi.number().positive().required(),
  priceAtExecution: Joi.number().min(0).optional(),
  date: dateOnly.optional(),
});

export const adminAssetSchema = Joi.object({
  ticker: Joi.string().trim().min(1).max(32).required(),
  name: Joi.string().trim().min(1).max(255).required(),
  category: Joi.string().trim().max(64).optional(),
  currentPrice: Joi.number().min(0).required(),
});

const uuidV4Param = Joi.string()
  .trim()
  .max(40)
  .custom((value, helpers) => {
    const s = String(value ?? "").trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)) {
      return helpers.error("any.invalid");
    }
    return s;
  }, "uuid v4")
  .required();

export const createMessagingConversationSchema = Joi.object({
  subject: Joi.string().trim().max(200).allow("").optional(),
  message: Joi.string().trim().min(1).max(8000).required(),
});

export const sendMessagingMessageSchema = Joi.object({
  conversationId: uuidV4Param,
  content: Joi.string().trim().min(1).max(8000).required(),
});

export const adminSendMessagingMessageSchema = Joi.object({
  conversationId: uuidV4Param,
  content: Joi.string().trim().min(1).max(8000).required(),
});

export const patchMessagingConversationSchema = Joi.object({
  status: Joi.string().valid("open", "closed").required(),
});

export const investmentSimulateSchema = Joi.object({
  monthlyInvestment: Joi.number().min(0).max(1e12).required(),
  years: Joi.number().min(0.01).max(100).required(),
  lang: Joi.string().valid("fr", "en").optional(),
  useCustomReturn: Joi.boolean().optional().default(false),
  customAnnualReturnPercent: Joi.when("useCustomReturn", {
    is: true,
    then: Joi.number().min(-99.99).max(500).required(),
    otherwise: Joi.number().optional().strip(),
  }),
});

const uuidV4OptionalConversation = Joi.string()
  .trim()
  .max(40)
  .custom((value, helpers) => {
    if (value === undefined || value === null || value === "") return undefined;
    const s = String(value).trim().toLowerCase();
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(s)) {
      return helpers.error("any.invalid");
    }
    return s;
  }, "uuid v4 optional")
  .optional();

export const aiChatSchema = Joi.object({
  message: Joi.string().trim().min(1).max(8000).required(),
  conversationId: uuidV4OptionalConversation,
  stock_context: Joi.object({
    ticker: Joi.string().trim().uppercase().max(32).required(),
  }).optional(),
  lang: Joi.string().valid("fr", "en").optional(),
});

export const completeProSubscriptionSchema = Joi.object({
  planType: Joi.string().valid("monthly", "yearly").required(),
});
