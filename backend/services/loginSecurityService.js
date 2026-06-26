import { Op } from "sequelize";
import { LoginAttemptLog, User } from "../models/index.js";

/** Fenêtre « tentatives rapides » sur un même compte. */
const RAPID_WINDOW_MS = 2 * 60 * 1000;
const RAPID_FAILURE_THRESHOLD = 3;

/** Fenêtre pour détecter des essais depuis une même IP sur plusieurs e-mails. */
const IP_SPRAY_WINDOW_MS = 10 * 60 * 1000;
const IP_SPRAY_DISTINCT_EMAILS = 4;

function safeIp(ip) {
  return String(ip || "").trim().slice(0, 64);
}

/**
 * Enregistre une tentative échouée (mot de passe invalide ou utilisateur absent).
 */
export async function recordFailedLoginAttempt({ userId, emailNorm, ip }) {
  const key = String(emailNorm || "").trim().toLowerCase().slice(0, 255);
  await LoginAttemptLog.create({
    userId: userId ?? null,
    emailNormalized: key || "unknown",
    ip: safeIp(ip),
  });
}

async function lockUserSuspicious(userId) {
  await User.update(
    {
      accountLocked: true,
      lockReason: "Suspicious activity detected",
      lockUntil: null,
    },
    { where: { id: userId, accountLocked: false } }
  );
}

/**
 * Après une échec sur un utilisateur existant : verrouillage automatique si comportement suspect.
 * @param {import("sequelize").Model} user — instance User (déjà sauvegardée avec compteur à jour)
 * @param {string} ip
 */
export async function evaluateBruteForceAfterFailure(user, ip) {
  const userId = user.id;
  const now = Date.now();
  const sip = safeIp(ip);
  const sinceRapid = new Date(now - RAPID_WINDOW_MS);
  const sinceSpray = new Date(now - IP_SPRAY_WINDOW_MS);

  const rapidCount = await LoginAttemptLog.count({
    where: {
      userId,
      createdAt: { [Op.gte]: sinceRapid },
    },
  });
  if (rapidCount >= RAPID_FAILURE_THRESHOLD) {
    await lockUserSuspicious(userId);
    return;
  }

  const distinctRows = await LoginAttemptLog.findAll({
    attributes: ["emailNormalized"],
    where: {
      ip: sip,
      createdAt: { [Op.gte]: sinceSpray },
    },
    group: ["emailNormalized"],
    raw: true,
  });
  const distinctEmails = distinctRows.length;
  if (distinctEmails >= IP_SPRAY_DISTINCT_EMAILS) {
    await lockUserSuspicious(userId);
  }
}
