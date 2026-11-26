// Kontrak event Socket.IO yang dipakai bersama oleh server dan client.
export const EVENTS = {
    CONNECTED: "socket:connected",
    ERROR: "socket:error",

    BOOKING_JOIN: "booking:join",
    BOOKING_LEAVE: "booking:leave",
    BOOKING_CREATED: "booking:created",
    BOOKING_UPDATED: "booking:updated",

    FIELD_JOIN: "field:join",
    FIELD_LEAVE: "field:leave",
    FIELD_AVAILABILITY: "field:availability",

    NOTIFICATION_JOIN: "notification:join",
    NOTIFICATION_LEAVE: "notification:leave",
    NOTIFICATION_NEW: "notification:new",
    NOTIFICATION_TEST: "notification:test",

    PAYMENT_CREATED: "payment:created",
    PAYMENT_UPDATED: "payment:updated",
};

export default EVENTS;
