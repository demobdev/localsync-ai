import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/connectors/google";

export async function GET(request: Request) {
  const session = await auth();

  if (!session.userId || !session.orgId) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/dashboard/import/google?error=not_configured", request.url),
    );
  }

  return NextResponse.redirect(getGoogleAuthUrl(session.orgId));
}
