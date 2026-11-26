import { Op } from "sequelize";
import Booking from "../models/BookingModel.js";
import User from "../models/UserModel.js";
import { timeToMinutes } from "../utils/BookingTime.js";
import {
  emitAvailabilityChanged,
  emitBookingExpired,
} from "../sockets/emitter.js";

const STATUS_MENGHALANG = ["pending", "confirmed", "completed"];

const buatError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const expiredKanBooking = async () => {
    const where = {
        status: "pending",
        expires_at: { [Op.lt]: new Date() },
    };

    const kedaluwarsa = await Booking.findAll({
        where,
        attributes: ["id", "booking_code", "field_id", "booking_date", "status"],
        include: [{ model: User, as: "user", attributes: ["uuid"] }],
    });

    if (!kedaluwarsa.length) return [];

    await Booking.update({ status: "expired" }, { where });

    const bookings = kedaluwarsa.map((booking) => ({
        ...booking.get({ plain: true }),
        status: "expired",
    }));

    emitBookingExpired(bookings);

    const ruangTerpengaruh = new Set();
    bookings.forEach((booking) => {
        const kunci = `${booking.field_id}|${booking.booking_date}`;
        if (ruangTerpengaruh.has(kunci)) return;
        ruangTerpengaruh.add(kunci);
        emitAvailabilityChanged({
            fieldId: booking.field_id,
            bookingDate: booking.booking_date,
        });
    });

    return bookings;
};

export const ambilJadwalTerpakai = async ({ fieldId, bookingDate, excludeId = null }) => {
    await expiredKanBooking();

    const where = {
        field_id: fieldId,
        booking_date: bookingDate,
        status: { [Op.in]: STATUS_MENGHALANG },
    };

    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }

    return Booking.findAll({
        where,
        attributes: ["id", "booking_code", "start_time", "end_time", "status"],
        order: [["start_time", "ASC"]],
    });
};

export const cekBentrok = async ({ fieldId, bookingDate, startTime, endTime, excludeId = null }) => {
    const jadwalTerpakai = await ambilJadwalTerpakai({ fieldId, bookingDate, excludeId });

    const mulaiBaru = timeToMinutes(startTime);
    const selesaiBaru = timeToMinutes(endTime);

    const bentrok = jadwalTerpakai.find((jadwal) => {
        const mulaiAda = timeToMinutes(jadwal.start_time);
        const selesaiAda = timeToMinutes(jadwal.end_time);

        return mulaiBaru < selesaiAda && selesaiBaru > mulaiAda;
    });

    if (!bentrok) return null;

    return buatError(
        409,
        `Jadwal bentrok dengan booking ${bentrok.booking_code} (${bentrok.start_time} - ${bentrok.end_time}).`
    );
};
