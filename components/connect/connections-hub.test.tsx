import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ConnectionsHub } from "./connections-hub";

describe("Connections hub quota status", () => {
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
