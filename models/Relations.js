import User from "./UserModel.js";
import Field from "./FieldModel.js";
import Booking from "./BookingModel.js";
import Payment from "./PaymentModel.js";

// Relasi User dan Booking
User.hasMany(Booking, {
    foreignKey: "user_id",
    as: "bookings",
});
Booking.belongsTo(User, {
    foreignKey: "user_id",
    as: "user",
});

// Relasi Field dan Booking
Field.hasMany(Booking, {
    foreignKey: "field_id",
    as: "bookings",
});
Booking.belongsTo(Field, {
    foreignKey: "field_id",
    as: "field",
});

// Relasi Booking dan Payment
Booking.hasMany(Payment, {
    foreignKey: "booking_id",
    as: "payments",
});
Payment.belongsTo(Booking, {
    foreignKey: "booking_id",
    as: "booking",
});

export { User, Field, Booking, Payment };