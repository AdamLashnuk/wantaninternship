import test from "node:test";
import assert from "node:assert/strict";
import { feedAccess, feedWindow } from "./feed-access.mjs";
test("guests can use the complete paginated feed without billing or identity calls", async () => {
  assert.equal(await feedAccess({ headers: {} }, { getRecord() { throw Error("No billing lookup"); } }), true);
  assert.deepEqual(feedWindow({ limit: "250", cursor: "next" }), { limit: 250, cursor: "next" });
});
test("homepage remains a ten-item preview and public limits stay bounded", () => {
  assert.deepEqual(feedWindow({ preview: "home", limit: "250", cursor: "next" }), { limit: 10, cursor: undefined });
  for (const [limit, expected] of [["9999",250],["-1",1],["invalid",50]]) assert.equal(feedWindow({ limit }).limit, expected);
});
