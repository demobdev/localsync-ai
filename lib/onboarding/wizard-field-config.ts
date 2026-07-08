import type { GraderOperatingModel } from "@/lib/grader/types";

export type WizardFieldConfig = {
  showCityState: boolean;
  cityLabel: string;
  stateLabel: string;
  websiteLabel: string;
  websitePlaceholder: string;
  websiteRequired: boolean;
  footerHint: string;
};

const CONFIG: Record<GraderOperatingModel, WizardFieldConfig> = {
  storefront: {
    showCityState: true,
    cityLabel: "City",
    stateLabel: "State",
    websiteLabel: "Website",
    websitePlaceholder: "https://…",
    websiteRequired: false,
    footerHint:
      "Storefront address can be added after setup — city helps us match directories.",
  },
  mobile: {
    showCityState: false,
    cityLabel: "City",
    stateLabel: "State",
    websiteLabel: "Website or link-in-bio *",
    websitePlaceholder: "https://… or Instagram link",
    websiteRequired: true,
    footerHint:
      "Mobile businesses need a home base online — website or social link is the anchor for audits.",
  },
  service_area: {
    showCityState: false,
    cityLabel: "City",
    stateLabel: "State",
    websiteLabel: "Website",
    websitePlaceholder: "https://…",
    websiteRequired: false,
    footerHint:
      "Service-area businesses rank on trade + cities served — add those below instead of a storefront address.",
  },
  online: {
    showCityState: false,
    cityLabel: "City",
    stateLabel: "State",
    websiteLabel: "Website *",
    websitePlaceholder: "https://yourstore.com",
    websiteRequired: true,
    footerHint:
      "Online-first local brands still need a website — Google and directories cite it for trust.",
  },
};

export function getWizardFieldConfig(
  operatingModel?: GraderOperatingModel | null,
): WizardFieldConfig {
  if (!operatingModel) {
    return {
      showCityState: true,
      cityLabel: "City",
      stateLabel: "State",
      websiteLabel: "Website",
      websitePlaceholder: "https://…",
      websiteRequired: false,
      footerHint:
        "City, phone, and website are optional — you can finish your profile after setup.",
    };
  }
  return CONFIG[operatingModel];
}
