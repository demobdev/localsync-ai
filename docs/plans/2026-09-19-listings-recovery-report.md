# LocalMap recovery and next-phase report

Reviewed September 19, 2026. Local preview: http://localhost:3002/

## PC handoff / next-phase update

The cohesion checkpoint was subsequently committed as `c851a17` and pushed to `origin/codex/listings-cohesion`. It passed `npm run build`. The initial-review sections below describe the earlier local-only state.

The next-phase hardening checks all three required campaign tables instead of treating one existing table as a complete migration. Regression coverage includes every table-presence combination, an empty result, and a database outage. This is a table-presence guard, not a schema compatibility check or proof of actual publisher delivery.

Follow [PC setup instructions](../pc-handoff.md). Local screenshots and pre-existing asset deletions are intentionally excluded from the handoff. Google access verification, authenticated/responsive acceptance, and the reviewed migration remain open; no live database or publisher state was changed.

## Executive assessment

The simplified listings proposition is the right center of the product: **one approved business profile, clear next steps for each publisher, and evidence of what changed**. The app has substantial implementation already; it is not yet verified as an operational end-to-end publishing service. Avoid presenting publisher logos, paid tiers, or illustrative status cards as proof of live distribution.

The first cohesion slice is implemented locally on `codex/listings-cohesion`, branched from `codex/dons-automated-listings-ux` at `12afda5`. Existing unfinished campaign work and deleted assets were preserved. Nothing was merged to main, pushed, or deployed during this review.

## Flow review

| Step | Observed condition | Action / remaining gate |
| --- | --- | --- |
| Homepage | Correct simplified listings homepage running | Preserved headline; primary CTA now goes directly to account setup, with optional business check |
| Navigation | Separate public-page treatments and inconsistent mobile paths | Shared LocalMap header/footer, mobile menu, sign-in, active navigation and skip links |
| Business check | Real Places search found The Owners Box in Greenville | Retained search, clarified scope, added input label; did not initiate a stored audit |
| Account creation | Previously generic account screen without product context | Branded setup/sign-in shell and explicit distinction between Google sign-in and GBP connection |
| Pricing | $19/$49/$79 catalog; wording implied integrations were automatically active | Clarified connection/access requirements; retained configured prices and trial terms; live billing not verified |
| Product details | Publisher visuals implied universal sync | Removed success checks from shared distribution illustration and labeled it as an example |
| Onboarding/dashboard | Authentication required | Source reviewed; authenticated account creation, organization setup and saved-profile journey still need a pilot |
| Campaigns | New control-plane code present but storage absent | Migration review and execution required before campaign testing; approval records are not proof of delivery |
| Publisher updates | Places discovery works; Google management access unverified | Configure OAuth and verify access before testing a read-only connection, then an explicitly approved write |

The primary setup CTA was clicked and reached `/sign-up`. Public pages rendered successfully. Narrow-layout navigation was exercised without horizontal overflow at the observed 658px width. The in-app browser did not honor a requested 390px override, so exact phone-width and full desktop acceptance remain outstanding; the temporary override was reset.

## Implemented first slice

- Shared ink/teal/lime identity for the listings entry journey; stable light public-page palette independent of workspace dark mode.
- Shared header/footer on homepage, listings, pricing and business check; matching account shell.
- Setup-first route; business check is optional instead of an obligatory lead-generation detour.
- Customer-facing LocalMap naming in onboarding and publisher descriptions; no backend identifiers renamed.
- Publisher availability qualifications, illustrative status labels and accessible feature-table text.
- Improved page metadata and preserved scan/audit-specific account redirect behavior.

The design audit drove the shared navigation, consistent public palette, simpler entry path and removal of misleading success indicators. Broader legacy product pages still need a second content/visual pass; this is not a claim that every page or signed-in state is finished.

## Google correspondence and approval

The signed-in `demo@localmap.co` Gmail account was searched, including all-mail search for `6-5267000042082`. No matching message was found. This is a search result, not proof that Google never replied or that the case was rejected.

An actual Google support email dated July 22, 2026, case **0-3698000041406**, says the application failed internal quality checks and cites: **“No approved project.The listing ID is associated with a different website”**. This is an older case, not the September outcome. A September 10 inbox notification confirms an ownership invitation/role update for The Owners Box, but does not establish API approval.

The prior September handoff identifies application **6-5267000042082**, submitted September 10/11, for project **localsync-501521**, number **249394741886**. Its submission date and case details are historical handoff evidence, not reverified through a new confirmation email.

