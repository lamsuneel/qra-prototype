/**
 * The demonstration is set on a fixed date so every derived figure — days to
 * a calibration due date, days to an SLA deadline — is deterministic. Reading
 * the real clock would make the prototype drift and would risk a hydration
 * mismatch between the server render and the browser.
 */
export const DEMO_TODAY = new Date(2026, 7, 2); // 02-Aug-2026

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Parses the site's date format, "10-Oct-2026". */
export const parseSiteDate = (value: string): Date | null => {
  const match = value.trim().match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;

  const month = MONTHS.indexOf(match[2][0].toUpperCase() + match[2].slice(1).toLowerCase());
  if (month < 0) return null;

  return new Date(Number(match[3]), month, Number(match[1]));
};

/** Whole days from the demonstration date to the given date; negative if past. */
export const daysUntil = (value: string): number | null => {
  const date = parseSiteDate(value);
  if (!date) return null;

  return Math.round((date.getTime() - DEMO_TODAY.getTime()) / 86_400_000);
};
