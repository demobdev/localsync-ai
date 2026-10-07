import { describe, expect, it } from "vitest";
import { mapGoogleHours } from "./google-hours";
const period = {
  openDay: "MONDAY",
  closeDay: "MONDAY",
  openTime: { hours: 9 },
  closeTime: { hours: 17 },
};
describe("Google hours fidelity", () => {
  it("maps simple weekly hours without inventing missing days", () => {
    expect(mapGoogleHours([period])).toEqual({
      regularHours: { monday: { open: "09:00", close: "17:00" } },
    });
  });
  it("does not silently keep only the last split shift", () => {
    const result = mapGoogleHours([
      period,
      { ...period, openTime: { hours: 18 }, closeTime: { hours: 22 } },
    ]);
    expect(result.regularHours).toEqual({});
    expect(result.hoursImportWarning).toBeDefined();
    expect(result.hoursDisplay).toContain("09:00–17:00");
    expect(result.hoursDisplay).toContain("18:00–22:00");
  });
  it("does not flatten overnight hours into a same-day period", () => {
    const result = mapGoogleHours([
      {
        ...period,
        closeDay: "TUESDAY",
        openTime: { hours: 20 },
        closeTime: { hours: 2 },
      },
    ]);
    expect(result.hoursImportWarning).toBeDefined();
    expect(result.hoursDisplay).toContain("TUESDAY");
  });
  it("preserves an empty hours response as empty", () => {
    expect(mapGoogleHours()).toEqual({ regularHours: {} });
  });
});
