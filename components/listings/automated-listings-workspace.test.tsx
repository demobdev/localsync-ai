import { act, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AutomatedListingsWorkspace } from "./automated-listings-workspace";
import { EMPTY_LOCATION_PROFILE } from "@/lib/types/location-profile";

const { refresh, saveUrl, runAudit, discover, createTasks, success, error } = vi.hoisted(() => ({
  refresh: vi.fn(), saveUrl: vi.fn(), runAudit: vi.fn(), discover: vi.fn(),
  createTasks: vi.fn(), success: vi.fn(), error: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));
vi.mock("@/app/actions/audits", () => ({
  updateListingUrlAction: saveUrl,
  startAuditAction: runAudit,
  discoverListingUrlsAction: discover,
}));
vi.mock("@/app/actions/tasks", () => ({ createChecklistTasksAction: createTasks }));
vi.mock("sonner", () => ({ toast: { success, error, info: vi.fn() } }));

type Props = ComponentProps<typeof AutomatedListingsWorkspace>;
const profile = { ...EMPTY_LOCATION_PROFILE, name: "Cedar Heating" };
const googleRow: Props["publisherRows"][number] = {
  id: "google-row", publisherId: "google", publisherName: "Google Business Profile",
  publisherSlug: "google-business-profile", rail: "api", isCore: true,
  status: "synced", listingUrl: null, externalId: "accounts/a/locations/listing-1",
  lastCheckedAt: new Date("2026-10-06T12:00:00Z"),
};
const yelpRow = {
  ...googleRow, id: "yelp-row", publisherId: "yelp", publisherName: "Yelp",
  publisherSlug: "yelp", rail: "audit_only", externalId: null, lastCheckedAt: null,
};
const bbbRow = {
  ...yelpRow, id: "bbb-row", publisherId: "bbb", publisherName: "Better Business Bureau",
  publisherSlug: "bbb", rail: "manual",
};
const facebookRow = {
  ...yelpRow, id: "facebook-row", publisherId: "facebook", publisherName: "Facebook",
  publisherSlug: "facebook",
};
const googleLocation = {
  gbpName: "locations/listing-1", title: profile.name, regularHours: {}, categories: [],
  verification: {
    status: "verified" as const, label: "Verified on Google", hasVoiceOfMerchant: true,
    hasBusinessAuthority: true, action: "none" as const,
  },
};
const defaults: Props = {
  locationId: "business-1", profile,
  publisherRows: [googleRow, yelpRow, bbbRow, facebookRow], auditRuns: [],
  googleState: { status: "connected", locations: [googleLocation] },
  profileScore: 40, listingConsistencyScore: 0, listingHealthScore: 40, canSync: true,
};
const yelpUrl = "https://www.yelp.com/biz/cedar-heating";
const bbbUrl = "https://www.bbb.org/us/ca/profile/cedar-heating";
const facebookUrl = "https://www.facebook.com/cedar-heating";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  saveUrl.mockResolvedValue(undefined);
  runAudit.mockResolvedValue({ status: "completed", score: { auditScore: 25 } });
  discover.mockResolvedValue({ filled: [], scannedWebsite: "https://cedar.example" });
  createTasks.mockResolvedValue([]);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.resetAllMocks();
});

async function render(overrides: Partial<Props> = {}) {
  await act(async () => root.render(<AutomatedListingsWorkspace {...defaults} {...overrides} />));
}

function button(label: string) {
  const found = Array.from(container.querySelectorAll("button")).find((item) => item.textContent?.trim() === label);
  expect(found, `button: ${label}`).toBeDefined();
  return found!;
}

