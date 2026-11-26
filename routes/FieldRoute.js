import express from "express";
import {
    createField,
    deleteField,
    getFieldById,
    getFields,
    updateField,
} from "../controllers/FieldController.js";
import { authMiddleware, requireRole } from "../middleware/AuthMiddleware.js";
import { uploadImage } from "../middleware/UploadImage.js";
import { optimizeUploadedImage } from "../middleware/OptimizeImage.js";
import { validateCreateField, validateUpdateField } from "../validators/FieldValidator.js";

const router = express.Router();

// Endpoint publik untuk melihat data lapangan
router.get("/", getFields);
router.get("/:id", getFieldById);

// Endpoint admin untuk mengelola data lapangan
router.post(
    "/",
    authMiddleware,
    requireRole("admin"),
    uploadImage.single("image"),
    optimizeUploadedImage,
    validateCreateField,
    createField
);

router.patch(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    uploadImage.single("image"),
    optimizeUploadedImage,
    validateUpdateField,
    updateField
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    deleteField
);

export default router;