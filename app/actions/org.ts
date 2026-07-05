"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

import { upsertOrganization } from "@/lib/auth/organizations";

export async function ensureOrganizationAction() {
  const session = await auth();

  if (!session.orgId) {
    return null;
  }

  const client = await clerkClient();
  const organization = await client.organizations.getOrganization({
    organizationId: session.orgId,
  });

  await upsertOrganization({
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    imageUrl: organization.imageUrl,
  });

  return organization;
}
