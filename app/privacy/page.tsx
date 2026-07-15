import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { LegalDocShell } from "@/components/marketing/legal-doc-shell";
import { COMPANY } from "@/lib/brand/company";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${COMPANY.brandName} (${COMPANY.domain}).`,
};

export default async function PrivacyPage() {
  const { userId } = await auth();

  return (
    <LegalDocShell
      signedIn={Boolean(userId)}
      title="Privacy Policy"
      updated="July 15, 2026"
    >
      <p>
        Protecting your private information is our priority. This Privacy Policy
        applies to <strong>{COMPANY.siteUrl}</strong> and the LocalMap local
        intelligence platform operated by{" "}
        <strong>{COMPANY.legalName}</strong> (“Local Map Co,” “we,” “us,” or
        “our”). By using the Platform, you consent to the practices described
        here.
      </p>

      <h2>1. Scope</h2>
      <p>
        This Policy covers personal information we collect when you visit our
        marketing site, create an account, run a visibility audit, connect
        publisher accounts (for example Google Business Profile), manage
        business locations, or purchase subscriptions.
      </p>

      <h2>2. Information we collect</h2>
      <p>Depending on how you use the Platform, we may collect:</p>
      <ul>
        <li>
          <strong>Account &amp; contact data</strong>: name, email, phone,
          company name, and authentication identifiers (including via our auth
          provider).
        </li>
        <li>
          <strong>Business profile data</strong>: NAP (name, address, phone),
          hours, categories, services, photos, website URLs, and related listing
          fields you enter or import.
        </li>
        <li>
          <strong>Connected account data</strong>: OAuth tokens and profile /
          location data from publishers you authorize (e.g. Google). We only
          request scopes needed to provide the features you enable.
        </li>
        <li>
          <strong>Billing data</strong>: processed by our payment providers; we
          do not store full card numbers on our servers.
        </li>
        <li>
          <strong>Usage &amp; device data</strong>: IP address, browser type,
          pages viewed, approximate location derived from IP, and diagnostic
          logs needed to operate and secure the Platform.
        </li>
      </ul>
      <p>
        We do not knowingly collect personal information from children under 13.
        If you believe a child has provided information, contact us and we will
        delete it.
      </p>

      <h2>3. How we use information</h2>
      <ul>
        <li>Provide, maintain, and improve the Platform and related services</li>
        <li>
          Sync, audit, and display business listings across publishers you
          connect
        </li>
        <li>Process payments and manage subscriptions</li>
        <li>Send service, security, and (with consent where required) product
          communications</li>
        <li>Detect abuse, enforce Terms, and comply with law</li>
      </ul>

      <h2>4. Sharing</h2>
      <p>
        We do not sell, rent, or lease customer lists. We share information with:
      </p>
      <ul>
        <li>
          <strong>Service providers</strong> who process data for us (hosting,
          authentication, database, email, analytics, payments, background jobs)
          under contractual confidentiality obligations
        </li>
        <li>
          <strong>Publishers and APIs</strong> you explicitly connect, solely to
          perform the actions you request
        </li>
        <li>
          <strong>Legal / safety</strong> when required by law or to protect
          rights, property, or safety
        </li>
      </ul>

      <h2>5. Cookies and similar technologies</h2>
      <p>
        We use cookies and similar technologies for authentication, preferences,
        security, and understanding product usage. You can control cookies in
        your browser; disabling some cookies may limit Platform features.
      </p>

      <h2>6. Security</h2>
      <p>
        We use industry-standard measures including encryption in transit (TLS /
        SSL) and access controls. No method of transmission or storage is 100%
        secure; you acknowledge residual risk inherent to internet services.
      </p>

      <h2>7. Retention &amp; deletion</h2>
      <p>
        We retain information as long as your account is active or as needed to
        provide services, meet legal obligations, resolve disputes, and enforce
        agreements. Subject to exceptions under applicable law (including CCPA
        where applicable), you may request deletion of personal information by
        contacting {COMPANY.emailPrivacy}.
      </p>

      <h2>8. Third-party links &amp; connected accounts</h2>
      <p>
        The Platform may link to third-party sites or let you connect third-party
        accounts. Their privacy practices are governed by their own policies. You
        can disconnect integrations from your LocalMap dashboard where available.
      </p>

      <h2>9. International transfers</h2>
      <p>
        We may process and store information in the United States and other
        countries where we or our providers operate.
      </p>

      <h2>10. Changes</h2>
      <p>
        We may update this Policy. Material changes will be posted on this page
        with an updated date, and we may notify account holders by email when
        appropriate. Continued use after changes constitutes acceptance.
      </p>

      <h2>11. Contact</h2>
      <p>
        {COMPANY.legalName}
        <br />
        {COMPANY.address.street}
        <br />
        {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}
        <br />
        Email: {COMPANY.emailPrivacy}
        <br />
        Phone: {COMPANY.phoneDisplay}
      </p>
      <p>
        Effective for the Platform at {COMPANY.domain}. Prior versions applied to
        the previous Local Map Co. ecommerce / agency site at the same domain.
      </p>
    </LegalDocShell>
  );
}
