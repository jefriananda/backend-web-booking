import express from "express";
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    updateUser,
} from "../controllers/UserController.js";
import { authMiddleware, requireRole } from "../middleware/AuthMiddleware.js";

const router = express.Router();


router.get("/", authMiddleware, requireRole("admin"), getUsers);
router.get("/:id", authMiddleware, requireRole("admin"), getUserById);
router.post("/", createUser);
router.patch("/:id", authMiddleware, requireRole("admin"), updateUser);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteUser);

export default router;