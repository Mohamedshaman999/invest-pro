import { DataTypes } from "sequelize";

export function defineKnownDevice(sequelize) {
  return sequelize.define(
    "KnownDevice",
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
      fingerprint: {
        type: DataTypes.STRING(64),
        allowNull: false,
      },
    },
    {
      tableName: "known_devices",
      indexes: [{ unique: true, fields: ["user_id", "fingerprint"] }],
    }
  );
}
