import { SignIn } from "@clerk/nextjs";

import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ scan?: string; audit?: string; auditId?: string }>;
}) {
  const { scan, audit, auditId: auditIdParam } = await searchParams;
  const scanId = scan && UUID_RE.test(scan) ? scan : null;
  const auditCandidate = audit ?? auditIdParam;
  const auditId =
    auditCandidate && UUID_RE.test(auditCandidate) ? auditCandidate : null;

  const redirectUrl = auditId
    ? `/dashboard/onboarding?auditId=${auditId}&intent=fix`
    : scanId
      ? `/dashboard/onboarding?scan=${scanId}`
      : undefined;

  return (
    <div className="localmap-mesh flex min-h-full flex-col">
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <LocalMapLogo />
        <ThemeToggle />
      </div>
      <div className="flex flex-1 items-center justify-center p-4 sm:p-6">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  );
}
