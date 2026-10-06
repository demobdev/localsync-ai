import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GbpLocation } from "@/lib/connectors/google";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const mocks = vi.hoisted(() => ({
  import: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));
vi.mock("@/app/actions/google-import", () => ({
  importGbpFieldsAction: mocks.import,
  pushGbpFieldsAction: mocks.push,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("sonner", () => ({
  toast: { success: mocks.success, error: mocks.error, info: vi.fn() },
}));
vi.mock("@/components/ui/select", () => ({
  Select: ({
    items,
    value,
    onValueChange,
    disabled,
  }: {
    items: Array<{ value: string; label: string }>;
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onValueChange(event.target.value)}
    >
      {items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  ),
  SelectContent: () => null,
  SelectItem: () => null,
  SelectTrigger: () => null,
  SelectValue: () => null,
}));
import { GoogleImportFlow } from "./google-import-flow";

const gbp: GbpLocation = {
  gbpName: "locations/123",
  gbpAccountName: "accounts/456",
  title: "Owner's Box",
  regularHours: {},
  categories: [],
  verification: {
    status: "verified",
    label: "Verified",
    hasVoiceOfMerchant: true,
    hasBusinessAuthority: true,
    action: "none",
  },
};
const target = {
  id: "business-1",
  name: "Owner's Box",
  profile: { ...EMPTY_LOCATION_PROFILE, name: "Owner's Box" },
};
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  mocks.import.mockResolvedValue({
    linked: true,
    changed: false,
    verified: true,
    listingVerified: true,
    mismatchedFields: [],
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
async function render(
  targets: Parameters<typeof GoogleImportFlow>[0]["targetLocations"] = [target],
  places: GbpLocation[] = [gbp],
) {
  await act(async () =>
    root.render(
      <GoogleImportFlow gbpLocations={places} targetLocations={targets} />,
    ),
  );
}
function button(text: string) {
  return [...container.querySelectorAll("button")].find(
    (node) => node.textContent === text,
  )!;
}
function continueLink() {
  return [...container.querySelectorAll("a")].find(
    (node) => node.textContent === "Continue to listings",
  );
}

describe("confirmation next step", () => {
  it("replaces repeat confirmation with persistent step 4 and an explicit business listings link", async () => {
    await render();
    await act(async () => button("Confirm this listing").click());
    expect(container.textContent).toContain("Step 4 of 4");
    expect(container.textContent).toContain("Listing confirmed");
    expect(button("Confirm this listing")).toBeUndefined();
    expect(continueLink()?.getAttribute("href")).toBe(
      "/dashboard/locations/business-1/listings",
    );
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("restores completion from the saved publisher link on a fresh mount", async () => {
    await render([
      {
        ...target,
        linkedGoogleName: "accounts/456/locations/123",
        googleLinkConfirmed: true,
      },
    ]);
    expect(continueLink()).toBeDefined();
    expect(mocks.import).not.toHaveBeenCalled();
  });
  it("uses refreshed verification status instead of a stale success result", async () => {
    await render();
    await act(async () => button("Confirm this listing").click());
    await render(
      [
        {
          ...target,
          linkedGoogleName: "accounts/456/locations/123",
          googleLinkConfirmed: true,
        },
      ],
      [{ ...gbp, verification: undefined }],
    );
    expect(container.textContent).toContain(
      "Google ownership verification still needs attention",
    );
    expect(continueLink()).toBeDefined();
  });
  it("drops transient confirmation when a refreshed saved link points elsewhere", async () => {
    await render();
    await act(async () => button("Confirm this listing").click());
    await render([
      {
        ...target,
        linkedGoogleName: "accounts/456/locations/999",
        googleLinkConfirmed: true,
      },
    ]);
    expect(continueLink()).toBeUndefined();
    expect(button("Confirm this listing")).toBeDefined();
  });
  it.each([
    "ownership_conflict",
    "guidelines_issue",
    "needs_verification",
    "unknown",
  ] as const)(
    "does not advise waiting for actionable status %s",
    async (status) => {
      await render(
        [
          {
            ...target,
            linkedGoogleName: "accounts/456/locations/123",
            googleLinkConfirmed: true,
          },
        ],
        [{ ...gbp, verification: { ...gbp.verification!, status } }],
      );
      expect(container.textContent).toContain(
        "verification still needs attention",
      );
      expect(container.textContent).not.toContain(
        "verification is still pending",
      );
    },
  );
  it("does not reuse another business's saved confirmation", async () => {
    await render([
      {
        ...target,
        linkedGoogleName: "accounts/456/locations/999",
        googleLinkConfirmed: true,
      },
    ]);
    expect(continueLink()).toBeUndefined();
    expect(button("Confirm this listing")).toBeDefined();
  });
  it("clearly distinguishes saved link from pending Google verification", async () => {
    mocks.import.mockResolvedValue({ linked: true, verified: false });
    await render();
    await act(async () => button("Confirm this listing").click());
    expect(container.textContent).toContain(
      "Google ownership verification still needs attention",
    );
    expect(continueLink()).toBeDefined();
  });
  it("guards same-tick repeated clicks and shows loading", async () => {
    let finish!: (value: unknown) => void;
    mocks.import.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    await act(async () => {
      const confirm = button("Confirm this listing");
      confirm.click();
      confirm.click();
    });
    expect(mocks.import).toHaveBeenCalledTimes(1);
    expect(button("Confirming listing…").disabled).toBe(true);
    expect(
      [...container.querySelectorAll("select")].every(
        (select) => select.disabled,
      ),
    ).toBe(true);
    await act(async () => finish({ linked: true, verified: true }));
    expect(continueLink()).toBeDefined();
  });
  it("keeps errors visible and permits a safe retry", async () => {
    mocks.import.mockRejectedValueOnce(new Error("Could not save listing"));
    await render();
    await act(async () => button("Confirm this listing").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toBe(
      "Could not save listing",
    );
    expect(continueLink()).toBeUndefined();
    await act(async () => button("Try confirming again").click());
    expect(continueLink()).toBeDefined();
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
  it("does not claim confirmation when the server could not save the publisher link", async () => {
    mocks.import.mockResolvedValue({ linked: false, verified: true });
    await render();
    await act(async () => button("Confirm this listing").click());
    expect(continueLink()).toBeUndefined();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "could not be saved",
    );
  });
  it("clears selection-specific success when another business is selected", async () => {
    await render([target, { ...target, id: "business-2" }]);
    await act(async () => button("Confirm this listing").click());
    await act(async () => {
      const select = container.querySelectorAll("select")[1];
      select.value = "business-2";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(continueLink()).toBeUndefined();
    expect(container.textContent).toContain("Step 3 of 4");
  });
});

describe("import/save progression", () => {
  it("shows a persistent next action after a partial save without writing to Google", async () => {
    mocks.import.mockResolvedValue({
      linked: true,
      changed: true,
      fieldCount: 1,
      verified: false,
      mismatchedFields: ["phone"],
    });
    await render([target], [{ ...gbp, phone: "8645550101" }]);
    await act(async () => button("Select all differences").click());
    await act(async () => button("Use Google for 1 field").click());
    expect(container.textContent).toContain("Saved to your Master Profile");
    expect(container.textContent).toContain("1 difference still need review");
    expect(continueLink()).toBeDefined();
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("shows production-safe returned errors with a refresh action", async () => {
    mocks.import.mockResolvedValue({
      error: "Google's data changed since this page loaded.",
    });
    await render([target], [{ ...gbp, phone: "8645550101" }]);
    await act(async () => button("Select all differences").click());
    await act(async () => button("Use Google for 1 field").click());
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "data changed",
    );
    expect(button("Refresh Google data")).toBeDefined();
    expect(continueLink()).toBeUndefined();
  });
  it("permits linking an unsupported-hours listing without importing or flattening those hours", async () => {
    mocks.import.mockResolvedValue({ linked: true, verified: false });
    await render(
      [target],
      [
        {
          ...gbp,
          hoursImportWarning: "Split hours need separate review",
          hoursDisplay: "Monday 09:00–12:00 · Monday 14:00–18:00",
        },
      ],
    );
    await act(async () =>
      button("Link listing without importing hours").click(),
    );
    expect(mocks.import).toHaveBeenCalledWith(
      expect.objectContaining({ fields: [], linkOnly: true }),
    );
    expect(continueLink()).toBeDefined();
    expect(mocks.push).not.toHaveBeenCalled();
  });
});
