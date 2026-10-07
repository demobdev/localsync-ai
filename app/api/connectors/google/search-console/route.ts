import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { locations } from "@/db/schema";
import {
  getGoogleAuthUrl,
  isGoogleConfigured,
  SEARCH_CONSOLE_SCOPE,
} from "@/lib/connectors/google";
import {
  createGoogleOAuthAttempt,
  GOOGLE_OAUTH_COOKIE,
  googleOAuthCookieOptions,
} from "@/lib/connectors/google-oauth-state";

export async function GET(request: Request) {
  const session = await auth();
  if (!session.userId || !session.orgId || !session.sessionId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  const locationId = new URL(request.url).searchParams.get("locationId");
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard/connect/google?error=not_configured", request.url),
    );
  }
  if (!locationId) {
    return NextResponse.redirect(new URL("/dashboard/locations", request.url));
  }
  const db = getDb();
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.organizationId, session.orgId),
      ),
    )
    .limit(1);
  if (!location) {
    return NextResponse.redirect(new URL("/dashboard/locations", request.url));
  }

  const attempt = createGoogleOAuthAttempt(
    { userId: session.userId, orgId: session.orgId, sessionId: session.sessionId },
    { kind: "search", locationId },
  );
  const response = NextResponse.redirect(
    getGoogleAuthUrl(attempt.state, [
      "https://www.googleapis.com/auth/business.manage",
      SEARCH_CONSOLE_SCOPE,
    ]),
  );
  response.cookies.set(GOOGLE_OAUTH_COOKIE, attempt.cookie, googleOAuthCookieOptions());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
