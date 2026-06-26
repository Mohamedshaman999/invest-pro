import { KnownDevice } from "../models/index.js";
import { deviceFingerprint } from "../utils/cryptoUtils.js";

export async function isKnownDevice(userId, ip, userAgent) {
  const fingerprint = deviceFingerprint(ip, userAgent);
  const row = await KnownDevice.findOne({ where: { userId, fingerprint } });
  return { known: Boolean(row), fingerprint };
}

export async function recordKnownDevice(userId, fingerprint) {
  await KnownDevice.findOrCreate({
    where: { userId, fingerprint },
    defaults: { userId, fingerprint },
  });
}
