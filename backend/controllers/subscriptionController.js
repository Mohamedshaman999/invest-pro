import { asyncHandler } from "../utils/asyncHandler.js";
import { activateProSubscription } from "../services/proSubscriptionService.js";
import * as userProfileService from "../services/userProfileService.js";

export const postCompleteProSubscription = asyncHandler(async (req, res) => {
  const planType = req.body?.planType === "yearly" ? "yearly" : "monthly";
  await activateProSubscription(req.user.id, planType);
  const profile = await userProfileService.getUserProfile(req.user.id);
  res.status(200).json({ message: "Pro subscription activated", profile });
});
