import express from "express";
import {
    cancelPayment,
    createPayment,
    getMidtransConfig,
    getPaymentById,
    getPayments,
    handleNotification,
    syncPayment,
} from "../controllers/PaymentController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import { validateCreatePayment } from "../validators/PaymentValidator.js";

const router = express.Router();

// Endpoint publik untuk webhook Midtrans dan konfigurasi client key
router.post("/notification", handleNotification);
router.get("/config", getMidtransConfig);

// Endpoint berikutnya memerlukan sesi login
router.use(authMiddleware);

router.get("/", getPayments);
router.post("/", validateCreatePayment, createPayment);
router.get("/:id", getPaymentById);
router.post("/:id/sync", syncPayment);
router.post("/:id/cancel", cancelPayment);

export default router;
