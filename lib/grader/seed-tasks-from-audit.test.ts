import { describe, expect, it } from "vitest";

import {
  extractKeywordOpportunities,
  graderTaskKey,
  selectChecksForTaskSeeding,
} from "@/lib/grader/seed-tasks-from-audit";
import type { AuditCheck } from "@/lib/grader/types";

function check(
  partial: Partial<AuditCheck> & Pick<AuditCheck, "id" | "effort" | "impact">,
): AuditCheck {
  return {
    category: "listings",
    group: "GBP",
    label: partial.id,
    status: "fail",
    detail: "detail",
    weight: 1,
    ...partial,
  };
}

describe("selectChecksForTaskSeeding", () => {
  it("prefers quick wins then medium, capped at 8", () => {
    const checks: AuditCheck[] = [
      check({ id: "high-effort", effort: "high", impact: "high" }),
      check({ id: "quick-a", effort: "quick", impact: "medium" }),
      check({ id: "quick-b", effort: "quick", impact: "high" }),
      ...Array.from({ length: 10 }, (_, i) =>
        check({ id: `medium-${i}`, effort: "medium", impact: "low" }),
      ),
    ];

    const selected = selectChecksForTaskSeeding(checks);
    expect(selected.map((c) => c.id)).toEqual([
      "quick-b",
      "quick-a",
      "medium-0",
      "medium-1",
      "medium-2",
      "medium-3",
      "medium-4",
      "medium-5",
    ]);
  });

  it("ignores passing checks", () => {
    const checks: AuditCheck[] = [
      {
        ...check({ id: "passing", effort: "quick", impact: "high" }),
        status: "pass",
      },
      check({ id: "failing", effort: "quick", impact: "high" }),
    ];

    expect(selectChecksForTaskSeeding(checks).map((c) => c.id)).toEqual([
      "failing",
    ]);
  });
});

describe("graderTaskKey", () => {
  it("prefixes check id for dedup", () => {
    expect(graderTaskKey("missing-hours")).toBe("grader:missing-hours");
  });
});

describe("extractKeywordOpportunities", () => {
  it("returns opportunity intent and unranked keywords", () => {
    const keywords = extractKeywordOpportunities(
      [
        {
          keyword: "hvac repair",
          yourMapRank: 1,
          yourOrganicRank: 5,
          intent: "protecting",
        },
        {
          keyword: "ac install",
          yourMapRank: null,
          yourOrganicRank: null,
          intent: "opportunity",
        },
        {
          keyword: "furnace tune up",
          yourMapRank: null,
          yourOrganicRank: null,
        },
      ],
      5,
    );

    expect(keywords).toEqual(["ac install", "furnace tune up"]);
  });
});
