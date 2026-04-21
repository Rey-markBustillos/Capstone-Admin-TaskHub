const DEFAULT_LOCALE = 'en-PH';
const DEFAULT_TIME_ZONE = 'Asia/Manila';

const TIME_24H_REGEX = /^([01]?\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const TIME_12H_REGEX = /^(0?[1-9]|1[0-2]):([0-5]\d)\s*([AaPp][Mm])$/;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value) => String(value).padStart(2, '0');

export const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const fromDateOnly = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return isValidDate(parsed) ? parsed : null;
};

const fromTimeOnly = (value) => {
  const normalized = String(value || '').trim();

  const match24 = normalized.match(TIME_24H_REGEX);
  if (match24) {
    const [, hour, minute, second = '0'] = match24;
    return new Date(1970, 0, 1, Number(hour), Number(minute), Number(second), 0);
  }

  const match12 = normalized.match(TIME_12H_REGEX);
  if (match12) {
    const [, hourRaw, minute, meridiem] = match12;
    let hour = Number(hourRaw);
    const isPm = meridiem.toUpperCase() === 'PM';
    if (isPm && hour !== 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    return new Date(1970, 0, 1, hour, Number(minute), 0, 0);
  }

  return null;
};

export const toDate = (value) => {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return isValidDate(value) ? value : null;
  }

  if (typeof value === 'number') {
    const parsedNumber = new Date(value);
    return isValidDate(parsedNumber) ? parsedNumber : null;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (DATE_ONLY_REGEX.test(trimmed)) {
      return fromDateOnly(trimmed);
    }

    const timeOnlyDate = fromTimeOnly(trimmed);
    if (timeOnlyDate) {
      return timeOnlyDate;
    }

    const parsedString = new Date(trimmed);
    return isValidDate(parsedString) ? parsedString : null;
  }

  const parsedGeneric = new Date(value);
  return isValidDate(parsedGeneric) ? parsedGeneric : null;
};

export const toTimestamp = (value, fallback = NaN) => {
  const parsed = toDate(value);
  return parsed ? parsed.getTime() : fallback;
};

const buildOptions = (options = {}, defaults = {}) => {
  const { locale = DEFAULT_LOCALE, timeZone = DEFAULT_TIME_ZONE, ...formatOptions } = options;
  return { locale, formatOptions: { timeZone, ...defaults, ...formatOptions } };
};

export const formatDate = (value, options = {}, fallback = 'N/A') => {
  const parsed = toDate(value);
  if (!parsed) return fallback;

  const { locale, formatOptions } = buildOptions(options, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return parsed.toLocaleDateString(locale, formatOptions);
};

export const formatTime = (value, options = {}, fallback = 'TBA') => {
  const parsed = toDate(value);
  if (!parsed) return fallback;

  const { locale, formatOptions } = buildOptions(options, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return parsed.toLocaleTimeString(locale, formatOptions);
};

export const formatDateTime = (value, options = {}, fallback = 'N/A') => {
  const parsed = toDate(value);
  if (!parsed) return fallback;

  const { locale, formatOptions } = buildOptions(options, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return parsed.toLocaleString(locale, formatOptions);
};

export const formatClassTimeRange = (startTime, endTime, options = {}, fallback = 'TBA') => {
  const start = formatTime(startTime, options, '');
  if (!start) return fallback;

  const end = formatTime(endTime, options, '');
  return end ? `${start} - ${end}` : start;
};

export const toTimeInputValue = (value) => {
  if (typeof value === 'string' && TIME_24H_REGEX.test(value.trim())) {
    const [hour, minute] = value.trim().split(':');
    return `${pad(hour)}:${pad(minute)}`;
  }

  const parsed = toDate(value);
  if (!parsed) return '';

  const valueInManila = parsed.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DEFAULT_TIME_ZONE,
  });

  return valueInManila;
};
