import { describe, expect, it } from "vitest";

import {
  getGbpVerificationLabel,
  resolveGbpVerificationAction,
  resolveGbpVerificationStatus,
  type GbpVoiceOfMerchantState,
} from "./google-verifications";

describe("resolveGbpVerificationAction", () => {
  it("prefers waitForVoiceOfMerchant when present", () => {
    expect(
      resolveGbpVerificationAction({
        waitForVoiceOfMerchant: {},
        verify: {},
      }),
    ).toBe("wait_for_review");
  });

  it("detects verify action", () => {
    expect(resolveGbpVerificationAction({ verify: {} })).toBe("verify");
  });
});

describe("resolveGbpVerificationStatus", () => {
  it("marks fully verified listings", () => {
    const state: GbpVoiceOfMerchantState = {
      hasVoiceOfMerchant: true,
      hasBusinessAuthority: true,
      action: "none",
    };

    expect(resolveGbpVerificationStatus(state)).toBe("verified");
    expect(getGbpVerificationLabel("verified")).toBe("Verified");
  });

  it("marks listings that need verification", () => {
    const state: GbpVoiceOfMerchantState = {
      hasVoiceOfMerchant: false,
      hasBusinessAuthority: false,
      action: "verify",
    };

    expect(resolveGbpVerificationStatus(state)).toBe("needs_verification");
    expect(getGbpVerificationLabel("needs_verification")).toBe(
      "Needs verification",
    );
  });
});
