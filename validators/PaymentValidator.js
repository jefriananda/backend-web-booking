export const validateCreatePayment = (req, res, next) => {
    const { booking_id } = req.body || {};
    const errors = [];

    if (
        booking_id === undefined ||
        booking_id === null ||
        booking_id === "" ||
        Number.isNaN(Number(booking_id)) ||
        Number(booking_id) <= 0
    ) {
        errors.push({ field: "booking_id", message: "ID booking wajib diisi dan harus berupa angka." });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Data pembayaran tidak valid.",
            errors,
        });
    }

    req.paymentInput = { bookingId: Number(booking_id) };

    return next();
};
