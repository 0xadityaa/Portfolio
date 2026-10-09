/**
 * When posts go out. The default slot is defined in local time so it does not
 * drift with daylight saving. The reasoning is in docs/research/distribution.md.
 */
export const TIME_ZONE = "America/Toronto";
export const DEFAULT_SLOT = { weekday: 2, time: "09:00" }; // 0 = Sunday

/** Offset of `timeZone` from UTC, in minutes, at the given instant. */
function offsetMinutes(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(instant)
      .map((part) => [part.type, part.value])
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/** A wall-clock date and time in `timeZone`, as a UTC Date. */
export function zonedToUtc(date, time, timeZone = TIME_ZONE) {
  const guess = new Date(`${date}T${time}:00Z`);
  return new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60000);
}

/** The calendar date in `timeZone` for an instant, as YYYY-MM-DD. */
function localDate(instant, timeZone = TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, dateStyle: "short" }).format(instant);
}

/** The next default slot that is at least an hour away. */
export function nextDefaultSlot(now = new Date()) {
  for (let day = 0; day < 8; day++) {
    const date = localDate(new Date(now.getTime() + day * 86400000));
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const slot = zonedToUtc(date, DEFAULT_SLOT.time);
    if (weekday === DEFAULT_SLOT.weekday && slot.getTime() - now.getTime() > 3600000) return slot;
  }
  throw new Error("No default slot found in the next week");
}

/**
 * Turn what Aditya typed into a publish time.
 *   ""                      the next default slot
 *   "now"                   immediately
 *   "2026-10-15"            that day at the default time, Toronto
 *   "2026-10-15 14:30"      that day and time, Toronto
 *   "2026-10-15T18:30:00Z"  an exact instant
 */
export function parseWhen(input, now = new Date()) {
  const text = (input ?? "").trim();
  if (text === "") return nextDefaultSlot(now);
  if (text === "now") return now;

  let match;
  if ((match = text.match(/^(\d{4}-\d{2}-\d{2})$/))) {
    return zonedToUtc(match[1], DEFAULT_SLOT.time);
  }
  if ((match = text.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2})$/))) {
    return zonedToUtc(match[1], `${match[2].padStart(2, "0")}:${match[3]}`);
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(text)) {
    return new Date(text);
  }
  throw new Error(
    `Could not read "${text}" as a publish time. Use YYYY-MM-DD, "YYYY-MM-DD HH:MM" (Toronto time), "now", or leave it empty for the next default slot.`
  );
}

export function describe(instant) {
  const local = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    dateStyle: "full",
    timeStyle: "short",
  }).format(instant);
  return `${local} Toronto time (${instant.toISOString().replace(".000Z", "Z")})`;
}
