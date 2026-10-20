# Payments and Premium activation

Implemented plan: 7 days free, then $9.99 USD per month. Stripe-hosted Checkout collects a card, and Stripe's customer portal manages billing and cancellation. Existing free accounts remain free until they explicitly complete Checkout.

Free access includes the homepage's latest drops, the curated website directory, ten listings per Latest Drops track, and up to ten tracked internships. Premium unlocks the full feed, advanced feed filters, unlimited tracking, and the animated flow chart. Existing tracker records and notes remain readable and editable after Premium ends; adding more records requires being under the free limit or upgrading.

## 1. Deploy the AWS resources

From the local repository folder:

```powershell
git pull
cd infra
sam build
sam deploy --guided
```

Keep the existing stack (`WantAnInternshipInternships`) and region (`us-east-1`). The new parameters are:

| Parameter | Initial value |
| --- | --- |
| BillingMode | `test` |
| StripeSecretKey | Keep `pending` for the first deployment, or enter your Stripe test secret key |
| StripePriceId | Leave blank until the test price is created |
| StripeWebhookSecret | Keep `pending` until the webhook is registered |
| FreeAccessCodeHash | Keep its default to enable the requested free-access code |
| AllowedOrigin | Your canonical website origin, normally `https://wantaninternship.com` |

Secret inputs are hidden while typing. If SAM keeps repeating a secret prompt when you press Enter, type `pending` explicitly instead of leaving it blank. This placeholder keeps checkout disabled.

This creates a retained BillingTable, billing Lambda, and server-side feed/tracker access enforcement. The `StripeWebhookUrl` output is the direct AWS webhook URL.

No new Vercel secrets are required: the website derives the billing endpoint from the existing `INTERNSHIPS_API_URL`. Stripe secrets stay in the AWS billing function. If needed, `BILLING_API_URL` can override the base with a URL ending in `/billing`.

## 2. Configure Stripe test mode

1. In Stripe's test environment, create a **WantAnInternship Premium** product and one recurring price: **9.99 USD every month**, quantity one, with no additional charges. Copy its `price_...` ID. Checkout validates this amount and interval before opening.
2. Copy the test secret API key (`sk_test_...`).
3. Add an event destination using the AWS stack's `StripeWebhookUrl`. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Use webhook API version **2025-06-30.basil** to match the pinned API requests, and copy that endpoint's `whsec_...` signing secret.
5. Enable Stripe's customer portal. Allow customers to update payment methods, view invoices, and cancel subscriptions at the end of the current trial or billing period. Keep plan switching and quantity updates disabled for this single-plan setup.
6. Enable Stripe customer emails for trial reminders, successful payments, and failed payments. Review the displayed business name, support contact, and cancellation information.
7. Run `sam deploy --guided` again and fill in the three Stripe parameters; keep `BillingMode=test`.

Trial starts when a new eligible subscription is created, not when an account is registered. Returning subscribers are charged $9.99/month immediately after completing Checkout; the trial is offered once per account. Checkout collects payment details and shows the first billing date. This implementation uses standard subscription free-trial periods, not the newer Trial Offer API.

## 3. Use the requested free-access code

Sign in, open **My account → Subscription**, enter your private access code under **Have an access code?**, then click **Apply code**.

It grants permanent complimentary Premium access to that account, requires no card, and creates no Stripe subscription. It works after the AWS deployment even before Stripe keys are configured. The code is not embedded in frontend assets; AWS stores only its SHA-256 hash as configuration and a per-account complimentary entitlement.

An account with a current paid, trialing, or unresolved subscription is asked to manage that subscription first. Redemption does not silently leave an existing subscription charging. Unfinished Checkout sessions are expired before access is granted. Redeeming a code and creating Checkout share a server lock.

Blank `FreeAccessCodeHash` disables new redemptions; changing it rotates the code. Previously granted complimentary access persists. Treat this code as shareable access: anyone who receives it can redeem it on their own account. Grants are scoped separately to test and live modes.

## 4. Test before accepting real payments

Use Stripe test payment methods, never a real charge, to verify:

- New account → Checkout → trial access → full feed and more than ten saves.
- Abandoned Checkout → no Premium access.
- Reopening Checkout → same unfinished session, not a duplicate subscription.
- Trial expiration, successful renewal, failed payment, and cancellation → matching access in the app.
- Cancel during the trial → no charge when it ends; access ends at the scheduled trial end.
- Repeat subscriber → no second trial.
- Your private access code → indefinite access without collecting payment details.
- Free direct API requests → fixed preview, no pagination; simultaneous saves cannot exceed ten.
- Expired subscriber → existing tracker records remain available.

Local `npm test` covers signature verification, stale/forged events, server-controlled price/trial settings, code grants, duplicate Checkout reuse, repeat-trial prevention, account ownership, concurrent save quotas, and entitlement expiry. External Stripe delivery, emails, portal configuration, and actual deployment must be verified in the Stripe test environment.

## 5. Switch to live mode

After testing, create the same $9.99/month product/price in Stripe live mode, register a live webhook destination, and configure the live customer portal and emails. Redeploy with `BillingMode=live`, the `sk_live_...` key, live `price_...` ID, and live webhook signing secret. Test and live billing records are namespaced so test customers/subscriptions cannot grant live access or break live Checkout. Redeem the free code again in live mode for your own complimentary account.

The site cannot accept real payments until these live settings and the AWS deployment are completed.
