import { DataTypes } from "sequelize";

export function definePriceAlertEmailLog(sequelize) {
  return sequelize.define(
    "PriceAlertEmailLog",
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
      alertDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: "alert_date",
      },
    },
    {
      tableName: "price_alert_email_logs",
      indexes: [{ unique: true, fields: ["user_id", "asset_id", "alert_date"] }],
    }
  );
}
