import { DataTypes } from "sequelize";

export function defineWallet(sequelize) {
  return sequelize.define(
    "Wallet",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "user_id",
        references: { model: "users", key: "id" },
      },
      balance: {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: "wallets",
      indexes: [{ unique: true, fields: ["user_id"] }],
    }
  );
}
