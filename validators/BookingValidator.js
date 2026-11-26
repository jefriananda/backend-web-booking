import {
    isPastDate,
    normalizeDate,
    normalizeTime,
    timeToMinutes,
    todayString,
} from "../utils/BookingTime.js";

const STATUS_BOOKING = ["pending", "confirmed", "cancelled", "completed", "expired"];

const tambahError = (errors, field, message) => {
    errors.push({ field, message });
};

const validasiField = (value, errors) => {
    if (
        value === undefined ||
        value === null ||
        value === "" ||
        Number.isNaN(Number(value)) ||
        Number(value) <= 0
    ) {
        tambahError(errors, "field_id", "ID lapangan wajib diisi dan harus berupa angka.");
        return null;
    }

    return Number(value);
};

const validasiTanggal = (value, errors, { bolehMasaLalu = false } = {}) => {
    const tanggal = normalizeDate(value);

    if (!tanggal) {
        tambahError(errors, "booking_date", "Tanggal booking harus berformat YYYY-MM-DD.");
        return null;
    }

    if (!bolehMasaLalu && isPastDate(tanggal)) {
        tambahError(errors, "booking_date", "Tanggal booking tidak boleh di masa lalu.");
        return null;
    }

    return tanggal;
};

const kirimErrorValidasi = (res, errors) => {
    return res.status(400).json({
        success: false,
        message: "Data booking tidak valid.",
        errors,
    });
};

export const validateCreateBooking = (req, res, next) => {
    const { field_id, booking_date, start_time, end_time } = req.body || {};
    const errors = [];

    const fieldId = validasiField(field_id, errors);
    const tanggal = validasiTanggal(booking_date, errors);

    const mulai = normalizeTime(start_time);
    const selesai = normalizeTime(end_time);

    if (!mulai) {
        tambahError(errors, "start_time", "Jam mulai harus berformat HH:mm (00:00 - 23:59).");
    }

    if (!selesai) {
        tambahError(errors, "end_time", "Jam selesai harus berformat HH:mm (00:00 - 23:59).");
    }

    if (tanggal && mulai && tanggal === todayString()) {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        if (timeToMinutes(mulai) <= currentMinutes) {
            tambahError(errors, "start_time", "Jam mulai sudah lewat. Pilih waktu yang masih tersedia.");
        }
    }

    if (mulai && selesai && timeToMinutes(selesai) <= timeToMinutes(mulai)) {
        tambahError(errors, "end_time", "Jam selesai harus lebih besar dari jam mulai.");
    }

    if (errors.length > 0) return kirimErrorValidasi(res, errors);

    req.bookingInput = {
        fieldId,
        bookingDate: tanggal,
        startTime: mulai,
        endTime: selesai,
    };

    return next();
};

export const validateAvailability = (req, res, next) => {
    const { field_id, booking_date } = req.query;
    const errors = [];

    const fieldId = validasiField(field_id, errors);
    const tanggal = validasiTanggal(booking_date, errors, { bolehMasaLalu: true });

    if (errors.length > 0) return kirimErrorValidasi(res, errors);

    req.availabilityInput = { fieldId, bookingDate: tanggal };

    return next();
};

export const validateStatusUpdate = (req, res, next) => {
    const { status } = req.body || {};
    const errors = [];

    if (!status || !STATUS_BOOKING.includes(String(status).toLowerCase())) {
        tambahError(
            errors,
            "status",
            `Status harus salah satu dari: ${STATUS_BOOKING.join(", ")}.`
        );
    }

    if (errors.length > 0) return kirimErrorValidasi(res, errors);

    req.statusBaru = String(status).toLowerCase();

    return next();
};
