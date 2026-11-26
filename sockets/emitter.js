// Tempat terpusat untuk mengirim event realtime dari service/controller.
// Tidak mengimpor service lain supaya tidak terjadi circular dependency.
import { EVENTS } from "./events.js";
import { ROOM } from "./rooms.js";

let io = null;

export const setSocketIO = (instance) => {
    io = instance;
};

export const getSocketIO = () => io;

const kePlain = (value) => {
    if (!value || typeof value !== "object") return value;
    return typeof value.toJSON === "function" ? value.toJSON() : value;
};

const kirimKe = (room, event, payload) => {
    if (!io || !room) return;
    io.to(room).emit(event, payload);
};

const kirimKeBanyak = (rooms, event, payload) => {
    rooms.filter(Boolean).forEach((room) => kirimKe(room, event, payload));
};

const ringkasBooking = (booking) => {
    const data = kePlain(booking) || {};
    return {
        id: data.id,
        booking_code: data.booking_code,
        field_id: data.field_id,
        booking_date: data.booking_date,
        start_time: data.start_time,
        end_time: data.end_time,
        total_price: data.total_price,
        status: data.status,
        expires_at: data.expires_at,
        field: data.field || null,
        updatedAt: data.updatedAt || null,
    };
};

// Jangan siarkan snapToken / redirectUrl Midtrans lewat socket.
const ringkasPembayaran = (payment) => {
    const data = kePlain(payment) || {};
    return {
        id: data.id,
        booking_id: data.booking_id,
        payment_method: data.payment_method,
        amount: data.amount,
        paid_at: data.paid_at,
        expires_at: data.expires_at,
        transactionId: data.transactionId || null,
        status: data.paid_at ? "paid" : "unpaid",
        createdAt: data.createdAt || null,
        updatedAt: data.updatedAt || null,
    };
};

const buatNotifikasi = ({ type, title, message, data = null }) => ({
    type,
    title,
    message,
    data,
    createdAt: new Date().toISOString(),
});

const kirimNotifikasiKeUser = (userUuid, notifikasi) => {
    if (!userUuid) return;
    kirimKe(ROOM.user(userUuid), EVENTS.NOTIFICATION_NEW, notifikasi);
};

const kirimNotifikasiKeAdmin = (notifikasi) => {
    kirimKe(ROOM.role("admin"), EVENTS.NOTIFICATION_NEW, notifikasi);
};

export const emitBookingCreated = ({ booking, userUuid }) => {
    const payload = ringkasBooking(booking);

    kirimKeBanyak(
        [ROOM.booking(payload.booking_code), ROOM.user(userUuid), ROOM.role("admin")],
        EVENTS.BOOKING_CREATED,
        payload
    );

    kirimNotifikasiKeUser(
        userUuid,
        buatNotifikasi({
            type: EVENTS.BOOKING_CREATED,
            title: "Booking berhasil dibuat",
            message: `Booking ${payload.booking_code} menunggu pembayaran.`,
            data: payload,
        })
    );

    kirimNotifikasiKeAdmin(
        buatNotifikasi({
            type: EVENTS.BOOKING_CREATED,
            title: "Booking baru",
            message: `Booking ${payload.booking_code} perlu diproses.`,
            data: payload,
        })
    );
};

export const emitBookingUpdated = ({ booking, previousStatus = null, userUuid = null }) => {
    const payload = { ...ringkasBooking(booking), previous_status: previousStatus };

    kirimKeBanyak(
        [ROOM.booking(payload.booking_code), ROOM.user(userUuid), ROOM.role("admin")],
        EVENTS.BOOKING_UPDATED,
        payload
    );

    const pesanStatus = {
        confirmed: `Booking ${payload.booking_code} telah dikonfirmasi.`,
        cancelled: `Booking ${payload.booking_code} dibatalkan.`,
        completed: `Booking ${payload.booking_code} telah selesai.`,
        expired: `Booking ${payload.booking_code} kedaluwarsa.`,
    };

    const pesan =
        pesanStatus[payload.status] ||
        `Status booking ${payload.booking_code} berubah menjadi ${payload.status}.`;

    kirimNotifikasiKeUser(
        userUuid,
        buatNotifikasi({
            type: EVENTS.BOOKING_UPDATED,
            title: "Status booking diperbarui",
            message: pesan,
            data: payload,
        })
    );

    kirimNotifikasiKeAdmin(
        buatNotifikasi({
            type: EVENTS.BOOKING_UPDATED,
            title: "Status booking diperbarui",
            message: pesan,
            data: payload,
        })
    );
};

export const emitBookingExpired = (bookings = []) => {
    bookings.forEach((booking) => {
        const data = kePlain(booking);
        emitBookingUpdated({
            booking: data,
            previousStatus: "pending",
            userUuid: data.user?.uuid || null,
        });
    });
};

export const emitAvailabilityChanged = ({ fieldId, bookingDate }) => {
    if (!fieldId || !bookingDate) return;

    kirimKe(ROOM.field(fieldId), EVENTS.FIELD_AVAILABILITY, {
        field_id: fieldId,
        booking_date: bookingDate,
        changed_at: new Date().toISOString(),
    });
};

export const emitPaymentCreated = ({ payment, booking, userUuid }) => {
    const payload = {
        payment: ringkasPembayaran(payment),
        booking: ringkasBooking(booking),
    };

    kirimKeBanyak(
        [ROOM.booking(payload.booking.booking_code), ROOM.user(userUuid), ROOM.role("admin")],
        EVENTS.PAYMENT_CREATED,
        payload
    );

    kirimNotifikasiKeUser(
        userUuid,
        buatNotifikasi({
            type: EVENTS.PAYMENT_CREATED,
            title: "Menunggu pembayaran",
            message: `Transaksi untuk booking ${payload.booking.booking_code} telah dibuat.`,
            data: payload,
        })
    );
};

export const emitPaymentUpdated = ({ payment, booking, userUuid, keterangan = "" }) => {
    const payload = {
        payment: ringkasPembayaran(payment),
        booking: ringkasBooking(booking),
        keterangan,
    };

    kirimKeBanyak(
        [ROOM.booking(payload.booking.booking_code), ROOM.user(userUuid), ROOM.role("admin")],
        EVENTS.PAYMENT_UPDATED,
        payload
    );

    const pesan =
        keterangan || `Pembayaran booking ${payload.booking.booking_code} diperbarui.`;

    kirimNotifikasiKeUser(
        userUuid,
        buatNotifikasi({
            type: EVENTS.PAYMENT_UPDATED,
            title: "Status pembayaran diperbarui",
            message: pesan,
            data: payload,
        })
    );

    kirimNotifikasiKeAdmin(
        buatNotifikasi({
            type: EVENTS.PAYMENT_UPDATED,
            title: "Status pembayaran diperbarui",
            message: pesan,
            data: payload,
        })
    );
};
