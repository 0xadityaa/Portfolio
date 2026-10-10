import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Post dates are plain YYYY-MM-DD strings, so format them in UTC to avoid day drift. */
function toDate(date: string) {
  return new Date(date.includes("T") ? date : `${date}T00:00:00Z`);
}

export function formatDate(date: string) {
  return toDate(date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatShortDate(date: string) {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  });
}

export function formatMonthYear(date: string) {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function getYear(date: string) {
  return toDate(date).getUTCFullYear();
}

/** "Jul 2025" + "Present" -> "2025 – Now"; the same year twice -> "2025". */
export function yearRange(start: string, end?: string) {
  const year = (value?: string) => value?.match(/\d{4}/g)?.pop();
  const from = start.match(/\d{4}/)?.[0];
  const to = end && /present/i.test(end) ? "Now" : year(end);
  if (!from) return to ?? "";
  return !to || to === from ? from : `${from} \u2013 ${to}`;
}
