import { afterEach, describe, expect, it, vi } from "vitest";
import {
  exchangeGoogleCode,
  fetchGbpLocationsSafe,
  getGoogleAuthUrl,
  getRedirectUri,
  isGoogleConfigured,
} from "./google";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Google connection integration", () => {
  it("uses the shared callback in the authorization URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.localmap.co");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
    expect(
      new URL(getGoogleAuthUrl("test-state")).searchParams.get("redirect_uri"),
    ).toBe(getRedirectUri());
  });
  it("uses exactly the same callback for token exchange", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.localmap.co/");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ access_token: "test-token" }));
    vi.stubGlobal("fetch", fetchMock);
    const expected = new URL(getGoogleAuthUrl("test-state")).searchParams.get(
      "redirect_uri",
    );
    await exchangeGoogleCode("test-code");
    expect(fetchMock.mock.calls[0][1].body.get("redirect_uri")).toBe(expected);
  });
  it("reports invalid callback configuration before starting OAuth", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.localmap.co/path");
    vi.stubEnv("GOOGLE_CLIENT_ID", "test-client");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-secret");
    expect(isGoogleConfigured()).toBe(false);
  });
  it("surfaces a locations API failure rather than claiming an empty account", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ accounts: [{ name: "accounts/123" }] }),
        )
        .mockResolvedValueOnce(
          Response.json(
            { error: { status: "PERMISSION_DENIED" } },
            { status: 403 },
          ),
        ),
    );
    expect(await fetchGbpLocationsSafe("test-token")).toMatchObject({
      ok: false,
      error: { code: "permission_denied" },
    });
  });
  it("keeps the account parent alongside the v1 location name", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ accounts: [{ name: "accounts/123" }] }),
        )
        .mockResolvedValueOnce(
          Response.json({
            locations: [{ name: "locations/456", title: "Owner's Box" }],
          }),
        )
        .mockResolvedValueOnce(
          Response.json({
            hasVoiceOfMerchant: true,
            hasBusinessAuthority: true,
          }),
        ),
    );
    const result = await fetchGbpLocationsSafe("test-token");
    expect(result.ok && result.locations[0]).toMatchObject({
      gbpName: "locations/456",
      gbpAccountName: "accounts/123",
    });
  });
});

describe("Google account and location pagination", () => {
  it("includes later pages of accounts and locations", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: string) => {
      const url = new URL(input);
      if (url.hostname.includes("accountmanagement")) return Response.json(url.searchParams.has("pageToken") ? { accounts: [{ name: "accounts/2" }] } : { accounts: [{ name: "accounts/1" }], nextPageToken: "accounts-next" });
      if (url.hostname.includes("businessinformation")) {
        if (url.pathname.includes("accounts/2")) return Response.json({ locations: [{ name: "locations/3", title: "Third" }] });
        return Response.json(url.searchParams.has("pageToken") ? { locations: [{ name: "locations/2", title: "Second" }] } : { locations: [{ name: "locations/1", title: "First" }], nextPageToken: "locations-next" });
      }
      return Response.json({ hasVoiceOfMerchant: true, hasBusinessAuthority: true });
    });
    vi.stubGlobal("fetch", fetchMock);
    const result = await fetchGbpLocationsSafe("test-token");
    expect(result.ok && result.locations.map((location) => location.title)).toEqual(["First", "Second", "Third"]);
  });
});
