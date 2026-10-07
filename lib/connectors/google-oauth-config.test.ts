import { describe, expect, it } from "vitest";
import { buildGoogleRedirectUri } from "./google-oauth-config";

describe("Google callback configuration", () => {
  it("matches the verified production origin", () => {
    expect(
      buildGoogleRedirectUri("https://app.localmap.co/", "production"),
    ).toBe("https://app.localmap.co/api/connectors/google/callback");
  });
  it("matches the dev script port", () => {
    expect(buildGoogleRedirectUri(undefined, "development")).toBe(
      "http://localhost:3002/api/connectors/google/callback",
    );
  });
  it("retains explicitly configured HTTPS preview origins", () => {
    expect(buildGoogleRedirectUri("https://localsync-preview.vercel.app", "production")).toBe("https://localsync-preview.vercel.app/api/connectors/google/callback");
  });
  it("does not silently use localhost in production", () => {
    expect(() => buildGoogleRedirectUri(undefined, "production")).toThrow();
  });
  it.each([
    "https://app.localmap.co/path",
    "https://app.localmap.co?x=1",
    "https://user:pass@app.localmap.co",
    "http://app.localmap.co",
    "https://app.localmap.co#x",
  ])("rejects malformed origins: %s", (origin) => {
    expect(() => buildGoogleRedirectUri(origin, "production")).toThrow();
  });
});
