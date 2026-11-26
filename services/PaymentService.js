import crypto from "crypto";
import { coreApi, midtransConfig, snap } from "../configs/Midtrans.js";
import Booking from "../models/BookingModel.js";
import Field from "../models/FieldModel.js";
import Payment from "../models/PaymentModel.js";
import User from "../models/UserModel.js";
import {
    emitAvailabilityChanged,
    emitBookingUpdated,
    emitPaymentCreated,
    emitPaymentUpdated,
} from "../sockets/emitter.js";
import { expiredKanBooking } from "./AvailabilityService.js";
import { cariUserByUuid } from "./BookingService.js";

const buatError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

const payment_method_valid = (value) => typeof value === "string" && value.trim() !== "";

const pastikanKunciMidtrans = () => {
    if (!midtransConfig.serverKey || !midtransConfig.clientKey) {
        throw buatError(
            500,
            "Kunci Midtrans belum dikonfigurasi. Isi MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di .env."
        );
    }
};

const jumlahSama = (grossAmount, totalPrice) => {
    const gross = Number(grossAmount);
    const total = Number(totalPrice);
    if (!Number.isFinite(gross) || !Number.isFinite(total)) return false;
    return Math.round(gross) === Math.round(total);
};

const statusBerhasil = (status, fraudStatus) => {
    const normalizedStatus = String(status || "").toLowerCase();
    const normalizedFraud = String(fraudStatus || "accept").toLowerCase();
    if (normalizedStatus === "settlement") return normalizedFraud === "accept";
    if (normalizedStatus === "capture") return normalizedFraud === "accept";
    return false;
};

const terapkanStatusMidtrans = async ({ booking, payment, status, fraudStatus, paymentType, transactionId }) => {
    const statusSebelum = booking.status;
    const normalizedStatus = String(status || "").toLowerCase();
    let keterangan = `Status Midtrans: ${normalizedStatus || "tidak diketahui"}.`;

    if (transactionId && payment.transactionId !== transactionId) {
        payment.transactionId = transactionId;
    }
    if (payment_method_valid(paymentType)) {
        payment.payment_method = paymentType;
    }

    if (statusBerhasil(normalizedStatus, fraudStatus)) {
        if (!["confirmed", "completed"].includes(booking.status)) {
            await booking.update({ status: "confirmed" });
        }
        if (!payment.paid_at) payment.paid_at = new Date();
        keterangan = "Pembayaran berhasil, booking dikonfirmasi.";
    } else if (normalizedStatus === "capture") {
        keterangan = "Pembayaran capture memerlukan verifikasi fraud.";
    } else if (normalizedStatus === "pending") {
        keterangan = "Menunggu pembayaran.";
    } else if (["deny", "cancel", "expire", "failure"].includes(normalizedStatus)) {
        const statusBooking = normalizedStatus === "expire" ? "expired" : "cancelled";
        if (["pending", "confirmed"].includes(booking.status)) {
            await booking.update({ status: statusBooking });
        }
        if (!payment.expires_at) payment.expires_at = new Date();
        keterangan = `Pembayaran ${normalizedStatus}, booking ditandai ${statusBooking}.`;
    }

    await payment.save();

    const userUuid = booking.user?.uuid || null;
    emitPaymentUpdated({ payment, booking, userUuid, keterangan });

    if (booking.status !== statusSebelum) {
        emitBookingUpdated({ booking, previousStatus: statusSebelum, userUuid });
        emitAvailabilityChanged({
            fieldId: booking.field_id,
            bookingDate: booking.booking_date,
        });
    }

    return { booking, payment, keterangan };
};

