import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canonicalizeApplicationUrl, deduplicateJobs, hasOpportunitySignal, inferEngineeringDiscipline, inferSoftwareCategory, isRelevantEngineering, isRelevantSoftware, parseListingsJson, parseSpeedyMarkdown, resolveCompanyWebsite } from "./normalize.mjs";

const fixture = (name) => readFileSync(new URL(`./test/fixtures/${name}`, import.meta.url), "utf8");
const config = (key) => ({ key, label: key, repository: `https://github.com/${key}`, opportunityType: "internship", collectedAt: "2026-09-14T12:00:00.000Z" });
const engineeringConfig = (key) => ({ ...config(key), track: "engineering" });

test("parses SpeedyApply tables while excluding quant", () => {
  const jobs = parseSpeedyMarkdown(fixture("speedy.md"), config("speedyapply"));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company, "Example Co");
  assert.equal(jobs[0].applicationUrl, "https://jobs.example.com/123");
});

test("parses five-column markdown tables with absolute posting dates", () => {
  const jobs = parseSpeedyMarkdown(fixture("sndsh.md"), config("sndsh404"));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company, "Example Labs");
  assert.equal(jobs[0].postedAt, "2026-09-12T00:00:00.000Z");
  assert.equal(jobs[0].applicationUrl, "https://jobs.example.com/software-intern");
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

test("parses wrapped JSON feeds with snake-case dates", () => {
  const jobs = parseListingsJson(fixture("zshah.json"), config("zshah101"));
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company, "Example Cloud");
  assert.equal(jobs[0].postedAt, "2026-09-13T15:30:00.000Z");
  assert.equal(jobs[0].softwareCategory, "cloud-devops");
});

test("parses engineering internships and co-ops without leaking software or new-grad roles", () => {
  const jobs = parseListingsJson(fixture("engineering.json"), engineeringConfig("engineering"));
  assert.equal(jobs.length, 3);
  assert.equal(jobs[0].positionType, "co-op");
  assert.equal(jobs[0].engineeringDiscipline, "mechanical");
  assert.equal(jobs[1].engineeringDiscipline, "electrical");
  assert.equal(jobs[2].engineeringDiscipline, "civil");
  assert.ok(jobs.every((job) => job.track === "engineering"));
});

test("classifies the major engineering disciplines", () => {
  assert.equal(inferEngineeringDiscipline("Chemical Process Engineering Intern"), "chemical");
  assert.equal(inferEngineeringDiscipline("Biomedical Engineering Intern"), "biomedical");
  assert.equal(inferEngineeringDiscipline("FPGA Hardware Intern"), "computer-hardware");
  assert.equal(inferEngineeringDiscipline("Environmental Engineering Co-op"), "environmental");
  assert.equal(isRelevantEngineering({ company: "X", title: "Software Engineering Intern", opportunityType: "internship", positionType: "internship", applicationUrl: "https://x.example/job/7", track: "engineering" }), false);
});

test("keeps technical security roles and rejects non-software business roles", () => {
  assert.equal(canonicalizeApplicationUrl("https://simplify.jobs/p/abc"), "");
  assert.equal(isRelevantSoftware({ company: "X", title: "Cybersecurity Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/1" }), true);
  assert.equal(isRelevantSoftware({ company: "X", title: "Brokerage Risk Analyst Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/2" }), false);
  assert.equal(isRelevantSoftware({ company: "X", title: "Crypto Operations Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/3" }), false);
  assert.equal(isRelevantSoftware({ company: "X", title: "Software Sales Intern", opportunityType: "internship", applicationUrl: "https://x.example/job/4" }), false);
  assert.equal(isRelevantSoftware({ company: "X", title: "Sr. Software Engineer, Security", opportunityType: "internship", applicationUrl: "https://x.example/job/5" }), false);
  assert.equal(isRelevantSoftware({ company: "X", title: "Senior Android Engineer, Wallet", opportunityType: "internship", applicationUrl: "https://x.example/job/6" }), false);
  assert.equal(hasOpportunitySignal("Early Career Software Engineer"), true);
  assert.equal(hasOpportunitySignal("Sr. Software Engineer"), false);
  assert.equal(inferSoftwareCategory("Application Security Engineer Intern"), "cybersecurity");
});

