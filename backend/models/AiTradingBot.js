import { DataTypes } from "sequelize";

export function defineAiTradingBot(sequelize) {
  return sequelize.define(
    "AiTradingBot",
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
      name: {
        type: DataTypes.STRING(128),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "paused", "stopped"),
        allowNull: false,
        defaultValue: "stopped",
      },
      mode: {
        type: DataTypes.ENUM("manual_strategy", "ai_strategy"),
        allowNull: false,
        defaultValue: "manual_strategy",
      },
      maxTransactionsPerDay: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        field: "max_transactions_per_day",
      },
      maxAllocation: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
        field: "max_allocation",
        comment: "Max TND per trade (allocation cap)",
      },
      riskLevel: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium",
        field: "risk_level",
      },
      dailyRealizedLossTnd: {
        type: DataTypes.DECIMAL(18, 4),
        allowNull: false,
        defaultValue: 0,
        field: "daily_realized_loss_tnd",
      },
      lossResetDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: "loss_reset_date",
      },
      lastTradeAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_trade_at",
      },
    },
    {
      tableName: "ai_trading_bots",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}
