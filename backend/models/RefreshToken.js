import { DataTypes } from "sequelize";

export function defineRefreshToken(sequelize) {
  return sequelize.define(
    "RefreshToken",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },
      tokenHash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        field: "token_hash",
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "expires_at",
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "revoked_at",
      },
    },
    { tableName: "refresh_tokens" }
  );
}
