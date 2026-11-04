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
  const call = async (action, body, user="alice", method="POST") => { const response=await handler({rawPath:`/billing/${action}`,headers:{authorization:user},requestContext:{http:{method}},body:JSON.stringify(body || {})});return {httpStatus:response.statusCode,...JSON.parse(response.body)}; };
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
test("new checkouts and access codes are disabled without contacting Stripe",async()=>{
 const {call,calls,rows}=setup();
 for (const user of ["alice", ""]) for (const action of ["checkout","redeem"]) assert.equal((await call(action,{code:"TestAccessCode-2026"},user)).httpStatus,410);
 assert.equal(calls.length,0);assert.equal(rows.size,0);
});
test("public status grants free access without Stripe or billing records",async()=>{
 const {call,calls,rows}=setup();
 const result=await call("status",{},"","GET");assert.equal(result.httpStatus,200);assert.equal(result.premium,true);assert.equal(result.billingReady,false);assert.equal(result.trialEligible,false);assert.equal(calls.length,0);assert.equal(rows.size,0);
});
