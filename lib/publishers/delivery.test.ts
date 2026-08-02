import { describe, expect, it } from "vitest";

import {
  isAutomationRail,
  publisherDeliveryLabel,
  publisherNextActionLabel,
} from "./delivery";

describe("publisher delivery truth", () => {
  it("does not describe an unapproved API as synchronized", () => {
    const state = {
      deliveryRail: "approval_gated_direct",
      approvalStatus: "not_applied",
    } as const;

    expect(publisherDeliveryLabel(state)).toBe("API approval required");
    expect(isAutomationRail(state)).toBe(false);
  });

  it("promotes an approval-gated rail only after production approval", () => {
    const state = {
      deliveryRail: "approval_gated_direct",
      approvalStatus: "production",
    } as const;

    expect(publisherDeliveryLabel(state)).toBe("Directly synchronized");
    expect(isAutomationRail(state)).toBe(true);
  });

  it("keeps partner distribution distinct from direct publisher access", () => {
    const state = {
      deliveryRail: "partner_network",
      approvalStatus: "not_required",
    } as const;

    expect(publisherDeliveryLabel(state)).toBe("Partner-distributed");
    expect(
      publisherNextActionLabel({ state, hasListingUrl: false }),
    ).toBe("Start distribution");
  });

  it("asks only for the unavoidable customer verification step", () => {
    const state = {
      deliveryRail: "customer_action",
      approvalStatus: "not_required",
    } as const;

    expect(publisherDeliveryLabel(state)).toBe("Customer verification");
    expect(
      publisherNextActionLabel({ state, hasListingUrl: false }),
    ).toBe("Verify business");
  });

  it("opens an existing public listing regardless of delivery rail", () => {
    expect(
      publisherNextActionLabel({
        state: {
          deliveryRail: "monitor_only",
          approvalStatus: "not_required",
        },
        hasListingUrl: true,
      }),
    ).toBe("View listing");
  });
});
