import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConnectionsHub } from "./connections-hub";
import { buildConnectionSteps, mergeSetupProgress } from "@/lib/profile/setup-workflow";

describe("Connections hub quota status", () => {
  it("does not count a hosted page or audit tool as an account connection", () => {
    const html = renderToStaticMarkup(
      <ConnectionsHub
        googleState={{ status: "connected", locations: [] }}
        setupProgress={null}
        primaryLocationId="business-1"
      />,
    );
    expect(html).toContain("Google account connected");
    expect(html).not.toMatch(/\d\/4 connected/);
    expect(html).toContain("Audit-only directories");
    expect(html).toContain("AI visibility page");
  });
  it("keeps the existing recommended list but puts reusable Google facts first", () => {
    const progress = mergeSetupProgress([
      { id: "profile-phone", phase: "profile", title: "Phone", description: "Missing", done: false, href: "/profile" },
      ...buildConnectionSteps({ locationId: "business-1", googleConnected: false, googleCanImport: true, listingUrlsConfigured: 0, auditRunsCompleted: 0 }),
    ]);
    const html = renderToStaticMarkup(<ConnectionsHub googleState={{ status: "not_connected" }} setupProgress={progress} primaryLocationId="business-1" />);
    const node = document.createElement("div");
    node.innerHTML = html;
    const steps = Array.from(node.querySelectorAll("ol li"), (item) => item.textContent);
    expect(steps[0]).toContain("Connect Google Business Profile");
    expect(steps[1]).toContain("Confirm listing and review differences");
    expect(steps[2]).toContain("Phone");
  });
  it("reports a rate or quota limit without implying pending approval", () => {
    const html = renderToStaticMarkup(
      <ConnectionsHub
        googleState={{
          status: "connected",
          locations: [],
          fetchError: { code: "quota_exceeded", message: "Rate limit reached" },
        }}
        setupProgress={null}
        primaryLocationId={null}
      />,
    );

    expect(html).toContain("Rate or quota limit reached");
    expect(html).toContain("does not mean API access is unapproved");
    expect(html).not.toMatch(/Quota pending|waiting on API approval|once Google approves/i);
  });
});
