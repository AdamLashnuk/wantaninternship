import assert from "node:assert/strict";
import test from "node:test";
import { formatOfficialPostDate } from "./internship-dates.ts";

test("shows the source posting date instead of discovery time", () => {
  assert.equal(formatOfficialPostDate("2026-09-08T23:30:00.000Z"), "Posted Sep 8, 2026");
  assert.equal(formatOfficialPostDate(), "Posting date unavailable");
  assert.equal(formatOfficialPostDate("not-a-date"), "Posting date unavailable");
});

test("legacy Greenhouse edits are labeled separately from discovery", async () => {
  const { formatJobDate, formatJobUpdate } = await import("./internship-dates.ts");
  const job = { source: "greenhouse", postedAt: "2026-10-19T12:00:00Z", firstSeenAt: "2026-10-01T12:00:00Z" };
  assert.equal(formatJobDate(job), "First discovered Oct 1, 2026");
  assert.equal(formatJobUpdate(job), "Updated Oct 19, 2026");
  assert.equal(formatJobUpdate({ ...job, postedAt: job.firstSeenAt }), null);
});
