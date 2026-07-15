import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@clerk/nextjs/server";

import { LegalDocShell } from "@/components/marketing/legal-doc-shell";
import { COMPANY } from "@/lib/brand/company";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `Terms of Use for ${COMPANY.brandName} (${COMPANY.domain}).`,
};

export default async function TermsPage() {
  const { userId } = await auth();

  return (
    <LegalDocShell
      signedIn={Boolean(userId)}
      title="Terms of Use"
      updated="July 15, 2026"
    >
      <p>
        <strong>THE LOCAL MAP PLATFORM TERMS OF USE</strong>
      </p>
      <p>
        This is an agreement (“Agreement”) between {COMPANY.legalName} (“Local
        Map Co,” “we,” “us,” or “our”), operator of {COMPANY.siteUrl} and the
        LocalMap local intelligence platform (collectively the “Platform”), and
        you (“you” or “user”). By accessing, registering for, or purchasing
        access to the Platform, you agree to this Agreement and our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not
        use the Platform.
      </p>
      <p>
        <strong>
          PLEASE BE AWARE THAT THESE TERMS INCLUDE ARBITRATION AND CLASS ACTION
          WAIVER PROVISIONS THAT MAY AFFECT YOUR RIGHTS.
        </strong>
      </p>

      <h2>1. Accounts</h2>
      <p>
        You must provide accurate information, be at least 18 years old, and keep
        credentials confidential. If you register for a company, you represent
        you are authorized to bind that company. Notify us promptly of any
        unauthorized use at {COMPANY.emailAccounts}.
      </p>

      <h2>2. License</h2>
      <p>
        Subject to payment where required and compliance with this Agreement, we
        grant you a personal, non-exclusive, revocable, limited license to access
        the Platform. You receive no ownership interest in the Platform. We may
        suspend or revoke access for breach, misuse, or risk to our systems or
        business.
      </p>

      <h2>3. Services: listings, audits, and related tools</h2>
      <p>
        The Platform provides tools to manage local business identity, audit and
        sync listings across publishers, track visibility, manage reputation
        workflows, and related automation. Publisher results depend on third-party
        policies, APIs, and market factors outside our control.{" "}
        <strong>We do not guarantee rankings, placement, traffic, leads, or
        revenue.</strong> Features labeled as audit-only, guided, or manual may
        not write to a publisher. Approve-first workflows mean changes may require
        your confirmation before going live.
      </p>
      <p>
        Agency services historically offered by Local Map Co. (SEO packages,
        creative, ads management, and similar) may still be sold under separate
        statements of work; those engagements are governed by their own order
        forms in addition to these Terms where they use the Platform.
      </p>

      <h2>4. Your obligations</h2>
      <ul>
        <li>
          Provide timely access, credentials, and accurate business data needed
          to deliver features you enable
        </li>
        <li>
          Do not scrape, reverse engineer, overload, or attack the Platform
        </li>
        <li>
          Do not use the Platform for unlawful, misleading, or infringing
          activity
        </li>
        <li>
          Do not share login access except as enabled by team/org features
        </li>
        <li>
          Ensure you have rights to any content or business data you upload
        </li>
      </ul>

      <h2>5. User content</h2>
      <p>
        You retain ownership of content you submit. You grant Local Map Co. a
        worldwide, non-exclusive, royalty-free license to host, process, display,
        and transmit that content solely to operate the Platform and provide
        requested services (including syncing to publishers you connect). You
        also grant a perpetual license to use feedback to improve the Platform.
      </p>

      <h2>6. Payments, renewals, and refunds</h2>
      <p>
        Paid subscriptions renew automatically until cancelled through your
        billing dashboard or by contacting {COMPANY.emailAccounts}. Prices may
        change with notice; rejecting a price increase may limit access. Except
        where required by law or expressly stated in a written satisfaction
        guarantee for a specific service,{" "}
        <strong>purchases are non-refundable</strong>. Third-party ad spend (e.g.
        Google Ads) paid to publishers is never refundable by us.
      </p>

      <h2>7. Intellectual property</h2>
      <p>
        “Local Map Co.”, “LocalMap”, {COMPANY.domain}, and related marks and
        Platform materials are owned by or licensed to {COMPANY.legalName}. All
        rights not expressly granted are reserved.
      </p>

      <h2>8. Disclaimer</h2>
      <p>
        THE PLATFORM AND ALL SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE”
        WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        WE DO NOT WARRANT UNINTERRUPTED OR ERROR-FREE OPERATION.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOCAL MAP CO. AND ITS OFFICERS,
        DIRECTORS, EMPLOYEES, AND AGENTS ARE NOT LIABLE FOR INDIRECT, INCIDENTAL,
        SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS,
        DATA, OR BUSINESS. OUR TOTAL LIABILITY FOR CLAIMS ARISING OUT OF THE
        PLATFORM SHALL NOT EXCEED THE AMOUNTS YOU PAID US FOR THE PLATFORM IN THE
        SIX (6) MONTHS BEFORE THE CLAIM. SOME JURISDICTIONS DO NOT ALLOW CERTAIN
        LIMITATIONS; IN THOSE CASES OUR LIABILITY IS LIMITED TO THE FULLEST
        EXTENT PERMITTED.
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You will defend and indemnify Local Map Co. against claims arising from
        your use of the Platform, your content, your violation of this Agreement,
        or your violation of third-party rights.
      </p>

      <h2>11. Governing law &amp; disputes</h2>
      <p>
        This Agreement is governed by the laws of the State of{" "}
        {COMPANY.address.state}, without regard to conflict-of-law rules. Except
        for claims seeking injunctive relief or IP ownership disputes, disputes
        shall be resolved by confidential binding arbitration in Greenville, SC
        under the AAA Commercial Rules, on an individual basis only.{" "}
        <strong>no class or representative actions</strong>. Claims must be filed
        within one (1) year after they arise.
      </p>

      <h2>12. Termination</h2>
      <p>
        You may cancel anytime via billing settings or by contacting us. We may
        terminate or suspend access for breach, unlawful use, or risk to the
        Platform. Upon termination, access may end immediately; we are not
        obligated to retain or export your data except as required by law or our
        Privacy Policy.
      </p>

      <h2>13. Changes</h2>
      <p>
        We may amend these Terms by posting an updated version with a new “Last
        updated” date. Continued use after the effective date constitutes
        acceptance. If you do not agree, stop using the Platform.
      </p>

      <h2>14. Contact</h2>
      <p>
        {COMPANY.legalName}
        <br />
        {COMPANY.address.street}
        <br />
        {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}
        <br />
        {COMPANY.phoneDisplay} · {COMPANY.emailAccounts}
      </p>
      <p>
        California users: complaints may also be directed to the California
        Department of Consumer Affairs, Division of Consumer Services, 1625 North
        Market Blvd., Sacramento, CA 95834, (800) 952-5210.
      </p>
    </LegalDocShell>
  );
}
