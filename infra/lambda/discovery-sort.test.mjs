import assert from "node:assert/strict";
import test from "node:test";
import { discoverySortKey, effectivePostingTimestamp } from "./discovery-sort.mjs";

const now = "2026-09-14T18:00:00.000Z";

test("uses the source posting date for newest-first ordering", () => {
  assert.equal(
    effectivePostingTimestamp("2026-09-12T09:30:00.000Z", "2026-09-14T17:00:00.000Z", now),
    "2026-09-12T09:30:00.000Z",
  );
  assert.equal(
    discoverySortKey(
      { id: "job-1", postedAt: "2026-09-12T09:30:00.000Z" },
      "2026-09-14T17:00:00.000Z",
      now,
    ),
    "2026-09-12T09:30:00.000Z#job-1",
  );
});

test("falls back to first-seen time when the source date is absent or invalid", () => {
  const firstSeenAt = "2026-09-14T17:00:00.000Z";
  assert.equal(effectivePostingTimestamp(undefined, firstSeenAt, now), firstSeenAt);
  assert.equal(effectivePostingTimestamp("not-a-date", firstSeenAt, now), firstSeenAt);
});

test("does not let a bad future date jump to the top", () => {
  assert.equal(
    effectivePostingTimestamp("2027-09-14T18:00:00.000Z", "2026-09-14T17:00:00.000Z", now),
    "2026-09-14T17:00:00.000Z",
  );
});
