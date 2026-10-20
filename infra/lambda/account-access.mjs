export class AccessError extends Error { constructor(message, status = 401) { super(message); this.status = status; } }
export async function verifiedAccount(event, request = fetch) {
  const token = (event.headers?.authorization || event.headers?.Authorization || "").match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new AccessError("Please log in.");
  const response = await request(`https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/`, { method: "POST", headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser" }, body: JSON.stringify({ AccessToken: token }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new AccessError("Please log in again.", response.status >= 500 ? 503 : 401);
  const payload = await response.json();
  const claims = JSON.parse(Buffer.from(token.split(".")[1] || "", "base64url").toString());
  const attributes = Object.fromEntries((payload.UserAttributes || []).map(a => [a.Name, a.Value]));
  if (!attributes.sub || claims.client_id !== process.env.ACCOUNTS_CLIENT_ID || claims.iss !== process.env.ACCOUNTS_ISSUER) throw new AccessError("Please log in again.");
  return { id: attributes.sub, email: attributes.email || "", name: attributes.name || "" };
}
export function premiumAccess(record, now = Date.now() / 1000) {
  return Boolean(record?.complimentary === true || (["trialing", "active"].includes(record?.status) && Number(record?.accessUntil) > now));
}
export function billingConfigured() {
  const mode = process.env.BILLING_MODE || "test";
  return Boolean((process.env.STRIPE_SECRET_KEY || "").startsWith(`sk_${mode}_`) && (process.env.STRIPE_PRICE_ID || "").startsWith("price_") && (process.env.STRIPE_WEBHOOK_SECRET || "").startsWith("whsec_"));
}
export function publicBilling(record = {}) {
  return { premium: premiumAccess(record), complimentary: record.complimentary === true, status: record.status || "free", accessUntil: record.accessUntil || null, trialEnd: record.trialEnd || null, cancelAtPeriodEnd: record.cancelAtPeriodEnd === true, trialEligible: !record.trialUsed, hasCustomer: Boolean(record.customerId), billingReady: billingConfigured(), testMode: (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_") };
}

export function billingKey(userId) { return `${process.env.BILLING_MODE || "test"}#${userId}`; }
