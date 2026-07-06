import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

export type VisibilityScoreBreakdown = {
  total: number;
  profileScore: number;
  auditScore: number;
  profileChecks: Array<{ label: string; passed: boolean }>;
  auditSummary?: {
    runs: number;
    critical: number;
    warning: number;
    info: number;
  };
};

export function computeProfileScore(
  profile: LocationProfileSnapshot,
): Pick<VisibilityScoreBreakdown, "profileScore" | "profileChecks"> {
  const profileChecks = [
    { label: "Business name", passed: Boolean(profile.name.trim()) },
    { label: "Phone", passed: Boolean(profile.phone?.trim()) },
    {
      label: "Address",
      passed: Boolean(profile.addressLine1?.trim() && profile.city?.trim()),
    },
    {
      label: "Hours",
      passed: Object.keys(profile.regularHours).length > 0,
    },
    { label: "Services", passed: profile.serviceSlugs.length > 0 },
    { label: "Description", passed: Boolean(profile.description?.trim()) },
    { label: "Website", passed: Boolean(profile.website?.trim()) },
    { label: "Category", passed: Boolean(profile.categorySlug) },
    {
      label: "FAQs",
      passed: (profile.faqs?.length ?? 0) >= 3,
    },
  ];

  const passed = profileChecks.filter((check) => check.passed).length;
  const profileScore = Math.round((passed / profileChecks.length) * 50);

  return { profileScore, profileChecks };
}

export function computeAuditScore(input: {
  critical: number;
  warning: number;
  info: number;
  runs: number;
}): number {
  if (input.runs === 0) {
    return 0;
  }

  const penalty = input.critical * 12 + input.warning * 5 + input.info * 1;
  const raw = Math.max(0, 50 - penalty);

  return Math.min(50, raw);
}

export function computeVisibilityScore(input: {
  profile: LocationProfileSnapshot;
  audit?: {
    runs: number;
    critical: number;
    warning: number;
    info: number;
  };
}): VisibilityScoreBreakdown {
  const { profileScore, profileChecks } = computeProfileScore(input.profile);
  const auditScore = input.audit
    ? computeAuditScore(input.audit)
    : 0;

  return {
    total: profileScore + auditScore,
    profileScore,
    auditScore,
    profileChecks,
    auditSummary: input.audit,
  };
}
