import Link from "next/link";

import { COMPANY } from "@/lib/brand/company";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="font-semibold tracking-tight text-foreground">
            {COMPANY.brandName}
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Local intelligence platform for listings, reputation, and AI
            discovery, built by the same Greenville team that has helped local
            brands get found since {COMPANY.foundedYear}.
          </p>
          <p className="text-sm text-muted-foreground">
            {COMPANY.address.city}, {COMPANY.address.state}
            <br />
            <a
              href={`tel:${COMPANY.phoneTel}`}
              className="underline-offset-4 hover:underline"
            >
              {COMPANY.phoneDisplay}
            </a>
            {" · "}
            <a
              href={`mailto:${COMPANY.emailDevelopment}`}
              className="underline-offset-4 hover:underline"
            >
              {COMPANY.emailDevelopment}
            </a>
          </p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
            <a
              href={COMPANY.social.bark}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Bark 5/5
            </a>
            <a
              href={COMPANY.social.facebook}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              Facebook
            </a>
            <a
              href={COMPANY.social.linkedin}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              LinkedIn
            </a>
            <a
              href={COMPANY.social.twitter}
              target="_blank"
              rel="noreferrer"
              className="underline-offset-4 hover:underline"
            >
              X
            </a>
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Product
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/products/listings" className="hover:underline">
                Listings
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:underline">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/grader" className="hover:underline">
                Free visibility audit
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                About
              </Link>
            </li>
            <li>
              <Link href="/reviews" className="hover:underline">
                Reviews
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Legal
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:underline">
                Terms of Use
              </Link>
            </li>
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            © {year} {COMPANY.brandName} · {COMPANY.legalName}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
