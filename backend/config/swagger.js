import config from "./index.js";

export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "Investment Portfolio API",
    version: "1.0.0",
    description:
      "Portfolio tracking backend (not a trading platform). PostgreSQL, Sequelize, JWT, BVMT-style pricing job.",
  },
  servers: [{ url: `http://localhost:${config.port}` }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          currency: { type: "string", example: "TND" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string" },
          password: { type: "string" },
        },
      },
      VerifyRequest: {
        type: "object",
        required: ["email", "code"],
        properties: {
          email: { type: "string" },
          code: { type: "string", pattern: "^\\d{6}$" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["email", "code", "newPassword"],
        properties: {
          email: { type: "string", format: "email" },
          code: { type: "string", pattern: "^\\d{6}$" },
          newPassword: {
            type: "string",
            minLength: 8,
            maxLength: 128,
            description: "Must include letters, numbers, and a symbol",
          },
        },
      },
      RequestPasswordChangeRequest: {
        type: "object",
        required: ["currentPassword"],
        properties: {
          currentPassword: { type: "string" },
        },
      },
      ConfirmPasswordChangeRequest: {
        type: "object",
        required: ["requestId", "code", "newPassword", "confirmPassword"],
        properties: {
          requestId: { type: "string", format: "uuid", description: "Returned by request-password-change" },
          code: { type: "string", pattern: "^\\d{6}$" },
          newPassword: {
            type: "string",
            minLength: 8,
            maxLength: 128,
            description: "Must include letters, numbers, and a symbol",
          },
          confirmPassword: { type: "string", minLength: 8, maxLength: 128 },
        },
      },
      DebugSendTestEmailRequest: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email" } },
      },
      TradeRequest: {
        type: "object",
        required: ["assetId", "quantity"],
        properties: {
          assetId: { type: "integer" },
          quantity: { type: "number", exclusiveMinimum: 0 },
          priceAtExecution: { type: "number", minimum: 0 },
          date: { type: "string", example: "2026-04-13" },
        },
      },
    },
  },
  paths: {
    "/api/health": {
      get: {
        summary: "Health check",
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/register": {
      post: {
        summary: "Register",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/auth/verify-email": {
      post: {
        summary: "Verify email with 6-digit code",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/VerifyRequest" } } },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: { 200: { description: "Tokens" } },
      },
    },
    "/api/auth/refresh": {
      post: {
        summary: "Refresh access token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["refreshToken"], properties: { refreshToken: { type: "string" } } },
            },
          },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/forgot-password": {
      post: {
        summary: "Request password reset code (always 200-style message; does not reveal if email exists)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } } },
        },
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/auth/reset-password": {
      post: {
        summary: "Reset password with email + 6-digit code",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } },
        },
        responses: { 200: { description: "OK" }, 400: { description: "Invalid or expired code" } },
      },
    },
    "/api/auth/request-password-change": {
      post: {
        summary: "Step 1: verify current password; send alert + OTP emails (aborts if email fails)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RequestPasswordChangeRequest" } } },
        },
        responses: {
          200: {
            description: "message + requestId (echo requestId on confirm from same device)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["message", "requestId"],
                  properties: { message: { type: "string" }, requestId: { type: "string", format: "uuid" } },
                },
              },
            },
          },
          400: { description: "Validation or wrong current password" },
          429: { description: "Cooldown or flow locked" },
          503: { description: "Email delivery failed; OTP rolled back" },
        },
      },
    },
    "/api/auth/confirm-password-change": {
      post: {
        summary: "Step 2: requestId + OTP + new password; atomic success; strict device binding",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ConfirmPasswordChangeRequest" } } },
        },
        responses: {
          200: { description: "OK" },
          400: { description: "Invalid OTP, context, requestId, expired, or weak password" },
          429: { description: "Flow locked" },
        },
      },
    },
    "/api/debug/send-test-email": {
      post: {
        summary: "Send SMTP test email (disabled in production unless ENABLE_DEBUG_EMAIL=true)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DebugSendTestEmailRequest" } } },
        },
        responses: { 200: { description: "Sent" }, 403: { description: "Forbidden" }, 502: { description: "SMTP failed" } },
      },
    },
    "/api/assets": {
      get: { summary: "List assets", responses: { 200: { description: "OK" } } },
    },
    "/api/assets/{ticker}/history": {
      get: {
        summary: "Price history",
        parameters: [{ name: "ticker", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Array of { date, price }" } },
      },
    },
    "/api/portfolio": {
      get: {
        summary: "Portfolio summary (verified users)",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/portfolio/performance": {
      get: {
        summary: "Portfolio performance series",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "Array of { date, value }" } },
      },
    },
    "/api/transactions": {
      get: {
        summary: "List user transactions",
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: "OK" } },
      },
    },
    "/api/transactions/buy": {
      post: {
        summary: "Buy",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TradeRequest" } } },
        },
        responses: { 201: { description: "Created" } },
      },
    },
    "/api/transactions/sell": {
      post: {
        summary: "Sell",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/TradeRequest" } } },
        },
        responses: { 201: { description: "Created" } },
      },
    },
  },
};
