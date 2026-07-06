# LocalMap Demo Guide (for Don)

**URL:** http://localhost:3002  
**What this is:** LocalMap OS — the local intelligence platform. LocalSync is the software engine; LocalMap is the agency + product brand.

---

## 30-second pitch

> LocalMap answers one question: *What does the internet know about your business?*  
> We unify identity (master profile), distribution (honest listing rails), intelligence (audits + AI visibility), and automation (recommend → approve → execute). The agency runs on it; the software sells standalone.

---

## Demo flow (5 minutes)

### 1. Landing page (`/`)

- Show **LocalMap** branding, teal palette, light/dark toggle (moon/sun, top right)
- Walk through **Four pillars**: Identity, Distribution, Intelligence, Automation
- Mention **agency flywheel**: import → audit → fix → AI assets → visibility → results

### 2. Sign in → Dashboard (`/dashboard`)

- **Command center** hero with quick actions
- Stat cards: clients, locations, publishers
- **Next actions** panel — the product lifecycle in plain language
- Toggle dark mode on mobile (hamburger menu top-left on phone)

### 3. Locations (`/dashboard/locations`)

- Create a client + location (HVAC use case — no Tim/Restore needed)
- Open location → **Master Business Profile** editor (NAP, hours, services, photos)

### 4. Listings & Audits (location → Listings tab)

- Add listing URLs per publisher
- Run audit → Firecrawl crawls, AI extracts NAP, compares to master profile
- View findings with severity + evidence

### 5. Google Import (`/dashboard/import/google`)

- OAuth connect flow (needs verified GBP on the Google account)
- Field-by-field diff/merge into master profile

---

## What’s built vs coming

| Shipped now | Next |
|-------------|------|
| Master profile + versioning | GBP write sync (after API approval) |
| Publisher registry (~20, honest rails) | Review monitoring + AI replies |
| Firecrawl listing audits | CallRail / CRM learning loop |
| AI visibility pages + scores + llms.txt | Agency bulk onboarding |
| FAQ drafts with approve-before-publish | IndexNow (set `INDEXNOW_KEY` in prod) |
| Google OAuth import scaffold | |
| Solo onboarding + smart routing | |

---

## GBP note (internal)

Google API access requires a **verified Business Profile** where your Google account is owner/manager, active 60+ days, with a website listed.

**Recommendation:** Create a LocalMap agency GBP (or use an existing LocalMap client listing) with `demo@blockbusters.tech` as manager — **not** Tim’s Restore account. Tim stays a future HVAC use case only.

---

## Scope boundaries

- **LocalMap** = agency + platform brand (this demo)
- **LocalSync** = the SaaS engine (repo name: `localsync-ai`)
- **Restore** = separate product, separate repo — do not mention in this pitch
- **Tim** = future design partner / HVAC use case — not involved yet

---

## Tech stack (if asked)

Next.js 16 · Drizzle + Neon · Clerk orgs · Inngest · Firecrawl · AI SDK · Vercel-native — no Redis/BullMQ, no fake syndication.
