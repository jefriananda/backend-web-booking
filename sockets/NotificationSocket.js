import { getUser } from "./auth.js";
import { EVENTS } from "./events.js";
import { ROOM } from "./rooms.js";
import { ambilPayloadDanAck, kirimHasil } from "./utils.js";

const normalkanUserId = (payload) =>
    String(payload?.userId ?? payload?.userUuid ?? payload?.uuid ?? "").trim();

export const registerNotificationSocket = (io, socket) => {
    // Ruang notifikasi sudah digabung otomatis saat login; handler ini untuk
    // mendaftar ulang setelah keluar ruang (mis. saat logout sementara).
    socket.on(EVENTS.NOTIFICATION_JOIN, (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const user = getUser(socket);
        const userId = normalkanUserId(data);

        if (!userId || userId !== user.uuid) {
            kirimHasil(
                socket,
                callback,
                { ok: false, message: "userId tidak valid atau bukan milik Anda." },
                EVENTS.NOTIFICATION_JOIN
            );
            return;
        }

        const room = ROOM.user(user.uuid);
        socket.join(room);
        kirimHasil(socket, callback, { ok: true, room }, EVENTS.NOTIFICATION_JOIN);
    });

    socket.on(EVENTS.NOTIFICATION_LEAVE, (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const user = getUser(socket);
        const userId = normalkanUserId(data);

        if (!userId || userId !== user.uuid) {
            kirimHasil(
                socket,
                callback,
                { ok: false, message: "userId tidak valid atau bukan milik Anda." },
                EVENTS.NOTIFICATION_LEAVE
            );
            return;
        }

        const room = ROOM.user(user.uuid);
        socket.leave(room);
        kirimHasil(socket, callback, { ok: true, room }, EVENTS.NOTIFICATION_LEAVE);
    });

    // Alat bantu pengembangan: mengirim notifikasi contoh ke diri sendiri untuk uji koneksi.
    socket.on(EVENTS.NOTIFICATION_TEST, (payload, ack) => {
        const { payload: data, ack: callback } = ambilPayloadDanAck(payload, ack);
        const user = getUser(socket);

        socket.emit(EVENTS.NOTIFICATION_NEW, {
            type: EVENTS.NOTIFICATION_TEST,
            title: "Tes notifikasi",
            message: String(data.message || "Koneksi Socket.IO berfungsi."),
            data: { userUuid: user.uuid },
            createdAt: new Date().toISOString(),
        });

        if (typeof callback === "function") callback({ ok: true });
    });
};

export default registerNotificationSocket;
