import { randomUUID } from "node:crypto";
import { verifiedAccount, premiumAccess, publicBilling, AccessError, billingKey } from "./account-access.mjs";
import { matchesAccessCode, verifiedStripeEvent, subscriptionFields, validatePrice, checkoutFields } from "./billing-core.mjs";
export function createBillingHandler({ database: db, commands, request = fetch, account = verifiedAccount }) {
const { GetCommand, UpdateCommand } = commands;
const TableName = process.env.BILLING_TABLE;
const reply = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
async function get(userId) { return (await db.send(new GetCommand({ TableName, Key: { userId: billingKey(userId) }, ConsistentRead: true }))).Item || { userId }; }
async function update(userId, values) {
  const names = Object.fromEntries(Object.keys(values).map((key,i) => [`#k${i}`, key]));
  const vals = Object.fromEntries(Object.values(values).map((value,i) => [`:v${i}`, value]));
  await db.send(new UpdateCommand({ TableName, Key: { userId: billingKey(userId) }, UpdateExpression: "SET " + Object.keys(values).map((_,i)=>`#k${i} = :v${i}`).join(", "), ExpressionAttributeNames: names, ExpressionAttributeValues: vals }));
}
async function acquireLock(userId) {
  const lockId = randomUUID();
  try { await db.send(new UpdateCommand({ TableName, Key: { userId: billingKey(userId) }, UpdateExpression: "SET checkoutLockUntil = :until, checkoutLockId = :lock", ConditionExpression: "attribute_not_exists(checkoutLockUntil) OR checkoutLockUntil < :now", ExpressionAttributeValues: { ":until": Date.now() + 60000, ":now": Date.now(), ":lock": lockId } })); }
  catch (error) { if (error.name === "ConditionalCheckFailedException") throw new AccessError("A billing change is already in progress. Please wait a moment.", 409); throw error; }
  return lockId;
}
async function releaseLock(userId, lockId) {
  await db.send(new UpdateCommand({ TableName, Key: { userId: billingKey(userId) }, UpdateExpression: "REMOVE checkoutLockUntil, checkoutLockId", ConditionExpression: "checkoutLockId = :lock", ExpressionAttributeValues: { ":lock": lockId } }));
}
async function stripe(path, fields, idempotencyKey) {
  if (!process.env.STRIPE_SECRET_KEY) throw new AccessError("Payments are being set up. Please try again soon.", 503);
  const mode = process.env.BILLING_MODE || "test";
  if (!(process.env.STRIPE_SECRET_KEY || "").startsWith(`sk_${mode}_`)) throw new AccessError("The Stripe key does not match the configured billing mode.", 503);
  const response = await request(`https://api.stripe.com/v1/${path}`, { method: fields ? "POST" : "GET", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`, "Stripe-Version": "2025-06-30.basil", ...(fields ? { "Content-Type": "application/x-www-form-urlencoded" } : {}), ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}) }, body: fields ? new URLSearchParams(fields).toString() : undefined, signal: AbortSignal.timeout(12000) });
  const payload = await response.json();
  if (!response.ok) { console.error("Stripe request failed", payload.error?.code || response.status); throw new AccessError("We couldn’t complete the billing request. Please try again.", 502); }
  return payload;
}
async function sync(userId, subscriptionId) {
  const record = await get(userId);
  const subscription = await stripe(`subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (subscription.metadata?.userId !== userId || subscription.customer !== record.customerId) throw new AccessError("Subscription account mismatch.", 403);
  // Ignore notifications for a previous subscription after a new one was started.
  if (record.subscriptionId && record.subscriptionId !== subscriptionId) return record;
  const fields = subscriptionFields(subscription, process.env.STRIPE_PRICE_ID);
  await update(userId, fields);
  return { ...record, ...fields };
}
async function refresh(userId, record) {
  if (record.complimentary) return record;
  if (!process.env.STRIPE_SECRET_KEY) return record;
  if (record.checkoutId) {
    const checkout = await stripe(`checkout/sessions/${encodeURIComponent(record.checkoutId)}`);
    if (checkout.status === "complete" && checkout.subscription && checkout.customer === record.customerId) {
      // A completed session created by this server may replace a previous canceled subscription.
      if (record.subscriptionId !== checkout.subscription) await update(userId, { subscriptionId: checkout.subscription });
      return sync(userId, checkout.subscription);
    }
  }
  return record.subscriptionId ? sync(userId, record.subscriptionId) : record;
}
return async function handler(event) {
  const action = (event.rawPath || "").split("/").pop();
  const method = event.requestContext?.http?.method;
  const raw = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString() : event.body || "";
  try {
    if (action === "webhook") {
      if (method !== "POST") return reply(405, { error: "Unsupported request." });
      const notification = verifiedStripeEvent(raw, event.headers?.["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
      if (notification.type === "checkout.session.completed") {
        const checkout = await stripe(`checkout/sessions/${encodeURIComponent(notification.data.object.id)}`);
        const userId = checkout.client_reference_id;
        if (userId && checkout.status === "complete" && checkout.subscription) {
          const record = await get(userId);
          if (record.customerId === checkout.customer && record.checkoutId === checkout.id) { await update(userId, { subscriptionId: checkout.subscription }); await sync(userId, checkout.subscription); }
        }
      } else if (notification.type.startsWith("customer.subscription.")) {
        const subscription = notification.data.object;
        const userId = subscription.metadata?.userId;
        if (userId) { const record = await get(userId); if (record.customerId === subscription.customer) await sync(userId, subscription.id); }
      } else if (["invoice.paid", "invoice.payment_failed"].includes(notification.type)) {
        const invoice = notification.data.object;
        const subId = invoice.subscription || invoice.parent?.subscription_details?.subscription;
        if (typeof subId === "string") { const sub = await stripe(`subscriptions/${encodeURIComponent(subId)}`); if (sub.metadata?.userId) await sync(sub.metadata.userId, subId); }
      }
      return reply(200, { received: true });
    }
    const user = await account(event);
    let record = await get(user.id);
    if (action === "status" && method === "GET") {
      record = await refresh(user.id, record);
      return reply(200, publicBilling(record));
    }
    if (method !== "POST") return reply(405, { error: "Unsupported request." });
    let body; try { if (raw.length > 4000) throw Error(); body = JSON.parse(raw || "{}"); } catch { throw new AccessError("Invalid request.", 400); }
    if (action === "redeem") {
      if (!matchesAccessCode(body?.code, process.env.FREE_ACCESS_CODE_HASH)) throw new AccessError("That access code is not valid.", 400);
      const lockId = await acquireLock(user.id);
      try {
      record = await refresh(user.id, await get(user.id));
      if (record.complimentary) return reply(200, publicBilling(record));
      if (["active", "trialing", "past_due", "unpaid", "incomplete"].includes(record.status)) throw new AccessError("Manage your existing subscription before redeeming a free-access code. Existing subscriptions are not automatically canceled.", 409);
      // Expire any unfinished checkout so it cannot later create a paid subscription.
      if (record.checkoutId && process.env.STRIPE_SECRET_KEY) { const checkout = await stripe(`checkout/sessions/${encodeURIComponent(record.checkoutId)}`); if (checkout.status === "open") await stripe(`checkout/sessions/${checkout.id}/expire`, {}); }
      await update(user.id, { complimentary: true, complimentaryGrantedAt: new Date().toISOString() });
      return reply(200, publicBilling({ ...record, complimentary: true }));
      } finally { await releaseLock(user.id, lockId); }
    }
    if (action === "portal") {
      if (!record.customerId) throw new AccessError("There is no billing account to manage yet.", 400);
      const portal = await stripe("billing_portal/sessions", { customer: record.customerId, return_url: `${process.env.SITE_ORIGIN}/subscription` });
      return reply(200, { url: portal.url });
    }
    if (action !== "checkout") return reply(404, { error: "Not found." });
    if (!process.env.STRIPE_PRICE_ID || !process.env.STRIPE_WEBHOOK_SECRET) throw new AccessError("Payments are being set up. Please try again soon.", 503);
    if (premiumAccess(record)) throw new AccessError("Your account already has Premium access.", 409);
    const lockId = await acquireLock(user.id);
    try {
      record = await refresh(user.id, await get(user.id));
      if (premiumAccess(record)) throw new AccessError("Your account already has Premium access.", 409);
      validatePrice(await stripe(`prices/${encodeURIComponent(process.env.STRIPE_PRICE_ID)}`));
      if (!record.customerId) {
        const customer = await stripe("customers", { email: user.email, name: user.name, "metadata[userId]": user.id }, `customer-${user.id}`);
        await update(user.id, { customerId: customer.id }); record.customerId = customer.id;
      }
      const existing = await stripe(`subscriptions?customer=${encodeURIComponent(record.customerId)}&status=all&limit=100`);
      if (existing.has_more) throw new AccessError("Please contact support to manage this billing account.", 409);
      if (existing.data.some(s => !["canceled", "incomplete_expired"].includes(s.status))) throw new AccessError("An existing subscription needs attention. Use Manage subscription.", 409);
      if (record.checkoutId) { const previous = await stripe(`checkout/sessions/${encodeURIComponent(record.checkoutId)}`); if (previous.status === "open") return reply(200, { url: previous.url }); }
      const trialEligible = !record.trialUsed && !existing.data.some(s => s.trial_start);
      const checkout = await stripe("checkout/sessions", checkoutFields({ userId: user.id, customerId: record.customerId, origin: process.env.SITE_ORIGIN, trialEligible }), `checkout-${user.id}-${lockId}`);
      await update(user.id, { checkoutId: checkout.id });
      return reply(200, { url: checkout.url });
    } finally {
      await releaseLock(user.id, lockId);
    }
  } catch (error) {
    if (error instanceof AccessError) return reply(error.status, { error: error.message });
    console.error("Billing request failed", error.name);
    return reply(503, { error: "Billing is temporarily unavailable. Please try again." });
  }
}

}
