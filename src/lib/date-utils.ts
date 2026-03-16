/**
 * Timezone-aware date formatting utilities.
 * All functions accept a timezone string (e.g., "Europe/Berlin", "America/New_York").
 */

/** Convert a Date to a datetime-local input string (YYYY-MM-DDTHH:mm) in a specific timezone */
export function toDateTimeLocal(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const g = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  // en-CA gives "24" for midnight hour in some engines; clamp to "00"
  const hour = g("hour") === "24" ? "00" : g("hour");
  return `${g("year")}-${g("month")}-${g("day")}T${hour}:${g("minute")}`;
}

/**
 * Convert a datetime-local string back to a UTC ISO string,
 * interpreting the string as being in the given timezone.
 *
 * This is needed because `new Date("2026-03-11T23:05")` always parses
 * as browser-local time, which may differ from the user's selected timezone.
 */
export function fromDateTimeLocal(localStr: string, tz: string): string {
  // Parse the datetime-local string components
  const [datePart, timePart] = localStr.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Create a date in UTC with the same calendar values
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));

  // Find the offset of the target timezone at this moment
  // by comparing UTC-formatted vs TZ-formatted representations
  const utcStr = utcGuess.toLocaleString("en-US", { timeZone: "UTC" });
  const tzStr = utcGuess.toLocaleString("en-US", { timeZone: tz });
  const offsetMs = new Date(utcStr).getTime() - new Date(tzStr).getTime();

  // The real UTC time = utcGuess + offset
  // (offset is positive if tz is ahead of UTC, e.g., +60min for CET)
  return new Date(utcGuess.getTime() + offsetMs).toISOString();
}

/** Format a date/ISO string for display using a specific timezone */
export function formatDate(
  iso: string,
  tz: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(iso).toLocaleDateString("en-US", { timeZone: tz, ...options });
}

/** Format a time from an ISO string for display using a specific timezone */
export function formatTime(
  iso: string,
  tz: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Date(iso).toLocaleTimeString("en-US", { timeZone: tz, ...options });
}
