import { DataTypes } from "sequelize";

export function defineAiConversation(sequelize) {
  return sequelize.define(
    "AiConversation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },
    },
    {
      tableName: "ai_conversations",
      indexes: [{ fields: ["user_id"] }, { fields: ["updated_at"] }],
    }
  );
}
