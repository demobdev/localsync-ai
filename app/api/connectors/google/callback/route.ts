import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { locations } from "@/db/schema";
import {
  exchangeGoogleCode,
  isGoogleConfigured,
  saveGoogleCredentials,
} from "@/lib/connectors/google";
import {
  GOOGLE_OAUTH_COOKIE,
  googleOAuthCookieOptions,
  readGoogleOAuthAttempt,
} from "@/lib/connectors/google-oauth-state";
import {
  connectMatchingSearchConsoleProperty,
  syncSearchConsolePerformance,
} from "@/lib/search-intelligence/search-console";

export async function GET(request: NextRequest) {
  const session = await auth();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  function redirect(path: string) {
    const response = NextResponse.redirect(new URL(path, request.url));
    // Retrying or returning in an old tab must start a fresh connection attempt.
    response.cookies.set(GOOGLE_OAUTH_COOKIE, "", {
      ...googleOAuthCookieOptions(),
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  }
  function failed(reason: string) {
    return redirect(`/dashboard/connect/google?error=${reason}`);
  }

  if (!session.userId || !session.orgId || !session.sessionId) {
    return redirect("/sign-in");
  }
  if (!isGoogleConfigured()) return failed("not_configured");

  const attempt = readGoogleOAuthAttempt(
    state,
    request.cookies.get(GOOGLE_OAUTH_COOKIE)?.value,
    { userId: session.userId, orgId: session.orgId, sessionId: session.sessionId },
  );
  if (!attempt) return failed("state_mismatch");

  // Never reflect arbitrary provider query-string content into app messages/URLs.
  if (error) return failed(error === "access_denied" ? "access_denied" : "authorization_failed");
  if (!code) return failed("missing_code");

  let website: string | undefined;
  if (attempt.kind === "search") {
    try {
      // Recheck ownership before exchanging or saving credentials; the location
      // could have been removed or moved while Google consent was open.
      const [location] = await getDb()
        .select({ profile: locations.profile })
        .from(locations)
        .where(
          and(
            eq(locations.id, attempt.locationId),
            eq(locations.organizationId, session.orgId),
          ),
        )
        .limit(1);
      if (!location) return failed("search_location_unavailable");
      website = location.profile.website;
    } catch {
      console.error("[google-oauth] Search Console location check failed");
      return failed("search_location_unavailable");
    }
  }

  let tokens: Awaited<ReturnType<typeof exchangeGoogleCode>>;
  try {
    tokens = await exchangeGoogleCode(code);
  } catch {
    // Provider errors can contain sensitive response details; keep logs generic.
    console.error("[google-oauth] token exchange failed");
    return failed("exchange_failed");
  }
  try {
    await saveGoogleCredentials(session.orgId, tokens);
  } catch {
    console.error("[google-oauth] credential save failed");
    return failed("save_failed");
  }

  if (attempt.kind === "search") {
    try {
      if (!website) throw new Error("Location website is missing");
      await connectMatchingSearchConsoleProperty({
        organizationId: session.orgId,
        locationId: attempt.locationId,
        website,
      });
      await syncSearchConsolePerformance({
        organizationId: session.orgId,
        locationId: attempt.locationId,
      });
    } catch {
      console.error("[google-oauth] Search Console setup failed after Google connected");
      return failed("search_setup_failed");
    }
    return redirect(
      `/dashboard/locations/${encodeURIComponent(attempt.locationId)}/search?connected=1`,
    );
  }
  return redirect("/dashboard/connect/google?connected=1");
}
