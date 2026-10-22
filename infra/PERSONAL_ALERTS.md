# Personal matching and alerts

Settings is private to the Cognito account configured by `PersonalAlertsUserId`. No subscription changes are required.

## Pages

- `/settings/resume`: upload/parse PDF, DOCX or TXT (2 MB, PDFs up to 10 pages), review/edit text and recognized skills, then save. PDFs are parsed in the browser with a same-origin, matching-version worker copied during `predev` / `prebuild`. Original files are not stored. Scans still need OCR or pasted text. The server PDF fallback also resolves its worker explicitly.
- `/settings/companies`: resume/company alert mode, recommended/custom companies, searchable multi-select role/location/keyword preferences, work arrangement and a fit preference dropdown. This is the only page with Check matches and results.
- `/settings/delivery`: choose **one** channel, email/Gmail or phone, enter/verify the destination, select 1, 2, 3, 4, 6, 12 or 24 maximum alerts per day, pause/resume and test delivery. Changing channel/address pauses notifications until verified and explicitly enabled again.

## Deploy

The Vercel frontend deploys after pushing. Deploy the Lambda changes separately from your Windows repository:

```powershell
cd C:\Users\chill\Downloads\VSCODE\wantaninternship
git pull
cd infra
sam build
sam deploy --guided
```

Keep the existing stack, region, billing mode, Stripe values, access-code hash and origin. Use the same `PersonalAlertsUserId` as before. Set `AlertEmailFrom` to an SES-verified sender in us-east-1. For SES sandbox accounts, receiving addresses must also be verified in SES. A blank sender disables email and email-code sending; preferences and previews still work.

`AlertSmsEnabled` defaults to **false**. Leave it false until SMS is configured. Code cannot provision or approve an SMS sender for you.

## Phone delivery setup

AWS SNS SMS requires an origination identity where applicable, including US sending. Use AWS End User Messaging/SNS to register the required sender. In the SMS sandbox, verify your destination phone in AWS as well. Configure a small account SMS spending limit in AWS before enabling this parameter; SNS delivery can incur per-message and sender charges. The code sets a maximum per-message price of USD 0.10 and never purchases numbers or sender registrations. See:

- https://docs.aws.amazon.com/sns/latest/dg/sns-sms-sandbox.html
- https://docs.aws.amazon.com/sns/latest/dg/channels-sms-originating-identities.html

After setup, deploy with `AlertSmsEnabled=true`. Enter an E.164 phone number (+country code), choose Verify & allow texts, and verify the code. The app records consent with verification. AWS/provider opt-out handling applies; pause delivery in settings at any time. Tests and alerts use the selected destination only. SMS contains a short summary linking to the shortlist, not a copy of a resume.

## Verification and cadence

The already-verified account email requires no extra code. A different email or phone requires a six-digit code. Codes expire after ten minutes, are stored as hashes, permit at most five guesses, and are single use. Code requests are limited to five per UTC day and at least a minute apart. SES sandbox verification is independent of this app verification.

Automatic alerts run hourly, with at least `24 / timesPerDay` hours between digests. This is a maximum, not a promise of empty or fixed-time messages. Jobs first discovered before the profile's initial save are previewable but not automatically delivered. Already delivered jobs are not repeated; tests do not consume jobs or alter the digest schedule. Only one channel is called per send. A delivery started before a user changes preferences may already have reached the provider; the change applies to future sends.

Ambiguous sends create a delivery hold instead of automatically retrying. Check the selected inbox/phone before clearing that hold. Deleting matching data stops future delivery and removes preferences, resume text, matches, verification records and caches.

## Matching coverage and progress

The worker reads up to 1,000 recent active internships per track. It uses existing feed descriptions and bounded public ATS endpoints for Greenhouse, Lever, Ashby and Workday. Adding company names does not add scrapers. Arbitrary URLs, redirects and private URLs are not fetched; payload/time limits apply.

Up to 40 uncached supported descriptions are checked per run, five at a time. Successful descriptions are cached for seven days and failed checks for a day. Unsupported URLs are counted as unavailable, not reported as permanently pending. When no full description is available, filter-matching candidates are displayed separately for manual review. They never trigger resume alerts or claim a verified match. A company watchlist match may still alert without full requirements.

Manual previews work while alerts are paused. Request IDs distinguish the requested check from scheduled runs. Progress is queued/running/complete/failed; the UI polls its own request and reports failures rather than treating every timestamp change as success. Matching is keyword-based; graduation, sponsorship, citizenship and other eligibility requirements must be confirmed with the employer.

## Validation

Run `npm test`, `npm run build`, and `sam validate` if SAM is installed. Tests cover PDF/DOCX/TXT parsing, matching, safe ATS requests, request correlation, verified recipients, single-channel sending, cadence, OTP replay/guess limits and delivery holds. Browser QA uses synthetic local settings fixtures; no real notification is sent during QA. Live email/SMS sending still requires AWS configuration and deployment.
