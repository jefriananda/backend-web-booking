// Autentikasi socket memakai sesi yang sama dengan request Express.
// Middleware sesi dipasang di io.engine.use() pada sockets/index.js.
export const socketAuth = (socket, next) => {
    const session = socket.request?.session;

    if (!session?.userId) {
        const error = new Error("Anda belum login. Silakan login terlebih dahulu.");
        error.data = { code: "UNAUTHENTICATED" };
        return next(error);
    }

    socket.data.user = {
        uuid: session.userId,
        role: session.role || "customer",
    };

    return next();
};

export const getUser = (socket) => socket.data.user;
