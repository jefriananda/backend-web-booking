import { DataTypes } from "sequelize";
import db from "../configs/Database.js";

const User = db.define(
    "users",
    {
        uuid: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            allowNull: false,
            unique: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(150),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM("admin", "customer"),
            allowNull: false,
            defaultValue: "customer",
        },
    },
    {
        tableName: "users",
        timestamps: true,
    }
);

export default User;