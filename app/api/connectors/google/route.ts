import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/connectors/google";
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

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard/connect/google?error=not_configured", request.url),
    );
  }

  const attempt = createGoogleOAuthAttempt({
    userId: session.userId,
    orgId: session.orgId,
    sessionId: session.sessionId,
  });
  const response = NextResponse.redirect(getGoogleAuthUrl(attempt.state));
  response.cookies.set(GOOGLE_OAUTH_COOKIE, attempt.cookie, googleOAuthCookieOptions());
  response.headers.set("Cache-Control", "no-store");
  return response;
}
