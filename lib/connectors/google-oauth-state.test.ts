// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createGoogleOAuthAttempt,
  googleOAuthCookieOptions,
  readGoogleOAuthAttempt,
} from "./google-oauth-state";

const session = { userId: "user-1", orgId: "org-1", sessionId: "session-1" };
beforeEach(() => {
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "test-only-secret");
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-06T12:00:00Z"));
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("Google OAuth attempt binding", () => {
  it("uses unique opaque nonces and round-trips the browser/session-bound destination", () => {
    const first = createGoogleOAuthAttempt(session);
    const second = createGoogleOAuthAttempt(session);
    expect(first.state).toMatch(/^[\w-]{43}$/);
    expect(first.state).not.toContain(session.orgId);
    expect(first.state).not.toEqual(second.state);
    expect(readGoogleOAuthAttempt(first.state, first.cookie, session)).toMatchObject({
      ...session, kind: "business", nonce: first.state,
    });
    expect(readGoogleOAuthAttempt(first.state, second.cookie, session)).toBeNull();
  });
  it("preserves the optional Search Console destination privately", () => {
    const attempt = createGoogleOAuthAttempt(session, { kind: "search", locationId: "location-1" });
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie, session)).toMatchObject({
      kind: "search", locationId: "location-1",
    });
  });
  it.each(["userId", "orgId", "sessionId"] as const)("rejects a changed %s", (key) => {
    const attempt = createGoogleOAuthAttempt(session);
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie, { ...session, [key]: "other" })).toBeNull();
  });
  it("rejects missing, forged, or modified state and cookies", () => {
    const attempt = createGoogleOAuthAttempt(session);
    expect(readGoogleOAuthAttempt(null, attempt.cookie, session)).toBeNull();
    expect(readGoogleOAuthAttempt(attempt.state, undefined, session)).toBeNull();
    expect(readGoogleOAuthAttempt("org-1", attempt.cookie, session)).toBeNull();
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie + ".extra", session)).toBeNull();
    expect(readGoogleOAuthAttempt(attempt.state, "malformed", session)).toBeNull();
    const [payload, mac] = attempt.cookie.split(".");
    const forged = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    forged.kind = "search";
    forged.locationId = "other-business";
    const forgedCookie = `${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${mac}`;
    expect(readGoogleOAuthAttempt(attempt.state, forgedCookie, session)).toBeNull();
  });
  it("expires at ten minutes even if the client keeps the cookie", () => {
    const attempt = createGoogleOAuthAttempt(session);
    vi.advanceTimersByTime(10 * 60 * 1000 - 1);
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie, session)).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie, session)).toBeNull();
  });
  it("fails closed if configuration disappears or changes", () => {
    const attempt = createGoogleOAuthAttempt(session);
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "different-test-secret");
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie, session)).toBeNull();
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "");
    expect(readGoogleOAuthAttempt(attempt.state, attempt.cookie, session)).toBeNull();
  });
  it("keeps the cookie short-lived, HttpOnly and compatible with Google's cross-site redirect", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(googleOAuthCookieOptions()).toEqual({
      httpOnly: true, secure: true, sameSite: "lax", path: "/api/connectors/google", maxAge: 600,
    });
    vi.stubEnv("NODE_ENV", "development");
    expect(googleOAuthCookieOptions().secure).toBe(false);
  });
});
