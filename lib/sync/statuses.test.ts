import { describe, expect, it } from "vitest";

import {
  presentIntegrationTier,
  presentListingStatus,
} from "@/lib/sync/statuses";

describe("listing status honesty", () => {
  it("never labels legacy synced as Live and synced", () => {
    const presentation = presentListingStatus("synced");
    expect(presentation.label).toBe("Accepted (unverified)");
    expect(presentation.tone).toBe("warning");
  });

  it("reserves Live and synced for verified state", () => {
    expect(presentListingStatus("live_synced").label).toBe("Live and synced");
  });

  it("maps rails to honest integration tiers", () => {
    expect(presentIntegrationTier("api")).toBe("Direct");
    expect(presentIntegrationTier("guided_import")).toBe("Distributed");
    expect(presentIntegrationTier("audit_only")).toBe("Audit-only");
  });
});