test("resolves employer websites without using aggregator branding", () => {
  assert.equal(
    resolveCompanyWebsite("Waymo", "https://simplify.jobs/c/Waymo", "https://careers.withwaymo.com/jobs/123"),
    "https://careers.withwaymo.com",
  );
  assert.equal(
    resolveCompanyWebsite("Robinhood", "https://simplify.jobs/c/Robinhood", "https://boards.greenhouse.io/robinhood/jobs/123"),
    "https://robinhood.com",
  );
  assert.equal(
    resolveCompanyWebsite("Scale AI", "https://simplify.jobs/c/Scale-AI", "https://job-boards.greenhouse.io/scaleai/jobs/123"),
    "https://scaleai.com",
  );
});

test("deduplicates by canonical URL, prefers ATS and merges locations", () => {
  const github = { company: "Example Co", title: "Software Engineer Intern", opportunityType: "internship", softwareCategory: "swe", locations: ["New York, NY"], location: "New York, NY", applicationUrl: "https://jobs.example.com/1?utm_source=x", applyUrl: "https://jobs.example.com/1?utm_source=x", source: "speedyapply", sourceKey: "speedy:usa", active: true, sourcePriority: 10 };
  const direct = { ...github, locations: ["Pittsburgh, PA"], location: "Pittsburgh, PA", applicationUrl: "https://jobs.example.com/1", applyUrl: "https://jobs.example.com/1", source: "greenhouse", sourceKey: "greenhouse:example", sourcePriority: 100 };
  const jobs = deduplicateJobs([github, direct]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].source, "greenhouse");
  assert.deepEqual(new Set(jobs[0].locations), new Set(["New York, NY", "Pittsburgh, PA"]));
});

test("keeps software and engineering partitions separate during deduplication", () => {
  const software = { company: "Example Co", title: "Software Engineering Intern", opportunityType: "internship", softwareCategory: "swe", locations: ["Austin, TX"], location: "Austin, TX", applicationUrl: "https://jobs.example.com/shared", applyUrl: "https://jobs.example.com/shared", source: "software-list", sourceKey: "software:list", active: true, sourcePriority: 10 };
  const engineering = { ...software, title: "Electrical Hardware Intern", track: "engineering", positionType: "internship", engineeringDiscipline: "electrical", source: "engineering-list", sourceKey: "engineering:list" };
  const jobs = deduplicateJobs([software, engineering]);
  assert.equal(jobs.length, 2);
});

const octoberConfig = { ...config('expanded'), collectedAt: '2026-10-20T12:00:00.000Z' };

test('parses Jobright titles as links and infers the current year for month/day dates', () => {
  const jobs = parseSpeedyMarkdown(`
| Company | Job Title | Location | Work Model | Date Posted |
| --- | --- | --- | --- | --- |
| **[Example Labs](https://example.com)** | **[Software Engineering Intern](https://jobright.ai/jobs/info/123?utm_source=git)** | Pittsburgh, PA | On Site | Oct 19 |
`, octoberConfig);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].company, 'Example Labs');
  assert.equal(jobs[0].title, 'Software Engineering Intern');
  assert.equal(jobs[0].applicationUrl, 'https://jobright.ai/jobs/info/123');
  assert.equal(jobs[0].postedAt, '2026-10-19T00:00:00.000Z');
});

test('parses Surya employer application links without treating the Sources column as a date', () => {
  const jobs = parseSpeedyMarkdown(`
| Company | Role | Location | Terms | Date Posted | Days Old | Sources |
| --- | --- | --- | --- | --- | --- | --- |
| [Example Labs](https://jobs.example.com/intern/123) | Machine Learning Intern | Remote | Summer 2027 | 2026-10-18 | 2 | simplify-2026 |
`, octoberConfig);
  assert.equal(jobs[0].applicationUrl, 'https://jobs.example.com/intern/123');
  assert.equal(jobs[0].postedAt, '2026-10-18T00:00:00.000Z');
});

test('parses WonOfAKind angle-bracket URLs and separates publication from discovery dates', () => {
  const jobs = parseSpeedyMarkdown(`
| Company | Role | Location | Salary / Hourly | Grad Window | Posted / First Seen | Apply |
| --- | --- | --- | --- | --- | --- | --- |
| 🔥 Example | Software Engineer Intern | Remote | $30 | 2027 | Posted Oct 19, 2026<br>First seen Oct 20, 2026 | [Apply](<https://jobs.example.com/Software-(Intern)>) |
| Other | Software Engineering Intern | Remote | - | 2027 | First seen Sep 1, 2026 | [Apply](<https://jobs.example.com/old>) |
`, octoberConfig);
  assert.equal(jobs[0].company, 'Example');
  assert.equal(jobs[0].applicationUrl, 'https://jobs.example.com/Software-(Intern)');
  assert.equal(jobs[0].postedAt, '2026-10-19T00:00:00.000Z');
  assert.equal(jobs[0].firstSeenAt, '2026-10-20T00:00:00.000Z');
  assert.equal(jobs[1].postedAt, undefined);
  assert.equal(jobs[1].firstSeenAt, '2026-09-01T00:00:00.000Z');
});

