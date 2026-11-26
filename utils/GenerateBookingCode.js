const pad = (value, length = 2) => String(value).padStart(length, "0");

export const generateBookingCode = (prefix = "BK") => {
    const now = new Date();
    const datePart = [
        now.getFullYear(),
        pad(now.getMonth() + 1),
        pad(now.getDate()),
    ].join("");
    const timePart = [pad(now.getHours()), pad(now.getMinutes()), pad(now.getSeconds())].join(
        ""
    );
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();

    return `${prefix}-${datePart}-${timePart}-${randomPart}`;
};

export default generateBookingCode;