const allowedOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Izinkan request tanpa origin (mis. Postman, server-to-server)
        if (!origin) return callback(null, true);

        // Jika whitelist kosong, izinkan semua origin pada tahap awal konfigurasi
        if (allowedOrigins.length === 0) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error("Origin tidak diizinkan oleh CORS."));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

export default corsOptions;