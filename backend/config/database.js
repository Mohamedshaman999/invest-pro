import { Sequelize } from "sequelize";
import config from "./index.js";
import { logger } from "../utils/logger.js";

export const sequelize = new Sequelize(config.database.url, {
  dialect: "postgres",
  logging: config.nodeEnv === "development" ? (msg) => logger.debug(msg) : false,
  define: {
    underscored: true,
    timestamps: true,
  },
});

export async function connectDatabase() {
  await sequelize.authenticate();
  logger.info("Database connection established");
}
