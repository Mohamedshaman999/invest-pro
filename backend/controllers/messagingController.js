import * as messagingService from "../services/messagingService.js";

export async function postConversation(req, res, next) {
  try {
    const out = await messagingService.createConversationForUser(req.user, req.body);
    res.status(201).json(out);
  } catch (e) {
    next(e);
  }
}

export async function getConversations(req, res, next) {
  try {
    const rows = await messagingService.listConversationsForUser(req.user.id);
    res.json({ conversations: rows });
  } catch (e) {
    next(e);
  }
}

export async function getConversationMessages(req, res, next) {
  try {
    const data = await messagingService.getConversationForUser(req.params.id, req.user.id);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function postMessage(req, res, next) {
  try {
    const msg = await messagingService.sendUserMessage(req.user, req.body);
    res.status(201).json({ message: msg });
  } catch (e) {
    next(e);
  }
}
