import { DataTypes } from "sequelize";
import db from "../configs/Database.js";

const Field = db.define(
    "fields",
    {
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        price_per_hour: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        image: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
    },
    {
        tableName: "fields",
        timestamps: true,
    }
);

export default Field;