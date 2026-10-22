# Personal matching and internship emails

The account dropdown now includes **Settings** at `/settings`. This first version is private to a single configured Cognito account and is independent of subscription access. Other accounts can see the Settings link but cannot read or write the personal profile. It does not enroll public users into emails.

## Features

- Upload a PDF, DOCX, or TXT resume (2 MB, text PDFs up to 10 pages), or paste resume text. Review extracted text before saving. Scanned PDFs require OCR elsewhere or pasted text.
- Save resume text, additional skills, role/location filters, required/excluded keywords, remote-only preference, tech/engineering track, and a minimum keyword-fit threshold.
- Enable resume matching, company alerts, or both. Recommended companies are shown explicitly; a custom list replaces or supplements them.
- Check matches on demand. The worker also checks hourly and can send a daily or hourly digest of up to 20 new results. Previously emailed job IDs are remembered for 30 days.
- Preview matches without sending an email, send an explicit test email, pause delivery without deleting the profile, or delete all personal matching data.

The original uploaded file is parsed in memory and not retained. Extracted resume text is stored in the private DynamoDB profile only after Save. There is no external AI service, model training, vector database, or API key required by this version. Scores explain keyword overlap and missing skill mentions; they are not hiring probabilities or confirmations that a candidate meets every requirement.

## Deploy and enable your account

1. Pull the updated repository and deploy the frontend normally. Open `/settings` while signed in. Its setup panel shows your Cognito account ID. Copy it.
2. In the existing AWS region (`us-east-1`), verify an Amazon SES sender email or domain. If the SES account is in its sandbox, also verify your receiving account email. For this personal tool, staying in the sandbox is sufficient after both addresses are verified.
3. From your Windows checkout:

   ```powershell
   git pull
   cd infra
   sam build
   sam deploy --guided
   ```

4. Keep the existing stack, region, billing mode, Stripe values, access-code hash, and origin. Set:

   | Parameter | Value |
   | --- | --- |
   | `PersonalAlertsUserId` | The exact account ID shown in Settings |
   | `AlertEmailFrom` | Your SES-verified sender address in `us-east-1` |

   A blank account ID disables personal settings access. A blank sender disables emails while leaving matching usable for the configured account. The SAM no-auth warning is expected: SettingsFunction validates Cognito access tokens inside the handler, as the applications and billing handlers do.

5. Open Settings, upload/paste your resume, review its text, and enable at least one mode. Save preferences and select **Check matches**. After results appear, choose **Send test email** in Email preferences. Check your inbox, then enable **Send emails** and save again.

No new Vercel setting is normally needed. `/api/settings` derives the AWS `/settings` endpoint from the existing `INTERNSHIPS_API_URL`. An optional `SETTINGS_API_URL` overrides it if your deployment uses a different endpoint. Account secrets and AWS credentials must not be placed in browser code.

## Coverage and requirements

Both modes use the existing internship database, up to the latest 1,000 active listings per chosen track in the 14-day window. Adding a company name does **not** start scraping a new career site. A company must already appear in the feed before it can produce company alerts.

The collector now retains bounded descriptions from its existing direct Greenhouse, Lever, and Ashby feeds. For GitHub-discovered jobs, the personal worker can retrieve requirements through those providers' documented public APIs. Only fixed ATS hosts and validated board/job path components are used, with redirects disabled, payload limits, request timeouts, and five-way concurrency. Arbitrary company URLs are never fetched. Other ATS providers and aggregator links can still generate watchlist alerts but do not receive resume-match alerts without a full description.

Each run makes at most 20 uncached description checks. Successful descriptions are cached for seven days, unsuccessful/unsupported checks for one day, using DynamoDB TTL. Remaining checks continue on subsequent runs. A result can be missing because of unsupported requirements coverage, not because the candidate is unsuitable. UI coverage counters expose this limitation.

All shared filters apply to both modes. Locations and remote status must be stated in listing data. Required/excluded keywords search titles plus available descriptions. Graduation windows, sponsorship, citizenship, clearance, experience equivalence, and education requirements are not automatically validated in this version; the employer posting remains authoritative.

## Delivery behavior

Email goes only to the verified account email captured when preferences are saved; the client cannot choose a recipient. Notifications begin with listings discovered after the profile's first save. Check matches previews existing results separately. Daily means at least 24 hours between digests, evaluated by the hourly worker; it is not a fixed wall-clock delivery time. No email is sent when there are no new results. Tests do not mark jobs delivered or change the daily schedule.

A worker lock prevents overlapping runs, and manual checks are limited to one per minute. Before emailing, the worker checks that preferences were not changed or deleted while it was processing. A pending delivery is recorded before SES is called. If delivery is interrupted or its outcome is ambiguous, automatic sends are held instead of repeating a potentially accepted email. Settings shows the hold and lets the owner clear it after checking the inbox and fixing any sender issue. Clearing a hold may retry an unconfirmed batch; verify the inbox first.

Pause or delete in Settings at any time. The email footer links back to Settings. Delete removes resume text, preferences, matches, caches, and delivery history; the next scheduled run exits without sending.

## Validation and running

- `npm test` covers preference validation, owner isolation, verified recipients, role and keyword matching, sparse descriptions, unsafe destinations, ATS enrichment, notification cadence/deduplication, delivery holds, deleted/changed profiles, and DOCX/TXT extraction.
- `npm run build` validates the Next.js production routes, including the PDF parser worker being included in the deployment trace.
- Stack output `MatchingWorkerFunctionName` can be invoked manually for an immediate scheduled-style check. Use `{"mode":"preview"}` for a no-email run.

The implementation adds a pay-per-request DynamoDB table and two Lambda functions with an hourly EventBridge schedule. SES uses your AWS account. No paid LLM calls or new subscription service are introduced. Actual AWS/SES charges depend on your account's free-tier eligibility and usage; sender verification and deployment must be completed before live email can be verified.
