# Gift a Story — GBP baseline (pre-LocalSync)

**Captured:** 2026-07-13  
**Purpose:** Before/after case study once LocalSync connects and we optimize the profile.  
**GBP API access:** Case `0-0182000041521` · GCP project number `684836579110` (`gift-a-story`) · review ~7–10 business days.

## Identity

| Field | Value |
|--------|--------|
| Business name | Gift a Story |
| Category | Gift shop |
| Managed | Yes — “You manage this Business Profile” |
| Website | `https://giftastory.app` (also referenced as `http://giftastory.app/` in Ads example) |
| Instagram | [instagram.com/gift.a.story](https://instagram.com/gift.a.story) (~390+ followers) |
| Phone (panel) | Confirm against site — panel has shown contact on manage UI |
| Hours | **Missing** — “Add business hours” |

## Completeness

| Signal | State |
|--------|--------|
| Profile strength | ~75% — “Complete info” still shown |
| Photos | Present (books/journals, map imagery) |
| Description | Partial presence on Search |
| Chat / social cards | Google prompting Add Chat; Instagram linked |

## Performance (manager UI, Feb 2026–Jul 2026 window)

| Metric | Value |
|--------|--------|
| Profile views | ~303–383 (UI showed both “303 people viewed” and “383 views”) |
| Search appearances | **&lt;50** — “More searches needed for search terms” |
| Business Profile interactions | **0** (calls / bookings / website clicks flat on Overview chart) |
| Discovery mix (of ~303 views) | Search desktop ~26% · Search mobile ~25% · Maps mobile ~25% · Maps desktop ~23% |

## Google Ads promo (visible, unclaimed)

Google surfaces **“Claim your $500 advertising credit”** / “$500 when you spend $500 — new advertisers only” on Search manage cards and Performance → Overview.

**Product note:** This is manager/Ads UI, not a Business Profile API field. LocalSync should treat it as a checklist opportunity (“check Performance / Ads for new-advertiser credit”) until/unless Ads account linkage can confirm claimed vs available.

## Snapshot checklist for “after”

Re-capture the same fields after LocalSync import + approved optimizations:

- [ ] Hours set
- [ ] Profile strength / completeness
- [ ] Views and search appearances (same date range length)
- [ ] Interactions &gt; 0
- [ ] Ads credit claimed or explicitly declined
- [ ] NAP + website consistent with master profile in LocalSync

## Related

- [gbp-api-request.md](./gbp-api-request.md) — access form + quota checks  
- LocalSync Connect → Google (OAuth) — expect “API quota pending” until ~300 QPM  
