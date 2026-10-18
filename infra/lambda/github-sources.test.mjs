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
  assert.equal(repositories.size, 9);
  assert.equal(sources.filter((source) => source.track === "engineering").length, 4);
});
