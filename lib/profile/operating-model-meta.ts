import type {
  GraderAuditTier,
  GraderOperatingModel,
} from "@/lib/grader/types";
import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

/** Stored in `location.profile.attributes` after grader claim. */
export const ATTR_OPERATING_MODEL = "operatingModel";
export const ATTR_AUDIT_TIER = "auditTier";
export const ATTR_GBP_AT_AUDIT = "gbpLinkedAtAudit";
export const ATTR_SERVICE_AREA_CITIES = "serviceAreaCities";
export const ATTR_ONBOARDING_INTENT = "onboardingIntent";

export type LocationOperatingContext = {
  operatingModel: GraderOperatingModel;
  auditTier: GraderAuditTier;
  /** Whether a Google listing was matched when the audit ran. */
  gbpLinkedAtAudit: boolean;
  serviceAreaCities: string | null;
  onboardingIntent: "fix" | "organic" | null;
};

const DEFAULT_CONTEXT: LocationOperatingContext = {
  operatingModel: "storefront",
  auditTier: "full_local",
  gbpLinkedAtAudit: true,
  serviceAreaCities: null,
  onboardingIntent: null,
};

function readStringAttr(
  attributes: LocationProfileSnapshot["attributes"],
  key: string,
): string | undefined {
  const value = attributes[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isOperatingModel(value: string): value is GraderOperatingModel {
  return (
    value === "storefront" ||
    value === "mobile" ||
    value === "service_area" ||
    value === "online"
  );
}

function isAuditTier(value: string): value is GraderAuditTier {
  return value === "full_local" || value === "website_local";
}

/** Read operating-model routing context from a location profile. */
export function getLocationOperatingContext(
  profile: LocationProfileSnapshot,
): LocationOperatingContext {
  const modelRaw = readStringAttr(profile.attributes, ATTR_OPERATING_MODEL);
  const tierRaw = readStringAttr(profile.attributes, ATTR_AUDIT_TIER);
  const gbpRaw = profile.attributes[ATTR_GBP_AT_AUDIT];
  const intentRaw = readStringAttr(profile.attributes, ATTR_ONBOARDING_INTENT);

  return {
    operatingModel:
      modelRaw && isOperatingModel(modelRaw) ? modelRaw : DEFAULT_CONTEXT.operatingModel,
    auditTier:
      tierRaw && isAuditTier(tierRaw) ? tierRaw : DEFAULT_CONTEXT.auditTier,
    gbpLinkedAtAudit:
      typeof gbpRaw === "boolean" ? gbpRaw : DEFAULT_CONTEXT.gbpLinkedAtAudit,
    serviceAreaCities:
      readStringAttr(profile.attributes, ATTR_SERVICE_AREA_CITIES) ?? null,
    onboardingIntent:
      intentRaw === "fix" || intentRaw === "organic" ? intentRaw : null,
  };
}

/** Merge operating-model metadata into a profile snapshot (e.g. at claim). */
export function withLocationOperatingContext(
  profile: LocationProfileSnapshot,
  input: Partial<LocationOperatingContext>,
): LocationProfileSnapshot {
  const next = { ...profile.attributes };

  if (input.operatingModel) {
    next[ATTR_OPERATING_MODEL] = input.operatingModel;
  }
  if (input.auditTier) {
    next[ATTR_AUDIT_TIER] = input.auditTier;
  }
  if (input.gbpLinkedAtAudit !== undefined) {
    next[ATTR_GBP_AT_AUDIT] = input.gbpLinkedAtAudit;
  }
  if (input.serviceAreaCities !== undefined) {
    if (input.serviceAreaCities) {
      next[ATTR_SERVICE_AREA_CITIES] = input.serviceAreaCities;
    } else {
      delete next[ATTR_SERVICE_AREA_CITIES];
    }
  }
  if (input.onboardingIntent !== undefined) {
    if (input.onboardingIntent) {
      next[ATTR_ONBOARDING_INTENT] = input.onboardingIntent;
    } else {
      delete next[ATTR_ONBOARDING_INTENT];
    }
  }

  return { ...profile, attributes: next };
}
