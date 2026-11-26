import fs from "fs";
import path from "path";
import Field from "../models/FieldModel.js";

const hapusFileJikaAda = (filePath) => {
    if (!filePath) return;

    const normalizedPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
    const absolutePath = path.resolve(normalizedPath);

    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
};

const parseStatus = (value, defaultValue = true) => {
    if (value === undefined || value === null || value === "") return defaultValue;
    if (typeof value === "boolean") return value;

    const normalized = String(value).toLowerCase();
    if (["true", "1", "aktif", "active"].includes(normalized)) return true;
    if (["false", "0", "nonaktif", "inactive"].includes(normalized)) return false;

    return defaultValue;
};

export const getFields = async (req, res) => {
    try {
        const fields = await Field.findAll({
            order: [["createdAt", "DESC"]],
        });

        return res.status(200).json({
            success: true,
            message: "Data lapangan berhasil diambil.",
            data: fields,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getFieldById = async (req, res) => {
    try {
        const field = await Field.findByPk(req.params.id);

        if (!field) {
            return res.status(404).json({ message: "Lapangan tidak ditemukan." });
        }

        return res.status(200).json({
            success: true,
            message: "Detail lapangan berhasil diambil.",
            data: field,
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const createField = async (req, res) => {
    try {
        const { name, type, price_per_hour, description, active } = req.body;
        const image = req.file ? `uploads/${req.file.filename}` : "";

        const field = await Field.create({
            name: name?.trim(),
            type: type?.trim(),
            price_per_hour,
            description: description?.trim() || null,
            image,
            active: parseStatus(active, true),
        });

        return res.status(201).json({
            success: true,
            message: "Lapangan berhasil dibuat.",
            data: field,
        });
    } catch (error) {
        if (req.file) {
            hapusFileJikaAda(`uploads/${req.file.filename}`);
        }
        return res.status(500).json({ message: error.message });
    }
};

export const updateField = async (req, res) => {
    try {
        const field = await Field.findByPk(req.params.id);

        if (!field) {
            if (req.file) {
                hapusFileJikaAda(`uploads/${req.file.filename}`);
            }
            return res.status(404).json({ message: "Lapangan tidak ditemukan." });
        }

        const { name, type, price_per_hour, description, active } = req.body;
        const imageLama = field.image;
        const imageBaru = req.file ? `uploads/${req.file.filename}` : field.image;

        await field.update({
            name: name !== undefined ? name.trim() : field.name,
            type: type !== undefined ? type.trim() : field.type,
            price_per_hour:
                price_per_hour !== undefined && price_per_hour !== ""
                    ? price_per_hour
                    : field.price_per_hour,
            description:
                description !== undefined ? (description?.trim() || null) : field.description,
            image: imageBaru,
            active: active !== undefined ? parseStatus(active, field.active) : field.active,
        });

        if (req.file && imageLama && imageLama !== imageBaru) {
            hapusFileJikaAda(imageLama);
        }

        return res.status(200).json({
            success: true,
            message: "Lapangan berhasil diperbarui.",
            data: field,
        });
    } catch (error) {
        if (req.file) {
            hapusFileJikaAda(`uploads/${req.file.filename}`);
        }
        return res.status(500).json({ message: error.message });
    }
};

export const deleteField = async (req, res) => {
    try {
        const field = await Field.findByPk(req.params.id);

        if (!field) {
            return res.status(404).json({ message: "Lapangan tidak ditemukan." });
        }

        const imagePath = field.image;
        await field.destroy();

        if (imagePath) {
            hapusFileJikaAda(imagePath);
        }

        return res.status(200).json({
            success: true,
            message: "Lapangan berhasil dihapus.",
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};