export const successResponse = (
    res,
    {
        statusCode = 200,
        message = "Berhasil.",
        data = null,
        meta = null,
    } = {}
) => {
    const payload = {
        success: true,
        message,
    };

    if (data !== null) payload.data = data;
    if (meta !== null) payload.meta = meta;

    return res.status(statusCode).json(payload);
};

export const errorResponse = (
    res,
    {
        statusCode = 500,
        message = "Terjadi kesalahan pada server.",
        errors = null,
    } = {}
) => {
    const payload = {
        success: false,
        message,
    };

    if (errors !== null) payload.errors = errors;

    return res.status(statusCode).json(payload);
};