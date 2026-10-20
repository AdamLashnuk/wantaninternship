import test from "node:test";
import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { premiumAccess, AccessError } from "./account-access.mjs";
import { verifiedStripeEvent, matchesAccessCode, subscriptionFields, checkoutFields, validatePrice } from "./billing-core.mjs";
import { createBillingHandler } from "./billing-handler.mjs";
const hash = createHash("sha256").update("TestAccessCode-2026").digest("hex");
process.env.STRIPE_PRICE_ID = "price_monthly";
process.env.FREE_ACCESS_CODE_HASH = hash;
process.env.SITE_ORIGIN = "https://wantaninternship.com";
const commands = Object.fromEntries(["GetCommand", "UpdateCommand"].map(name => { const Command = class { constructor(input) { this.input = input; } }; Object.defineProperty(Command, "name", { value: name }); return [name, Command]; }));
function setup({ initial = {}, remote } = {}) {
  const rows = new Map(Object.entries(initial)); const calls = [];
  const db = { async send(command) {
    const p = command.input; const id = p.Key.userId.replace(/^test#/, ""); const row = rows.get(id) || { userId: id };
    if (command.constructor.name === "GetCommand") return { Item: rows.get(id) };
    const values = p.ExpressionAttributeValues;
    if (p.UpdateExpression.startsWith("REMOVE")) { if (row.checkoutLockId !== values[":lock"]) throw Object.assign(Error(),{name:"ConditionalCheckFailedException"}); delete row.checkoutLockId; delete row.checkoutLockUntil; }
    else if (p.UpdateExpression.includes("checkoutLockUntil")) { if (row.checkoutLockUntil >= values[":now"]) throw Object.assign(Error(),{name:"ConditionalCheckFailedException"}); Object.assign(row,{checkoutLockUntil: values[":until"],checkoutLockId: values[":lock"]}); }
    else for (const [name, attribute] of Object.entries(p.ExpressionAttributeNames)) row[attribute] = values[name.replace("#k", ":v")];
    rows.set(id,row); return {};
  } };
  const handler = createBillingHandler({ database: db, commands, account: async event => { if (!event.headers?.authorization) throw new AccessError("Please log in."); return { id: event.headers.authorization, email: "student@example.com", name: "Student" }; }, request: async (url, options) => { const path = String(url).split("/v1/")[1]; calls.push({path, options}); if (!remote) throw Error("Stripe must not be called"); return Response.json(await remote(path,options)); } });
  const call = async (action, body, user="alice", method="POST") => { const response=await handler({rawPath:`/billing/${action}`,headers:{authorization:user},requestContext:{http:{method}},body:JSON.stringify(body || {})});return {status:response.statusCode,...JSON.parse(response.body)}; };
  return {call,handler,rows,calls};
}
test("only current paid, trial, or complimentary access is premium",()=>{
  assert.equal(premiumAccess({status:"trialing",accessUntil:101},100),true);
  assert.equal(premiumAccess({status:"active",accessUntil:99},100),false);
  for(const status of ["past_due","unpaid","canceled","incomplete","paused"]) assert.equal(premiumAccess({status,accessUntil:200},100),false);
  assert.equal(premiumAccess({complimentary:true},100),true);
});
test("webhook verifies exact raw body, timestamp, and signature",()=>{
  const raw=JSON.stringify({type:"customer.subscription.updated"});const secret="whsec_test"; const time=1000;
  const signature=createHmac("sha256",secret).update(`${time}.${raw}`).digest("hex");
  assert.equal(verifiedStripeEvent(raw,`t=${time},v1=${signature}`,secret,time).type,"customer.subscription.updated");
  assert.throws(()=>verifiedStripeEvent(raw+" ",`t=${time},v1=${signature}`,secret,time));
  assert.throws(()=>verifiedStripeEvent(raw,`t=${time},v1=${signature}`,secret,time+301));
  assert.throws(()=>verifiedStripeEvent(raw,"t=1000,v1=forged",secret,time));
});
test("checkout fixes product, price and trial length on the server",()=>{
  const params=checkoutFields({userId:"alice",customerId:"cus_alice",origin:process.env.SITE_ORIGIN,trialEligible:true});
  assert.equal(params["subscription_data[trial_period_days]"],"7");assert.equal(params["line_items[0][price]"],"price_monthly");assert.equal(params.payment_method_collection,"always");
  assert.equal(checkoutFields({userId:"alice",customerId:"cus_alice",origin:process.env.SITE_ORIGIN,trialEligible:false})["subscription_data[trial_period_days]"],undefined);
  assert.throws(()=>validatePrice({active:true,unit_amount:1000,currency:"usd",recurring:{interval:"month",interval_count:1}}));
});
test("subscription sync rejects another price and handles item period ends",()=>{
  const sub={id:"sub_a",status:"active",items:{data:[{price:{id:"price_monthly"},current_period_end:200}]}};
  assert.equal(subscriptionFields(sub,"price_monthly").accessUntil,200);assert.throws(()=>subscriptionFields(sub,"price_other"));
});
test("free code is verified on server, persists per account and requires no Stripe calls",async()=>{
  delete process.env.STRIPE_SECRET_KEY;
  assert.equal(matchesAccessCode("TestAccessCode-2026",hash),true);assert.equal(matchesAccessCode("wrong",hash),false);
  const {call,rows,calls}=setup();
  assert.equal((await call("redeem",{code:"wrong",premium:true})).status,400);
  assert.equal((await call("redeem",{code:"TestAccessCode-2026",userId:"bob"})).premium,true);
  assert.equal(rows.get("alice").complimentary,true);assert.equal(rows.has("bob"),false);assert.equal(calls.length,0);
  assert.equal((await call("status",{},"alice","GET")).premium,true);
  assert.equal((await call("status",{},"bob","GET")).premium,false);
  assert.equal((await call("redeem",{code:"TestAccessCode-2026"},"")).status,401);
});
test("a checkout return alone grants no access and duplicate checkout is reused",async()=>{
  process.env.STRIPE_SECRET_KEY="sk_test_fake";process.env.STRIPE_WEBHOOK_SECRET="whsec_test";
  const {call,calls}=setup({initial:{alice:{userId:"alice",customerId:"cus_alice",checkoutId:"cs_pending"}},remote:async path=>{
    if(path.startsWith("checkout/sessions"))return{id:"cs_pending",status:"open",customer:"cus_alice",url:"https://checkout.stripe.com/test"};
    if(path.startsWith("prices/"))return{active:true,unit_amount:999,currency:"usd",recurring:{interval:"month",interval_count:1}};
    if(path.startsWith("subscriptions?"))return{data:[],has_more:false};throw Error(path);
  }});
  assert.equal((await call("status",{},"alice","GET")).premium,false);
  assert.equal((await call("checkout",{premium:true,price:"price_wrong"})).url,"https://checkout.stripe.com/test");
  assert.equal(calls.filter(c=>c.path==="checkout/sessions"&&c.options.method==="POST").length,0);
});
test("repeat trial is omitted and existing subscriptions block another checkout",async()=>{
  process.env.STRIPE_SECRET_KEY="sk_test_fake";process.env.STRIPE_WEBHOOK_SECRET="whsec_test";
  let active=false;let posted;
  const {call}=setup({initial:{alice:{userId:"alice",customerId:"cus_alice",trialUsed:true}},remote:async(path,options)=>{
    if(path.startsWith("prices/"))return{active:true,unit_amount:999,currency:"usd",recurring:{interval:"month",interval_count:1}};
    if(path.startsWith("subscriptions?"))return{data:[{status:active?"active":"canceled",trial_start:123}],has_more:false};
    if(path==="checkout/sessions"){posted=new URLSearchParams(options.body);return{id:"cs_new",url:"https://checkout.stripe.com/test"};}
    if(path.startsWith("checkout/sessions/"))return{status:"expired"};throw Error(path);
  }});
  assert.equal((await call("checkout")).status,200);assert.equal(posted.has("subscription_data[trial_period_days]"),false);
  active=true;assert.equal((await call("checkout")).status,409);
});
test("renewal, failed payment, cancellation and old events follow the current Stripe subscription",async()=>{
 process.env.STRIPE_SECRET_KEY="sk_test_fake";process.env.STRIPE_WEBHOOK_SECRET="whsec_test";
 const subscription={id:"sub_alice",customer:"cus_alice",metadata:{userId:"alice"},status:"active",cancel_at_period_end:false,items:{data:[{price:{id:"price_monthly"},current_period_end:Math.floor(Date.now()/1000)+3600}]}};
 const {call,handler}=setup({initial:{alice:{userId:"alice",customerId:"cus_alice",subscriptionId:"sub_alice"}},remote:async path=>{assert.equal(path,"subscriptions/sub_alice");return subscription;}});
 assert.equal((await call("status",{},"alice","GET")).premium,true);
 subscription.status="past_due";assert.equal((await call("status",{},"alice","GET")).premium,false);
 subscription.status="active";subscription.cancel_at_period_end=true;const scheduled=await call("status",{},"alice","GET");assert.equal(scheduled.premium,true);assert.equal(scheduled.cancelAtPeriodEnd,true);
 subscription.status="canceled";
 const raw=JSON.stringify({type:"customer.subscription.updated",data:{object:{...subscription,status:"active"}}});
 const time=Math.floor(Date.now()/1000);const sig=createHmac("sha256","whsec_test").update(`${time}.${raw}`).digest("hex");
 const event={rawPath:"/billing/webhook",headers:{"stripe-signature":`t=${time},v1=${sig}`},requestContext:{http:{method:"POST"}},body:raw};
 assert.equal((await handler(event)).statusCode,200);assert.equal((await handler(event)).statusCode,200);
 assert.equal((await call("status",{},"alice","GET")).premium,false);
});
test("a free code cannot silently leave an active subscription billing",async()=>{
 process.env.STRIPE_SECRET_KEY="sk_test_fake";process.env.STRIPE_WEBHOOK_SECRET="whsec_test";
 const {call,rows}=setup({initial:{alice:{userId:"alice",customerId:"cus_alice",subscriptionId:"sub_alice"}},remote:async()=>({id:"sub_alice",customer:"cus_alice",metadata:{userId:"alice"},status:"active",items:{data:[{price:{id:"price_monthly"},current_period_end:Date.now()/1000+3600}]}})});
 assert.equal((await call("redeem",{code:"TestAccessCode-2026"})).status,409);assert.notEqual(rows.get("alice").complimentary,true);
});
