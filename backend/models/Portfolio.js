import { DataTypes } from "sequelize";

export function definePortfolio(sequelize) {
  return sequelize.define(
    "Portfolio",
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
      totalQuantity: {
        type: DataTypes.DECIMAL(24, 8),
        allowNull: false,
        defaultValue: 0,
        field: "total_quantity",
      },
      averagePurchasePrice: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
        field: "average_purchase_price",
      },
    },
    {
      tableName: "portfolios",
      indexes: [{ unique: true, fields: ["user_id", "asset_id"] }],
    }
  );
}
