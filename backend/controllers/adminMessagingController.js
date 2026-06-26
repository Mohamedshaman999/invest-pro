import * as messagingService from "../services/messagingService.js";

export async function getAdminConversations(req, res, next) {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const rows = await messagingService.listConversationsForAdmin({ status, role });
    res.json({ conversations: rows });
  } catch (e) {
    next(e);
  }
}

export async function getAdminConversationMessages(req, res, next) {
  try {
    const data = await messagingService.getConversationForAdmin(req.params.id);
    res.json(data);
  } catch (e) {
    next(e);
  }
}

export async function postAdminMessage(req, res, next) {
  try {
    const msg = await messagingService.sendAdminReply(req.body);
    res.status(201).json({ message: msg });
  } catch (e) {
    next(e);
  }
}

export async function patchAdminConversation(req, res, next) {
  try {
    const { status } = req.body;
    const conv = await messagingService.patchConversationStatus(req.params.id, status);
    res.json({ conversation: conv });
  } catch (e) {
    next(e);
  }
}
