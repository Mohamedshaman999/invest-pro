import winston from "winston";
import config from "../config/index.js";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf((info) => {
  const { level, stack, timestamp: ts } = info;
  let { message } = info;
  if (typeof message !== "string") {
    if (message instanceof Error) message = message.message;
    else if (message != null) message = JSON.stringify(message);
    else message = "";
  }
  if (stack) return `${ts} [${level}] ${message}\n${stack}`;
  return `${ts} [${level}] ${message}`;
});

export const logger = winston.createLogger({
  level: config.nodeEnv === "production" ? "info" : "debug",
  format: combine(errors({ stack: true }), timestamp(), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), errors({ stack: true }), timestamp(), logFormat),
    }),
  ],
});
