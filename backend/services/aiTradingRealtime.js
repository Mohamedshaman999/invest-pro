/** @type {import("socket.io").Server | null} */
let io = null;

/**
 * @param {import("socket.io").Server} server
 */
export function setAiTradingIo(server) {
  io = server;
}

/**
 * @param {number} userId
 * @param {string} event
 * @param {unknown} payload
 */
export function emitAiTradingToUser(userId, event, payload) {
  try {
    io?.to(`user:${userId}`).emit(event, payload);
  } catch {
    /* never throw into HTTP layer */
  }
}
