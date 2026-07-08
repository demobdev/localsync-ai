import { describe, expect, it } from "vitest";

import { googleConnectCopyForContext } from "@/lib/connect/google-connect-copy";
import { getWizardFieldConfig } from "@/lib/onboarding/wizard-field-config";
import { listingsDescriptionForModel } from "@/lib/profile/publisher-packs-by-model";

describe("getWizardFieldConfig", () => {
  it("hides city/state for service area and requires website for online", () => {
    expect(getWizardFieldConfig("service_area").showCityState).toBe(false);
    expect(getWizardFieldConfig("online").websiteRequired).toBe(true);
    expect(getWizardFieldConfig("storefront").showCityState).toBe(true);
  });
});

describe("googleConnectCopyForContext", () => {
  it("marks online GBP as optional when missing at audit", () => {
    const copy = googleConnectCopyForContext({
      context: {
        operatingModel: "online",
        auditTier: "website_local",
        gbpLinkedAtAudit: false,
        serviceAreaCities: null,
        onboardingIntent: null,
        graderAuditId: null,
      },
      googleState: { status: "not_connected" },
    });

    expect(copy.headline).toContain("optional");
    expect(copy.helper).toBeTruthy();
  });
});

describe("listingsDescriptionForModel", () => {
  it("mentions mobile-friendly directories", () => {
    expect(listingsDescriptionForModel("mobile")).toMatch(/mobile customers/i);
  });
});
