import { socketAuth } from "./auth.js";
import { setSocketIO } from "./emitter.js";
import { EVENTS } from "./events.js";
import { gabungRuangAwal } from "./rooms.js";
import registerBookingSocket from "./BookingSocket.js";
import registerNotificationSocket from "./NotificationSocket.js";

// sessionMiddleware harus middleware express-session yang sama dipakai Express,
// supaya socket.request.session berisi sesi login yang identik.
export const initSocket = (io, sessionMiddleware = null) => {
    if (sessionMiddleware) io.engine.use(sessionMiddleware);

    io.use(socketAuth);
    setSocketIO(io);

    io.on("connection", (socket) => {
        const user = socket.data.user;
        const rooms = gabungRuangAwal(socket, user);

        console.log(`Socket terhubung: ${socket.id} (${user.role}: ${user.uuid})`);

        socket.emit(EVENTS.CONNECTED, {
            socketId: socket.id,
            user,
            rooms,
        });

        registerBookingSocket(io, socket);
        registerNotificationSocket(io, socket);

        socket.on("disconnect", (reason) => {
            console.log(`Socket terputus: ${socket.id} (${reason})`);
        });
    });

    return io;
};

export default initSocket;
