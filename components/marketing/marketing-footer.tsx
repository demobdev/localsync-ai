import Link from "next/link";
import { LocalMapLogo } from "@/components/brand/localmap-logo";
import { COMPANY } from "@/lib/brand/company";

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/15 bg-[#062f3a] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr] lg:px-8">
        <div>
          <Link href="/" aria-label="LocalMap home"><LocalMapLogo tone="light" /></Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75">One business profile. Clear next steps for every listing. Evidence of what changed.</p>
          <a href={`mailto:${COMPANY.emailDevelopment}`} className="mt-4 inline-block text-sm text-white/80 underline-offset-4 hover:underline">{COMPANY.emailDevelopment}</a>
        </div>
        <nav aria-label="Footer navigation" className="grid grid-cols-2 content-start gap-x-6 gap-y-4 text-sm text-white/80">
          {[["/products/listings", "Listings"], ["/pricing", "Pricing"], ["/grader", "Free business check"], ["/contact", "Contact"], ["/privacy", "Privacy"], ["/terms", "Terms"], ["/sign-in", "Sign in"]].map(([href, label]) => <Link key={href} href={href} className="hover:text-white">{label}</Link>)}
        </nav>
        <p className="text-xs text-white/60 md:col-span-2">© {new Date().getFullYear()} {COMPANY.shortBrand} · {COMPANY.legalName}.</p>
      </div>
    </footer>
  );
}
