import { DataTypes } from "sequelize";

export function defineAiTradingRule(sequelize) {
  return sequelize.define(
    "AiTradingRule",
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
      assetSymbol: {
        type: DataTypes.STRING(32),
        allowNull: false,
        field: "asset_symbol",
      },
      buyConditionType: {
        type: DataTypes.ENUM("percentage", "price", "ai_signal"),
        allowNull: false,
        field: "buy_condition_type",
      },
      buyThreshold: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        field: "buy_threshold",
      },
      sellConditionType: {
        type: DataTypes.ENUM("percentage", "price", "ai_signal"),
        allowNull: false,
        field: "sell_condition_type",
      },
      sellThreshold: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        field: "sell_threshold",
      },
      stopLossPercent: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        field: "stop_loss_percent",
      },
      takeProfitPercent: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0,
        field: "take_profit_percent",
      },
      useAiBuySignal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "use_ai_buy_signal",
      },
      useAiExit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "use_ai_exit",
      },
    },
    {
      tableName: "ai_trading_rules",
      underscored: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );
}
