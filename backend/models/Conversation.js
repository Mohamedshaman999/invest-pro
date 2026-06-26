import { DataTypes } from "sequelize";

export function defineConversation(sequelize) {
  return sequelize.define(
    "Conversation",
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
      /** Snapshot du tier au moment de la création (investisseur standard vs Pro). */
      role: {
        type: DataTypes.ENUM("investor", "pro_investor"),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("open", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      subject: {
        type: DataTypes.STRING(200),
        allowNull: true,
      },
    },
    {
      tableName: "conversations",
      indexes: [
        { fields: ["user_id"] },
        { fields: ["status"] },
        { fields: ["updated_at"] },
      ],
    }
  );
}
