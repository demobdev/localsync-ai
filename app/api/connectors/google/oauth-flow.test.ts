// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GOOGLE_OAUTH_COOKIE } from "@/lib/connectors/google-oauth-state";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), configured: vi.fn(), authUrl: vi.fn(), exchange: vi.fn(), save: vi.fn(),
  select: vi.fn(), where: vi.fn(), limit: vi.fn(), connectSearch: vi.fn(), syncSearch: vi.fn(),
}));
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/lib/connectors/google", () => ({
  isGoogleConfigured: mocks.configured,
  getGoogleAuthUrl: mocks.authUrl,
  exchangeGoogleCode: mocks.exchange,
  saveGoogleCredentials: mocks.save,
  SEARCH_CONSOLE_SCOPE: "https://www.googleapis.com/auth/webmasters.readonly",
}));
vi.mock("@/db", () => ({ getDb: () => ({ select: mocks.select }) }));
vi.mock("@/db/schema", () => ({ locations: { id: "location.id", organizationId: "location.orgId", profile: "profile" } }));
vi.mock("drizzle-orm", () => ({
  and: (...conditions: unknown[]) => conditions,
  eq: (column: unknown, value: unknown) => ({ column, value }),
}));
vi.mock("@/lib/search-intelligence/search-console", () => ({
  connectMatchingSearchConsoleProperty: mocks.connectSearch,
  syncSearchConsolePerformance: mocks.syncSearch,
}));
import { GET as startGoogle } from "./route";
import { GET as startSearch } from "./search-console/route";
import { GET as callback } from "./callback/route";

const origin = "https://app.localmap.co";
const session = { userId: "user-1", orgId: "org-1", sessionId: "session-1" };
const tokens = { access_token: "mock-access", refresh_token: "mock-refresh", expires_in: 3600, scope: "business.manage" };
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-only-secret");
  mocks.auth.mockResolvedValue(session);
  mocks.configured.mockReturnValue(true);
  mocks.authUrl.mockImplementation((state: string) => `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`);
  mocks.exchange.mockResolvedValue(tokens);
  mocks.save.mockResolvedValue(undefined);
  mocks.where.mockReturnValue({ limit: mocks.limit });
  mocks.select.mockReturnValue({ from: () => ({ where: mocks.where }) });
  mocks.limit.mockResolvedValue([{ id: "location-1", profile: { website: "https://example.com" } }]);
  vi.spyOn(console, "error").mockImplementation(() => {});
  // No code path in these tests may make a real request to Google or a database.
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Unexpected live request"); }));
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function target(response: Response) { return new URL(response.headers.get("location")!); }
async function begin(search = false) {
  const response = search
    ? await startSearch(new Request(`${origin}/api/connectors/google/search-console?locationId=location-1`))
    : await startGoogle(new Request(`${origin}/api/connectors/google`));
  return { state: target(response).searchParams.get("state")!, cookie: response.cookies.get(GOOGLE_OAUTH_COOKIE)!.value, response };
}
function returning(attempt: { state: string; cookie?: string }, params: Record<string, string> = { code: "mock-code" }) {
  const url = new URL(`${origin}/api/connectors/google/callback`);
  url.searchParams.set("state", attempt.state);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return new NextRequest(url, { headers: attempt.cookie ? { cookie: `${GOOGLE_OAUTH_COOKIE}=${attempt.cookie}` } : {} });
}
function expectFailure(response: Awaited<ReturnType<typeof callback>>, error: string) {
  expect(target(response).pathname).toBe("/dashboard/connect/google");
  expect(target(response).searchParams.get("error")).toBe(error);
  expect(response.cookies.get(GOOGLE_OAUTH_COOKIE)?.maxAge).toBe(0);
  expect(response.headers.get("cache-control")).toBe("no-store");
}

