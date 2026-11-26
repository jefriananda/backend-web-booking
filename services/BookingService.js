import Booking from "../models/BookingModel.js";
import Field from "../models/FieldModel.js";
import User from "../models/UserModel.js";
import { generateBookingCode } from "../utils/GenerateBookingCode.js";
import { timeToMinutes } from "../utils/BookingTime.js";
import {
    emitAvailabilityChanged,
    emitBookingCreated,
    emitBookingUpdated,
} from "../sockets/emitter.js";
import { ambilJadwalTerpakai, cekBentrok } from "./AvailabilityService.js";

const TRANSISI_STATUS = {
    pending: ["confirmed", "cancelled", "expired"],
    confirmed: ["completed", "cancelled"],
    cancelled: [],
    completed: [],
    expired: [],
};

const buatError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

export const cariUserByUuid = async (userUuid) => {
    const user = await User.findOne({
        where: { uuid: userUuid },
        attributes: ["id", "uuid", "name", "email", "role"],
    });

    if (!user) throw buatError(404, "User tidak ditemukan.");

    return user;
};

const buatKodeBooking = async () => {
    for (let percobaan = 0; percobaan < 5; percobaan += 1) {
        const kode = generateBookingCode();
        const sudahAda = await Booking.findOne({ where: { booking_code: kode } });

        if (!sudahAda) return kode;
    }

    throw buatError(500, "Gagal membuat kode booking yang unik.");
};

export const buatBooking = async ({
    userUuid,
    fieldId,
    bookingDate,
    startTime,
    endTime,
}) => {
    const user = await cariUserByUuid(userUuid);

    const field = await Field.findByPk(fieldId);
    if (!field) throw buatError(404, "Lapangan tidak ditemukan.");
    if (!field.active) throw buatError(400, "Lapangan tidak aktif dan tidak dapat dibooking.");

    const bentrok = await cekBentrok({ fieldId, bookingDate, startTime, endTime });
    if (bentrok) throw bentrok;

    const durasiJam = (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;
    const totalPrice = Math.round(durasiJam * field.price_per_hour);

    const menitKedaluwarsa = Number(process.env.BOOKING_EXPIRES_MINUTES) || 15;

    const booking = await Booking.create({
        booking_code: await buatKodeBooking(),
        user_id: user.id,
        field_id: field.id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice,
        status: "pending",
        expires_at: new Date(Date.now() + menitKedaluwarsa * 60 * 1000),
    });

    emitBookingCreated({ booking, userUuid: user.uuid });
    emitAvailabilityChanged({ fieldId: field.id, bookingDate });

    return booking;
};

export const daftarBooking = async ({ userUuid, role, filters = {} }) => {
    const where = {};

    if (role !== "admin") {
        const user = await cariUserByUuid(userUuid);
        where.user_id = user.id;
    }

    if (filters.status) where.status = filters.status;
    if (filters.field_id) where.field_id = Number(filters.field_id);
    if (filters.booking_date) where.booking_date = filters.booking_date;

    return Booking.findAll({
        where,
        include: [
            {
                model: User,
                as: "user",
                attributes: ["id", "name"]
            },
            {
                model: Field,
                as: "field",
                attributes: ["id", "name", "type", "price_per_hour"],
            },
        ],
        order: [
            ["booking_date", "DESC"],
            ["start_time", "DESC"],
        ],
    });
};

export const detailBooking = async ({ id, userUuid, role }) => {
    const booking = await Booking.findByPk(id, {
        include: [
            {
                model: Field,
                as: "field",
                attributes: ["id", "name", "type", "price_per_hour", "image"],
            },
            {
                model: User,
                as: "user",
                attributes: ["id", "uuid", "name", "email"],
            },
        ],
    });

    if (!booking) throw buatError(404, "Booking tidak ditemukan.");

    if (role !== "admin" && booking.user?.uuid !== userUuid) {
        throw buatError(403, "Anda tidak memiliki akses ke booking ini.");
    }

    return booking;
};

const ubahStatusBooking = async ({ id, status, userUuid, role }) => {
    const booking = await detailBooking({ id, userUuid, role });
    const statusSekarang = booking.status;

    if (statusSekarang === status) {
        throw buatError(400, `Status booking sudah "${status}".`);
    }

    if (role !== "admin") {
        if (statusSekarang !== "pending" || status !== "cancelled") {
            throw buatError(
                403,
                "Customer hanya dapat membatalkan booking yang masih berstatus pending."
            );
        }
    } else if (!TRANSISI_STATUS[statusSekarang]?.includes(status)) {
        throw buatError(
            400,
            `Status tidak dapat diubah dari "${statusSekarang}" menjadi "${status}".`
        );
    }

    await booking.update({ status });

    emitBookingUpdated({
        booking,
        previousStatus: statusSekarang,
        userUuid: booking.user?.uuid || null,
    });
    emitAvailabilityChanged({
        fieldId: booking.field_id,
        bookingDate: booking.booking_date,
    });

    return booking;
};

export const konfirmasiAtauUbahStatus = ubahStatusBooking;

export const batalkanBooking = async ({ id, userUuid, role }) => {
    return ubahStatusBooking({ id, status: "cancelled", userUuid, role });
};

export const jadwalTerpakaiBooking = async ({ fieldId, bookingDate }) => {
    return ambilJadwalTerpakai({ fieldId, bookingDate });
};
