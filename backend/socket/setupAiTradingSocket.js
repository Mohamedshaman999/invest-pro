import { Server } from "socket.io";
import { User } from "../models/index.js";
import { verifyAccessToken } from "../services/authService.js";
import { assertAccessTokenVersionMatches } from "../utils/accessTokenVersion.js";
import { userHasProInvestorAccess } from "../utils/investorTier.js";
import { setAiTradingIo } from "../services/aiTradingRealtime.js";
import { logger } from "../utils/logger.js";
import config from "../config/index.js";

/**
 * @param {import("http").Server} httpServer
 */
export function attachAiTradingSocket(httpServer) {
  const allowed = new Set();
  try {
    const fe = new URL(config.frontendUrl);
    allowed.add(fe.origin);
  } catch {
    /* ignore */
  }

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) return cb(null, true);
        if (allowed.has(origin)) return cb(null, true);
        cb(null, false);
      },
      credentials: true,
    },
  });

  setAiTradingIo(io);

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== "string") {
        return next(new Error("unauthorized"));
      }
      const payload = verifyAccessToken(token);
      const user = await User.findByPk(payload.sub);
      if (!user) return next(new Error("unauthorized"));
      assertAccessTokenVersionMatches(user, payload);
      if (!userHasProInvestorAccess(user)) {
        return next(new Error("forbidden"));
      }
      socket.data.userId = user.id;
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const uid = socket.data.userId;
    if (uid) {
      socket.join(`user:${uid}`);
    }
    socket.on("disconnect", () => {});
  });

  logger.info("Socket.io mounted at /socket.io (AI trading events)");
  return io;
}
