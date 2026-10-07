import { describe, expect, it } from "vitest";

import { getDashboardNav } from "@/lib/dashboard/nav";

describe("dashboard settings navigation", () => {
  it("gives every workspace a settings destination", () => {
    expect(getDashboardNav(false).map((item) => item.href)).toContain(
      "/dashboard/settings",
    );
    expect(getDashboardNav(true).map((item) => item.href)).toContain(
      "/dashboard/settings",
    );
  });
});
