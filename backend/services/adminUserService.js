import { User } from "../models/index.js";
import { AppError } from "../utils/errors.js";

function displayName(user) {
  const fn = String(user.firstName ?? "").trim();
  const ln = String(user.lastName ?? "").trim();
  const combined = `${fn} ${ln}`.trim();
  return combined || user.name || "";
}

export function toAdminUserDto(user) {
  return {
    id: user.id,
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    name: user.name,
    displayName: displayName(user),
    email: user.email,
    investorRole: user.role === "PRO_INVESTOR" ? "PRO_INVESTOR" : "INVESTOR",
    lastActiveAt: user.lastActiveAt ? new Date(user.lastActiveAt).toISOString() : null,
    failedLoginAttempts: Number(user.failedLoginAttempts) || 0,
    accountLocked: user.accountLocked === true,
    lockReason: user.lockReason ?? null,
    lockUntil: user.lockUntil ? new Date(user.lockUntil).toISOString() : null,
    isVerified: user.isVerified === true,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

export async function listUsersPaginated({ page, limit }) {
  const safeLimit = Math.min(100, Math.max(1, limit));
  const safePage = Math.max(1, page);
  const offset = (safePage - 1) * safeLimit;

  const { rows, count } = await User.findAndCountAll({
    order: [["id", "DESC"]],
    limit: safeLimit,
    offset,
    attributes: {
      exclude: ["password", "twoFaSecret", "verificationCode", "passwordResetCode", "passwordChangeOtpHash"],
    },
  });

  return {
    users: rows.map(toAdminUserDto),
    total: count,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(count / safeLimit)),
  };
}

export async function getUserByIdForAdmin(id) {
  const user = await User.findByPk(id, {
    attributes: {
      exclude: ["password", "twoFaSecret", "verificationCode", "passwordResetCode", "passwordChangeOtpHash"],
    },
  });
  return user;
}

export async function softDeleteUser({ targetUserId, actorUserId }) {
  if (targetUserId === actorUserId) {
    throw new AppError("Cannot delete your own account from this panel", 400, "SELF_DELETE_FORBIDDEN");
  }
  const user = await User.findByPk(targetUserId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  await user.destroy();
  return { message: "User archived", id: targetUserId };
}

export async function unlockUserAccount(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
  user.accountLocked = false;
  user.lockReason = null;
  user.lockUntil = null;
  user.failedLoginAttempts = 0;
  await user.save();
  return toAdminUserDto(user);
}
