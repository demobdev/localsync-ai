# Google workflow acceptance and data contract

Updated 2026-10-06. This checklist covers the focused Google pipeline on Don's simplified listings branch. Automated tests use fixtures/mocks; they do not establish a successful production OAuth grant or review read.

## Data returned and saved

| Area | Read from Google | Saved in LocalMap |
|---|---|---|
| Listing selection | Account/location resource names, title, phone, website, address, weekly hours, categories, Maps URL, open status, duplicate/pending-edit flags | The selected account-qualified Google resource and Maps link |
| Master Profile import | A fresh server-side read of the selected listing | Only the fields the customer selected: name, phone, website, street, city, state, ZIP, ordinary weekly hours. Changed profiles get an immutable `gbp_import` version identifying the Google resource |
| Link-only confirmation | Fresh listing plus current verification | Listing link/status only; no Master Profile field changes |
| Verification | Voice of Merchant and business authority | Last-checked link status; fresh status controls setup progression |
| Reviews | ID, reviewer display name, stars, text, creation time, existing owner reply and reply update time | Those fields with `source=google`; existing local pending/approved reply work is preserved |
| Review aggregates | Google's total review count and average | Returned to the sync result, not persisted as authoritative metrics |

Categories are read but are not automatically mapped into LocalMap's taxonomy. The profile import does not fetch descriptions, services, photos, posts, holiday hours or Business Profile performance analytics. Review avatars, media, review-edit timestamps and moderation fields are not ingested.

Split, overnight and extended hours cannot currently be represented by the single-period Master Profile editor. They are shown with a warning and cannot be imported destructively. Customers can link the listing without changing fields, import other supported fields, and review hours separately.

## Flow contract

1. App login selects the workspace. Google connection is a separate customer-approved OAuth flow.
2. Connect starts a fresh signed, short-lived, session/workspace-bound nonce. Callback distinguishes denial, interrupted/expired attempts, exchange failure, save failure and optional Search Console failure. Previously opened consent attempts must restart after the state-format update.
3. Listing reads use the real APIs with no persistent fetch cache, paginate accounts and locations, and report failures without presenting partial results as a complete list.
4. The customer chooses the Google listing and existing LocalMap Master Profile. No record is automatically selected as the correct business merely because names look similar.
5. Save re-reads the selected listing on the server. If selected Google values changed since the preview, it asks the customer to refresh/review rather than silently overwriting. Only selected fields change.
6. Confirmation is link-only. Saved completion persists across reloads, exposes Continue to listings, and distinguishes verification needs. The setup checklist advances only when the saved link matches a fresh, verified profile; incomplete linked records route to their Listings workspace.
7. Reviews sync only when the customer clicks Sync from Google. The UI reports added/updated/fetched counts, empty results, skipped unsupported records, and actionable failures. Repeated sync refreshes changed content; same-screen rapid duplicate requests are blocked.
8. This workflow does not automatically send Master Profile changes to Google, post replies, create credentials, generate AI content or publish visibility pages.

## Automated coverage

- OAuth redirect construction, signed state, expiry/tampering/session/workspace mismatch, canceled/missing-code callbacks, exchange/storage errors, and optional Search Console routing
- Complete pagination, repeated page tokens, malformed/network/error responses and safe hours mapping
- Fresh import provenance, vanished/changed listings, no writes on expected errors, and link-only confirmation with differing names
- Confirmation/save status, reload persistence, correct target navigation, changed selections, loading, rapid repeat clicks, error/retry and stale verification
- Review pagination, malformed dates/content, repeated-sync updates, preserved local reply work, demo labeling, empty/error results, and location-navigation races
- Completion-aware setup routing after saved Google confirmation

## Production acceptance still required

- [ ] Begin a new Google connection attempt; confirm callback returns to the same selected workspace
- [ ] Verify Owner's Box appears with actual address/hours and verification status
- [ ] Import a deliberately chosen missing field; reload and check its version history/source
- [ ] Confirm/link without changing any fields; follow Continue to listings and verify Continue setup no longer loops
- [ ] Click Sync from Google; compare a few actual reviews and any existing owner reply with Google's profile
- [ ] Reload the inbox, then repeat sync to verify persistence and no duplicates under sequential use
- [ ] Verify denied/canceled authorization and a disconnected account show useful next steps

Do not click Send Master Profile or approve a public Google write as part of this read/import acceptance test.

## Existing limitations for the next phase

Deleted upstream reviews are not automatically removed. Cross-tab concurrent sync does not yet have a database uniqueness guard. Existing response metrics include local approved replies, and the UI discloses this; local approval is not Google publication. Existing Google-content storage/retention policy needs a separate bounded review. This release adds no persisted AI summaries or Google aggregate metrics. User screenshots and public-page smoke tests are not substitutes for the authenticated acceptance checks above.
