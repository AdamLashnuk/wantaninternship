# Software Latest Drops feed

This AWS SAM stack powers the software-only Latest Drops experience.

It creates:

- a DynamoDB table for normalized internships and new-grad roles;
- a Lambda collector for direct employer ATS feeds and three GitHub discovery sources;
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

The API supports `limit` (1–100) and an opaque `cursor` returned as
`nextCursor`. Edit `lambda/sources.json` for direct ATS employers and
`lambda/github-sources.json` for scheduled GitHub discovery inputs.