const formatMidtransStartTime = (date = new Date()) => {
    const pad = (value) => String(value).padStart(2, "0");
    const timezoneOffset = -date.getTimezoneOffset();
    const sign = timezoneOffset >= 0 ? "+" : "-";
    const absoluteOffset = Math.abs(timezoneOffset);
    const timezone = `${sign}${pad(Math.floor(absoluteOffset / 60))}${pad(absoluteOffset % 60)}`;

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${timezone}`;
};

const cariBooking = async ({ bookingId, userUuid, role }) => {
    const user = await cariUserByUuid(userUuid);

    const booking = await Booking.findByPk(bookingId, {
        include: [
            {
                model: Field,
                as: "field",
                attributes: ["id", "name", "type"],
            },
        ],
    });

    if (!booking) throw buatError(404, "Booking tidak ditemukan.");

    if (role !== "admin" && booking.user_id !== user.id) {
        throw buatError(403, "Anda tidak memiliki akses ke booking ini.");
    }

    return { booking, user };
};

const cariPembayaranTerakhir = (bookingId) => {
    return Payment.findOne({
        where: { booking_id: bookingId },
        order: [["createdAt", "DESC"]],
    });
};

export const buatPembayaran = async ({ bookingId, userUuid, role }) => {
    pastikanKunciMidtrans();

    const { booking, user } = await cariBooking({ bookingId, userUuid, role });

    if (booking.status !== "pending") {
        throw buatError(400, `Booking berstatus "${booking.status}" dan tidak dapat dibayar.`);
    }

    if (booking.expires_at && new Date(booking.expires_at) <= new Date()) {
        await expiredKanBooking();
        throw buatError(400, "Batas waktu booking sudah habis. Silakan buat booking baru.");
    }

    const pembayaranLama = await cariPembayaranTerakhir(booking.id);
    if (pembayaranLama?.snapToken && !pembayaranLama.paid_at) {
        if (pembayaranLama.expires_at && new Date(pembayaranLama.expires_at) > new Date()) {
            return pembayaranLama;
        }
    }

    const durasiMenit = Math.max(
        1,
        Math.ceil((new Date(booking.expires_at).getTime() - Date.now()) / 60000)
    );

    const parameter = {
        transaction_details: {
            order_id: booking.booking_code,
            gross_amount: booking.total_price,
        },
        customer_details: {
            first_name: user.name,
            email: user.email,
        },
        item_details: [
            {
                id: `booking-${booking.id}`,
                name: `Booking ${booking.field?.name || "Lapangan"} ${booking.booking_date}`,
                price: booking.total_price,
                quantity: 1,
            },
        ],
        credit_card: { secure: true },
        expiry: {
            start_time: formatMidtransStartTime(),
            unit: "minute",
            duration: durasiMenit,
        },
    };

    let transaksi;
    try {
        transaksi = await snap.createTransaction(parameter);
    } catch (error) {
        throw buatError(502, `Gagal membuat transaksi Midtrans: ${error.message}`);
    }

    const payment = await Payment.create({
        booking_id: booking.id,
        payment_method: "midtrans",
        amount: booking.total_price,
        paid_at: null,
        expires_at: booking.expires_at,
        snapToken: transaksi.token,
        snapRedirectUrl: transaksi.redirect_url,
        transactionId: null,
    });

    emitPaymentCreated({ payment, booking, userUuid: user.uuid });

    return payment;
};

export const daftarPembayaran = async ({ userUuid, role, bookingId }) => {
    const where = bookingId ? { booking_id: Number(bookingId) } : {};
    const includeWhere = {};

    if (role !== "admin") {
        const user = await cariUserByUuid(userUuid);
        includeWhere.user_id = user.id;
    }

    return Payment.findAll({
        where,
        include: [
            {
                model: Booking,
                as: "booking",
                attributes: [
                    "id",
                    "booking_code",
                    "user_id",
                    "booking_date",
                    "start_time",
                    "end_time",
                    "total_price",
                    "status",
                ],
                where: includeWhere,
                required: true,
            },
        ],
        order: [["createdAt", "DESC"]],
    });
};

export const detailPembayaran = async ({ id, userUuid, role }) => {
    const user = await cariUserByUuid(userUuid);

    const payment = await Payment.findByPk(id, {
        include: [
            {
                model: Booking,
                as: "booking",
                attributes: [
                    "id",
                    "booking_code",
                    "user_id",
                    "field_id",
                    "booking_date",
                    "total_price",
                    "status",
                ],
            },
        ],
    });

    if (!payment) throw buatError(404, "Pembayaran tidak ditemukan.");

    if (role !== "admin" && payment.booking?.user_id !== user.id) {
        throw buatError(403, "Anda tidak memiliki akses ke pembayaran ini.");
    }

    return payment;
};

const muatKonteksOrder = async (orderId) => {
    const booking = await Booking.findOne({
        where: { booking_code: orderId },
        include: [{ model: User, as: "user", attributes: ["uuid"] }],
    });
    if (!booking) throw buatError(404, `Booking untuk order ${orderId} tidak ditemukan.`);

    const payment = await cariPembayaranTerakhir(booking.id);
    if (!payment) throw buatError(404, "Pembayaran untuk order ini tidak ditemukan.");

    return { booking, payment };
};

export const prosesNotifikasi = async (payload) => {
    pastikanKunciMidtrans();

    const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        fraud_status,
        payment_type,
        transaction_id,
    } = payload || {};

    if (!order_id || !status_code || !gross_amount || !signature_key) {
        throw buatError(400, "Payload notifikasi tidak lengkap.");
    }

    const signatureDiharapkan = crypto
        .createHash("sha512")
        .update(`${order_id}${status_code}${gross_amount}${midtransConfig.serverKey}`)
        .digest("hex");

    const signatureDiterima = String(signature_key);
    if (
        signatureDiterima.length !== signatureDiharapkan.length ||
        !crypto.timingSafeEqual(Buffer.from(signatureDiterima), Buffer.from(signatureDiharapkan))
    ) {
        throw buatError(401, "Signature key tidak valid.");
    }

    const { booking, payment } = await muatKonteksOrder(order_id);

    if (!jumlahSama(gross_amount, booking.total_price)) {
        throw buatError(400, "Jumlah pembayaran tidak sesuai dengan total booking.");
    }

    return terapkanStatusMidtrans({
        booking,
        payment,
        status: transaction_status,
        fraudStatus: fraud_status,
        paymentType: payment_type,
        transactionId: transaction_id,
    });
};

export const batalkanPembayaran = async ({ id, userUuid, role }) => {
    pastikanKunciMidtrans();

    const payment = await detailPembayaran({ id, userUuid, role });
    const booking = payment.booking;
    const statusSebelum = booking.status;

    if (booking.status !== "pending") {
        throw buatError(400, "Hanya pembayaran untuk booking pending yang dapat dibatalkan.");
    }

    if (!payment.transactionId && !payment.snapToken) {
        throw buatError(400, "Transaksi Midtrans belum tersedia untuk dibatalkan.");
    }

    try {
        await coreApi.transaction.cancel(payment.transactionId || booking.booking_code);
    } catch (error) {
        throw buatError(502, `Gagal membatalkan transaksi Midtrans: ${error.message}`);
    }

    await payment.update({ expires_at: new Date() });
    await booking.update({ status: "cancelled" });

    emitPaymentUpdated({
        payment,
        booking,
        userUuid,
        keterangan: "Pembayaran dibatalkan, booking ditandai cancelled.",
    });
    emitBookingUpdated({ booking, previousStatus: statusSebelum, userUuid });
    emitAvailabilityChanged({
        fieldId: booking.field_id,
        bookingDate: booking.booking_date,
    });

    return payment;
};

export const sinkronkanPembayaran = async ({ id, userUuid, role }) => {
    pastikanKunciMidtrans();

    const payment = await detailPembayaran({ id, userUuid, role });
    const booking = await Booking.findOne({
        where: { id: payment.booking_id },
        include: [{ model: User, as: "user", attributes: ["uuid"] }],
    });
    if (!booking) throw buatError(404, "Booking untuk pembayaran ini tidak ditemukan.");

    let statusMidtrans;
    try {
        statusMidtrans = await coreApi.transaction.status(
            payment.transactionId || booking.booking_code
        );
    } catch (error) {
        throw buatError(502, `Gagal mengambil status Midtrans: ${error.message}`);
    }

    if (!jumlahSama(statusMidtrans?.gross_amount, booking.total_price)) {
        throw buatError(400, "Jumlah pembayaran Midtrans tidak sesuai dengan total booking.");
    }

    return terapkanStatusMidtrans({
        booking,
        payment,
        status: statusMidtrans?.transaction_status,
        fraudStatus: statusMidtrans?.fraud_status,
        paymentType: statusMidtrans?.payment_type,
        transactionId: statusMidtrans?.transaction_id,
    });
};

export const konfigurasiMidtrans = () => ({
    isProduction: midtransConfig.isProduction,
    clientKey: midtransConfig.clientKey,
});
