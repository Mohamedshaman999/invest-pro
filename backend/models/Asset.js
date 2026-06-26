import { DataTypes } from "sequelize";

export function defineAsset(sequelize) {
  return sequelize.define(
    "Asset",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticker: {
        type: DataTypes.STRING(32),
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      currentPrice: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
        field: "current_price",
      },
      category: {
        type: DataTypes.STRING(64),
        allowNull: false,
        defaultValue: "Stock",
      },
      variationPercent: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: true,
        field: "variation_percent",
      },
      lastVolume: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: "last_volume",
      },
      marketCap: {
        type: DataTypes.DECIMAL(24, 4),
        allowNull: true,
        field: "market_cap",
      },
      quoteUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "quote_updated_at",
      },
    },
    {
      tableName: "assets",
      indexes: [
        { unique: true, fields: ["ticker"] },
        { fields: ["name"], name: "assets_name_idx" },
        { fields: ["name", "ticker"], name: "assets_name_ticker_idx" },
      ],
    }
  );
}
