import { describe, expect, it } from "vitest";

import {
  compareGoogleProfile,
  verifyGoogleProfile,
} from "@/lib/connectors/google-profile-diff";
import type { GbpLocation } from "@/lib/connectors/google";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const master = {
  ...EMPTY_LOCATION_PROFILE,
  name: "The Owner's Box",
  phone: "(864) 555-0100",
  website: "https://www.ownersbox.com/",
  addressLine1: "123 Main St.",
  city: "Greenville",
  state: "SC",
  postalCode: "29601",
  regularHours: {
    monday: { open: "09:00", close: "17:00" },
  },
};

function googleLocation(
  overrides: Partial<GbpLocation> = {},
): GbpLocation {
  return {
    gbpName: "locations/123",
    title: "The Owners Box",
    phone: "+1 864-555-0100",
    website: "https://ownersbox.com",
    addressLine1: "123 Main St",
    city: "Greenville",
    state: "sc",
    postalCode: "29601",
    regularHours: {
      monday: { open: "09:00", close: "17:00" },
    },
    categories: [],
    verification: {
      status: "verified",
      label: "Verified",
      hasVoiceOfMerchant: true,
      hasBusinessAuthority: true,
      action: "none",
    },
    ...overrides,
  };
}

describe("Google profile comparison", () => {
  it("tolerates publisher-safe formatting differences", () => {
    const comparisons = compareGoogleProfile(master, googleLocation());

    expect(comparisons.every((comparison) => comparison.matches)).toBe(true);
    expect(verifyGoogleProfile(master, googleLocation()).verified).toBe(true);
  });

  it("does not verify a profile with a real field mismatch", () => {
    const result = verifyGoogleProfile(
      master,
      googleLocation({ phone: "864-555-9999" }),
    );

    expect(result.verified).toBe(false);
    expect(result.mismatchedFields).toContain("phone");
  });

  it("requires publisher ownership verification before live status", () => {
    const result = verifyGoogleProfile(
      master,
      googleLocation({
        verification: {
          status: "needs_verification",
          label: "Verification required",
          hasVoiceOfMerchant: false,
          hasBusinessAuthority: false,
          action: "verify",
        },
      }),
    );

    expect(result.verified).toBe(false);
    expect(result.listingVerified).toBe(false);
    expect(result.mismatchedFields).toEqual([]);
  });
});