async function click(label: string, twice = false) {
  const target = button(label);
  await act(async () => {
    target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    if (twice) target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

function yelpInput() {
  return container.querySelector<HTMLInputElement>('input[placeholder="https://www.yelp.com/biz/your-business"]')!;
}

async function type(input: HTMLInputElement, value: string) {
  expect(input).toBeTruthy();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

describe("Minimal Google-first flow", () => {
  it("keeps the existing hero and four steps while offering Google before manual fields", async () => {
    await render({ profileScore: 0, googleState: { status: "not_connected" } });
    const hero = container.querySelector("section")!;
    expect(hero.querySelector("h2")?.textContent).toBe("One profile. One connection. No guesswork.");
    expect(hero.querySelector("a")?.textContent).toContain("Connect Google account");
    expect(hero.querySelector("a")?.getAttribute("href")).toBe("/dashboard/connect/google");
    expect(Array.from(hero.querySelectorAll("ol li p:first-child")).map((p) => p.textContent)).toEqual([
      "Master Profile", "Connect account", "Confirm listing", "Approve & verify",
    ]);
    expect(hero.textContent).toContain("Saving business facts updates LocalMap only");
    expect(hero.textContent).toContain("separate approval step");
  });

  it("reviews existing Google data before asking for missing profile fields", async () => {
    await render({ profileScore: 0, googleState: { status: "connected", locations: [{ ...googleLocation, phone: "555-0100" }] } });
    expect(container.querySelector("section a")?.textContent).toContain("Review & approve differences");
    expect(container.querySelector("section")?.textContent).not.toContain("Complete Master Profile");
    await render({ profileScore: 0 });
    expect(container.querySelector("section a")?.textContent).toContain("Complete Master Profile");
  });

  it("does not call a failed or stale Google read pending ownership verification", async () => {
    await render({ googleState: { status: "connected", locations: [googleLocation], fetchError: { code: "quota_exceeded", message: "Rate limit reached" } } });
    expect(container.querySelector("section a")?.textContent).toContain("Resolve Google access");
    expect(container.textContent).toContain("Connection error");
    expect(container.textContent).not.toContain("Live & synced");
    expect(container.textContent).not.toContain("Pending verification");
    await render({ googleState: { status: "connected", locations: [] } });
    expect(container.textContent).toContain("Listing unavailable");
    expect(container.textContent).not.toContain("Pending verification");
  });

  it("distinguishes unknown verification from an actual pending review", async () => {
    await render({ googleState: { status: "connected", locations: [{ ...googleLocation, verification: undefined }] } });
    expect(container.textContent).toContain("Verification unavailable");
    expect(container.textContent).not.toContain("Pending verification");
    await render({ googleState: { status: "connected", locations: [{ ...googleLocation, verification: {
      ...googleLocation.verification, status: "pending_review", label: "Google review pending", action: "wait_for_review",
    } }] } });
    expect(container.textContent).toContain("Pending verification");
    expect(container.textContent).toContain("Google review pending");
  });

  it("does not make empty optional directories urgent", async () => {
    await render();
    const attention = Array.from(container.querySelectorAll("p")).find((p) => p.textContent === "Needs attention")!;
    expect(attention.nextElementSibling?.textContent).toBe("0");
    await click("Show actions");
    expect(container.querySelector("#publisher-health")?.textContent).toContain("No publishers match this filter");
  });
});

describe("Saved URLs and resilient actions", () => {
  it("counts only saved URLs, then immediately reflects a successful save", async () => {
    await render();
    await click("Add audit-only listing");
    await type(yelpInput(), yelpUrl);
    expect(container.textContent).toContain("0 audit-only");
    await click("Connected");
    expect(container.querySelector("#publisher-health")?.textContent).not.toContain("Yelp");
    await click("Save URL");
    expect(container.textContent).toContain("1 audit-only");
    expect(container.querySelector("#publisher-health")?.textContent).toContain("Yelp");
    expect(button("Saved").disabled).toBe(true);
    expect(saveUrl).toHaveBeenCalledExactlyOnceWith({ locationId: "business-1", locationPublisherId: "yelp-row", listingUrl: yelpUrl, status: "pending" });
  });

  it("keeps a saved link configured when an unsaved edit clears it", async () => {
    await render({ publisherRows: [googleRow, { ...yelpRow, listingUrl: yelpUrl }] });
    await click("Add audit-only listing");
    await type(yelpInput(), "");
    expect(container.textContent).toContain("1 audit-only");
    expect(container.querySelector<HTMLAnchorElement>(`a[href="${yelpUrl}"]`)).toBeTruthy();
    await click("Remove");
    expect(container.textContent).toContain("0 audit-only");
  });

  it("blocks same-tick duplicate saves and releases the lock after a failure", async () => {
    const pending = deferred<void>();
    saveUrl.mockReturnValueOnce(pending.promise);
    await render();
    await click("Add audit-only listing");
    await type(yelpInput(), yelpUrl);
    await click("Save URL", true);
    expect(saveUrl).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("0 audit-only");
    await act(async () => pending.reject(new Error("Please retry")));
    expect(error).toHaveBeenCalledWith("Please retry");
    await click("Save URL");
    expect(saveUrl).toHaveBeenCalledTimes(2);
    expect(container.textContent).toContain("1 audit-only");
  });

  it("retains completed bulk saves and retries only failed or unattempted links", async () => {
    saveUrl.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("BBB save failed"));
    await render();
    await click("Add audit-only listing");
    const paste = container.querySelector<HTMLInputElement>("#audit-quick-paste")!;
    await type(paste, `${yelpUrl} ${bbbUrl} ${facebookUrl}`);
    await click("Match links");
    expect(saveUrl).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalledWith("BBB save failed");
    expect(container.textContent).toContain("1 audit-only");
    expect(button("Saved").disabled).toBe(true);
    expect(paste.value).toBe(`${bbbUrl} ${facebookUrl}`);
    expect(refresh).toHaveBeenCalledOnce();
    await click("Match links");
    expect(saveUrl).toHaveBeenCalledTimes(4);
    expect(saveUrl.mock.calls.slice(2).map(([input]) => input.listingUrl)).toEqual([bbbUrl, facebookUrl]);
    expect(container.textContent).toContain("3 audit-only");
    expect(paste.value).toBe("");
  });

  it("blocks repeated Enter submissions before React disables buttons", async () => {
    const pending = deferred<void>();
    saveUrl.mockReturnValueOnce(pending.promise);
    await render();
    await click("Add audit-only listing");
    const paste = container.querySelector<HTMLInputElement>("#audit-quick-paste")!;
    await type(paste, yelpUrl);
    await act(async () => {
      paste.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      paste.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(saveUrl).toHaveBeenCalledOnce();
    await act(async () => pending.resolve(undefined));
    expect(container.textContent).toContain("1 audit-only");
  });

  it("reports failed audits without success and blocks duplicate audit requests", async () => {
    const pending = deferred<{ status: string; score: { auditScore: number } }>();
    runAudit.mockReturnValueOnce(pending.promise);
    await render({ publisherRows: [googleRow, { ...yelpRow, listingUrl: yelpUrl }] });
    await click("Run audit-only check", true);
    expect(runAudit).toHaveBeenCalledOnce();
    await act(async () => pending.resolve({ status: "failed", score: { auditScore: 0 } }));
    expect(error).toHaveBeenCalledWith(expect.stringContaining("listing check failed"));
    expect(success).not.toHaveBeenCalled();
    await click("Run audit-only check");
    expect(runAudit).toHaveBeenCalledTimes(2);
    expect(success).toHaveBeenCalledWith(expect.stringContaining("Audit complete"));
  });

  it("deduplicates discovery and records discovered links as saved", async () => {
    const pending = deferred<{ filled: Array<{ publisherSlug: string; url: string }> }>();
    discover.mockReturnValueOnce(pending.promise);
    await render();
    await click("Add audit-only listing");
    await click("Find on website", true);
    expect(discover).toHaveBeenCalledOnce();
    await act(async () => pending.resolve({ filled: [{ publisherSlug: "yelp", url: yelpUrl }] }));
    expect(container.textContent).toContain("1 audit-only");
    expect(button("Saved").disabled).toBe(true);
  });

  it("deduplicates checklist task creation", async () => {
    const pending = deferred<unknown[]>();
    createTasks.mockReturnValueOnce(pending.promise);
    await render({ publisherRows: [googleRow, { ...yelpRow, listingUrl: yelpUrl }] });
    await click("Tasks", true);
    expect(createTasks).toHaveBeenCalledOnce();
    await act(async () => pending.resolve([]));
  });
});
