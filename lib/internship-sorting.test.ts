import assert from "node:assert/strict";
import test from "node:test";
import type { InternshipJob } from "./internships.ts";
import { sortInternshipsNewestFirst } from "./internship-sorting.ts";

function job(id: string, company: string, postedAt?: string, firstSeenAt = ""): InternshipJob {
  return {
    id,
    company,
    title: "Software Engineer Intern",
    opportunityType: "internship",
    softwareCategory: "swe",
    location: "New York, NY",
    locations: ["New York, NY"],
    applicationUrl: `https://example.com/${id}`,
    source: "test",
    firstSeenAt,
    postedAt,
    active: true,
  };
}

test("sorts source posting dates newest first without mutating input", () => {
  const original = [
    job("older", "Older", "2026-09-10T12:00:00.000Z"),
    job("newest", "Newest", "2026-09-14T12:00:00.000Z"),
    job("middle", "Middle", "2026-09-12T12:00:00.000Z"),
  ];
  const result = sortInternshipsNewestFirst(original);

  assert.deepEqual(result.map((item) => item.id), ["newest", "middle", "older"]);
  assert.deepEqual(original.map((item) => item.id), ["older", "newest", "middle"]);
});

test("uses first-seen time only when source dates tie or are unavailable", () => {
  const result = sortInternshipsNewestFirst([
    job("older-discovery", "Beta", undefined, "2026-09-13T12:00:00.000Z"),
    job("newer-discovery", "Alpha", undefined, "2026-09-14T12:00:00.000Z"),
  ]);
  assert.deepEqual(result.map((item) => item.id), ["newer-discovery", "older-discovery"]);
});
