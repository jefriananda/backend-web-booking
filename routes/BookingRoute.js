import express from "express";
import {
    cancelBooking,
    createBooking,
    getAvailability,
    getBookingById,
    getBookings,
    updateStatusBooking,
} from "../controllers/BookingController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";
import {
    validateAvailability,
    validateCreateBooking,
    validateStatusUpdate,
} from "../validators/BookingValidator.js";

const router = express.Router();

// Semua endpoint booking memerlukan sesi login
router.use(authMiddleware);

router.get("/", getBookings);
router.get("/availability", validateAvailability, getAvailability);
router.post("/", validateCreateBooking, createBooking);
router.get("/:id", getBookingById);
router.patch("/:id/status", validateStatusUpdate, updateStatusBooking);
router.delete("/:id", cancelBooking);

export default router;
