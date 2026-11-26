import fs from "fs";
import path from "path";

// Konfigurasi terpusat untuk unggahan gambar.
export const UPLOAD_DIR = path.resolve("uploads");
export const UPLOAD_URL_PREFIX = "/uploads";
export const UPLOAD_DB_PREFIX = "uploads/";

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 2 MB
export const MAX_IMAGE_DIMENSION = 1600; // px (sisi terpanjang)

// Format input yang diterima; semua hasil akhir disimpan sebagai WebP.
export const ALLOWED_IMAGE_FORMATS = ["jpeg", "png", "webp", "avif"];
export const ALLOWED_IMAGE_MIMETYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
];
export const OUTPUT_IMAGE_FORMAT = "webp";
export const OUTPUT_IMAGE_MIMETYPE = "image/webp";
export const OUTPUT_IMAGE_EXTENSION = ".webp";
export const WEBP_QUALITY = 80;
export const WEBP_EFFORT = 4;

export const IMAGE_TYPE_ERROR =
    "Format gambar tidak didukung. Gunakan JPG, PNG, WebP, atau AVIF.";

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
