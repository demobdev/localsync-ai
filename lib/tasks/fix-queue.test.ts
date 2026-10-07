import { describe, expect, it } from "vitest";

import {
  fixQueuePriority,
  fixQueueSource,
  isNewFixQueueTask,
  sortFixQueueTasks,
} from "@/lib/tasks/fix-queue";

const baseTask = {
  title: "Update listing",
  description: null,
  status: "open" as const,
  checklistItemKey: "google-0",
  createdAt: new Date("2026-07-27T12:00:00Z"),
};

describe("fix queue", () => {
  it("classifies audit, system, and publisher sources", () => {
    expect(
      fixQueueSource({ ...baseTask, checklistItemKey: "grader:hours" }),
    ).toBe("visibility_audit");
    expect(
      fixQueueSource({ ...baseTask, checklistItemKey: "system:auth" }),
    ).toBe("system");
    expect(fixQueueSource(baseTask)).toBe("publisher");
  });

  it("raises blocked and connector exception work to urgent", () => {
    expect(
      fixQueuePriority({ ...baseTask, status: "blocked" }),
    ).toBe("urgent");
    expect(
      fixQueuePriority({
        ...baseTask,
        title: "Google authentication expired",
      }),
    ).toBe("urgent");
  });

  it("marks recent incomplete work as new", () => {
    expect(
      isNewFixQueueTask(baseTask, new Date("2026-07-29T11:00:00Z")),
    ).toBe(true);
    expect(
      isNewFixQueueTask(baseTask, new Date("2026-07-31T12:00:00Z")),
    ).toBe(false);
  });

  it("sorts urgent work before audit and routine tasks", () => {
    const sorted = sortFixQueueTasks([
      { ...baseTask, title: "Routine publisher step" },
      {
        ...baseTask,
        title: "Audit hours",
        checklistItemKey: "grader:hours",
      },
      { ...baseTask, title: "Verification required" },
    ]);

    expect(sorted.map((task) => task.title)).toEqual([
      "Verification required",
      "Audit hours",
      "Routine publisher step",
    ]);
  });
});
