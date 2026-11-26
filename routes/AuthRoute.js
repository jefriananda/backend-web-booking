import express from "express";
import { Login, Logout, Profile } from "../controllers/AuthController.js";
import { authMiddleware } from "../middleware/AuthMiddleware.js";

const router = express.Router();

router.post("/login", Login);
router.delete("/logout", authMiddleware, Logout);
router.get("/profile", authMiddleware, Profile);

export default router;