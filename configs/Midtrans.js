import dotenv from "dotenv";
import midtransClient from "midtrans-client";

dotenv.config();

const parseBoolean = (value) => String(value ?? "").trim().toLowerCase() === "true";

// Default sandbox. Production hanya aktif jika MIDTRANS_IS_PRODUCTION=true.
const isProduction = parseBoolean(process.env.MIDTRANS_IS_PRODUCTION);

const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
const clientKey = process.env.MIDTRANS_CLIENT_KEY || "";

export const snap = new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
});

export const coreApi = new midtransClient.CoreApi({
    isProduction,
    serverKey,
    clientKey,
});

export const midtransConfig = {
    isProduction,
    serverKey,
    clientKey,
};

export default snap;
