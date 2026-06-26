import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { TOKEN_KEY } from "../lib/api";

export type AiTradingSocketHandlers = {
  onTradeExecuted?: (payload: unknown) => void;
  onBotStarted?: (payload: unknown) => void;
  onBotPaused?: (payload: unknown) => void;
  onLossLimit?: (payload: unknown) => void;
};

/**
 * Connexion Socket.io (même origine en dev via proxy Vite `/socket.io`).
 */
export function useAiTradingSocket(enabled: boolean, handlers: AiTradingSocketHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const origin =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";

    const socket: Socket = io(origin, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
    });

    const h = () => handlersRef.current;
    socket.on("trade_executed", (p) => h().onTradeExecuted?.(p));
    socket.on("bot_started", (p) => h().onBotStarted?.(p));
    socket.on("bot_paused", (p) => h().onBotPaused?.(p));
    socket.on("loss_limit_triggered", (p) => h().onLossLimit?.(p));

    socket.on("connect_error", () => {
      /* silencieux : l’UI REST reste fonctionnelle */
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [enabled]);
}
