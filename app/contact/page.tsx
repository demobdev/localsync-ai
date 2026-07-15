import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/brand/company";

export const metadata: Metadata = {
  title: "Contact",
  description: `Contact ${COMPANY.brandName} in ${COMPANY.address.city}, ${COMPANY.address.state}. Call ${COMPANY.phoneDisplay} or email ${COMPANY.emailDevelopment}.`,
};

export default async function ContactPage() {
  const { userId } = await auth();

  return (
    <div className="flex min-h-full flex-col bg-background">
      <MarketingHeader signedIn={Boolean(userId)} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          {COMPANY.brandName}
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          Let&apos;s get in touch
        </h1>
        <p className="mt-3 text-muted-foreground">
          Platform questions, agency campaigns, or a free visibility audit.
          we&apos;re in Greenville and work with brands nationwide.
        </p>

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Office
            </p>
            <p>
              {COMPANY.legalName}
              <br />
              {COMPANY.address.street}
              <br />
              {COMPANY.address.city}, {COMPANY.address.state}{" "}
              {COMPANY.address.zip}
            </p>
            <p>{COMPANY.hours}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Reach us
            </p>
            <p>
              Phone:{" "}
              <a
                href={`tel:${COMPANY.phoneTel}`}
                className="underline underline-offset-4"
              >
                {COMPANY.phoneDisplay}
              </a>
            </p>
            <p>
              Email:{" "}
              <a
                href={`mailto:${COMPANY.emailDevelopment}`}
                className="underline underline-offset-4"
              >
                {COMPANY.emailDevelopment}
              </a>
            </p>
            <p>
              Billing / accounts:{" "}
              <a
                href={`mailto:${COMPANY.emailAccounts}`}
                className="underline underline-offset-4"
              >
                {COMPANY.emailAccounts}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button nativeButton={false} render={<Link href="/grader" />}>
            Run a free visibility audit
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href={`mailto:${COMPANY.emailDevelopment}`} />}
          >
            Email the team
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={
              <a href={COMPANY.clientPortal} target="_blank" rel="noreferrer" />
            }
          >
            Legacy client portal
          </Button>
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
