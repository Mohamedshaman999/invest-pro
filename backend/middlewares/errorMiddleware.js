import { AppError } from "../utils/errors.js";
import config from "../config/index.js";
import { logger } from "../utils/logger.js";

export function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (!err.isOperational) {
    logger.error(`Unhandled error: ${err?.message || err}${err?.stack ? `\n${err.stack}` : ""}`);
  } else {
    logger.debug(`Operational error: ${err.message} (code=${err.code ?? "n/a"})`);
  }

  const status = err instanceof AppError ? err.statusCode : 500;
  const isDev = config.nodeEnv === "development";
  const body = {
    message:
      err instanceof AppError
        ? err.message
        : isDev && typeof err?.message === "string" && err.message.trim()
          ? err.message.trim()
          : "Internal server error",
    code: err instanceof AppError ? err.code : "INTERNAL_ERROR",
  };
  if (isDev && !(err instanceof AppError)) {
    body.stack = err.stack;
  }
  res.status(status).json(body);
}
