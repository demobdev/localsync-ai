import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  exchangeGoogleCode,
  saveGoogleCredentials,
} from "@/lib/connectors/google";

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

  if (state !== session.orgId) {
    return NextResponse.redirect(
      new URL("/dashboard/connect/google?error=state_mismatch", request.url),
    );
  }

  try {
    const tokens = await exchangeGoogleCode(code);
    await saveGoogleCredentials(session.orgId, tokens);
  } catch (exchangeError) {
    console.error("[google-oauth] exchange failed", exchangeError);
    return NextResponse.redirect(
      new URL("/dashboard/connect/google?error=exchange_failed", request.url),
    );
  }

  return NextResponse.redirect(
    new URL("/dashboard/connect/google?connected=1", request.url),
  );
}
