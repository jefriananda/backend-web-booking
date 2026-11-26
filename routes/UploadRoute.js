import express from "express";
import {
    deleteUploadedImage,
    uploadImageFile,
} from "../controllers/UploadController.js";
import { requireRole } from "../middleware/AuthMiddleware.js";
import { uploadImage } from "../middleware/UploadImage.js";
import { optimizeUploadedImage } from "../middleware/OptimizeImage.js";

const router = express.Router();

// Semua endpoint upload hanya untuk admin (requireRole juga mengecek sesi login).
router.use(requireRole("admin"));

router.post("/", uploadImage.single("image"), optimizeUploadedImage, uploadImageFile);
router.delete("/:filename", deleteUploadedImage);

export default router;
