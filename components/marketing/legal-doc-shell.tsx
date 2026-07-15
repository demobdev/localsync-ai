import type { ReactNode } from "react";
import Link from "next/link";

import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { COMPANY } from "@/lib/brand/company";

export function LegalDocShell({
  signedIn,
  title,
  updated,
  children,
}: {
  signedIn: boolean;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <MarketingHeader signedIn={signedIn} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-300">
          {COMPANY.brandName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated {updated} · Operated by {COMPANY.legalName}
        </p>
        <div className="legal-doc mt-10 space-y-4 text-sm leading-relaxed text-foreground/90 [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold">
          {children}
        </div>
        <p className="mt-12 text-sm text-muted-foreground">
          Questions?{" "}
          <Link href="/contact" className="underline underline-offset-4">
            Contact us
          </Link>{" "}
          or email{" "}
          <a
            href={`mailto:${COMPANY.emailPrivacy}`}
            className="underline underline-offset-4"
          >
            {COMPANY.emailPrivacy}
          </a>
          .
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
