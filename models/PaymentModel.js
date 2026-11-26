import { DataTypes } from "sequelize";
import db from "../configs/Database.js";

const Payment = db.define(
    "payments",
    {
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        amount: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        paid_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        snapToken: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        snapRedirectUrl: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        transactionId: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    },
    {
        tableName: "payments",
        timestamps: true,
    }
);

export default Payment;