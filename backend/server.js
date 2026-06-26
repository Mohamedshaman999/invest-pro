import "dotenv/config";
import http from "http";
import app from "./app.js";
import config from "./config/index.js";
import { connectDatabase, sequelize } from "./config/database.js";
import "./models/index.js";
import { logger } from "./utils/logger.js";
import { seedAssetsIfEmpty } from "./services/bvmtService.js";
import { seedDemoUsersIfMissing } from "./services/seedDemoUsers.js";
import { ensureWalletsForUsersWithoutOne } from "./services/walletService.js";
import { startPriceUpdateJob, runPriceUpdateOnce } from "./jobs/priceUpdateJob.js";
import { startBourseMarketWatchJob } from "./jobs/bourseMarketWatchJob.js";
import { logSmtpConfigAtStartup, verifySmtpConnection } from "./services/emailService.js";
import { attachAiTradingSocket } from "./socket/setupAiTradingSocket.js";
import { startAiTradingJob } from "./jobs/aiTradingJob.js";

async function main() {
  await connectDatabase();
  if (config.dbSync) {
    console.warn(
      "[backend] DB_SYNC is enabled — Sequelize will align existing tables to models (alter: true). Development only; for a clean slate use `npm run db:reset` in the backend folder."
    );
    await sequelize.sync({ alter: true });
    logger.warn(
      "sequelize.sync({ alter: true }) ran (DB_SYNC=true). Disable DB_SYNC in production after migrations are stable."
    );
  }
  await seedDemoUsersIfMissing();
  await ensureWalletsForUsersWithoutOne();
  await seedAssetsIfEmpty();
  runPriceUpdateOnce().catch((e) =>
    logger.warn(`Initial BVMT price update skipped or failed: ${e?.message || e}`)
  );
  startPriceUpdateJob();
  startBourseMarketWatchJob();
  startAiTradingJob();

  const httpServer = http.createServer(app);
  attachAiTradingSocket(httpServer);

  const server = httpServer.listen(config.port, () => {
    logger.info(`API listening on http://localhost:${config.port}`);
    logger.info(`Swagger UI: http://localhost:${config.port}/api-docs`);

    void (async () => {
      try {
        logSmtpConfigAtStartup();
        await verifySmtpConnection();
      } catch (e) {
        console.error("EMAIL ERROR:", e?.message || e, e?.stack || "");
        logger.error(`SMTP startup check failed: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
      }
    })();
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      logger.error(
        `Port ${config.port} is already in use. Stop the other API (or pick a different PORT in backend/.env and update the Vite proxy target in vite.config.ts). If you use "npm run dev:all" at the repo root, do not also run the backend in another terminal.`
      );
    } else {
      logger.error(`Server listen error: ${err.message}`);
    }
    process.exit(1);
  });
}

main().catch((e) => {
  logger.error(`Fatal startup error: ${e?.message || e}${e?.stack ? `\n${e.stack}` : ""}`);
  process.exit(1);
});
