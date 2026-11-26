const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value) => String(value).padStart(2, "0");

export const normalizeTime = (value) => {
    if (value === undefined || value === null) return null;

    const match = String(value).trim().match(TIME_REGEX);
    if (!match) return null;

    return `${match[1]}:${match[2]}:${match[3] || "00"}`;
};

export const normalizeDate = (value) => {
    if (value === undefined || value === null) return null;

    const text = String(value).trim();
    if (!DATE_REGEX.test(text)) return null;

    const [year, month, day] = text.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    const valid =
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day;

    return valid ? text : null;
};

export const todayString = () => {
    const now = new Date();
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const isPastDate = (date) => date < todayString();

export const timeToMinutes = (value) => {
    const normalized = normalizeTime(value);
    if (!normalized) return null;

    const [hours, minutes] = normalized.split(":").map(Number);
    return hours * 60 + minutes;
};
