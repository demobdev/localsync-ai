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
2. Create project: `localsync-ai` (or your production name)
3. Enable billing on the project

### 2. Enable required APIs

In **APIs & Services → Library**, enable:

- **Google Business Profile API** (Business Profile Performance / Account Management APIs as listed in current Google docs)
- **Google My Business Account Management API**
- **Google My Business Business Information API**
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

Google periodically changes the exact form, but the flow is:

1. Open the [Google Business Profile API documentation](https://developers.google.com/my-business/content/overview)
2. Follow the **"Request access"** or **quota request** link in the current docs
3. Provide:
   - Company name and website
   - App description: *"LocalSync AI helps home-services businesses maintain a canonical master business profile, audit listing consistency, and sync approved changes to Google Business Profile."*
   - Expected QPM / daily quota (start modest: read import + limited writes per location)
   - OAuth client ID
   - Screenshot or short Loom of master profile editor (after Sprint 1 UI exists)

### 6. Track status

| Status | Action |
|--------|--------|
| Submitted | Note date in your project tracker |
| Testing mode | Use test GBP accounts only |
| Approved | Move OAuth app to **Production** and store approval email |
| Rejected | Revise use case; emphasize read-only import + user-approved writes |

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

- [ ] Google Cloud project created (separate from Restore)
- [ ] GBP-related APIs enabled
- [ ] OAuth consent screen configured
- [ ] OAuth client created with callback URLs
- [ ] Quota / access request submitted
- [ ] Approval date tracked (target: before Phase 2 Sprint 4)
