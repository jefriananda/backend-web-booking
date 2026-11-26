import multer from "multer";
import { IMAGE_TYPE_ERROR, MAX_IMAGE_SIZE } from "../configs/Upload.js";

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error("Terjadi error:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: `Ukuran file terlalu besar. Maksimal ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.`,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Terjadi kesalahan saat mengunggah file.",
    });
  }

  if (
    err?.message === IMAGE_TYPE_ERROR ||
    err?.message === "File yang diunggah harus berupa gambar."
  ) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Terjadi kesalahan pada server.";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};