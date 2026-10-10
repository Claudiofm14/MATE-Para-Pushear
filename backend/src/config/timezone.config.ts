export const APP_TIME_ZONE = 'America/Argentina/Buenos_Aires';

process.env.TZ = process.env.TZ || APP_TIME_ZONE;

const argentinaDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const argentinaTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export const getArgentinaDateString = (date = new Date()): string => {
  return argentinaDateFormatter.format(date);
};

export const getArgentinaTimeString = (date = new Date()): string => {
  return argentinaTimeFormatter.format(date);
};

export const getArgentinaTimestamp = (date = new Date()): string => {
  return date.toLocaleString('sv-SE', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};
