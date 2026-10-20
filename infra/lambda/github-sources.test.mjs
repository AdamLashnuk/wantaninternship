import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sources = JSON.parse(
  readFileSync(new URL("./github-sources.json", import.meta.url), "utf8"),
);

test("GitHub source configuration has unique keys and supported formats", () => {
  assert.equal(new Set(sources.map((source) => source.key)).size, sources.length);
  assert.ok(sources.every((source) => ["json", "markdown", "speedy-markdown"].includes(source.format)));
  assert.ok(sources.every((source) => source.repository.startsWith("https://github.com/")));
  assert.ok(sources.every((source) => source.apiUrl.startsWith("https://api.github.com/repos/")));
});

test("collector includes software and engineering discovery repositories", () => {
  const repositories = new Set(sources.map((source) => source.repository));
  assert.ok(repositories.has("https://github.com/sndsh404/summer-2027-internships"));
  assert.ok(repositories.has("https://github.com/speedyapply/2027-AI-College-Jobs"));
  assert.ok(repositories.has("https://github.com/zshah101/Automated-List-Of-Summer-2027-and-Fall-2026-Tech-Internships"));
  assert.ok(repositories.has("https://github.com/WonOfAKind/New-Grad-And-Internships-2027"));
  assert.ok(repositories.has("https://github.com/hiderrick/Engineering-Internships-Summer-2027"));
  assert.ok(repositories.has("https://github.com/thebargon/2027-Mechanical-Engineering-Internships"));
  for (const repo of [
    "SuryaHarikrishnan/2027-internship-tracker",
    "jobright-ai/2026-Software-Engineer-Internship",
    "jobright-ai/2026-Data-Analysis-Internship",
    "jobright-ai/2026-Engineer-Internship",
    "mehek-builds/Electrical-Engineering-Internships",
    "mehek-builds/Mechanical-Engineering-Internships",
    "water473/mechanical-engineering-job-posting-tracker",
    "Khushsj30/hardware-internships-2027",
  ]) assert.ok(repositories.has(`https://github.com/${repo}`));
  assert.equal(repositories.size, 17);
  assert.equal(sources.filter((source) => source.track === "engineering").length, 16);
});

test("uses category feeds and structured engineering data instead of oversized mixed archives", () => {
  assert.ok(sources.filter((source) => source.repository.includes("WonOfAKind/")).every((source) => source.apiUrl.includes("/internships/")));
  assert.ok(sources.some((source) => source.key === "github:hiderrick:engineering" && source.format === "json" && source.apiUrl.includes("/jobs.json")));
  assert.ok(!sources.some((source) => /Summer2026|awesome-ml|krishkc5/.test(source.repository)));
});