describe("Google connect initiation", () => {
  it.each(["userId", "orgId", "sessionId"])("requires %s before starting OAuth", async (field) => {
    mocks.auth.mockResolvedValue({ ...session, [field]: null });
    const response = await startGoogle(new Request(`${origin}/api/connectors/google`));
    expect(target(response).pathname).toBe("/sign-in");
    expect(mocks.authUrl).not.toHaveBeenCalled();
  });
  it("reports missing configuration instead of attempting authorization", async () => {
    mocks.configured.mockReturnValue(false);
    const response = await startGoogle(new Request(`${origin}/api/connectors/google`));
    expect(target(response).searchParams.get("error")).toBe("not_configured");
    expect(mocks.authUrl).not.toHaveBeenCalled();
    expect(response.cookies.get(GOOGLE_OAUTH_COOKIE)).toBeUndefined();
  });
  it("sets a browser-bound nonce without requesting additional scopes", async () => {
    const { state, response } = await begin();
    expect(state).not.toBe(session.orgId);
    expect(mocks.authUrl).toHaveBeenCalledWith(state);
    expect(response.cookies.get(GOOGLE_OAUTH_COOKIE)).toMatchObject({ httpOnly: true, sameSite: "lax", maxAge: 600 });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("limits optional Search Console to an owned location and keeps its original scopes", async () => {
    const { state } = await begin(true);
    expect(mocks.where).toHaveBeenCalledWith([
      { column: "location.id", value: "location-1" }, { column: "location.orgId", value: "org-1" },
    ]);
    expect(mocks.authUrl).toHaveBeenCalledWith(state, [
      "https://www.googleapis.com/auth/business.manage", "https://www.googleapis.com/auth/webmasters.readonly",
    ]);
  });
  it("does not initiate Search Console without an owned location", async () => {
    mocks.limit.mockResolvedValue([]);
    const response = await startSearch(new Request(`${origin}/api/connectors/google/search-console?locationId=other`));
    expect(target(response).pathname).toBe("/dashboard/locations");
    expect(mocks.authUrl).not.toHaveBeenCalled();
  });
  it("gives Search Console an actionable configuration error", async () => {
    mocks.configured.mockReturnValue(false);
    const response = await startSearch(new Request(`${origin}/api/connectors/google/search-console?locationId=location-1`));
    expect(target(response).searchParams.get("error")).toBe("not_configured");
    expect(mocks.select).not.toHaveBeenCalled();
  });
});

describe("Google OAuth callback workflow (all external services mocked)", () => {
  it("saves the authorized workspace credentials, clears state, and returns to the import workflow", async () => {
    const attempt = await begin();
    const response = await callback(returning(attempt));
    expect(mocks.exchange).toHaveBeenCalledWith("mock-code");
    expect(mocks.save).toHaveBeenCalledWith("org-1", tokens);
    expect(target(response).pathname + target(response).search).toBe("/dashboard/connect/google?connected=1");
    expect(response.cookies.get(GOOGLE_OAUTH_COOKIE)?.maxAge).toBe(0);
    expect(mocks.connectSearch).not.toHaveBeenCalled();
  });
  it("sends an expired session to sign-in without using the returned code", async () => {
    const attempt = await begin();
    mocks.auth.mockResolvedValue({ userId: null, orgId: null, sessionId: null });
    const response = await callback(returning(attempt));
    expect(target(response).pathname).toBe("/sign-in");
    expect(response.cookies.get(GOOGLE_OAUTH_COOKIE)?.maxAge).toBe(0);
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it.each(["userId", "orgId", "sessionId"])("rejects callback after %s changed", async (key) => {
    const attempt = await begin();
    mocks.auth.mockResolvedValue({ ...session, [key]: "changed" });
    expectFailure(await callback(returning(attempt)), "state_mismatch");
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("rejects legacy workspace-only state, unsigned Search Console JSON, missing cookie and stale tabs", async () => {
    const first = await begin();
    const second = await begin();
    for (const attempt of [
      { ...first, state: session.orgId },
      { ...first, state: Buffer.from(JSON.stringify({ kind: "search", orgId: "org-1", locationId: "location-1" })).toString("base64url") },
      { state: first.state },
      { state: first.state, cookie: second.cookie },
    ]) {
      expectFailure(await callback(returning(attempt)), "state_mismatch");
    }
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it.each([
    [{ error: "access_denied" }, "access_denied"],
    [{ error: "untrusted&connected=1" }, "authorization_failed"],
    [{}, "missing_code"],
  ] as const)("handles interrupted or denied consent: %j", async (params, reason) => {
    const attempt = await begin();
    const response = await callback(returning(attempt, params));
    expectFailure(response, reason);
    expect(target(response).searchParams.get("connected")).toBeNull();
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it("fails safely if configuration disappears during consent", async () => {
    const attempt = await begin();
    mocks.configured.mockReturnValue(false);
    expectFailure(await callback(returning(attempt)), "not_configured");
    expect(mocks.exchange).not.toHaveBeenCalled();
  });
  it("does not save after token exchange fails or log provider details", async () => {
    const attempt = await begin();
    mocks.exchange.mockRejectedValue(new Error("sensitive-provider-response"));
    expectFailure(await callback(returning(attempt)), "exchange_failed");
    expect(mocks.save).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith("[google-oauth] token exchange failed");
  });
  it("distinguishes persistence failure from token exchange failure", async () => {
    const attempt = await begin();
    mocks.save.mockRejectedValue(new Error("database unavailable"));
    expectFailure(await callback(returning(attempt)), "save_failed");
  });
  it("retains the optional Search Console sync and location-specific success route", async () => {
    const attempt = await begin(true);
    const response = await callback(returning(attempt));
    expect(mocks.save).toHaveBeenCalledWith("org-1", tokens);
    expect(mocks.connectSearch).toHaveBeenCalledWith({ organizationId: "org-1", locationId: "location-1", website: "https://example.com" });
    expect(mocks.syncSearch).toHaveBeenCalledWith({ organizationId: "org-1", locationId: "location-1" });
    expect(target(response).pathname + target(response).search).toBe("/dashboard/locations/location-1/search?connected=1");
    expect(response.cookies.get(GOOGLE_OAUTH_COOKIE)?.maxAge).toBe(0);
  });
  it("rechecks Search Console location ownership before exchanging or storing credentials", async () => {
    const attempt = await begin(true);
    mocks.limit.mockResolvedValue([]);
    expectFailure(await callback(returning(attempt)), "search_location_unavailable");
    expect(mocks.where).toHaveBeenLastCalledWith([
      { column: "location.id", value: "location-1" }, { column: "location.orgId", value: "org-1" },
    ]);
    expect(mocks.exchange).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });
  it.each(["website", "property", "sync"])("does not call successful Google auth an exchange failure when Search Console %s fails", async (failure) => {
    const attempt = await begin(true);
    if (failure === "website") mocks.limit.mockResolvedValue([{ profile: {} }]);
    if (failure === "property") mocks.connectSearch.mockRejectedValue(new Error("no property"));
    if (failure === "sync") mocks.syncSearch.mockRejectedValue(new Error("sync unavailable"));
    expectFailure(await callback(returning(attempt)), "search_setup_failed");
    expect(mocks.save).toHaveBeenCalledWith("org-1", tokens);
  });
});
