import assert from "node:assert/strict";
import test from "node:test";
import { formatOfficialPostDate } from "./internship-dates.ts";

test("shows the source posting date instead of discovery time", () => {
  assert.equal(formatOfficialPostDate("2026-09-08T23:30:00.000Z"), "Posted Sep 8, 2026");
  assert.equal(formatOfficialPostDate(), "Posting date unavailable");
  assert.equal(formatOfficialPostDate("not-a-date"), "Posting date unavailable");
});
