import test from "node:test";
import assert from "node:assert/strict";
import { applicationStorage } from "./application-quota.mjs";
const commands = Object.fromEntries(["GetCommand","PutCommand","QueryCommand","TransactWriteCommand"].map(name => {const Command=class{constructor(input){this.input=input;}};Object.defineProperty(Command,"name",{value:name});return[name,Command];}));
function setup(existing=0,premium=false){
 const rows=new Map(); const billing={complimentary:premium};
 const id=i=>i.toString(16).padStart(64,"0"); const key=p=>`${p.userId}:${p.id}`;
 for(let i=1;i<=existing;i++)rows.set(`alice:${id(i)}`,{userId:"alice",id:id(i)});
 const database={async send(command){const p=command.input;
  if(command.constructor.name==="GetCommand")return{Item:p.TableName==="billing"?billing:rows.get(key(p.Key))};
  if(command.constructor.name==="QueryCommand")return{Items:[...rows.values()].filter(r=>r.userId===p.ExpressionAttributeValues[":user"])};
  if(command.constructor.name==="PutCommand"){if(rows.has(key(p.Item)))throw Object.assign(Error(),{name:"ConditionalCheckFailedException"});rows.set(key(p.Item),p.Item);return{};}
  const [first,second]=p.TransactItems;const change=second.Update;const counter=rows.get(key(change.Key));const put=first.Put;const del=first.Delete;
  const firstFailed=put?rows.has(key(put.Item)):!rows.has(key(del.Key));
  const secondFailed=put?(change.ConditionExpression&&counter.count>=change.ExpressionAttributeValues[":limit"]):counter.count<=0;
  if(firstFailed||secondFailed)throw Object.assign(Error(),{name:"TransactionCanceledException",CancellationReasons:[{Code:firstFailed?"ConditionalCheckFailed":"None"},{Code:secondFailed?"ConditionalCheckFailed":"None"}]});
  if(put){rows.set(key(put.Item),put.Item);counter.count++;}else{rows.delete(key(del.Key));counter.count--;}return{};
 }};
 return{...applicationStorage({database,commands,applicationsTable:"apps",billingTable:"billing"}),rows,id,billing};
}
test("simultaneous saves cannot exceed ten on the free plan",async()=>{
 const store=setup(9);const outcomes=await Promise.allSettled([store.save({userId:"alice",id:store.id(10)}),store.save({userId:"alice",id:store.id(11)})]);
 assert.equal(outcomes.filter(r=>r.status==="fulfilled").length,1);assert.equal(outcomes.find(r=>r.status==="rejected").reason.status,402);assert.equal(store.rows.get("alice:meta#usage").count,10);
});
test("duplicate saves do not consume a slot and deletion releases exactly one",async()=>{
 const store=setup(10);await store.save({userId:"alice",id:store.id(1)});await store.remove({userId:"alice",id:store.id(1)});await store.remove({userId:"alice",id:store.id(1)});await store.save({userId:"alice",id:store.id(11)});assert.equal(store.rows.get("alice:meta#usage").count,10);
});
test("premium permits more than ten and expiration preserves records",async()=>{
 const store=setup(12,true);await store.save({userId:"alice",id:store.id(13)});store.billing.complimentary=false;store.billing.status="active";store.billing.accessUntil=1;
 await assert.rejects(store.save({userId:"alice",id:store.id(14)}),error=>error.status===402);assert.ok(store.rows.has(`alice:${store.id(13)}`));assert.equal(store.rows.get("alice:meta#usage").count,13);
});
