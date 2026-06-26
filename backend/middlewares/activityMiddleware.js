import { User } from "../models/index.js";

const lastFlush = new Map();
const MIN_INTERVAL_MS = 45_000;

/**
 * Met à jour last_active_at sans bloquer la requête (échantillonnage par utilisateur).
 * @param {number} userId
 */
export function scheduleUserActivityTouch(userId) {
  if (!userId) return;
  const now = Date.now();
  const prev = lastFlush.get(userId) || 0;
  if (now - prev < MIN_INTERVAL_MS) return;
  lastFlush.set(userId, now);
  setImmediate(() => {
    User.update({ lastActiveAt: new Date() }, { where: { id: userId } }).catch(() => {});
  });
}
