import { Op, fn, col } from "sequelize";
import { sequelize, Conversation, Message, User } from "../models/index.js";
import { sanitizeMessageContent } from "../utils/sanitizeMessage.js";
import { AppError, ForbiddenError, NotFoundError } from "../utils/errors.js";

function mapUserTierToConversationRole(userRecord) {
  const tier = userRecord?.role == null || userRecord.role === "" ? "INVESTOR" : String(userRecord.role);
  return tier === "PRO_INVESTOR" ? "pro_investor" : "investor";
}

function serializeMessage(m) {
  return {
    id: m.id,
    conversationId: m.conversationId,
    sender: m.sender,
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt,
  };
}

function serializeConversation(c) {
  return {
    id: c.id,
    userId: c.userId,
    role: c.role,
    status: c.status,
    subject: c.subject,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

async function unreadCountsForUser(conversationIds) {
  if (!conversationIds.length) return new Map();
  const rows = await Message.findAll({
    attributes: ["conversationId", [fn("COUNT", col("Message.id")), "cnt"]],
    where: {
      conversationId: { [Op.in]: conversationIds },
      sender: "admin",
      isRead: false,
    },
    group: ["conversationId"],
    raw: true,
  });
  const map = new Map();
  for (const r of rows) {
    map.set(r.conversationId, Number(r.cnt) || 0);
  }
  return map;
}

async function unreadCountsForAdmin(conversationIds) {
  if (!conversationIds.length) return new Map();
  const rows = await Message.findAll({
    attributes: ["conversationId", [fn("COUNT", col("Message.id")), "cnt"]],
    where: {
      conversationId: { [Op.in]: conversationIds },
      sender: "user",
      isRead: false,
    },
    group: ["conversationId"],
    raw: true,
  });
  const map = new Map();
  for (const r of rows) {
    map.set(r.conversationId, Number(r.cnt) || 0);
  }
  return map;
}

export async function listConversationsForUser(userId) {
  const conversations = await Conversation.findAll({
    where: { userId },
    order: [["updated_at", "DESC"]],
    include: [
      {
        model: Message,
        as: "messages",
        separate: true,
        limit: 1,
        order: [["created_at", "DESC"]],
      },
    ],
  });
  const ids = conversations.map((c) => c.id);
  const unreadMap = await unreadCountsForUser(ids);
  return conversations.map((c) => {
    const last = c.messages?.[0];
    return {
      ...serializeConversation(c),
      lastMessage: last
        ? {
            content: last.content,
            sender: last.sender,
            createdAt: last.createdAt,
          }
        : null,
      unreadCount: unreadMap.get(c.id) ?? 0,
    };
  });
}

export async function getConversationForUser(conversationId, userId) {
  const conv = await Conversation.findOne({
    where: { id: conversationId, userId },
  });
  if (!conv) throw new NotFoundError("Conversation not found");

  await Message.update(
    { isRead: true },
    { where: { conversationId, sender: "admin", isRead: false } }
  );

  const messages = await Message.findAll({
    where: { conversationId },
    order: [["created_at", "ASC"]],
  });

  return {
    conversation: serializeConversation(conv),
    messages: messages.map(serializeMessage),
  };
}

export async function createConversationForUser(userRecord, { subject, message: rawMessage }) {
  const content = sanitizeMessageContent(rawMessage);
  if (!content) throw new AppError("Message cannot be empty", 400, "EMPTY_MESSAGE");

  const sub =
    subject == null || String(subject).trim() === ""
      ? null
      : String(subject).trim().slice(0, 200);

  const role = mapUserTierToConversationRole(userRecord);

  const result = await sequelize.transaction(async (t) => {
    const conv = await Conversation.create(
      {
        userId: userRecord.id,
        role,
        status: "open",
        subject: sub,
      },
      { transaction: t }
    );
    const msg = await Message.create(
      {
        conversationId: conv.id,
        sender: "user",
        content,
        isRead: false,
      },
      { transaction: t }
    );
    await conv.update({ updatedAt: new Date() }, { transaction: t });
    return { conv, msg };
  });

  return {
    conversation: serializeConversation(result.conv),
    message: serializeMessage(result.msg),
  };
}

export async function sendUserMessage(userRecord, { conversationId, content: raw }) {
  const content = sanitizeMessageContent(raw);
  if (!content) throw new AppError("Message cannot be empty", 400, "EMPTY_MESSAGE");

  const conv = await Conversation.findOne({
    where: { id: conversationId, userId: userRecord.id },
  });
  if (!conv) throw new NotFoundError("Conversation not found");
  if (conv.status === "closed") throw new ForbiddenError("Conversation is closed");

  const msg = await Message.create({
    conversationId,
    sender: "user",
    content,
    isRead: false,
  });

  await conv.update({ updatedAt: new Date() });

  return serializeMessage(msg);
}

export async function listConversationsForAdmin({ status, role }) {
  const where = {};
  if (status === "open" || status === "closed") where.status = status;
  if (role === "investor" || role === "pro_investor") where.role = role;

  const conversations = await Conversation.findAll({
    where,
    order: [["updated_at", "DESC"]],
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "email"],
      },
      {
        model: Message,
        as: "messages",
        separate: true,
        limit: 1,
        order: [["created_at", "DESC"]],
      },
    ],
  });

  const ids = conversations.map((c) => c.id);
  const unreadMap = await unreadCountsForAdmin(ids);

  return conversations.map((c) => {
    const last = c.messages?.[0];
    const u = c.user;
    return {
      ...serializeConversation(c),
      user: u ? { id: u.id, name: u.name, email: u.email } : null,
      lastMessage: last
        ? {
            content: last.content,
            sender: last.sender,
            createdAt: last.createdAt,
          }
        : null,
      unreadCount: unreadMap.get(c.id) ?? 0,
    };
  });
}

export async function getConversationForAdmin(conversationId) {
  const conv = await Conversation.findByPk(conversationId, {
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
  });
  if (!conv) throw new NotFoundError("Conversation not found");

  await Message.update(
    { isRead: true },
    { where: { conversationId, sender: "user", isRead: false } }
  );

  const messages = await Message.findAll({
    where: { conversationId },
    order: [["created_at", "ASC"]],
  });

  const u = conv.user;
  return {
    conversation: {
      ...serializeConversation(conv),
      user: u ? { id: u.id, name: u.name, email: u.email } : null,
    },
    messages: messages.map(serializeMessage),
  };
}

export async function sendAdminReply({ conversationId, content: raw }) {
  const content = sanitizeMessageContent(raw);
  if (!content) throw new AppError("Message cannot be empty", 400, "EMPTY_MESSAGE");

  const conv = await Conversation.findByPk(conversationId);
  if (!conv) throw new NotFoundError("Conversation not found");
  if (conv.status === "closed") throw new ForbiddenError("Conversation is closed");

  const msg = await Message.create({
    conversationId,
    sender: "admin",
    content,
    isRead: false,
  });

  await conv.update({ updatedAt: new Date() });

  return serializeMessage(msg);
}

export async function patchConversationStatus(conversationId, status) {
  const conv = await Conversation.findByPk(conversationId);
  if (!conv) throw new NotFoundError("Conversation not found");
  await conv.update({ status });
  return serializeConversation(conv);
}
