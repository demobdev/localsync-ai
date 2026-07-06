"use client";

import { OrganizationSwitcher, useOrganizationList } from "@clerk/nextjs";

export function WorkspaceSwitcher() {
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: { infinite: true },
  });

  const orgCount = userMemberships.data?.length ?? 0;

  if (!isLoaded || orgCount <= 1) {
    return null;
  }

  return (
    <OrganizationSwitcher
      hidePersonal
      afterCreateOrganizationUrl="/dashboard"
      afterSelectOrganizationUrl="/dashboard"
    />
  );
}
