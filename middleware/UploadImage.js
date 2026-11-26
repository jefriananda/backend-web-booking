import multer from "multer";
import {
    ALLOWED_IMAGE_MIMETYPES,
    IMAGE_TYPE_ERROR,
    MAX_IMAGE_SIZE,
} from "../configs/Upload.js";

const fileFilter = (req, file, cb) => {
    if (ALLOWED_IMAGE_MIMETYPES.includes((file.mimetype || "").toLowerCase())) {
        return cb(null, true);
    }

    return cb(new Error(IMAGE_TYPE_ERROR));
};

// File ditampung di memori (maks. 2 MB) lalu ditulis sekali oleh OptimizeImage
// setelah dikonversi ke WebP. Ini menghindari file mentah tertinggal di disk.
export const uploadImage = multer({
    storage: multer.memoryStorage(),
    fileFilter,
    limits: {
        fileSize: MAX_IMAGE_SIZE,
    },
});

export default uploadImage;
