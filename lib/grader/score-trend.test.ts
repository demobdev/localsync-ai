import { describe, expect, it } from "vitest";

import { summarizeLocationAudit } from "@/lib/grader/client-audit-summaries";
import { buildGraderScoreTrend } from "@/lib/grader/location-audit-bridge";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

describe("buildGraderScoreTrend", () => {
  it("returns null deltas when no prior audit exists", () => {
    expect(
      buildGraderScoreTrend({
        totalScore: 72,
        failedChecks: 5,
        prior: null,
      }),
    ).toEqual({
      priorTotalScore: null,
      scoreDelta: null,
      priorFailedChecks: null,
      failedChecksDelta: null,
    });
  });

  it("computes score and leak deltas from prior audit", () => {
    expect(
      buildGraderScoreTrend({
        totalScore: 81,
        failedChecks: 3,
        prior: { totalScore: 68, failedChecks: 7 },
      }),
    ).toEqual({
      priorTotalScore: 68,
      scoreDelta: 13,
      priorFailedChecks: 7,
      failedChecksDelta: 4,
    });
  });
});

describe("summarizeLocationAudit", () => {
  it("marks locations with website as audit-ready", () => {
    const summary = summarizeLocationAudit({
      locationId: "loc-1",
      locationName: "Demo HVAC",
      profile: {
        ...EMPTY_LOCATION_PROFILE,
        name: "Demo HVAC",
        website: "https://example.com",
        city: "Austin",
      },
      auditsForLocation: [
        {
          id: "audit-2",
          locationId: "loc-1",
          totalScore: 80,
          grade: "B",
          failedChecks: 4,
        },
        {
          id: "audit-1",
          locationId: "loc-1",
          totalScore: 65,
          grade: "C",
          failedChecks: 8,
        },
      ],
    });

    expect(summary.canRunAudit).toBe(true);
    expect(summary.totalScore).toBe(80);
    expect(summary.scoreDelta).toBe(15);
    expect(summary.auditId).toBe("audit-2");
  });
});
