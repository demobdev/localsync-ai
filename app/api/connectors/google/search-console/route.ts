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

export async function GET(request: Request) {
  const session = await auth();
  if (!session.userId || !session.orgId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
  const locationId = new URL(request.url).searchParams.get("locationId");
  if (!locationId || !isGoogleConfigured()) {
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

  const state = Buffer.from(
    JSON.stringify({ kind: "search", orgId: session.orgId, locationId }),
  ).toString("base64url");
  return NextResponse.redirect(
    getGoogleAuthUrl(state, [
      "https://www.googleapis.com/auth/business.manage",
      SEARCH_CONSOLE_SCOPE,
    ]),
  );
}

