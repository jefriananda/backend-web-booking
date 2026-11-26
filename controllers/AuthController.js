import argon2 from "argon2";
import User from "../models/UserModel.js";
import { getSocketIO } from "../sockets/emitter.js";

const userAttributes = ["id", "uuid", "name", "email", "role", "createdAt", "updatedAt"];

export const Profile = async (req, res) => {
    if (!req.session?.userId) {
        return res.status(401).json({ message: "Anda belum login." });
    }

    try {
        const user = await User.findOne({
            where: { uuid: req.session.userId },
            attributes: userAttributes,
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        return res.status(200).json({
            success: true,
            message: "Profil berhasil diambil.",
            data: user,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email dan password wajib diisi." });
        }

        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        const cocok = await argon2.verify(user.password, password);
        if (!cocok) {
            return res.status(400).json({ message: "Password salah." });
        }

        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                return res.status(500).json({ message: "Gagal membuat sesi login." });
            }

            req.session.userId = user.uuid;
            req.session.role = user.role;

            req.session.save((saveError) => {
                if (saveError) {
                    return res.status(500).json({ message: "Gagal menyimpan sesi login." });
                }

                return res.status(200).json({
                    success: true,
                    message: "Berhasil login.",
                    data: {
                        user: {
                            id: user.id,
                            uuid: user.uuid,
                            name: user.name,
                            email: user.email,
                            role: user.role,
                        },
                    },
                });
            });
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const Logout = (req, res) => {
    const cookieName = req.app?.locals?.sessionCookieName || "web_booking.sid";
    const cookieOptions = req.app?.locals?.sessionCookieOptions || { path: "/" };
    const userUuid = req.session?.userId;

    req.session.destroy((error) => {
        if (error) {
            return res.status(400).json({ message: "Gagal logout." });
        }

        // Putuskan semua socket milik user ini agar tidak menerima notifikasi setelah logout.
        const io = getSocketIO();
        if (io && userUuid) {
            for (const socket of io.sockets.sockets.values()) {
                if (socket.data.user?.uuid === userUuid) socket.disconnect(true);
            }
        }

        res.clearCookie(cookieName, {
            path: cookieOptions.path || "/",
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
        });

        return res.status(200).json({ message: "Berhasil logout." });
    });
};