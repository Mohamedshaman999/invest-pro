import { DataTypes } from "sequelize";

export function defineAiTradingTransaction(sequelize) {
  return sequelize.define(
    "AiTradingTransaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      botId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "bot_id",
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "user_id",
      },
      assetSymbol: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: "asset_symbol",
      },
      action: {
        type: DataTypes.ENUM("buy", "sell"),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        comment: "TND: cost for buy, proceeds for sell",
      },
      price: {
        type: DataTypes.DECIMAL(18, 6),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(24, 8),
        allowNull: false,
      },
      tradeTimestamp: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: "trade_timestamp",
      },
      status: {
        type: DataTypes.ENUM("success", "failed", "pending"),
        allowNull: false,
        defaultValue: "pending",
      },
      idempotencyKey: {
        type: DataTypes.STRING(160),
        allowNull: true,
        unique: true,
        field: "idempotency_key",
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: "error_message",
      },
    },
    {
      tableName: "ai_trading_transactions",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}
