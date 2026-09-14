# Software internship feed

This AWS SAM stack powers the Software-only Latest Drops experience.

It creates:

- a DynamoDB table for normalized internships;
- a Lambda collector that reads public Greenhouse and Ashby job feeds;
- an EventBridge schedule that refreshes the table every two hours; and
- a public read-only HTTP API used by the Next.js site.

## Deploy

Install the AWS CLI and AWS SAM CLI, authenticate to the intended AWS account,
then run from this directory:

```bash
sam build
sam deploy --guided
```

Use `WantAnInternshipInternships` as the stack name when prompted. Set
`AllowedOrigin` to the production site origin.

After deployment, copy the `InternshipApiUrl` output into the Vercel project as:

```text
INTERNSHIPS_API_URL=https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/internships
```

Redeploy the Vercel project after adding the variable.

To populate the table immediately instead of waiting for the first scheduled run,
invoke the collector name printed in the stack outputs:

```bash
aws lambda invoke --function-name YOUR_COLLECTOR_FUNCTION_NAME /tmp/wantaninternship-response.json
```

Edit `lambda/sources.json` to add or remove software employers. Only public ATS
feeds should be added; the collector intentionally does not scrape LinkedIn or
Indeed pages.
