// src/utils/schedule.ts
//
// Date/time helpers for scheduled posts.
//
// `combineDateAndTimeToISO` is identical to the old helperTwo version: the
// picked date + time are the user's LOCAL time, and the API gets the UTC ISO
// string. If your new project's `@/utils/helperTwo` already has it, import it
// from there instead and delete this copy.

/** "2026-10-05" + "15:30" -> "2026-10-05T14:30:00.000Z" (UTC, from local time) */
export const combineDateAndTimeToISO = (eventDate: string, eventTime: string) =>
  new Date(`${eventDate}T${eventTime}:00`).toISOString();

const pad = (n: number) => String(n).padStart(2, "0");

/** Local "YYYY-MM-DD" — what <input type="date"> uses. */
export const localDateISO = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local "HH:mm" — what <input type="time"> uses. */
export const localTimeHHMM = (d = new Date()) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** "Oct 5, 2026", or the placeholder when nothing is picked. */
export function formatScheduleDate(value: string) {
  if (!value) return "Select Day";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "3:30 pm", or the placeholder when nothing is picked. */
export function formatScheduleTime(value: string) {
  if (!value) return "Select Time";
  const [hour, minute] = value.split(":").map(Number);
  return `${hour % 12 || 12}:${pad(minute)} ${hour >= 12 ? "pm" : "am"}`;
}

/** True only for a real moment that is still ahead of now. Always run this
 *  BEFORE combineDateAndTimeToISO(): given bad input that function either
 *  throws (a RangeError for most invalid dates) or — for two empty strings —
 *  quietly returns a date around the year 2000 rather than failing. */
export function isFuture(eventDate: string, eventTime: string) {
  const t = new Date(`${eventDate}T${eventTime}:00`).getTime();
  return !Number.isNaN(t) && t > Date.now();
}

export const userTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
