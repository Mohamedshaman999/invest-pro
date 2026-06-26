import { useEffect, useRef } from "react";

export type MessagingRealtimeConnectFn = () => void;
export type MessagingRealtimeDisconnectFn = () => void;

/**
 * Extension temps réel (WebSocket) — placeholder.
 * Aujourd’hui : aucune connexion ; la messagerie repose sur le polling dans `MessagingContext`.
 */
export function useMessagingRealtime(_conversationId: string | null, _opts?: { enabled?: boolean }) {
  const connectRef = useRef<MessagingRealtimeConnectFn | null>(null);
  const disconnectRef = useRef<MessagingRealtimeDisconnectFn | null>(null);

  useEffect(() => {
    // Future: io(`${origin}/messaging`, { auth: { token } })
    connectRef.current = () => {};
    disconnectRef.current = () => {};
    return () => {
      disconnectRef.current?.();
    };
  }, [_conversationId]);

  return {
    /** Brancher Socket.io ou équivalent quand le backend exposera un namespace dédié. */
    registerSocketHooks: (hooks: { connect: MessagingRealtimeConnectFn; disconnect: MessagingRealtimeDisconnectFn }) => {
      connectRef.current = hooks.connect;
      disconnectRef.current = hooks.disconnect;
    },
    isRealtimeConnected: false,
  };
}
