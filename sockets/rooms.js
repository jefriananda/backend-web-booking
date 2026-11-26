import Booking from "../models/BookingModel.js";
import Field from "../models/FieldModel.js";
import User from "../models/UserModel.js";

// Penamaan ruang harus konsisten dengan emitter dan client.
export const ROOM = {
    user: (uuid) => `user:${uuid}`,
    role: (role) => `role:${role}`,
    booking: (bookingCode) => `booking:${bookingCode}`,
    field: (fieldId) => `field:${fieldId}`,
};

// Setiap socket yang login otomatis masuk ke ruang user dan role-nya.
export const gabungRuangAwal = (socket, user) => {
    const rooms = [ROOM.user(user.uuid), ROOM.role(user.role)];
    rooms.forEach((room) => socket.join(room));
    return rooms;
};

// Cek kepemilikan booking sebelum mengizinkan socket masuk ke ruang booking.
export const bookingBisaDiakses = async ({ user, bookingCode }) => {
    if (!user || !bookingCode) return false;

    const booking = await Booking.findOne({
        where: { booking_code: bookingCode },
        attributes: ["id", "booking_code"],
        include: [{ model: User, as: "user", attributes: ["uuid"] }],
    });

    if (!booking) return false;
    if (user.role === "admin") return true;

    return booking.user?.uuid === user.uuid;
};

export const fieldAda = async (fieldId) => {
    if (!Number.isInteger(fieldId) || fieldId <= 0) return false;
    return Boolean(await Field.findByPk(fieldId, { attributes: ["id"] }));
};
