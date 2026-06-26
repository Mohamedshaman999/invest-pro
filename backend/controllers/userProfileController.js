import { asyncHandler } from "../utils/asyncHandler.js";
import * as userProfileService from "../services/userProfileService.js";

export const getUserProfile = asyncHandler(async (req, res) => {
  const out = await userProfileService.getUserProfile(req.user.id);
  res.json(out);
});

export const patchUserProfile = asyncHandler(async (req, res) => {
  const out = await userProfileService.patchUserProfile(req.user.id, req.body);
  res.json(out);
});
