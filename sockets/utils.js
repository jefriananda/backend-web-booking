import { EVENTS } from "./events.js";

// Menerima bentuk emit socket.emit(event, payload, ack) maupun socket.emit(event, ack).
export const ambilPayloadDanAck = (payload, ack) => {
    if (typeof payload === "function") return { payload: {}, ack: payload };
    return { payload: payload || {}, ack };
};

// Balas lewat callback bila tersedia, dan kirim socket:error untuk payload ditolak.
export const kirimHasil = (socket, ack, hasil, event) => {
    if (typeof ack === "function") ack(hasil);
    if (!hasil.ok) socket.emit(EVENTS.ERROR, { event, message: hasil.message });
    return hasil;
};
