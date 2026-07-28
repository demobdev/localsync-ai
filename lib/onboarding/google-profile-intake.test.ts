import { describe, expect, it } from "vitest";

import { resolveGoogleProfileIntake } from "@/lib/onboarding/google-profile-intake";

describe("Google profile onboarding intake", () => {
  it("routes a confirmed place into ownership connection", () => {
    expect(
      resolveGoogleProfileIntake({
        lookup: { status: "found", matchedBy: "autocomplete" },
      }),
    ).toMatchObject({
      state: "ready_to_connect",
      fix: { checklistItemKey: "system:google-profile:connect" },
    });
  });

  it("routes a weak name match through customer confirmation", () => {
    expect(
      resolveGoogleProfileIntake({
        lookup: { status: "found", matchedBy: "name" },
      }),
    ).toMatchObject({
      state: "needs_confirmation",
      fix: { checklistItemKey: "system:google-profile:confirm-match" },
    });
  });

  it("creates a profile setup fix only after a genuine empty search", () => {
    expect(
      resolveGoogleProfileIntake({ lookup: { status: "not_found" } }),
    ).toMatchObject({
      state: "needs_creation",
      fix: { checklistItemKey: "system:google-profile:create" },
    });
  });

  it("recovers an existing profile when the customer disputes not-found", () => {
    expect(
      resolveGoogleProfileIntake({
        lookup: { status: "not_found" },
        customerSaysExists: true,
      }),
    ).toMatchObject({
      state: "needs_manual_match",
      fix: { checklistItemKey: "system:google-profile:recover" },
    });
  });

  it("blocks on a lookup outage instead of creating a false profile task", () => {
    expect(
      resolveGoogleProfileIntake({ lookup: { status: "error" } }),
    ).toMatchObject({
      state: "lookup_blocked",
      fix: {
        checklistItemKey: "system:google-profile:retry-lookup",
        status: "blocked",
      },
    });
  });
});