Google Cloud currently requires separate reauthentication for `demo@localmap.co`. Therefore the current project quota is unknown.

### Correct next action

1. Complete the Google Cloud sign-in and inspect [Account Management quotas for the intended project](https://console.cloud.google.com/apis/api/mybusinessaccountmanagement.googleapis.com/quotas?project=localsync-501521).
2. If quota is **0**, pursue **Basic API access**, not a quota increase. Verify the applicant's owner/manager role, verified business profile, official website match, profile eligibility and exact project number before any reapplication.
3. If quota is already **300 requests/minute**, access is approved according to Google's prerequisites guidance. Configure OAuth and test account/location reads before considering an increase.
4. Request a higher limit only if approved access exists and measured sustained usage supports it. Google says increases are generally rejected when average usage is below half the current quota, traffic is highly spiky, or limits are not being reached.
5. Resolve the earlier website mismatch explicitly. Do not claim it has been corrected until the profile, official website and application identity have been compared.

Sources: [Google prerequisites](https://developers.google.com/my-business/content/prereqs), [Google usage limits](https://developers.google.com/my-business/content/limits). Places API discovery and GBP management approval are separate gates.

### Follow-up draft — not sent

Subject: Status of GBP API access request 6-5267000042082 — project 249394741886

Hello Google Business Profile API Support,

Could you confirm the status of our September application, case 6-5267000042082, for LocalMap project localsync-501521 (project number 249394741886), submitted using demo@localmap.co for The Owners Box?

An earlier application, case 0-3698000041406, was declined with a listing/website mismatch. Please let us know whether that issue affects the current application and which business-profile, website, or project details need correction. We can supply the verified profile and official website information for review.

Thank you.

Send only after verifying the case details and recipient/reply thread; do not create a duplicate application merely because an email search was empty.

## Technical release gates

| Area | Verified now | Required next |
| --- | --- | --- |
| App server | Local port 3002 serving correct homepage | Production build and isolated Vercel preview before launch |
| TypeScript | Passing after cohesion edits | Keep gate on final integration branch |
| Tests | 29 files, 89 tests passing | Add authenticated onboarding/campaign integration coverage |
| Lint | No errors; initial run reported 7 warnings, one unused import subsequently removed | Recheck remaining warnings before release |
| Google Places | Live business search returned The Owners Box | Not evidence of GBP management permission |
| Google OAuth | Local client ID and secret missing | Configure approved credentials and redirect URLs securely |
| Database | `sync_jobs` exists; `submission_campaigns`, `submission_targets`, `submission_events` absent | Review `20260802_submission_campaign_control_plane.sql`, confirm intended DB/backup, migrate and verify |
| Campaign execution | State/actions/UI code exists | Confirm transactions, retries, idempotency and actual dispatch; test evidence persistence |
| Clerk/billing | Development-mode auth UI, local plan catalog | Verify production keys, plan mapping, trials, entitlements and checkout separately |
| Assets | Pre-existing compact-logo and review-image deletions remain | Resolve deliberate removal vs missing asset before release |

No secrets were copied into this report. No database migration, publisher write, email send, payment, or production deployment was performed.

## Ordered next phase

1. **Finish cohesion acceptance:** verify 390px and desktop layouts, all auth states, plan-selection continuity, account-return behavior, remaining broad claims and missing assets.
2. **Unblock Google:** current quota, eligibility/website match, application status, OAuth configuration, then read-only account/location connection.
3. **Activate campaign storage safely:** review migration, apply to the agreed environment, verify tenant isolation, repeat approvals and failure recovery. Prove actual worker dispatch separately from stored campaign state.
4. **Pilot one business:** The Owners Box profile approval → connection → one authorized update → read-back/evidence → visible success/failure status. Do not run bulk publication first.
5. **Release consolidation:** review the existing campaign changes alongside this cohesion branch, run build/checks, push the reviewed diff and create a Vercel preview. Validate preview credentials, URLs and billing; promote only after pilot acceptance.

Keep the independent shader-branding branch separate until its auth/onboarding/dependency changes are explicitly reviewed. A wholesale merge would obscure the simplified listings direction.

## Visual evidence

Before/after captures are local review artifacts under `output/review-2026-09-19/` (not deployment proof).

![Homepage before](../../output/review-2026-09-19/01-home-before.png)

![Updated homepage](../../output/review-2026-09-19/09-home-after.png)

![Updated pricing](../../output/review-2026-09-19/08-pricing-after.png)
