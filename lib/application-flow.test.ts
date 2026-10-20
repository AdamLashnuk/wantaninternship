import test from "node:test";
import assert from "node:assert/strict";
import { applicationCounts, flowLayout } from "./application-flow.ts";

test("flow counts each application once at its actual current status", () => {
  const counts = applicationCounts([{ status: "Saved" }, { status: "Applied" }, { status: "Interviewing" }, { status: "Offer" }, { status: "Rejected" }, { status: "Withdrawn" }, { status: "Offer" }]);
  assert.deepEqual(counts, [1, 1, 1, 2, 1, 1]);
  const layout = flowLayout(counts);
  assert.equal(layout.total, 7);
  assert.ok(Math.abs(layout.branches.reduce((sum, branch) => sum + branch.thickness, 0) - layout.height) < 1e-9);
});
test("a status change redistributes ribbons without changing the total", () => {
  const before = flowLayout([2, 4, 1, 0, 1, 0]);
  const after = flowLayout([2, 3, 2, 0, 1, 0]);
  assert.equal(before.total, after.total);
  assert.ok(after.branches[1].thickness / after.height < before.branches[1].thickness / before.height);
  assert.ok(after.branches[2].thickness / after.height > before.branches[2].thickness / before.height);
});
test("empty and interpolated flow values produce finite, non-overlapping nodes", () => {
  for (const values of [[0,0,0,0,0,0], [.5, 1.25, .75, 0, .1, 0], [5000,1,0,0,0,0]]) {
    const layout = flowLayout(values);
    assert.ok(Number.isFinite(layout.top));
    assert.ok(layout.height <= 210);
    layout.branches.forEach(branch => { assert.ok(branch.thickness <= 38); assert.doesNotMatch(branch.path, /NaN|Infinity/); });
  }
});
