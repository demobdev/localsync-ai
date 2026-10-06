import type { RegularHours } from "@/lib/types/location-profile";
const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;
type Time = { hours?: number; minutes?: number };
export type GoogleHoursPeriod = {
  openDay?: string;
  closeDay?: string;
  openTime?: Time;
  closeTime?: Time;
};
function time(value?: Time) {
  if (!value) return "Unknown";
  return `${String(value?.hours ?? 0).padStart(2, "0")}:${String(value?.minutes ?? 0).padStart(2, "0")}`;
}
export function mapGoogleHours(periods: GoogleHoursPeriod[] = []): {
  regularHours: RegularHours;
  hoursImportWarning?: string;
  hoursDisplay?: string;
} {
  const hours: RegularHours = {};
  let unsupported = false;
  for (const period of periods) {
    if (
      !DAYS.includes(period.openDay as (typeof DAYS)[number]) ||
      !period.openTime ||
      !period.closeTime
    ) {
      unsupported = true;
      continue;
    }
    const day = period.openDay!.toLowerCase() as keyof RegularHours;
    if (
      hours[day] ||
      (period.closeDay && period.closeDay !== period.openDay) ||
      time(period.closeTime) <= time(period.openTime)
    ) {
      unsupported = true;
      continue;
    }
    hours[day] = { open: time(period.openTime), close: time(period.closeTime) };
  }
  if (!unsupported) return { regularHours: hours };
  return {
    regularHours: {},
    hoursImportWarning:
      "Google's split, overnight, or extended hours cannot be represented safely by the current Master Profile editor. Hours were not imported; review them separately. Other fields can still be imported.",
    hoursDisplay: periods
      .map(
        (p) =>
          `${p.openDay ?? "Unknown day"} ${time(p.openTime)}–${p.closeDay && p.closeDay !== p.openDay ? `${p.closeDay} ` : ""}${time(p.closeTime)}`,
      )
      .join(" · "),
  };
}
