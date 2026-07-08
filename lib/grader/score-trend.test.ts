import { describe, expect, it } from "vitest";

import { summarizeLocationAudit, buildOrgGraderAuditSummary } from "@/lib/grader/client-audit-summaries";
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
          createdAt: new Date("2026-07-02"),
        },
        {
          id: "audit-1",
          locationId: "loc-1",
          totalScore: 65,
          grade: "C",
          failedChecks: 8,
          createdAt: new Date("2026-07-01"),
        },
      ],
    });

    expect(summary.canRunAudit).toBe(true);
    expect(summary.totalScore).toBe(80);
    expect(summary.scoreDelta).toBe(15);
    expect(summary.auditId).toBe("audit-2");
  });
});

describe("buildOrgGraderAuditSummary", () => {
  it("averages latest scores and picks trend from most-audited location", () => {
    const auditsByLocation = new Map([
      [
        "loc-a",
        [
          {
            id: "a2",
            locationId: "loc-a",
            totalScore: 80,
            grade: "B",
            failedChecks: 3,
            createdAt: new Date("2026-07-02"),
          },
          {
            id: "a1",
            locationId: "loc-a",
            totalScore: 65,
            grade: "C",
            failedChecks: 8,
            createdAt: new Date("2026-07-01"),
          },
        ],
      ],
      [
        "loc-b",
        [
          {
            id: "b1",
            locationId: "loc-b",
            totalScore: 70,
            grade: "C",
            failedChecks: 5,
            createdAt: new Date("2026-07-03"),
          },
        ],
      ],
    ]);

    const summary = buildOrgGraderAuditSummary({
      locationIds: ["loc-a", "loc-b", "loc-c"],
      auditsByLocation,
    });

    expect(summary.averageScore).toBe(75);
    expect(summary.auditedLocationCount).toBe(2);
    expect(summary.totalLocationCount).toBe(3);
    expect(summary.latestScoreDelta).toBe(15);
    expect(summary.scoreTrend).toEqual([65, 80]);
    expect(summary.trendLocationId).toBe("loc-a");
  });
});
