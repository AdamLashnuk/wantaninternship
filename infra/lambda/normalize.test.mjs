import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeApplicationUrl, deduplicateJobs, inferSoftwareCategory, isRelevantSoftware, parseListingsJson, parseSpeedyMarkdown } from "./normalize.mjs";

const fixture = (name) => readFileSync(new URL(`./test/fixtures/${name}`, import.meta.url), "utf8");
const config = (key) => ({ key, label: key, repository: `https://github.com/${key}`, opportunityType: "internship", collectedAt: "2026-09-14T12:00:00.000Z" });

test("parses SpeedyApply tables while excluding quant", () => {
  const jobs = parseSpeedyMarkdown(fixture("speedy.md"), config("speedyapply"));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company, "Example Co");
  assert.equal(jobs[0].applicationUrl, "https://jobs.example.com/123");
});

test("parses vanshb03 JSON, filters hardware and keeps merged locations", () => {
  const jobs = parseListingsJson(fixture("vansh.json"), config("vanshb03"));
  assert.equal(jobs.length, 1);
  assert.deepEqual(jobs[0].locations, ["Pittsburgh, PA", "New York, NY"]);
});

test("parses Simplify JSON and categorizes cloud roles", () => {
  const jobs = parseListingsJson(fixture("simplify.json"), config("simplify"));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].softwareCategory, "cloud-devops");
  assert.equal(jobs[0].applicationUrl, "https://boards.greenhouse.io/cloud/jobs/77");
});

test("keeps technical security roles and rejects non-software business roles", () => {
  assert.equal(canonicalizeApplicationUrl("https://simplify.jobs/p/abc"), "");
  assert.equal(isRelevantSoftware({ company: "X", title: "Cybersecurity Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/1" }), true);
  assert.equal(isRelevantSoftware({ company: "X", title: "Brokerage Risk Analyst Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/2" }), false);
  assert.equal(isRelevantSoftware({ company: "X", title: "Crypto Operations Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/3" }), false);
  assert.equal(isRelevantSoftware({ company: "X", title: "Software Sales Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/4" }), false);
  assert.equal(inferSoftwareCategory("Application Security Engineer Intern"), "cybersecurity");
});

test("deduplicates by canonical URL, prefers ATS and merges locations", () => {
  const github = { company: "Example Co", title: "Software Engineer Intern", opportunityType: "internship", softwareCategory: "swe", locations: ["New York, NY"], location: "New York, NY", applicationUrl: "https://jobs.example.com/1?utm_source=x", applyUrl: "https://jobs.example.com/1?utm_source=x", source: "speedyapply", sourceKey: "speedy:usa", active: true, sourcePriority: 10 };
  const direct = { ...github, locations: ["Pittsburgh, PA"], location: "Pittsburgh, PA", applicationUrl: "https://jobs.example.com/1", applyUrl: "https://jobs.example.com/1", source: "greenhouse", sourceKey: "greenhouse:example", sourcePriority: 100 };
  const jobs = deduplicateJobs([github, direct]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].source, "greenhouse");
  assert.deepEqual(new Set(jobs[0].locations), new Set(["New York, NY", "Pittsburgh, PA"]));
});
