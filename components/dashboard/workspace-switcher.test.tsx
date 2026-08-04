import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspaceSwitcher } from "@/components/dashboard/workspace-switcher";

const setActive = vi.fn();

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@clerk/nextjs", () => ({
  useOrganization: () => ({
    organization: { id: "org_restore", name: "Restore Heating & Cooling" },
  }),
  useOrganizationList: () => ({
    isLoaded: true,
    setActive,
    userMemberships: {
      data: [
        {
          id: "membership_restore",
          role: "org:admin",
          organization: {
            id: "org_restore",
            name: "Restore Heating & Cooling",
          },
        },
        {
          id: "membership_operations",
          role: "org:member",
          organization: {
            id: "org_operations",
            name: "LocalMap Operations",
          },
        },
      ],
    },
  }),
}));

describe("WorkspaceSwitcher", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllMocks();
  });

  it("opens the authorized workspace menu without crashing", async () => {
    await act(async () => root.render(<WorkspaceSwitcher />));

    const trigger = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Switch workspace"),
    );

    expect(trigger).toBeDefined();

    await act(async () => {
      trigger?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.body.textContent).toContain("Authorized workspaces");
    expect(document.body.textContent).toContain("LocalMap Operations");
  });
});
