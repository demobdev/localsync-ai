import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GoogleConnectionStatus } from "./google-connection-status";

function render(state: Parameters<typeof GoogleConnectionStatus>[0]["state"]) {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(<GoogleConnectionStatus state={state} />);
  return container;
}

describe("Google connection status", () => {
  it("gives disconnected accounts a full-page OAuth link", () => {
    const view = render({ status: "not_connected" });
    expect(view.querySelector("a")?.getAttribute("href")).toBe("/api/connectors/google");
    expect(view.textContent).not.toContain("OAuth succeeded");
  });
  it("does not label an expired authorization as a working connection", () => {
    const view = render({ status: "connected", locations: [], fetchError: { code: "unauthenticated", message: "Reconnect to authorize again." } });
    expect(view.textContent).toContain("Reconnect your Google account");
    expect(view.textContent).toContain("Authorization needs attention");
    expect(view.textContent).not.toContain("Google account connected");
    expect(view.textContent).not.toContain("OAuth succeeded");
    expect(view.querySelector("a")?.getAttribute("href")).toBe("/api/connectors/google");
  });
  it("distinguishes an empty managed-account response from API failure", () => {
    const empty = render({ status: "connected", locations: [] });
    expect(empty.textContent).toContain("No Business Profile locations found");
    const blocked = render({ status: "connected", locations: [], fetchError: { code: "api_disabled", message: "Enable the API." } });
    expect(blocked.textContent).toContain("API activation needed");
    expect(blocked.textContent).not.toContain("No Business Profile locations found");
  });
  it("does not initiate OAuth when configuration is absent", () => {
    const view = render({ status: "not_configured" });
    expect(view.textContent).toContain("Google OAuth not configured");
    expect(view.querySelector("a")).toBeNull();
  });
});
