import { asyncHandler } from "../utils/asyncHandler.js";
import * as userNotificationPreferencesService from "../services/userNotificationPreferencesService.js";

export const getNotificationPreferences = asyncHandler(async (req, res) => {
  const out = await userNotificationPreferencesService.getNotificationPreferences(req.user.id);
  res.json(out);
});

export const patchNotificationPreferences = asyncHandler(async (req, res) => {
  const out = await userNotificationPreferencesService.patchNotificationPreferences(req.user.id, req.body);
  res.json(out);
});
