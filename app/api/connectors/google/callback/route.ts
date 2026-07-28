import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { locations } from "@/db/schema";
import {
  exchangeGoogleCode,
  saveGoogleCredentials,
} from "@/lib/connectors/google";
import {
  connectMatchingSearchConsoleProperty,
  syncSearchConsolePerformance,
} from "@/lib/search-intelligence/search-console";

export async function GET(request: Request) {
  const session = await auth();
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (!session.userId || !session.orgId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (error || !code) {
    return NextResponse.redirect(
      new URL(`/dashboard/connect/google?error=${error ?? "missing_code"}`, request.url),
    );
  }

  type SearchOAuthState = {
    kind: "search";
    orgId: string;
    locationId: string;
  };
  let searchState: SearchOAuthState | null = null;
  if (state) {
    try {
      const parsed = JSON.parse(
        Buffer.from(state, "base64url").toString("utf8"),
      ) as SearchOAuthState;
      if (parsed?.kind === "search") searchState = parsed;
    } catch {
      searchState = null;
    }
  }

  if (
    state !== session.orgId &&
    (!searchState || searchState.orgId !== session.orgId)
  ) {
    return NextResponse.redirect(
      new URL("/dashboard/connect/google?error=state_mismatch", request.url),
    );
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    await saveGoogleCredentials(session.orgId, tokens);
    if (searchState) {
      const db = getDb();
      const [location] = await db
        .select({ profile: locations.profile })
        .from(locations)
        .where(
          and(
            eq(locations.id, searchState.locationId),
            eq(locations.organizationId, session.orgId),
          ),
        )
        .limit(1);
      if (!location?.profile.website) {
        throw new Error("Location website is missing");
      }
      await connectMatchingSearchConsoleProperty({
        organizationId: session.orgId,
        locationId: searchState.locationId,
        website: location.profile.website,
      });
      await syncSearchConsolePerformance({
        organizationId: session.orgId,
        locationId: searchState.locationId,
      });
    }
  } catch (exchangeError) {
    console.error("[google-oauth] exchange failed", exchangeError);
    return NextResponse.redirect(
      new URL("/dashboard/connect/google?error=exchange_failed", request.url),
    );
  }

  if (searchState) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/locations/${searchState.locationId}/search?connected=1`,
        request.url,
      ),
    );
  }
  return NextResponse.redirect(
    new URL("/dashboard/connect/google?connected=1", request.url),
  );
}
