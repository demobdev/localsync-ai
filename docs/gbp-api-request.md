# Google Business Profile API access request

Submit this on **day 1** of Sprint 1. Approval often takes **2–6 weeks**, and write sync in Phase 2 depends on it.

## Why this is manual

Google reviews GBP API access against your business identity, use case, and quota needs. Cursor cannot submit this for you.

## Prerequisites

1. A Google account tied to your business
2. A Google Cloud project for LocalSync AI (separate from any Restore project)
3. A verified Google Business Profile for your company (or design partner)
4. A privacy policy URL and public app homepage (`NEXT_PUBLIC_APP_URL`)

## Steps

### 1. Create a Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Create project: `localsync` (project ID `localsync-501521` under org `localmap.co`)
3. Enable billing on the project

### 2. Enable required APIs

In **APIs & Services → Library**, enable:

- **Google Business Profile API** (Business Profile Performance / Account Management APIs as listed in current Google docs)
- **Google My Business Account Management API**
- **Google My Business Business Information API**
- **My Business Verifications API** — Voice of Merchant + verification status (enable now; works once quota is approved)
- **Places API (New)** — for audit validation in Sprint 2

### 3. Configure OAuth consent screen

1. Go to **APIs & Services → OAuth consent screen**
2. User type: **External** (unless you are Google Workspace only)
3. App name: `LocalSync AI`
4. Support email: your business email
5. Authorized domains: your production domain (e.g. `localsync.ai`)
6. Scopes (read-only first):
   - `https://www.googleapis.com/auth/business.manage` (read for import; write later in Phase 2)
7. Add test users while in **Testing** mode

### 4. Create OAuth credentials

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Authorized redirect URIs:
   - `http://localhost:3000/api/connectors/google/callback` (dev)
   - `https://YOUR_DOMAIN/api/connectors/google/callback` (prod)
4. Save `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env.local`

### 5. Request GBP API quota / access

This is a **separate form** — not Google Cloud Support Cases.

1. Open the [GBP API contact form](https://support.google.com/business/contact/api_default)
2. From the dropdown, select **Application for Basic API Access** (not "Quota Increase" or product support)
3. Fill the form using the copy in **Application copy (below)** — submitted via Gift a Story dogfood, July 2026
4. Save the confirmation email Google sends — that is your only "case" reference

#### Application copy (Gift a Story dogfood — July 2026)

Use for project **`684836511110`** (GCP project tied to this submission).

| Field | Value |
|-------|-------|
| **Google Cloud project number** | `684836511110` |
| **Company website** | `https://gift-a-story-mvp.vercel.app/` |
| **How did you hear about this API access form?** | Google Business Profile API documentation while setting up API access for our local business management platform. |
| **What is the primary reason for seeking access?** | We are building LocalSync, an AI-powered local business management platform for agencies and small businesses. We need Google Business Profile API access to test and develop core workflows including syncing business profile data, managing location information, monitoring profile changes, creating posts/updates, and supporting review workflows. Initial use is for internal development and dogfooding with our own test accounts before onboarding customer accounts. |

**Internal note (do not put in the form):**

- **Dogfood case study:** Gift a Story — AI book generation company; using LocalSync to build/monitor online presence while we develop the platform.
- **Website:** Primary domain lapsed (renewal pending). Vercel staging URL is the active deployment for now. **TODO:** renew domain and update GBP + form/resubmit if Google asks for production URL later.
- **Platform prod URL:** `https://localsync-ai.vercel.app` (LocalMap app); Gift a Story is the GBP-linked business for this application.

### 6. Track status

| Status | Action |
|--------|--------|
| Submitted | Note date in your project tracker |
| Testing mode | Use test GBP accounts only |
| Approved | Move OAuth app to **Production** and store approval email |
| Rejected | Revise use case; emphasize read-only import + user-approved writes |

#### How to check your Basic API Access request

**Important:** GBP API access is **not** tracked in Google Cloud **Support → Cases**. That page is for paid technical support — your plan is Basic (billing-only), so it will stay empty. The Cloud Storage "Known Issue" in your console is unrelated.

Use these instead:

1. **Check API quota (most reliable in-console signal)**
   - [APIs & Services → Enabled APIs](https://console.cloud.google.com/apis/dashboard) for project **`localsync`**
   - Open **Google My Business Account Management API**
   - Click **Quotas & System Limits** (or **IAM & Admin → Quotas**, filter `mybusiness`)
   - **0 QPM** = not approved yet
   - **300 QPM** = approved (Google's default Basic access)

2. **Email confirmation**
   After submitting the [GBP API contact form](https://support.google.com/business/contact/api_default), Google sends a confirmation to the email you used. Search inbox for "Business Profile API" or "Basic API Access". That email is your queue reference — it will **not** appear under Cloud Support → Cases.

3. **Live test in LocalMap**
   Dashboard → Connections → Google Business Profile → Connect
   - OAuth succeeds + **"API quota pending"** → still waiting
   - Locations load with verification badges → quota is live

4. **Prerequisites before applying** (Google auto-rejects if missing)
   - Verified Google Business Profile, **active 60+ days**
   - Website listed on that GBP
   - Submit as an email that is **owner/manager** on the profile
   - Include **Project number** from Cloud Console (project `localsync`, ID `localsync-501521`)

**Should you submit now?**

| Action | Do it now? |
|--------|------------|
| Submit **Application for Basic API Access** form | **Yes**, if you haven't yet — [submit here](https://support.google.com/business/contact/api_default). Select that exact dropdown option. |
| Enable APIs in GCP | **Mostly done** — Account Management, Business Information, Places enabled. Also enable **My Business Verifications API**. |
| Check Support → Cases | **No** — wrong place; will stay empty on Basic support. |
| Move OAuth consent to Production | **Wait** until quota shows 300 QPM. |
| Connect Google in the app | **Yes** — validates OAuth now; import works when quota flips. |

## What we can build before approval

- OAuth **read-only** import (Sprint 2) if test users + test listings are available
- Master profile editor and versioning (Sprint 1 — no Google dependency)
- Firecrawl audits of public listing URLs (Sprint 2)

## What requires approval

- Production-scale GBP **write** sync (Phase 2 Sprint 4)
- Automated review reply posting
- Bulk location updates beyond test quota

## Env vars to add after setup

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Checklist

- [x] Google Cloud project created (`localsync` / `localsync-501521`)
- [ ] GBP-related APIs enabled (including **Verifications API**)
- [ ] OAuth consent screen configured
- [ ] OAuth client created with callback URLs
- [ ] Quota / access request submitted via GBP contact form (Gift a Story / project `684836511110`, July 2026)
- [ ] Approval date tracked (target: before Phase 2 Sprint 4)
