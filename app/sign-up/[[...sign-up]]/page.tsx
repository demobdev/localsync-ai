import { SignUp } from "@clerk/nextjs";

import { AuthShell } from "@/components/brand/auth-shell";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ scan?: string; audit?: string; auditId?: string }>;
}) {
  const { scan, audit, auditId: auditIdParam } = await searchParams;
  const scanId = scan && UUID_RE.test(scan) ? scan : null;
  const auditCandidate = audit ?? auditIdParam;
  const auditId =
    auditCandidate && UUID_RE.test(auditCandidate) ? auditCandidate : null;

  // Audit wins over scan — it carries richer prefill data.
  const redirectUrl = auditId
    ? `/dashboard/onboarding?auditId=${auditId}&intent=fix`
    : scanId
      ? `/dashboard/onboarding?scan=${scanId}`
      : undefined;

  const helper = auditId ? (
    <p className="max-w-sm text-center text-sm text-muted-foreground">
      Your audit report is saved. Create an account and we&apos;ll pre-fill your
      business profile and start fixing the leaks it found.
    </p>
  ) : scanId ? (
    <p className="max-w-sm text-center text-sm text-muted-foreground">
      Your scan results are saved. Create an account and we&apos;ll pre-fill your
      business profile from them.
    </p>
  ) : null;

  return (
    <AuthShell helper={helper}>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        forceRedirectUrl={redirectUrl}
      />
    </AuthShell>
  );
}
