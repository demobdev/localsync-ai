# Yext Product Page Funnels — Research Notes

**Purpose:** Structure notes from crawling yext.com product pages (July 2026) to model LocalMap's `/products/*` marketing pages. Structure only — copy is ours.

**Source pages (Firecrawl scrape):**

- [yext.com/platform/listings](https://www.yext.com/platform/listings)
- [yext.com/platform/reviews](https://www.yext.com/platform/reviews)
- [yext.com/platform/pages](https://www.yext.com/platform/pages)
- [Blog: Why AI citations matter more than clicks](https://www.yext.com/blog/why-ai-citations-matter-more-than-clicks)

**Related:** [pricing-and-offerings.md](./pricing-and-offerings.md), [yext-localmap-comparison.md](./yext-localmap-comparison.md)

---

## The shared funnel arc

Every Yext product page follows the same nine-beat template:

1. **Eyebrow + hero.** A short "agent" positioning eyebrow ("AI-Ready Distribution Agent — No Aggregator", "AI Reputation Agent", "Agentic Local Content Creation"), then an H1 that ties the product to AI search urgency ("Local Listings Management: AI-ready, everywhere that matters", "Reviews that rank you in AI search", "Local content built for GEO"). One-sentence subhead with a concrete mechanism claim. **Single CTA: "Get a demo."** Product screenshot beside it.
2. **Three-up proof strip.** Scale + trust claims immediately under the hero: "200+ direct integrations. 12M+ locations managed", "80+ platforms. One reputation agent. Zero missed signals", plus a compliance/enterprise line (RBAC, HIPAA, audit trails).
3. **Benefit-led feature tour.** 6–9 alternating sections. Each has a small category eyebrow ("Local Listings Management", "Review Generation", "AI Optimization"), an H5-weight benefit headline written as an outcome ("No aggregator. Updates live in seconds", "AI drafts. You approve. Always on-brand."), 1–2 sentences of body, and a screenshot. Never spec-sheet phrasing.
4. **AI-search thread throughout.** Every page repeats the same urgency story: discovery is shifting from blue links to AI answers; ChatGPT/Gemini/Perplexity have no dashboard to log into; they cite the ecosystem of listings/reviews/pages, so consistency = citations.
5. **Industry use cases.** Short 4-up vertical grid (Restaurants / Retail / Healthcare / Financial services) with one concrete field example each (menus, inventory, NPI numbers, advisor disclosures).
6. **Customer stat cards.** Three logo cards, each with one giant number ("85% growth in Google impressions", "374% increase in 5-star reviews", "53% higher CTR") linking to case studies.
7. **Long SEO FAQ.** 15–25 questions doing triple duty: SEO capture ("What are business listings?"), objection handling ("How is Yext different from SOCi/Uberall/Birdeye?"), and AI-education ("How can I manage my business info on ChatGPT?"). Security/enterprise questions close it out.
8. **Recommended resources.** 3 blog/report cards.
9. **Final CTA banner.** Restates the promise in one line + "Get a demo."

## Page-specific notes

| Page | Hero hook | Signature feature framing |
|------|-----------|---------------------------|
| Listings | "Distribution agent pushes verified data to 200+ publishers and LLMs. Google trusts it. ChatGPT cites it." | No-aggregator speed; Listings Verifier (detect/fix vs Knowledge Graph); 50+ fields; analytics by publisher; AI citation comparison vs competitors; 10k+ location scale; RBAC governance |
| Reviews | "Reviews that rank you in AI search" — reviews as *ranking signals*, not vanity | One dashboard for 80+ platforms; smart-routing review requests "to the platforms AI trusts most"; **"AI drafts. You approve. Always on-brand."** (identical to our approve-first angle); sentiment analysis at scale; competitor reputation benchmark |
| Pages | "Local content built for GEO. Published in minutes." | Schema markup by default "so AI reads your pages, not past them"; no-code templates at 1000s-of-pages scale; one Knowledge Graph change cascades everywhere; conversion widgets; page-level analytics |

## What we mirror vs invert for LocalMap

**Mirror (structure):** the nine-beat arc, category-eyebrow feature sections, outcome-phrased headlines, the AI-search urgency thread, vertical use cases, FAQ-as-objection-handling, final CTA banner.

**Invert (positioning):**

- Yext funnels to **"Get a demo"** (sales-led, hidden pricing). LocalMap funnels to **/sign-up and /scan** (self-serve) with visible pricing anchors linking to /pricing.
- Yext claims 200+ integrations without qualification. LocalMap leads with **honest rails** — every publisher labeled API / guided / manual / audit-only.
- Yext bundles verticals into $999/yr tiers. LocalMap sells **modular add-ons at $15/mo**.
- Yext's "AI drafts, you approve" appears once on Reviews; LocalMap makes **approve-first** a platform-wide principle on every page.
- Yext's stat cards are enterprise case studies; we substitute mechanism proof (what actually ships) since we don't have logos yet.
