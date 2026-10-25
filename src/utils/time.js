// Slots travel as UTC ISO strings. These helpers only decide how they are SHOWN.
const FALLBACK_ZONES = [
  'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles', 'Australia/Sydney', 'UTC',
];

export const detectTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

export const timezoneList = () => {
  const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : FALLBACK_ZONES;
  const detected = detectTimezone();
  return zones.includes(detected) ? zones : [detected, ...zones];
};

// "YYYY-MM-DD" of an instant as seen in a timezone (en-CA formats dates this way).
export const dateKeyInZone = (iso, timeZone) =>
  new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));

export const formatTime = (iso, timeZone) =>
  new Intl.DateTimeFormat(undefined, { timeZone, hour: 'numeric', minute: '2-digit' }).format(new Date(iso));

export const formatDateTime = (iso, timeZone) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone, weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso));

export const formatLongDate = (dateKey) =>
  new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(`${dateKey}T12:00:00Z`)
  );

export const formatMonth = (year, monthIndex) =>
  new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, monthIndex, 1))
  );

export const todayKey = () => new Date().toISOString().slice(0, 10);
