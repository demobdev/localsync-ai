import { describe, expect, it } from "vitest";
import { EMPTY_STAFF_REVIEW, parseStaffReviewState, transitionStaffReview } from "./staff-fulfillment";

const at = "2026-10-23T14:00:00.000Z";

describe("LocalMap staff review transitions", () => {
  it("requires an unassigned review before claim and keeps a revisioned audit state", () => {
    const claimed = transitionStaffReview({ state: EMPTY_STAFF_REVIEW, action: "claim", actorUserId: "user_staff", now: at });
    expect(claimed).toEqual({ status: "in_progress", revision: 1, assignedToUserId: "user_staff", lastNote: null, updatedAt: at });
    expect(() => transitionStaffReview({ state: claimed, action: "claim", actorUserId: "user_other", now: at })).toThrow("already claimed");
  });

  it("requires the assigned staff member and an operational note for information handoffs", () => {
    const claimed = transitionStaffReview({ state: EMPTY_STAFF_REVIEW, action: "claim", actorUserId: "user_staff", now: at });
    expect(() => transitionStaffReview({ state: claimed, action: "request_information", actorUserId: "user_other", note: "Need owner info", now: at })).toThrow("assigned staff member");
    const waiting = transitionStaffReview({ state: claimed, action: "request_information", actorUserId: "user_staff", note: "Need owner-approved URL", now: at });
    expect(waiting.status).toBe("needs_information"); expect(waiting.revision).toBe(2);
    const resumed = transitionStaffReview({ state: waiting, action: "resume", actorUserId: "user_staff", note: "Owner supplied URL", now: at });
    expect(resumed.status).toBe("in_progress"); expect(resumed.revision).toBe(3);
    expect(resumed.lastNote).toBe("Owner supplied URL");
  });

  it("validates stored state before rendering or writing", () => {
    expect(parseStaffReviewState(null)).toEqual(EMPTY_STAFF_REVIEW);
    expect(() => parseStaffReviewState({ status: "live", revision: "1" })).toThrow("state is unavailable");
    expect(() => transitionStaffReview({ state: EMPTY_STAFF_REVIEW, action: "resume", actorUserId: "user_staff", note: "No", now: at })).toThrow("awaiting information");
  });
});
