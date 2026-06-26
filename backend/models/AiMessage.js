import { DataTypes } from "sequelize";

export function defineAiMessage(sequelize) {
  return sequelize.define(
    "AiMessage",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversationId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "conversation_id",
      },
      role: {
        type: DataTypes.ENUM("user", "assistant"),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      tableName: "ai_messages",
      updatedAt: false,
      indexes: [
        { fields: ["conversation_id"] },
        { fields: ["created_at"] },
      ],
    }
  );
}
