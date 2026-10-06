# Google Business Profile API access and OAuth setup

**Updated:** 2026-10-06

## Current status

**Basic API Access is approved for LocalSync's Google Cloud project. Do not submit another application because the app returns a quota error.**

| Item | Current record |
|-------|----------------|
| Chosen GBP / demo business | **Owner's Box** |
| Approved Google Cloud project ID | `localsync-501521` |
| Approved Google Cloud project number | `249394741886` |
| Approval date | **2026-10-06** |
| Google approval case | `1-3775000042082` |
| Default quota stated in approval | **300 queries per minute (QPM)**; live per-API limits still need Console verification |
| Production app base | `https://app.localmap.co` |

The approval record comes from Google's October 6 approval email. A read-only Vercel check confirmed production `NEXT_PUBLIC_APP_URL=https://app.localmap.co` and the presence of protected `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` entries. Their presence does **not** establish which Google Cloud project owns the deployed OAuth client or that its redirect URIs are correct. Credential values are not recorded here.

### Keep the identities separate

- **Owner's Box** is the selected business profile and demo subject. Its current profile details, baseline measurements, and successful import have not been established by this documentation update.
- **LocalMap** is the platform / agency brand; **LocalSync** is the software engine and Google Cloud project context.
- The **OAuth consent app name and OAuth client display name are unverified**. Do not rename either to Owner's Box just because the demo business changed.
- The deployed **OAuth client's project association**, the Cloud project's organization / IAM ownership, API enablement, and live quotas still require Console verification.
- **Gift a Story** is an earlier, separate setup retained in [Historical record](#historical-record-gift-a-story-july-2026). Its project and baseline are not the current setup.

### Approval is one requirement, not the whole setup

GBP Basic API Access approval, individual API enablement, OAuth consent / verification, and a quota increase above the default are separate matters. Approval does not automatically publish or verify the OAuth app, enable each API, or prove a working connection. Do not switch the OAuth app to Production solely because GBP approval arrived. Google's [basic setup](https://developers.google.com/my-business/content/basic-setup) and [OAuth guide](https://developers.google.com/my-business/content/implement-oauth) describe the separate configuration steps.

## Callback URLs and environment alignment

`lib/connectors/google.ts` uses the shared builder in `lib/connectors/google-oauth-config.ts` for both authorization and token exchange. It validates `NEXT_PUBLIC_APP_URL` as an origin and appends `/api/connectors/google/callback`. Production requires an explicit HTTPS origin; local development defaults to `http://localhost:3002`. `npm run dev` runs on port **3002**.

| Environment | `NEXT_PUBLIC_APP_URL` | Exact Google authorized redirect URI |
|-------------|-----------------------|--------------------------------------|
| Local development | `http://localhost:3002` | `http://localhost:3002/api/connectors/google/callback` |
| Production | `https://app.localmap.co` | `https://app.localmap.co/api/connectors/google/callback` |

These are the URIs required by the current app configuration, **not confirmation that Google already has them registered**. Verify them on the deployed OAuth client in Console. The former `https://localsync-ai.vercel.app` URL and bare `https://localmap.co` are not the verified production callback base.

**Preview deployments:** a read-only Vercel metadata review did not show a preview-scoped `NEXT_PUBLIC_APP_URL`. The callback builder fails closed when `NODE_ENV=production` and this value is missing, including production-mode preview builds. Configure `NEXT_PUBLIC_APP_URL` explicitly for the intended preview origin and register that exact origin plus `/api/connectors/google/callback` on the appropriate OAuth client as an authorized setup change. Do not reuse the production URL for a cross-origin callback unless that flow is intentional and session continuity has been verified. No Vercel or Google settings were changed in this documentation update.

For local development, set the base URL above in `.env.local` and supply the authorized Google OAuth credentials through the normal secret configuration. Production already has protected credential entries; do not expose, recreate, rotate, or overwrite credentials just to check this setup.

## Remaining verification

Start with a **read-only** Console review in project **`localsync-501521` / `249394741886`**. Record evidence before making changes. This documentation update does not authorize OAuth configuration changes, credential creation, API enablement, or publishing.

1. **Match the deployed OAuth client to the approved project.** Open [Credentials](https://console.cloud.google.com/apis/credentials?project=localsync-501521) and confirm the client used by Vercel belongs to this project. Check the project number in [project settings](https://console.cloud.google.com/iam-admin/settings?project=localsync-501521); do not rely on a display name alone. Record app/client display names and project ownership only once verified.
2. **Compare both redirect URIs exactly** with the table above. Check the consent screen's homepage, privacy URL, authorized domains, audience, test users, publishing status, and any OAuth verification requirement separately. No such status has been verified here.
3. **Check enabled APIs** in [APIs & Services](https://console.cloud.google.com/apis/dashboard?project=localsync-501521), particularly the services used by the current features:
   - My Business Account Management API (`mybusinessaccountmanagement.googleapis.com`): account discovery
   - My Business Business Information API (`mybusinessbusinessinformation.googleapis.com`): location import
   - My Business Verifications API (`mybusinessverifications.googleapis.com`): verification / Voice of Merchant status
   - Google My Business API (`mybusiness.googleapis.com`): review workflows
   - Places API (New): separate audit / public-place features; enabling it does not establish GBP access
4. **Inspect effective quotas and usage for the failing API**, including project and any per-user limits. The approval's default 300 QPM is not a live measurement of every endpoint's current quota.
5. **Verify the signed-in Google account can manage Owner's Box**, then perform an authorized connection / read-only import test. Successful OAuth alone is not proof that API requests or location access succeed. Capture an Owner's Box baseline separately before any approved optimization; do not reuse Gift a Story's numbers.

The app requests `https://www.googleapis.com/auth/business.manage`. Calling the import read-only describes its application behavior; the OAuth scope itself also supports management operations. Any new consent grant or persistent-access change must be authorized separately. See Google's [OAuth guide](https://developers.google.com/my-business/content/implement-oauth).

## Troubleshooting without reapplying

Google documents `429` / `RESOURCE_EXHAUSTED` as quota exhaustion, which can happen to an approved project. Inspect the failing service's effective limit, usage, and error details; use backoff for a temporary limit. A 429 alone is **not evidence that approval is missing**. See [Google's quota guidance](https://developers.google.com/my-business/content/limits).

| Signal | Next check |
|--------|------------|
| `429` / `RESOURCE_EXHAUSTED` | Check request rate, service / quota metric, effective limit, and the OAuth client's actual project. Do not reapply automatically. |
| Effective quota is `0` despite the approval email | First reconcile the deployed client, selected project `249394741886`, API, and approval case `1-3775000042082`. If the same approved project remains at zero, raise the mismatch through the existing Google support case rather than filing a duplicate Basic Access application. |
| `403` / `PERMISSION_DENIED` | Read the specific reason. Check API enablement, OAuth scope, Workspace restrictions, and the signed-in account's rights to Owner's Box; the status alone does not identify one cause. |
| `404` / `NOT_FOUND` | Check the endpoint and resource / account / location IDs and access. It is not proof of an unapproved project. |
| `redirect_uri_mismatch` | Compare the requested URI with the exact registered URI, including scheme, host, port, and path. Confirm the deployed base and correct client. |
| OAuth completes but no locations load | Check actual API response and account/profile access. Do not promise success or infer pending approval from the connection step. |

For a genuinely new, unapproved project, Google's zero-quota guidance directs applicants to Basic API Access rather than a quota increase. That is **not** the current status recorded for `localsync-501521`. Requests for capacity above an approved default are a separate quota-increase process. See [quota limits](https://developers.google.com/my-business/content/limits).

## Current checklist

- [x] Owner's Box chosen as the GBP / demo business
- [x] Basic API Access approved for `localsync-501521` / `249394741886` on 2026-10-06, case `1-3775000042082`
- [x] Vercel production app base verified as `https://app.localmap.co`
- [x] Protected Google client ID / secret entries present in Vercel production
- [x] Expected callback paths matched to source and dev port
- [ ] Deployed OAuth client belongs to the approved project; app/client display names and project ownership verified
- [ ] Both exact callback URIs verified in Google Console
- [ ] OAuth audience / consent / verification status reviewed separately
- [ ] Required APIs enabled and live effective quotas verified
- [ ] Owner's Box account access and read-only location import confirmed
- [ ] Owner's Box pre-optimization baseline captured from verified business data

## Historical record: Gift a Story (July 2026)

**Historical only. Do not use this project, application copy, or callback base for the current Owner's Box setup.**

The earlier application was submitted **2026-07-13**, case **`0-0182000041521`**, for Google Cloud project **Gift A Story**, ID **`gift-a-story`**, number **`684836579110`**, recorded under organization `wvfmlabs.com`. The confirmation then estimated **7–10 business days**; that estimate is historical, not a current wait instruction.

| Original application field | Submitted / recorded value |
|----------------------------|----------------------------|
| Google Cloud project number | `684836579110` |
| Company website | `https://giftastory.app` (fallback recorded: `https://gift-a-story-mvp.vercel.app/`) |
| How did you hear about this API access form? | Google Business Profile API documentation while setting up API access for our local business management platform. |
| Primary reason for seeking access | We are building LocalSync, an AI-powered local business management platform for agencies and small businesses. We need Google Business Profile API access to test and develop core workflows including syncing business profile data, managing location information, monitoring profile changes, creating posts/updates, and supporting review workflows. Initial use is for internal development and dogfooding with our own test accounts before onboarding customer accounts. |

The platform URL was then recorded as `https://localsync-ai.vercel.app`, with `https://localsync-ai.vercel.app/api/connectors/google/callback` as the proposed production redirect. Historical documentation proposed the consent app name `LocalSync AI`; it did not verify the current live name. The original [Gift a Story baseline](./gift-a-story-baseline.md) is retained unchanged in its business facts and measurements, clearly marked historical. No Owner's Box baseline is implied.
