import { describe, expect, it } from "vitest";

import { selectWorkspaceOptions } from "@/lib/org/workspace-options";

describe("workspace switcher options", () => {
  it("keeps usable workspaces and removes empty legacy duplicates", () => {
    const options = selectWorkspaceOptions({
      activeOrganizationId: "org_restore",
      memberships: [
        {
          organizationId: "org_restore",
          name: "Restore Heating & Cooling",
          slug: "restore-heating-cooling",
          role: "org:admin",
          businessCount: 2,
        },
        {
          organizationId: "org_restore_legacy",
          name: "Restore Heating & Cooling LLC",
          slug: "restore-heating-cooling-legacy",
          role: "org:admin",
          businessCount: 1,
        },
        {
          organizationId: "org_restore_duplicate",
          name: "Restore Heating & Cooling, L.L.C.",
          slug: "restore-heating-cooling-copy",
          role: "org:admin",
          businessCount: 1,
        },
        {
          organizationId: "org_localmap_ready",
          name: "LocalMap Operations",
          slug: "localmap-operations",
          role: "org:admin",
          businessCount: 3,
        },
        {
          organizationId: "org_localmap_legacy",
          name: "LocalMap Operations",
          slug: "localmap-operations-old",
          role: "org:admin",
          businessCount: 0,
        },
      ],
    });

    expect(options.map((option) => option.organizationId)).toEqual([
      "org_restore",
      "org_localmap_ready",
    ]);
  });

  it("keeps the active workspace so a user can see that setup is incomplete", () => {
    const options = selectWorkspaceOptions({
      activeOrganizationId: "org_empty",
      memberships: [
        {
          organizationId: "org_empty",
          name: "New workspace",
          slug: "new-workspace",
          role: "org:admin",
          businessCount: 0,
        },
        {
          organizationId: "org_ready",
          name: "Ready workspace",
          slug: "ready-workspace",
          role: "org:member",
          businessCount: 1,
        },
      ],
    });

    expect(options).toHaveLength(2);
    expect(options[0]).toMatchObject({
      organizationId: "org_empty",
      setupComplete: false,
    });
  });
});
