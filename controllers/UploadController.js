import { errorResponse, successResponse } from "../utils/Response.js";
import { buildImageInfo, deleteImageFile } from "../services/UploadService.js";

export const uploadImageFile = async (req, res) => {
    try {
        return successResponse(res, {
            statusCode: 201,
            message: "Gambar berhasil diunggah.",
            data: await buildImageInfo(req.file, req),
        });
    } catch (error) {
        if (req.file) {
            await deleteImageFile(req.file.filename).catch(() => {});
        }

        return errorResponse(res, {
            statusCode: error.statusCode || error.status || 500,
            message: error.message || "Gagal mengunggah gambar.",
        });
    }
};

export const deleteUploadedImage = async (req, res) => {
    try {
        const dihapus = await deleteImageFile(req.params.filename);

        if (!dihapus) {
            return errorResponse(res, {
                statusCode: 404,
                message: "Gambar tidak ditemukan.",
            });
        }

        return successResponse(res, {
            message: "Gambar berhasil dihapus.",
        });
    } catch (error) {
        return errorResponse(res, {
            statusCode: error.statusCode || error.status || 500,
            message: error.message || "Gagal menghapus gambar.",
        });
    }
};
