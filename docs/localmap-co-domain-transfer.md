# localmap.co → LocalMap platform transfer

Historical migration notes from a Firecrawl scrape on Jul 15, 2026. The production app base verified in Vercel on **2026-10-06** is **`https://app.localmap.co`**; these notes do not establish the current apex / www DNS routing.

## What the old site offered

| Area | Old site | Morph into this app |
| --- | --- | --- |
| Brand | Local Map Co. / Get Found Online | Logo + `lib/brand/company.ts` + metadata |
| Legal entity | Midas Holdings LLC, Greenville SC | Privacy + Terms |
| Contact | (888) 418-7335, development@ / accounts@ | `/contact`, footer |
| Agency services | Web, SEO, PPC, social, retargeting, chat, multimedia, reputation | `/about` heritage; DFY still via contact |
| Managed SEO shop | Compass $250 · Atlas $500 · Globe $1000 · Galaxy $2500 (all include listing management) | Documented on `/about`; SaaS SKUs stay $19/$49/$79 |
| Free audit | Marketing audit form | `/grader` |
| Client portal | joinportal.com | Link retained on `/contact` until cutover |
| Legal URLs | `/privacy-policy`, `/terms-conditions` | `/privacy`, `/terms` (update OAuth consent when domain cuts over) |

## Pages shipped for cutover

- `/privacy`, `/terms` — SaaS-updated from legacy LMC policies
- `/about` — agency → platform story + stats + testimonials
- `/contact` — Greenville office + phones/emails
- Shared `MarketingFooter` with legal + product links

## Current app base and future DNS cutovers

1. Keep production `NEXT_PUBLIC_APP_URL=https://app.localmap.co`, matching the verified Vercel configuration. The old proposal to use the bare `https://localmap.co` base is superseded.
2. The expected production Google OAuth redirect is **`https://app.localmap.co/api/connectors/google/callback`**. Development uses **`http://localhost:3002/api/connectors/google/callback`**. Verify the registered values on the deployed OAuth client; this document does not claim Console settings were checked or changed.
3. Before any future domain change, verify apex / www routing and explicitly coordinate the app base, Google redirect URIs, and consent-screen homepage / privacy URLs. Do not change OAuth or DNS settings as part of a documentation correction.
4. Retain or add legacy path redirects as needed for an authorized cutover: `/privacy-policy` → `/privacy`, `/terms-conditions` → `/terms`.

Owner's Box is the current GBP / demo business. The approved Google Cloud project is `localsync-501521` / `249394741886`; the business identity does not rename the platform or its OAuth app. See [GBP approval and remaining verification](./gbp-api-request.md).
