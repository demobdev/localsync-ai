import type { LocationProfileSnapshot } from "@/lib/types/location-profile";
import type { ExtractedListing } from "@/lib/audit/extract";

export type FindingSeverity = "critical" | "warning" | "info";

export type ComparisonFinding = {
  fieldKey: string;
  masterValue: string | null;
  foundValue: string | null;
  severity: FindingSeverity;
  message: string;
};

function normalizePhone(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits || null;
}

function normalizeText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value.trim().toLowerCase().replace(/\s+/g, " ") || null;
}

function normalizeWebsite(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "") || null;
}

export function compareListingToMaster(
  master: LocationProfileSnapshot,
  found: ExtractedListing,
): ComparisonFinding[] {
  const findings: ComparisonFinding[] = [];

  const checks: Array<{
    fieldKey: string;
    label: string;
    master: string | null | undefined;
    found: string | null;
    normalize: (value: string | null | undefined) => string | null;
    mismatchSeverity: FindingSeverity;
  }> = [
    {
      fieldKey: "name",
      label: "Business name",
      master: master.name,
      found: found.businessName,
      normalize: normalizeText,
      mismatchSeverity: "critical",
    },
    {
      fieldKey: "phone",
      label: "Phone",
      master: master.phone,
      found: found.phone,
      normalize: normalizePhone,
      mismatchSeverity: "critical",
    },
    {
      fieldKey: "addressLine1",
      label: "Street address",
      master: master.addressLine1,
      found: found.addressLine1,
      normalize: normalizeText,
      mismatchSeverity: "critical",
    },
    {
      fieldKey: "city",
      label: "City",
      master: master.city,
      found: found.city,
      normalize: normalizeText,
      mismatchSeverity: "warning",
    },
    {
      fieldKey: "state",
      label: "State",
      master: master.state,
      found: found.state,
      normalize: normalizeText,
      mismatchSeverity: "warning",
    },
    {
      fieldKey: "postalCode",
      label: "Postal code",
      master: master.postalCode,
      found: found.postalCode,
      normalize: normalizeText,
      mismatchSeverity: "warning",
    },
    {
      fieldKey: "website",
      label: "Website",
      master: master.website,
      found: found.website,
      normalize: normalizeWebsite,
      mismatchSeverity: "warning",
    },
  ];

  for (const check of checks) {
    const masterNorm = check.normalize(check.master);
    const foundNorm = check.normalize(check.found);

    if (!masterNorm) {
      continue;
    }

    if (!foundNorm) {
      findings.push({
        fieldKey: check.fieldKey,
        masterValue: check.master ?? null,
        foundValue: null,
        severity: "info",
        message: `${check.label} is missing from the listing`,
      });
      continue;
    }

    if (masterNorm !== foundNorm) {
      findings.push({
        fieldKey: check.fieldKey,
        masterValue: check.master ?? null,
        foundValue: check.found,
        severity: check.mismatchSeverity,
        message: `${check.label} does not match the master profile`,
      });
    }
  }

  if (found.confidence === "low") {
    findings.push({
      fieldKey: "_page",
      masterValue: null,
      foundValue: null,
      severity: "info",
      message:
        "Low confidence that this page is a listing for this business — verify the URL",
    });
  }

  return findings;
}

export function summarizeFindings(findings: ComparisonFinding[]): string {
  const critical = findings.filter((finding) => finding.severity === "critical").length;
  const warning = findings.filter((finding) => finding.severity === "warning").length;
  const info = findings.filter((finding) => finding.severity === "info").length;

  if (findings.length === 0) {
    return "No issues found";
  }

  return `${critical} critical, ${warning} warnings, ${info} info`;
}
