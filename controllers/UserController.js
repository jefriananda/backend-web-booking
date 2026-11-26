import argon2 from "argon2";
import User from "../models/UserModel.js";

const userAttributes = ["id", "uuid", "name", "email", "role", "createdAt", "updatedAt"];

export const getUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: userAttributes,
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            message: "Data user berhasil diambil.",
            data: users,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.params.id },
            attributes: userAttributes,
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        return res.status(200).json({
            success: true,
            message: "Detail user berhasil diambil.",
            data: user,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password wajib diisi." });
        }

        const hash = await argon2.hash(password);

        const user = await User.create({
            name,
            email,
            password: hash,
            role: role || "customer",
        });

        return res.status(201).json({
            success: true,
            message: "User berhasil dibuat.",
            data: {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.params.id },
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        const { name, email, password, role } = req.body;
        const hash =
            password === "" || password === null || password === undefined
                ? user.password
                : await argon2.hash(password);

        await user.update({
            name: name ?? user.name,
            email: email ?? user.email,
            password: hash,
            role: role ?? user.role,
        });

        return res.status(200).json({
            success: true,
            message: "User berhasil diperbarui.",
            data: {
                id: user.id,
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const user = await User.findOne({
            where: { uuid: req.params.id },
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan." });
        }

        await user.destroy();

        return res.status(200).json({
            success: true,
            message: "User berhasil dihapus.",
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};