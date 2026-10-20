import test from "node:test";
import assert from "node:assert/strict";
import { feedAccess, feedWindow } from "./feed-access.mjs";
import { AccessError, billingKey } from "./account-access.mjs";
test("public feed requests cannot raise the limit or page through the feed",async()=>{
 const query={limit:"250",cursor:"another-page",premium:"true",userId:"paid-user"};
 assert.deepEqual(feedWindow(query,false),{limit:10,cursor:undefined});
 assert.equal(await feedAccess({queryStringParameters:query,headers:{}},{getRecord(){throw Error("No account may be trusted from query");}}),false);
 assert.deepEqual(feedWindow(query,true),{limit:250,cursor:"another-page"});
});
test("only verified accounts with current entitlements unlock the feed",async()=>{
 const event={headers:{authorization:"Bearer token"}};const account=async()=>({id:"alice"});
 assert.equal(await feedAccess(event,{account,getRecord:async id=>{assert.equal(id,"alice");return{status:"trialing",accessUntil:Date.now()/1000+100};}}),true);
 assert.equal(await feedAccess(event,{account,getRecord:async()=>({status:"active",accessUntil:1})}),false);
 assert.equal(await feedAccess(event,{account:async()=>{throw new AccessError("Invalid token");},getRecord:async()=>({complimentary:true})}),false);
 assert.equal(await feedAccess({...event,queryStringParameters:{preview:"home"}},{account,getRecord:async()=>({complimentary:true})}),false);
});
test("test billing records cannot grant live-mode access",()=>{
 const original=process.env.BILLING_MODE;process.env.BILLING_MODE="test";const testKey=billingKey("alice");process.env.BILLING_MODE="live";assert.notEqual(billingKey("alice"),testKey);if(original)process.env.BILLING_MODE=original;else delete process.env.BILLING_MODE;
});
