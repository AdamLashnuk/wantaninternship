# Latest Drops feeds

This AWS SAM stack powers the separate Software and Engineering Latest Drops experiences.

It creates:

- a DynamoDB table for normalized internships and new-grad roles;
- a Lambda collector for direct employer ATS feeds and 36 discovery feeds from 17 GitHub repositories (11 tech repositories and 10 engineering repositories, with overlap);
- an EventBridge schedule that refreshes once per hour; and
- a paginated public HTTP API used by the Next.js site.

GitHub collection happens only in the scheduled Lambda. Website visitors read
DynamoDB-backed API results and cannot trigger GitHub scraping.

## Deploy

Install the AWS CLI and AWS SAM CLI, authenticate to the intended AWS account,
then run from this directory:

```bash
sam build
sam deploy --guided
```

Use `WantAnInternshipInternships` as the stack name and set `AllowedOrigin`
to `https://wantaninternship.com`. The public GitHub sources work without a
token. An optional `GITHUB_TOKEN` may be set directly on the collector Lambda
later for a larger GitHub API quota; never commit it to this repository.

After deployment, copy the `InternshipApiUrl` output into the Vercel project:

```text
INTERNSHIPS_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/internships
```

Redeploy Vercel after adding the variable. Populate immediately with the
`CollectorFunctionName` stack output:

```bash
aws lambda invoke --function-name YOUR_COLLECTOR_FUNCTION_NAME wantaninternship-response.json
```

The API supports `track=software|engineering`, `limit` (1–250) and an opaque
`cursor` returned as `nextCursor`. Edit `lambda/sources.json` for direct ATS
employers and `lambda/github-sources.json` for scheduled GitHub discovery inputs.
See [GITHUB_SOURCES.md](GITHUB_SOURCES.md) for the source audit and parsing details.

## Listing freshness

The collector preserves each listing's first discovery time and earliest known
publication date. Greenhouse `updated_at` is stored separately as `sourceUpdatedAt`;
employer edits do not move existing jobs to the top. Older Greenhouse records are
migrated on the next collector run. Deploy the Lambda changes with `sam build`
and `sam deploy`, then invoke the collector to apply the migration immediately.
The website also corrects legacy Greenhouse dates when reading existing API data.

## Student accounts

The same SAM stack also creates a Cognito user pool and web app client for email
and password accounts. Passwords are managed by Cognito; the website stores only
HttpOnly, Secure (in production), SameSite=Lax session cookies. Signup requires
an emailed confirmation code. Account data comes from Cognito GetUser, not from
browser storage. The pool is retained if the stack is deleted.

Deploy with `sam build` and `sam deploy`. Copy the `AccountsClientId` output into
Vercel as `COGNITO_CLIENT_ID`, and `AccountsRegion` as `COGNITO_REGION`, then
redeploy Vercel. Until configured, browsing and the account pages remain available,
while signup/login return an honest service-unavailable message. There are no
mock accounts or password storage in localStorage. Subscription billing is not
connected; accounts start on the free plan.

Cognito's default email sender has sending quotas. Configure a verified SES
sender and request appropriate production quotas before a public signup campaign.

## Applications dashboard

The account menu links to `/applications`. Bookmarking an internship on Latest Drops saves it to the signed-in account in place. The outline fills blue when saved; clicking again removes the saved application. Signed-out visitors log in first and return to Latest Drops, where the pending save is retried. The homepage and directory sidebar have no internship save buttons. Records are stored in a separate, retained DynamoDB table partitioned by the verified Cognito user ID. Repeated saves preserve the original status, notes, and saved date.

After pulling these changes, run `sam build` and `sam deploy` from this `infra` directory to create the applications table and API handler. Vercel uses the existing `INTERNSHIPS_API_URL` with `/internships` replaced by `/applications`; no new environment variable is required. An optional `APPLICATIONS_API_URL` can override that endpoint. Until the stack is deployed, the interface shows a save error rather than claiming a save succeeded.

Run `npm test` from the repository root to verify account isolation, duplicate saves, validation, and the existing feed behavior.

## Subscriptions and paywall

See [BILLING.md](BILLING.md) for Stripe test setup, the seven-day trial followed by $9.99/month, private access-code redemption, and live activation. The API now returns a fixed ten-listing preview without a current Premium entitlement; pagination and the complete feed require verified subscription access. The tracker enforces a ten-item free limit atomically while retaining existing records after a downgrade.
