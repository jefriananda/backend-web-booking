import {
    batalkanPembayaran,
    buatPembayaran,
    daftarPembayaran,
    detailPembayaran,
    konfigurasiMidtrans,
    prosesNotifikasi,
    sinkronkanPembayaran,
} from "../services/PaymentService.js";
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

export const createPayment = async (req, res) => {
    try {
        const payment = await buatPembayaran({
            ...sesiUser(req),
            ...req.paymentInput,
        });

        return successResponse(res, {
            statusCode: 201,
            message: "Transaksi pembayaran berhasil dibuat.",
            data: {
                payment,
                snapToken: payment.snapToken,
                redirectUrl: payment.snapRedirectUrl,
            },
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const getPayments = async (req, res) => {
    try {
        const payments = await daftarPembayaran({
            ...sesiUser(req),
            bookingId: req.query.booking_id,
        });

        return successResponse(res, {
            message: "Data pembayaran berhasil diambil.",
            data: payments,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const getPaymentById = async (req, res) => {
    try {
        const payment = await detailPembayaran({
            id: req.params.id,
            ...sesiUser(req),
        });

        return successResponse(res, {
            message: "Detail pembayaran berhasil diambil.",
            data: payment,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const getMidtransConfig = (req, res) => {
    return successResponse(res, {
        message: "Konfigurasi Midtrans berhasil diambil.",
        data: konfigurasiMidtrans(),
    });
};

export const cancelPayment = async (req, res) => {
    try {
        const payment = await batalkanPembayaran({
            id: req.params.id,
            ...sesiUser(req),
        });

        return successResponse(res, {
            message: "Transaksi pembayaran berhasil dibatalkan.",
            data: payment,
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

export const syncPayment = async (req, res) => {
    try {
        const hasil = await sinkronkanPembayaran({
            id: req.params.id,
            ...sesiUser(req),
        });

        return successResponse(res, {
            message: hasil.keterangan,
            data: {
                payment: hasil.payment,
                booking_status: hasil.booking.status,
                payment_status: hasil.payment.paid_at ? "paid" : "unpaid",
            },
        });
    } catch (error) {
        return tanganiError(res, error);
    }
};

// Webhook Midtrans: selalu balas 200 untuk error permanen agar tidak di-retry,
// kecuali signature tidak valid (401).
export const handleNotification = async (req, res) => {
    try {
        const hasil = await prosesNotifikasi(req.body);

        return successResponse(res, {
            message: hasil.keterangan,
            data: {
                order_id: hasil.booking.booking_code,
                transaction_id: hasil.payment.transactionId,
                booking_status: hasil.booking.status,
                payment_status: hasil.payment.paid_at ? "paid" : "unpaid",
            },
        });
    } catch (error) {
        if (error.statusCode === 401) return tanganiError(res, error);

        return errorResponse(res, {
            statusCode: 200,
            message: error.message || "Notifikasi tidak dapat diproses.",
        });
    }
};
