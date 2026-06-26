import { DataTypes } from "sequelize";

export function defineAssetPriceHistory(sequelize) {
  return sequelize.define(
    "AssetPriceHistory",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      assetId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "asset_id",
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
      },
    },
    {
      tableName: "asset_price_history",
      indexes: [{ unique: true, fields: ["asset_id", "date"] }],
    }
  );
}
