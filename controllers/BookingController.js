import Field from "../models/FieldModel.js";
import {
    batalkanBooking,
    buatBooking,
    daftarBooking,
    detailBooking,
    jadwalTerpakaiBooking,
    konfirmasiAtauUbahStatus,
} from "../services/BookingService.js";
import { errorResponse, successResponse } from "../utils/Response.js";

const tanganiError = (res, error) => {
    return errorResponse(res, {
        statusCode: error.statusCode || 500,
        message: error.message || "Terjadi kesalahan pada server.",
    });
};

const sesiUser = (req) => ({
    userUuid: req.session.userId,
    role: req.session.role,
});

export const createBooking = async (req, res) => {
    try {
        const booking = await buatBooking({
            ...sesiUser(req),
            ...req.bookingInput,
        });

        return successResponse(res, {
            statusCode: 201,
            message: "Booking berhasil dibuat. Selesaikan pembayaran sebelum batas waktu.",
            data: booking,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const getBookings = async (req, res) => {
    try {
        const bookings = await daftarBooking({
            ...sesiUser(req),
            filters: {
                status: req.query.status,
                field_id: req.query.field_id,
                booking_date: req.query.booking_date,
            },
        });

        return successResponse(res, {
            message: "Data booking berhasil diambil.",
            data: bookings,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const getBookingById = async (req, res) => {
    try {
        const booking = await detailBooking({
            id: req.params.id,
            ...sesiUser(req),
        });

        return successResponse(res, {
            message: "Detail booking berhasil diambil.",
            data: booking,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const getAvailability = async (req, res) => {
    try {
        const { fieldId, bookingDate } = req.availabilityInput;

        const field = await Field.findByPk(fieldId);
        if (!field) {
            return errorResponse(res, { statusCode: 404, message: "Lapangan tidak ditemukan." });
        }

        const jadwalTerpakai = await jadwalTerpakaiBooking({
            fieldId,
            bookingDate,
        });

        return successResponse(res, {
            message: "Ketersediaan lapangan berhasil diambil.",
            data: {
                field_id: fieldId,
                booking_date: bookingDate,
                booked_slots: jadwalTerpakai,
            },
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const updateStatusBooking = async (req, res) => {
    try {
        const booking = await konfirmasiAtauUbahStatus({
            id: req.params.id,
            status: req.statusBaru,
            ...sesiUser(req),
        });

        return successResponse(res, {
            message: "Status booking berhasil diperbarui.",
            data: booking,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const booking = await batalkanBooking({
            id: req.params.id,
            ...sesiUser(req),
        });

        return successResponse(res, {
            message: "Booking berhasil dibatalkan.",
            data: booking,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};
