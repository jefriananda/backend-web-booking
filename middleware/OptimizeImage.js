import {
    deleteImageFile,
    generateImageFilename,
    optimizeImage,
    validateImageFile,
} from "../services/UploadService.js";

/**
 * Middleware pasca-multer: memberi nama file, memvalidasi isi gambar, dan
 * mengubahnya menjadi WebP. Dipakai oleh endpoint upload mandiri maupun
 * upload gambar lapangan.
 */
export const optimizeUploadedImage = async (req, res, next) => {
    const file = req.file;

    if (!file) return next();

    file.filename = generateImageFilename(file.originalname);

    try {
        const metadata = await validateImageFile(file);
        const hasil = await optimizeImage(file, metadata);

        req.file.mimetype = hasil.mimetype;
        req.file.size = hasil.size;
        req.file.original_mimetype = hasil.original_mimetype;
        req.file.original_format = hasil.original_format;

        return next();
    } catch (error) {
        await deleteImageFile(file.filename).catch(() => {});
        return next(error);
    }
};

export default optimizeUploadedImage;
