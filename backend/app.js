import express from "express";
import { Router } from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import config from "./config/index.js";
import { swaggerSpec } from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
import portfolioRoutes from "./routes/portfolioRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import aiTradingRoutes from "./routes/aiTradingRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import aiAssistantRoutes from "./routes/aiAssistantRoutes.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";

const app = express();

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "100kb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok", env: config.nodeEnv });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const api = Router();
api.get("/health", (req, res) => {
  res.json({ status: "ok", env: config.nodeEnv });
});
api.use("/auth", authRoutes);
api.use(debugRoutes);
api.use(aiRoutes);
api.use(userRoutes);
api.use(subscriptionRoutes);
api.use(walletRoutes);
api.use(assetRoutes);
api.use(portfolioRoutes);
api.use(transactionRoutes);
api.use(adminRoutes);
api.use(conversationRoutes);
api.use(aiTradingRoutes);
api.use(aiAssistantRoutes);
app.use("/api", api);

app.use((req, res) => {
  res.status(404).json({ message: "Not found", code: "NOT_FOUND" });
});

app.use(errorMiddleware);

export default app;
