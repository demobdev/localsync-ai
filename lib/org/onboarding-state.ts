import { getOrganization } from "@/lib/auth/organizations";
import { countOrgLocations } from "@/lib/org/locations";

const PLACEHOLDER_ORG_NAMES = new Set([
  "my organization",
  "organization",
  "personal account",
]);

export function isPlaceholderOrganizationName(name: string): boolean {
  return PLACEHOLDER_ORG_NAMES.has(name.trim().toLowerCase());
}

/** Org exists in Clerk but the user never finished LocalSync onboarding. */
export async function isIncompleteOrganization(orgId: string): Promise<boolean> {
  const locationCount = await countOrgLocations(orgId);

  if (locationCount > 0) {
    return false;
  }

  const organization = await getOrganization(orgId);

  if (!organization) {
    return true;
  }

  return isPlaceholderOrganizationName(organization.name);
}
