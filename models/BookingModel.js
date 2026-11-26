import { DataTypes } from "sequelize";
import db from "../configs/Database.js";

const Booking = db.define(
    "bookings",
    {
        booking_code: {
            type: DataTypes.STRING(30),
            allowNull: false,
            unique: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        field_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        booking_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false,
        },
        total_price: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(
                "pending",
                "confirmed",
                "cancelled",
                "completed",
                "expired"
            ),
            allowNull: false,
            defaultValue: "pending",
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "bookings",
        timestamps: true,
    }
);

export default Booking;