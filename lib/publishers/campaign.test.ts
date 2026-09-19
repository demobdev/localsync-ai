import { describe, expect, it } from "vitest";

import {
  deriveInitialSubmissionTarget,
  submissionCampaignProgress,
  submissionTargetLabel,
} from "@/lib/publishers/campaign";

describe("deriveInitialSubmissionTarget", () => {
  it("keeps approval-gated publishers blocked until production access exists", () => {
    expect(
      deriveInitialSubmissionTarget({
        publisherName: "Google Business Profile",
        deliveryRail: "approval_gated_direct",
        approvalStatus: "pending",
      }),
    ).toMatchObject({
      status: "blocked",
      nextAction: "Track partner approval",
      customerActionRequired: false,
    });
  });

  it("routes managed submissions through customer review", () => {
    expect(
      deriveInitialSubmissionTarget({
        publisherName: "BBB",
        deliveryRail: "managed_submission",
        approvalStatus: "not_required",
      }),
    ).toMatchObject({
      status: "ready_for_review",
      nextAction: "Approve managed submission",
      customerActionRequired: true,
    });
  });

  it("treats a known public URL as monitored, not submitted", () => {
    expect(
      deriveInitialSubmissionTarget({
        publisherName: "Yelp",
        deliveryRail: "approval_gated_direct",
        approvalStatus: "pending",
        listingUrl: "https://www.yelp.com/biz/example",
      }),
    ).toMatchObject({
      status: "monitoring",
      nextAction: "Run listing check",
    });
  });
});

describe("submission campaign presentation", () => {
  it("uses a truthful submitted label", () => {
    expect(submissionTargetLabel("submitted")).toBe(
      "Submitted — awaiting publisher",
    );
  });

  it("summarizes durable job states", () => {
    expect(
      submissionCampaignProgress([
        "verified",
        "submitted",
        "monitoring",
        "ready_for_review",
        "verification_required",
        "blocked",
      ]),
    ).toEqual({
      total: 6,
      verified: 1,
      inFlight: 1,
      awaitingApproval: 1,
      customerAction: 1,
      monitored: 1,
      blocked: 1,
      progressPercent: 50,
    });
  });
});
