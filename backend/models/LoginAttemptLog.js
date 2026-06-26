import { DataTypes } from "sequelize";

export function defineLoginAttemptLog(sequelize) {
  return sequelize.define(
    "LoginAttemptLog",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "user_id",
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
      emailNormalized: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "email_normalized",
      },
      ip: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: "",
      },
    },
    {
      tableName: "login_attempt_logs",
      indexes: [
        { fields: ["ip", "created_at"] },
        { fields: ["user_id", "created_at"] },
      ],
    }
  );
}
