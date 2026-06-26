import * as aiAssistantChatService from "../services/aiAssistantChatService.js";
import { aiChatSchema } from "../validators/schemas.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const postAiChat = asyncHandler(async (req, res) => {
  const { error, value } = aiChatSchema.validate(req.body ?? {}, { abortEarly: false, stripUnknown: true });
  if (error) {
    res.status(400).json({ message: error.details.map((d) => d.message).join("; "), code: "VALIDATION" });
    return;
  }

  const currency = req.user.currency || "TND";
  const { reply, conversationId } = await aiAssistantChatService.handleAiChat({
    userId: req.user.id,
    currency,
    value,
  });

  res.json({ reply, conversationId });
});

export const listAiConversations = asyncHandler(async (req, res) => {
  const conversations = await aiAssistantChatService.listAiConversations(req.user.id);
  res.json({ conversations });
});

export const getAiConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = await aiAssistantChatService.getAiConversationDetail(req.user.id, id);
  res.json(payload);
});

export const deleteAiConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await aiAssistantChatService.deleteAiConversation(req.user.id, id);
  res.status(204).send();
});
