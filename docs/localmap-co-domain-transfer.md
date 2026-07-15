# localmap.co → LocalMap platform transfer

Scraped with Firecrawl (Jul 15, 2026). Domain `localmap.co` points at this app.

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

## After DNS cutover

1. Point `localmap.co` (and www) to this Vercel project.
2. Set `NEXT_PUBLIC_APP_URL=https://localmap.co`.
3. Update Google OAuth redirect URIs + consent screen privacy/homepage URLs.
4. Redirect legacy paths if needed: `/privacy-policy` → `/privacy`, `/terms-conditions` → `/terms`.
