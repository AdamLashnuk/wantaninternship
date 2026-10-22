import assert from "node:assert/strict";
import test from "node:test";
import { selectHomePreview } from "./home-preview.ts";
import type { InternshipJob } from "./internships.ts";

test("public homepage contains at most ten unique active recent internships and ignores edit timestamps", () => {
  const now = Date.parse("2026-10-22T12:00:00Z");
  const jobs: InternshipJob[] = Array.from({length: 16}, (_, i) => ({
    id: String(i), company: `Company ${i}`, title: "Engineering Intern", opportunityType: "internship",
    location: "USA", source: "github", active: true, firstSeenAt: new Date(now - i * 3600000).toISOString(),
    applicationUrl: `https://example.com/jobs/${i}`,
  }));
  const invalid: InternshipJob[] = [
    {...jobs[0], id:"closed", active:false, applicationUrl:"https://example.com/closed"},
    {...jobs[0], id:"newgrad", opportunityType:"new-grad", applicationUrl:"https://example.com/grad"},
    {...jobs[0], id:"old", source:"greenhouse", firstSeenAt:"2026-09-01T00:00:00Z", postedAt:"2026-10-22T11:00:00Z", applicationUrl:"https://example.com/edited"},
  ];
  const result = selectHomePreview([...invalid, jobs[0], ...jobs], now);
  assert.equal(result.length, 10);
  assert.equal(new Set(result.map(job => job.applicationUrl)).size, 10);
  assert.deepEqual(result.map(job => job.id), jobs.slice(0, 10).map(job => job.id));
});
