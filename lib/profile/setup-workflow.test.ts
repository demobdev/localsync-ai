import { describe, expect, it } from "vitest";
import { buildConnectionSteps, mergeSetupProgress } from "./setup-workflow";
const input = {
  locationId: "owners-box",
  googleConnected: true,
  googleCanImport: true,
  listingUrlsConfigured: 0,
  auditRunsCompleted: 0,
};
describe("Google setup progress", () => {
  it("advances past a saved verified matching listing instead of looping forever", () => {
    const steps = buildConnectionSteps({
      ...input,
      googleListingLinked: true,
      googleListingReady: true,
    });
    expect(steps.find((step) => step.id === "import-google")?.done).toBe(true);
    expect(mergeSetupProgress(steps).nextStep?.id).not.toBe("import-google");
  });
  it("routes a linked but mismatching/unverified listing to its workspace", () => {
    const step = buildConnectionSteps({
      ...input,
      googleListingLinked: true,
      googleListingReady: false,
    }).find((step) => step.id === "import-google");
    expect(step).toMatchObject({
      done: false,
      href: "/dashboard/locations/owners-box/listings",
    });
  });
  it("does not treat OAuth alone as listing confirmation", () => {
    const step = buildConnectionSteps(input).find(
      (step) => step.id === "import-google",
    );
    expect(step).toMatchObject({
      done: false,
      href: "/dashboard/connect/google",
    });
  });
});
