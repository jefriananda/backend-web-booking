import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import {
    ALLOWED_IMAGE_FORMATS,
    MAX_IMAGE_DIMENSION,
    OUTPUT_IMAGE_EXTENSION,
    OUTPUT_IMAGE_MIMETYPE,
    UPLOAD_DB_PREFIX,
    UPLOAD_DIR,
    UPLOAD_URL_PREFIX,
    WEBP_EFFORT,
    WEBP_QUALITY,
} from "../configs/Upload.js";

const createHttpError = (statusCode, message) =>
    Object.assign(new Error(message), { statusCode });

const getFilePath = (filename) => path.join(UPLOAD_DIR, filename);

/** Membuat nama file unik dengan ekstensi WebP. */
export const generateImageFilename = (originalName = "gambar") => {
    const ext = path.extname(originalName).toLowerCase();
    const baseName = path
        .basename(originalName, ext)
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    return `${baseName || "gambar"}-${uniqueSuffix}${OUTPUT_IMAGE_EXTENSION}`;
};

const getSourceBuffer = async (file) => {
    if (file.buffer) return file.buffer;
    if (file.path) return fs.readFile(file.path);
    throw createHttpError(400, "Data gambar tidak ditemukan.");
};

/**
 * Memastikan file yang diterima benar-benar gambar yang didukung.
 * Pemeriksaan ini melengkapi filter mimetype dari multer.
 */
export const validateImageFile = async (file) => {
    if (!file) {
        throw createHttpError(400, "File gambar wajib diunggah dengan field 'image'.");
    }

    let metadata;

    try {
        metadata = await sharp(await getSourceBuffer(file)).metadata();
    } catch (error) {
        if (error.statusCode) throw error;
        throw createHttpError(400, "File gambar tidak valid atau rusak.");
    }

    if (!metadata.format || !ALLOWED_IMAGE_FORMATS.includes(metadata.format)) {
        throw createHttpError(
            400,
            "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF."
        );
    }

    if (!metadata.width || !metadata.height) {
        throw createHttpError(400, "Dimensi gambar tidak valid.");
    }

    return metadata;
};

/**
 * Memperbaiki orientasi EXIF, mengecilkan gambar, lalu menyimpannya sebagai WebP.
 */
export const optimizeImage = async (file, metadata) => {
    const processed = await sharp(await getSourceBuffer(file))
        .rotate()
        .resize({
            width: MAX_IMAGE_DIMENSION,
            height: MAX_IMAGE_DIMENSION,
            fit: "inside",
            withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
        .toBuffer();

    await fs.writeFile(getFilePath(file.filename), processed);

    return {
        size: processed.length,
        mimetype: OUTPUT_IMAGE_MIMETYPE,
        original_mimetype: file.mimetype,
        original_format: metadata.format,
    };
};

export const buildImageInfo = async (file, req) => {
    const stats = await fs.stat(getFilePath(file.filename));
    const relativeUrl = `${UPLOAD_URL_PREFIX}/${encodeURIComponent(file.filename)}`;
    const baseUrl = req ? `${req.protocol}://${req.get("host")}` : "";

    return {
        filename: file.filename,
        original_name: file.originalname,
        path: `${UPLOAD_DB_PREFIX}${file.filename}`,
        url: relativeUrl,
        full_url: `${baseUrl}${relativeUrl}`,
        size: stats.size,
        mimetype: OUTPUT_IMAGE_MIMETYPE,
        format: "webp",
        original_format: file.original_format,
    };
};

/**
 * Menghapus file gambar berdasarkan nama file.
 * Nama file diverifikasi agar tidak bisa keluar dari direktori uploads/.
 */
export const deleteImageFile = async (filename) => {
    if (
        !filename ||
        typeof filename !== "string" ||
        path.basename(filename) !== filename ||
        filename === "." ||
        filename === ".."
    ) {
        throw createHttpError(400, "Nama file gambar tidak valid.");
    }

    const filePath = path.resolve(getFilePath(filename));
    const relativePath = path.relative(path.resolve(UPLOAD_DIR), filePath);

    if (!relativePath || relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw createHttpError(400, "Nama file gambar tidak valid.");
    }

    try {
        await fs.unlink(filePath);
        return true;
    } catch (error) {
        if (error.code === "ENOENT") return false;
        throw error;
    }
};
