import { DataTypes } from "sequelize";

export function defineMessage(sequelize) {
  return sequelize.define(
    "Message",
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
      sender: {
        type: DataTypes.ENUM("user", "admin"),
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "is_read",
      },
    },
    {
      tableName: "messages",
      updatedAt: false,
      indexes: [
        { fields: ["conversation_id"] },
        { fields: ["created_at"] },
      ],
    }
  );
}
