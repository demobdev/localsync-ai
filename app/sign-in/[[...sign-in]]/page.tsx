import { SignIn } from "@clerk/nextjs";

import { ListingsAuthShell } from "@/components/brand/listings-auth-shell";

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
    <ListingsAuthShell mode="sign-in">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl={redirectUrl}
        />
    </ListingsAuthShell>
  );
}
