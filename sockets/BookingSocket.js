import { getUser } from "./auth.js";
import { EVENTS } from "./events.js";
import { ROOM, bookingBisaDiakses, fieldAda } from "./rooms.js";
import { ambilPayloadDanAck, kirimHasil } from "./utils.js";

const normalkanKode = (payload) =>
    String(payload?.bookingCode ?? payload?.booking_code ?? "").trim();

const normalkanFieldId = (payload) => Number(payload?.fieldId ?? payload?.field_id);

export const registerBookingSocket = (io, socket) => {
    socket.on(EVENTS.BOOKING_JOIN, async (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const bookingCode = normalkanKode(data);
        let hasil;

        if (!bookingCode) {
            hasil = { ok: false, message: "Kode booking wajib diisi." };
        } else {
            try {
                const boleh = await bookingBisaDiakses({ user: getUser(socket), bookingCode });

                if (!boleh) {
                    hasil = {
                        ok: false,
                        message: "Booking tidak ditemukan atau bukan milik Anda.",
                    };
                } else {
                    const room = ROOM.booking(bookingCode);
                    socket.join(room);
                    hasil = { ok: true, room };
                }
            } catch (error) {
                hasil = { ok: false, message: "Gagal bergabung ke ruang booking." };
            }
        }

        kirimHasil(socket, callback, hasil, EVENTS.BOOKING_JOIN);
    });

    socket.on(EVENTS.BOOKING_LEAVE, (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const bookingCode = normalkanKode(data);

        if (!bookingCode) {
            kirimHasil(
                socket,
                callback,
                { ok: false, message: "Kode booking wajib diisi." },
                EVENTS.BOOKING_LEAVE
            );
            return;
        }

        const room = ROOM.booking(bookingCode);
        socket.leave(room);
        kirimHasil(socket, callback, { ok: true, room }, EVENTS.BOOKING_LEAVE);
    });

    socket.on(EVENTS.FIELD_JOIN, async (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const fieldId = normalkanFieldId(data);
        let hasil;

        try {
            if (!(await fieldAda(fieldId))) {
                hasil = { ok: false, message: "Lapangan tidak ditemukan." };
            } else {
                const room = ROOM.field(fieldId);
                socket.join(room);
                hasil = { ok: true, room };
            }
        } catch (error) {
            hasil = { ok: false, message: "Gagal bergabung ke ruang lapangan." };
        }

        kirimHasil(socket, callback, hasil, EVENTS.FIELD_JOIN);
    });

    socket.on(EVENTS.FIELD_LEAVE, (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const fieldId = normalkanFieldId(data);

        if (!Number.isInteger(fieldId) || fieldId <= 0) {
            kirimHasil(
                socket,
                callback,
                { ok: false, message: "field_id tidak valid." },
                EVENTS.FIELD_LEAVE
            );
            return;
        }

        const room = ROOM.field(fieldId);
        socket.leave(room);
        kirimHasil(socket, callback, { ok: true, room }, EVENTS.FIELD_LEAVE);
    });
};

export default registerBookingSocket;
