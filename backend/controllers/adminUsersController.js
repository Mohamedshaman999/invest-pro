import { asyncHandler } from "../utils/asyncHandler.js";
import * as adminUserService from "../services/adminUserService.js";

function parsePositiveInt(raw, fallback) {
  const n = Number.parseInt(String(raw ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

export const listAdminUsers = asyncHandler(async (req, res) => {
  const page = parsePositiveInt(req.query.page, 1);
  const limit = parsePositiveInt(req.query.limit, 20);
  const out = await adminUserService.listUsersPaginated({ page, limit });
  res.json(out);
});

export const getAdminUser = asyncHandler(async (req, res) => {
  const id = Number.parseInt(String(req.params.id ?? ""), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ message: "Invalid user id", code: "INVALID_ID" });
    return;
  }
  const user = await adminUserService.getUserByIdForAdmin(id);
  if (!user) {
    res.status(404).json({ message: "User not found", code: "NOT_FOUND" });
    return;
  }
  res.json(adminUserService.toAdminUserDto(user));
});

export const deleteAdminUser = asyncHandler(async (req, res) => {
  const id = Number.parseInt(String(req.params.id ?? ""), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ message: "Invalid user id", code: "INVALID_ID" });
    return;
  }
  const out = await adminUserService.softDeleteUser({
    targetUserId: id,
    actorUserId: req.user.id,
  });
  res.json(out);
});

export const unlockAdminUser = asyncHandler(async (req, res) => {
  const id = Number.parseInt(String(req.params.id ?? ""), 10);
  if (!Number.isFinite(id) || id < 1) {
    res.status(400).json({ message: "Invalid user id", code: "INVALID_ID" });
    return;
  }
  const dto = await adminUserService.unlockUserAccount(id);
  res.json(dto);
});
