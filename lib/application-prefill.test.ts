import assert from "node:assert/strict";
import test from "node:test";
import { getApplicationTrackerUrl } from "./application-prefill.ts";

test("prefills the tracker from a discovered internship", () => {
  const url = new URL(
    getApplicationTrackerUrl({
      id: "job-123",
      company: "North & Pine",
      title: "Software Engineering Intern",
      opportunityType: "internship",
      softwareCategory: "swe",
      location: "New York, NY",
      locations: ["New York, NY", "Remote"],
      applicationUrl: "https://example.com/jobs/123",
      source: "test",
      firstSeenAt: "2026-10-17T00:00:00.000Z",
      active: true,
    }),
    "https://wantaninternship.com",
  );

  assert.equal(url.pathname, "/applications/new");
  assert.equal(url.searchParams.get("company"), "North & Pine");
  assert.equal(url.searchParams.get("role"), "Software Engineering Intern");
  assert.equal(url.searchParams.get("location"), "New York, NY, Remote");
  assert.equal(url.searchParams.get("status"), "saved");
  assert.equal(url.searchParams.get("source_job_id"), "job-123");
  assert.equal(url.searchParams.get("source_url"), "https://example.com/jobs/123");
});
