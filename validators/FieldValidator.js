export const validateCreateField = (req, res, next) => {
    const { name, type, price_per_hour } = req.body;
    const errors = [];

    if (!name || String(name).trim() === "") {
        errors.push({ field: "name", message: "Nama lapangan wajib diisi." });
    }

    if (!type || String(type).trim() === "") {
        errors.push({ field: "type", message: "Tipe lapangan wajib diisi." });
    }

    if (price_per_hour === undefined || price_per_hour === null || price_per_hour === "") {
        errors.push({ field: "price_per_hour", message: "Harga per jam wajib diisi." });
    } else if (Number.isNaN(Number(price_per_hour)) || Number(price_per_hour) < 0) {
        errors.push({
            field: "price_per_hour",
            message: "Harga per jam harus berupa angka yang valid.",
        });
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Data lapangan tidak valid.",
            errors,
        });
    }

    return next();
};

export const validateUpdateField = (req, res, next) => {
    const { name, type, price_per_hour, status } = req.body || {};
    const errors = [];

    if (name !== undefined && String(name).trim() === "") {
        errors.push({ field: "name", message: "Nama lapangan tidak boleh kosong." });
    }

    if (type !== undefined && String(type).trim() === "") {
        errors.push({ field: "type", message: "Tipe lapangan tidak boleh kosong." });
    }

    if (price_per_hour !== undefined) {
        if (
            price_per_hour === "" ||
            Number.isNaN(Number(price_per_hour)) ||
            Number(price_per_hour) < 0
        ) {
            errors.push({
                field: "price_per_hour",
                message: "Harga per jam harus berupa angka yang valid.",
            });
        }
    }

    if (status !== undefined) {
        const nilaiStatus = String(status).toLowerCase();
        if (
            !["true", "false", "1", "0"].includes(nilaiStatus) &&
            typeof status !== "boolean"
        ) {
            errors.push({ field: "status", message: "Status harus bernilai true atau false." });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Data lapangan tidak valid.",
            errors,
        });
    }

    return next();
};