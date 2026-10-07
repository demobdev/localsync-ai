import { describe, expect, it } from "vitest";
import { googleOAuthErrorMessage } from "./google-oauth-errors";

describe("Google OAuth error guidance", () => {
  it("explains canceled consent and security recovery without claiming credentials changed", () => {
    expect(googleOAuthErrorMessage("access_denied")).toContain("existing connection has not been changed");
    expect(googleOAuthErrorMessage("missing_code")).toContain("not completed");
    expect(googleOAuthErrorMessage("state_mismatch")).toContain("signed-in workspace");
  });
  it("separates configuration, exchange, storage, and optional Search Console failures", () => {
    expect(googleOAuthErrorMessage("not_configured")).toContain("OAuth client and callback URL");
    expect(googleOAuthErrorMessage("exchange_failed")).toContain("could not finish authorization");
    expect(googleOAuthErrorMessage("save_failed")).toContain("could not save");
    expect(googleOAuthErrorMessage("search_location_unavailable")).toContain("no longer available");
    expect(googleOAuthErrorMessage("search_setup_failed")).toContain("Google account is connected");
    expect(googleOAuthErrorMessage("search_setup_failed")).toContain("Search Intelligence page");
  });
  it("does not display arbitrary query-string or provider error content", () => {
    expect(googleOAuthErrorMessage("untrusted-token-or-content")).not.toContain("untrusted-token-or-content");
    expect(googleOAuthErrorMessage("authorization_failed")).toContain("Start a new connection attempt");
  });
});
