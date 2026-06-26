import { DataTypes } from "sequelize";

export const TRANSACTION_TYPES = ["BUY", "SELL"];

export function defineTransaction(sequelize) {
  return sequelize.define(
    "Transaction",
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
      assetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "asset_id",
      },
      type: {
        type: DataTypes.ENUM(...TRANSACTION_TYPES),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(24, 8),
        allowNull: false,
      },
      priceAtExecution: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        field: "price_at_execution",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    { tableName: "transactions" }
  );
}
