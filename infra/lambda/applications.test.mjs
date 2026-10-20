import test from "node:test";
import assert from "node:assert/strict";
import { createHandler } from "./applications-handler.mjs";
import { savedRecord } from "./application-records.mjs";
const commands = Object.fromEntries(["PutCommand", "QueryCommand", "UpdateCommand", "DeleteCommand"].map(name => {
  const Command = class { constructor(input) { this.input = input; } };
  Object.defineProperty(Command, "name", { value: name });
  return [name, Command];
}));
process.env.ACCOUNTS_CLIENT_ID = "our-client";
process.env.ACCOUNTS_ISSUER = "our-pool";
const token = Buffer.from(JSON.stringify({ client_id: "our-client", iss: "our-pool" })).toString("base64url");
const job = { title: "Software Intern", company: "Example", location: "NY", applicationUrl: "https://example.com/jobs/1" };
function setup() {
  const rows = new Map();
  const database = { async send(command) {
    const p = command.input;
    const key = JSON.stringify(p.Key || (p.Item && { userId: p.Item.userId, id: p.Item.id }));
    if (command.constructor.name === "PutCommand") {
      if (rows.has(key)) throw Object.assign(Error(), { name: "ConditionalCheckFailedException" });
      rows.set(key, p.Item); return {};
    }
    if (command.constructor.name === "QueryCommand") return { Items: [...rows.values()].filter(row => row.userId === p.ExpressionAttributeValues[":user"]) };
    if (command.constructor.name === "DeleteCommand") { rows.delete(key); return {}; }
    if (!rows.has(key)) throw Object.assign(Error(), { name: "ConditionalCheckFailedException" });
    Object.assign(rows.get(key), { status: p.ExpressionAttributeValues[":status"], notes: p.ExpressionAttributeValues[":notes"] }); return {};
  } };
  const handler = createHandler({ database, commands, verify: async (_url, options) => {
    const access = JSON.parse(options.body).AccessToken;
    if (access === "invalid") return Response.json({}, { status: 400 });
    return Response.json({ UserAttributes: [{ Name: "sub", Value: access.split(".")[0] }] });
  } });
  const call = async (user, method, body) => {
    const result = await handler({ headers: { authorization: `Bearer ${user}.${token}.sig` }, requestContext: { http: { method } }, body: JSON.stringify(body) });
    return { status: result.statusCode, ...JSON.parse(result.body) };
  };
  return { call, handler };
}
test("saving again preserves status and notes", async () => {
  const { call } = setup();
  const saved = await call("alice", "POST", job);
  assert.equal(saved.status, 200);
  await call("alice", "PATCH", { id: saved.id, status: "Applied", notes: "Follow up Friday" });
  await call("alice", "POST", job);
  const result = await call("alice", "GET");
  assert.equal(result.applications.length, 1);
  assert.equal(result.applications[0].status, "Applied");
  assert.equal(result.applications[0].notes, "Follow up Friday");
  assert.equal(result.applications[0].userId, undefined);
});
test("accounts cannot read, update, or remove each other's applications", async () => {
  const { call } = setup();
  const saved = await call("alice", "POST", { ...job, userId: "bob" });
  assert.equal((await call("bob", "GET")).applications.length, 0);
  assert.equal((await call("bob", "PATCH", { id: saved.id, status: "Offer", notes: "" })).status, 404);
  await call("bob", "DELETE", { id: saved.id });
  assert.equal((await call("alice", "GET")).applications.length, 1);
  await call("alice", "DELETE", { id: saved.id });
  assert.equal((await call("alice", "GET")).applications.length, 0);
});
test("unverified requests never reach storage", async () => {
  const handler = createHandler({ commands, database: { send() { throw Error("storage must not run"); } }, verify: async () => Response.json({}, { status: 400 }) });
  assert.equal((await handler({ headers: {} })).statusCode, 401);
  assert.equal((await handler({ headers: { authorization: "Bearer invalid" } })).statusCode, 401);
});
test("invalid links and statuses are rejected", async () => {
  assert.throws(() => savedRecord({ ...job, applicationUrl: "javascript:alert(1)" }, "alice"));
  const { call } = setup(); const saved = await call("alice", "POST", job);
  assert.equal((await call("alice", "PATCH", { id: saved.id, status: "Unknown", notes: "" })).status, 400);
});
