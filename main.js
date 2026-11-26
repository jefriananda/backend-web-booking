import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from "express-session";
import http from "http";
import { Server } from "socket.io";

import db from "./configs/Database.js";
import corsOptions from "./configs/Cors.js";
import "./models/Relations.js";

import authRoute from "./routes/AuthRoute.js";
import userRoute from "./routes/UserRoute.js";
import fieldRoute from "./routes/FieldRoute.js";
import bookingRoute from "./routes/BookingRoute.js";
import paymentRoute from "./routes/PaymentRoute.js";
import uploadRoute from "./routes/UploadRoute.js";

import { errorHandler, notFoundHandler } from "./middleware/ErrorMiddleware.js";
import { initSocket } from "./sockets/index.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: corsOptions.origin,
    credentials: true,
  },
});

const PORT = process.env.APP_PORT;
const SESSION_SECRET = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === "production";
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME;

if (isProduction) {
  // Diperlukan agar cookie secure bekerja benar saat aplikasi di belakang proxy/load balancer
  app.set("trust proxy", 1);
}

const sessionCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  maxAge: Number(process.env.SESSION_COOKIE_MAX_AGE) || 1000 * 60 * 60 * 24 * 30, // default 30 hari
  path: "/",
};

app.locals.sessionCookieName = SESSION_COOKIE_NAME;
app.locals.sessionCookieOptions = sessionCookieOptions;

// Middleware dasar
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// Middleware sesi ini dipakai bersama Express dan Socket.IO agar handshake
// socket membawa kredensial login yang sama dengan request HTTP.
const sessionMiddleware = session({
  name: SESSION_COOKIE_NAME,
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: sessionCookieOptions,
});

app.use(sessionMiddleware);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API Web Booking berjalan.",
  });
});

// Routing API
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/fields", fieldRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/uploads", uploadRoute);

// Handler 404 dan error
app.use(notFoundHandler);
app.use(errorHandler);

// Inisialisasi Socket.IO
initSocket(io, sessionMiddleware);

const startServer = async () => {
  try {
    await db.authenticate();
    console.log("Koneksi database berhasil.");

    if (process.env.DB_SYNC === "true") {
      await db.sync();
      console.log("Sinkronisasi database berhasil.");
    }

    server.listen(PORT, () => {
      console.log(`Server berjalan pada port ${PORT}`);
    });
  } catch (error) {
    console.error("Gagal menjalankan server:", error);
    process.exit(1);
  }
};

startServer();

export { app, io, server };