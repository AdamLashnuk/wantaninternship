import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { AccessError } from "./account-access.mjs";
export function matchesAccessCode(code, expectedHash) {
  if (typeof code !== "string" || !expectedHash || !/^[a-f0-9]{64}$/.test(expectedHash) || code.length > 100) return false;
  return timingSafeEqual(createHash("sha256").update(code.trim()).digest(), Buffer.from(expectedHash, "hex"));
}
export function verifiedStripeEvent(raw, signature, secret, now = Date.now() / 1000) {
  if (!secret || !signature) throw new AccessError("Invalid webhook signature.", 400);
  const parts = signature.split(",").map(part => part.split("="));
  const time = parts.find(([key]) => key === "t")?.[1];
  if (!/^\d+$/.test(time || "") || Math.abs(now - Number(time)) > 300) throw new AccessError("Expired webhook signature.", 400);
  const expected = createHmac("sha256", secret).update(`${time}.${raw}`).digest();
  const valid = parts.filter(([key, value]) => key === "v1" && /^[a-f0-9]{64}$/.test(value)).some(([,value]) => timingSafeEqual(expected, Buffer.from(value, "hex")));
  if (!valid) throw new AccessError("Invalid webhook signature.", 400);
  return JSON.parse(raw);
}
export function subscriptionFields(subscription, expectedPrice) {
  const items = subscription.items?.data || [];
  if (items.length !== 1 || items[0].price?.id !== expectedPrice) throw new AccessError("Unexpected subscription product.", 400);
  return { subscriptionId: subscription.id, status: subscription.status, trialUsed: true, trialEnd: subscription.trial_end || null, accessUntil: subscription.status === "trialing" ? subscription.trial_end : (subscription.current_period_end || items[0].current_period_end || 0), cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end) };
}
export function validatePrice(price) {
  if (!price.active || price.unit_amount !== 999 || price.currency !== "usd" || price.recurring?.interval !== "month" || price.recurring?.interval_count !== 1) throw new AccessError("The subscription price must be $9.99 USD per month.", 503);
}
export function checkoutFields({ userId, customerId, origin, trialEligible }) {
  const fields = { mode: "subscription", customer: customerId, client_reference_id: userId, "line_items[0][price]": process.env.STRIPE_PRICE_ID, "line_items[0][quantity]": "1", payment_method_collection: "always", "payment_method_types[0]": "card", success_url: `${origin}/subscription?checkout=success`, cancel_url: `${origin}/subscription?checkout=canceled`, "metadata[userId]": userId, "subscription_data[metadata][userId]": userId, "custom_text[submit][message]": trialEligible ? "7 days free, then $9.99 USD per month until canceled. Cancel before your trial ends to avoid a charge." : "$9.99 USD per month until canceled." };
  if (trialEligible) { fields["subscription_data[trial_period_days]"] = "7"; fields["subscription_data[trial_settings][end_behavior][missing_payment_method]"] = "cancel"; }
  return fields;
}
