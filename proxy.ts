import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/scan(.*)",
  "/pricing(.*)",
  "/products(.*)",
  "/platform(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/l/(.*)",
  "/api/webhooks/clerk(.*)",
  "/api/inngest(.*)",
]);

const isOnboardingRoute = createRouteMatcher(["/dashboard/onboarding(.*)"]);

function nextWithPathname(req: Request, pathname: string) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (isPublicRoute(req)) {
    return nextWithPathname(req, pathname);
  }

  const session = await auth.protect();

  if (
    pathname.startsWith("/dashboard") &&
    !session.orgId &&
    !isOnboardingRoute(req)
  ) {
    return NextResponse.redirect(new URL("/dashboard/onboarding", req.url));
  }

  return nextWithPathname(req, pathname);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