test('parses Water role/location columns and ignores Checked when Posted is missing', () => {
  const jobs = parseSpeedyMarkdown(`
| Company | ATS | Role | Location | Term / type | Posted | Found | Checked |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Example | Workday | [Mechanical Engineering Co-op](<https://jobs.example.com/mechanical>) | Pittsburgh, PA | Spring 2027 / co-op | — | 2026-10-01 | 2026-10-20 |
`, { ...octoberConfig, track: 'engineering' });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].positionType, 'co-op');
  assert.equal(jobs[0].location, 'Pittsburgh, PA');
  assert.equal(jobs[0].postedAt, undefined);
  assert.equal(jobs[0].firstSeenAt, '2026-10-01T00:00:00.000Z');
});

test('parses Mehek role links and uses the Posted column before Visa signal', () => {
  const jobs = parseSpeedyMarkdown(`
| Company | Role | Location | Pay | Posted | Visa signal |
| --- | --- | --- | --- | --- | --- |
| **Example** | [Electrical Engineering Intern](https://trylitos.com/job/123) | Pittsburgh, PA; New York, NY | | Oct 19 | Employer has H-1B filings |
`, { ...octoberConfig, track: 'engineering' });
  assert.equal(jobs[0].postedAt, '2026-10-19T00:00:00.000Z');
  assert.deepEqual(jobs[0].locations, ['Pittsburgh, PA', 'New York, NY']);
});

test('parses hardware Posted-before-Link tables and excludes their new-grad section', () => {
  const jobs = parseSpeedyMarkdown(`
## Internships
| Company | Role | Location | Posted | Link |
| --- | --- | --- | --- | --- |
| Example | Firmware Engineer Intern | Remote | 2026-10-19 | [Apply](https://jobs.example.com/firmware-(intern)) |
## New Grad
| Company | Role | Location | Posted | Link |
| --- | --- | --- | --- | --- |
| Example | Electrical Engineer | Remote | 2026-10-20 | [Apply](https://jobs.example.com/fulltime) |
`, { ...octoberConfig, track: 'engineering' });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].applicationUrl, 'https://jobs.example.com/firmware-(intern)');
  assert.equal(jobs[0].postedAt, '2026-10-19T00:00:00.000Z');
});

test('yearless dates roll into the previous year across January', () => {
  const jobs = parseSpeedyMarkdown(`
| Company | Role | Location | Apply | Posted |
| --- | --- | --- | --- | --- |
| Example | Software Engineer Intern | Remote | [Apply](https://jobs.example.com/1) | Dec 31 |
`, { ...octoberConfig, collectedAt: '2027-01-02T12:00:00.000Z' });
  assert.equal(jobs[0].postedAt, '2026-12-31T00:00:00.000Z');
});

test('deduplication retains the earliest imported discovery date across sources', () => {
  const job = { company: 'Example', title: 'Software Engineer Intern', track: 'software', opportunityType: 'internship', applicationUrl: 'https://jobs.example.com/1', locations: ['Remote'], source: 'primary', sourceKey: 'primary', sourcePriority: 10 };
  const jobs = deduplicateJobs([job, { ...job, source: 'secondary', sourceKey: 'secondary', firstSeenAt: '2026-09-01T00:00:00.000Z' }]);
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].firstSeenAt, '2026-09-01T00:00:00.000Z');
});

test('removes Markdown links with escaped brackets in role titles', () => {
  const text = '| Company | Role | Location | Apply | Posted |\n| --- | --- | --- | --- | --- |\n| Example | [Hardware Reliability Intern \\[Winter 2027\\]](<https://jobs.example.com/hardware>) | Remote | [Apply](https://jobs.example.com/hardware) | 2026-10-19 |';
  const jobs = parseSpeedyMarkdown(text, { ...octoberConfig, track: 'engineering' });
  assert.equal(jobs[0].title, 'Hardware Reliability Intern [Winter 2027]');
});
