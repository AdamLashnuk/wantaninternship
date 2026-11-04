# Free access

The website has no subscription UI, trials, checkout, access-code requirement or Pro badge. The complete feed, filters, application graph and unlimited saved applications are free. Personal data still requires account authentication. Personal resume/company alerts retain their owner restriction and provider setup.

Deploy the frontend through the existing GitHub/Vercel workflow. Deploy the AWS changes from `infra` with `sam build` and `sam deploy` to unlock public feed pagination and remove the tracker quota at its source. Until that deployment, the previous backend restrictions remain.

New checkout and code-redemption endpoints return 410 in both layers. Legacy Stripe webhook and backend portal handling are retained for existing customer records. No billing records, credentials, infrastructure resources or Stripe subscriptions are deleted by this change. Existing active/trial subscriptions and already-open Checkout sessions must be canceled/expired separately in Stripe to stop charges. Website access no longer depends on payment status.
