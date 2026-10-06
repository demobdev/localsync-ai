import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const GOOGLE_OAUTH_COOKIE = "localsync_google_oauth";
const MAX_AGE_SECONDS = 10 * 60;

type Session = { userId: string; orgId: string; sessionId: string };
type Destination = { kind: "business" } | { kind: "search"; locationId: string };
type Attempt = Session & Destination & { nonce: string; createdAt: number };

export function googleOAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api/connectors/google",
    maxAge: MAX_AGE_SECONDS,
  };
}

function signature(payload: string) {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error("Google OAuth is not configured");
  return createHmac("sha256", secret)
    .update(`localsync-google-oauth:${payload}`)
    .digest("base64url");
}

function equal(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Only the random nonce is sent to Google. Workspace/session routing stays in
// a signed, short-lived, HttpOnly cookie on this app's origin.
export function createGoogleOAuthAttempt(
  session: Session,
  destination: Destination = { kind: "business" },
) {
  const attempt: Attempt = {
    ...session,
    ...destination,
    nonce: randomBytes(32).toString("base64url"),
    createdAt: Date.now(),
  };
  const payload = Buffer.from(JSON.stringify(attempt)).toString("base64url");
  return { state: attempt.nonce, cookie: `${payload}.${signature(payload)}` };
}

export function readGoogleOAuthAttempt(
  state: string | null,
  cookie: string | undefined,
  session: Session,
): Attempt | null {
  if (!state || !/^[\w-]{43}$/.test(state) || !cookie || cookie.length > 4096) return null;
  try {
    const [payload, mac, extra] = cookie.split(".");
    if (!payload || !mac || extra !== undefined || !equal(mac, signature(payload))) {
      return null;
    }
    const attempt: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!attempt || typeof attempt !== "object") return null;
    const value = attempt as Record<string, unknown>;
    if (
      typeof value.nonce !== "string" ||
      !/^[\w-]{43}$/.test(value.nonce) ||
      !equal(state, value.nonce) ||
      value.userId !== session.userId ||
      value.orgId !== session.orgId ||
      value.sessionId !== session.sessionId ||
      typeof value.createdAt !== "number" ||
      !Number.isSafeInteger(value.createdAt) ||
      value.createdAt > Date.now() ||
      Date.now() - value.createdAt >= MAX_AGE_SECONDS * 1000 ||
      (value.kind !== "business" && value.kind !== "search") ||
      (value.kind === "search" &&
        (typeof value.locationId !== "string" || !value.locationId))
    ) {
      return null;
    }
    return attempt as Attempt;
  } catch {
    return null;
  }
}
