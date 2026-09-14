import assert from "node:assert/strict";
import test from "node:test";
import { filterInternships, getRefreshStatus } from "./internship-filters.ts";
import type { InternshipJob } from "./internships.ts";

const jobs: InternshipJob[] = [
  { id: "1", company: "Alpha", title: "Software Engineer Intern", opportunityType: "internship", softwareCategory: "swe", location: "Multiple locations", locations: ["Toronto, Canada", "Pittsburgh, PA"], applicationUrl: "https://alpha.example/1", source: "test", firstSeenAt: "", active: true },
  { id: "2", company: "Beta", title: "Machine Learning Engineer", opportunityType: "new-grad", softwareCategory: "data-ai-ml", location: "Remote - Europe", locations: ["Remote - Europe"], applicationUrl: "https://beta.example/2", source: "test", firstSeenAt: "", active: true },
  { id: "3", company: "Gamma", title: "Cloud Engineering Intern", opportunityType: "internship", softwareCategory: "cloud-devops", location: "London, UK", locations: ["London, UK"], applicationUrl: "https://gamma.example/3", source: "test", firstSeenAt: "", active: true },
];

test("USA detection checks every merged location", () => {
  assert.deepEqual(filterInternships(jobs, { keyword: "", opportunity: "all", area: "usa", category: "all" }).map((job) => job.id), ["1"]);
});

test("global and remote filters have distinct behavior", () => {
  assert.equal(filterInternships(jobs, { keyword: "", opportunity: "all", area: "global", category: "all" }).length, 3);
  assert.deepEqual(filterInternships(jobs, { keyword: "", opportunity: "all", area: "remote", category: "all" }).map((job) => job.id), ["2"]);
});

test("keyword and dropdown filters combine", () => {
  const result = filterInternships(jobs, { keyword: "machine", opportunity: "new-grad", area: "global", category: "data-ai-ml" });
  assert.deepEqual(result.map((job) => job.id), ["2"]);
});

test("cybersecurity is a distinct software category", () => {
  const securityJob: InternshipJob = {
    id: "4",
    company: "Delta",
    title: "Application Security Engineer Intern",
    opportunityType: "internship",
    softwareCategory: "cybersecurity",
    location: "Austin, TX",
    locations: ["Austin, TX"],
    applicationUrl: "https://delta.example/4",
    source: "test",
    firstSeenAt: "",
    active: true,
  };
  const result = filterInternships([...jobs, securityJob], {
    keyword: "",
    opportunity: "internship",
    area: "usa",
    category: "cybersecurity",
  });
  assert.deepEqual(result.map((job) => job.id), ["4"]);
});

test("senior roles never appear in early-career results", () => {
  const seniorJob: InternshipJob = {
    id: "senior",
    company: "Example",
    title: "Sr. Software Engineer, Security",
    opportunityType: "internship",
    softwareCategory: "cybersecurity",
    location: "Hawthorne, CA",
    locations: ["Hawthorne, CA"],
    applicationUrl: "https://example.test/senior",
    source: "test",
    firstSeenAt: "",
    active: true,
  };
  assert.equal(filterInternships([...jobs, seniorJob], {
    keyword: "",
    opportunity: "internship",
    area: "usa",
    category: "all",
  }).some((job) => job.id === "senior"), false);
});

test("timer counts down, then reports soon and delayed states", () => {
  const updatedAt = "2026-09-14T12:00:00.000Z";
  assert.equal(getRefreshStatus(updatedAt, Date.parse("2026-09-14T12:17:42.000Z")).label, "Next refresh in 42:18");
  assert.equal(getRefreshStatus(updatedAt, Date.parse("2026-09-14T13:02:00.000Z")).label, "Updating soon");
  assert.equal(getRefreshStatus(updatedAt, Date.parse("2026-09-14T13:10:00.000Z")).label, "Refresh delayed");
});
