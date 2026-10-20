import assert from "node:assert/strict";
import test from "node:test";
import { preserveJobFreshness } from "./job-freshness.mjs";
import { discoverySortKey } from "./discovery-sort.mjs";

test("repeated employer edits never promote a known listing", () => {
  const firstSeenAt = "2026-10-01T12:00:00Z";
  let prior = { id: "roblox", source: "greenhouse", firstSeenAt, postedAt: "2026-10-17T12:00:00Z" };
  for (const day of [18, 19, 20]) {
    const now = `2026-10-${day}T12:00:00Z`;
    prior = preserveJobFreshness({ id: "roblox", source: "greenhouse", sourceUpdatedAt: now }, prior, now);
    assert.equal(prior.firstSeenAt, firstSeenAt);
    assert.equal(prior.postedAt, undefined);
    assert.equal(prior.sourceUpdatedAt, now);
    assert.equal(discoverySortKey(prior, prior.firstSeenAt, now), `${new Date(firstSeenAt).toISOString()}#roblox`);
  }
});

test("publication dates remain stable when a source refreshes a known role", () => {
  const original = "2026-10-01T12:00:00Z";
  const result = preserveJobFreshness(
    { source: "ashby", postedAt: "2026-10-19T12:00:00Z" },
    { source: "ashby", firstSeenAt: original, postedAt: original, freshnessVersion: 1 },
    "2026-10-19T12:00:00Z",
  );
  assert.equal(result.postedAt, original);
  assert.equal(result.firstSeenAt, original);
});

test("a new role gets one stable discovery date", () => {
  const now = "2026-10-19T12:00:00Z";
  const result = preserveJobFreshness({ source: "greenhouse", sourceUpdatedAt: now }, undefined, now);
  assert.equal(result.firstSeenAt, now);
  assert.equal(result.postedAt, undefined);
});

test('importing an old source discovery does not make the listing freshly discovered', () => {
  const now = '2026-10-20T12:00:00.000Z';
  const original = '2026-09-01T00:00:00.000Z';
  const result = preserveJobFreshness({ firstSeenAt: original }, undefined, now);
  assert.equal(result.firstSeenAt, original);
  assert.equal(result.postedAt, undefined);
  assert.equal(preserveJobFreshness({ firstSeenAt: now }, result, now).firstSeenAt, original);
  for (const firstSeenAt of ['invalid', '2027-01-01T00:00:00.000Z']) {
    assert.equal(preserveJobFreshness({ firstSeenAt }, undefined, now).firstSeenAt, now);
  }
});
