import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AuditReport } from "@/lib/grader/types";

import { GraderReportGate } from "./report-gate";

vi.mock("@/components/grader/brief-reveal", () => ({
  BriefReveal: ({ onComplete }: { onComplete: () => void }) => (
    <button onClick={onComplete}>Complete brief</button>
  ),
}));
vi.mock("./report-view", () => ({
  GraderReport: ({ report }: { report: AuditReport }) => <div>Report {report.id}</div>,
}));

const report = {
  id: "audit-1",
  leadCaptured: false,
  websiteUrl: null,
  scanSnapshot: { warnings: ["Missing description"] },
} as AuditReport;

function gate(overrides: Partial<AuditReport> = {}, signedIn = false) {
  return (
    <GraderReportGate
      report={{ ...report, ...overrides }}
      signedIn={signedIn}
      dashboardHref="/dashboard"
      fixHref="/fix"
    />
  );
}

let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  sessionStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
  container.remove();
  vi.restoreAllMocks();
});

async function render(element = gate()) {
  await act(async () => {
    root ??= createRoot(container);
    root.render(element);
  });
}

describe("GraderReportGate session reveal", () => {
  it("hydrates the server report before showing an unseen brief without mismatches", async () => {
    const readStorage = vi.spyOn(Storage.prototype, "getItem");
    container.innerHTML = renderToString(gate());
    expect(container.textContent).toBe("Report audit-1");
    expect(readStorage).not.toHaveBeenCalled();

    const onRecoverableError = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, gate(), { onRecoverableError });
    });
    expect(container.textContent).toBe("Complete brief");
    expect(onRecoverableError).not.toHaveBeenCalled();

    await act(async () => container.querySelector("button")!.click());
    expect(sessionStorage.getItem("grader-revealed:audit-1")).toBe("1");
    expect(container.textContent).toBe("Report audit-1");
  });

  it("keeps previously revealed reports visible after hydration", async () => {
    sessionStorage.setItem("grader-revealed:audit-1", "1");
    container.innerHTML = renderToString(gate());
    const onRecoverableError = vi.fn();
    await act(async () => {
      root = hydrateRoot(container, gate(), { onRecoverableError });
    });
    expect(container.textContent).toBe("Report audit-1");
    expect(onRecoverableError).not.toHaveBeenCalled();
  });

  it.each([
    { overrides: { leadCaptured: true }, signedIn: false },
    { overrides: {}, signedIn: true },
    { overrides: { scanSnapshot: undefined }, signedIn: false },
  ])("skips the brief when it is not eligible (%j)", async ({ overrides, signedIn }) => {
    await render(gate(overrides, signedIn));
    expect(container.textContent).toBe("Report audit-1");
  });

  it("shows the report directly when storage reads fail", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    await render();
    expect(container.textContent).toBe("Report audit-1");
  });

  it("dismisses the brief even when storage writes fail and checks a new audit separately", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage unavailable");
    });
    await render();
    await act(async () => container.querySelector("button")!.click());
    expect(container.textContent).toBe("Report audit-1");

    await render(gate({ id: "audit-2" }));
    expect(container.textContent).toBe("Complete brief");
  });
});
