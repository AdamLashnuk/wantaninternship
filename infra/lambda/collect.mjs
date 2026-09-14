import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const sources = JSON.parse(
  readFileSync(new URL("./sources.json", import.meta.url), "utf8"),
);
const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const tableName = process.env.TABLE_NAME;

const internshipPattern = /\b(intern|internship|co-op|co op)\b/i;
const softwarePattern =
  /\b(software|developer|engineering|engineer|data|machine learning|artificial intelligence|ai|cloud|security|cyber|devops|site reliability|sre|product|technology|technical|it)\b/i;

function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function sourceKey(source) {
  return `${source.provider}:${source.board}`;
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function listingKey(job) {
  return `${normalize(job.company)}:${normalize(job.title)}`;
}

function stableId(job) {
  return createHash("sha256")
    .update(`${job.sourceKey}:${listingKey(job)}`)
    .digest("hex");
}

function mergeDuplicateLocations(jobs) {
  const grouped = new Map();

  for (const job of jobs) {
    const key = listingKey(job);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, { job, locations: new Set([job.location]) });
      continue;
    }

    existing.locations.add(job.location);
    if (
      new Date(job.postedAt ?? 0).getTime() >
      new Date(existing.job.postedAt ?? 0).getTime()
    ) {
      existing.job = job;
    }
  }

  return [...grouped.values()].map(({ job, locations }) => ({
    ...job,
    location: locations.size > 1 ? "Multiple locations" : job.location,
  }));
}

function isSoftwareInternship(job) {
  const searchable = [
    job.title,
    job.department,
    job.team,
    job.description,
  ].join(" ");

  return internshipPattern.test(job.title) && softwarePattern.test(searchable);
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "WantAnInternship/1.0 (wantaninternship@gmail.com)",
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function fetchGreenhouse(source) {
  const payload = await getJson(
    `https://boards-api.greenhouse.io/v1/boards/${source.board}/jobs?content=true`,
  );

  return (payload.jobs ?? []).map((job) => ({
    source: "greenhouse",
    sourceKey: sourceKey(source),
    sourceJobId: String(job.id),
    company: source.company,
    title: job.title ?? "Untitled internship",
    location: job.location?.name ?? "Location not listed",
    applyUrl: job.absolute_url,
    department: (job.departments ?? []).map((item) => item.name).join(" "),
    team: "",
    description: stripHtml(job.content),
    postedAt: job.updated_at,
  }));
}

async function fetchLever(source) {
  const payload = await getJson(
    `https://api.lever.co/v0/postings/${source.board}?mode=json`,
  );

  return (Array.isArray(payload) ? payload : []).map((job) => ({
    source: "lever",
    sourceKey: sourceKey(source),
    sourceJobId: String(job.id),
    company: source.company,
    title: job.text ?? "Untitled internship",
    location: job.categories?.location ?? "Location not listed",
    applyUrl: job.applyUrl ?? job.hostedUrl,
    department: job.categories?.department ?? "",
    team: job.categories?.team ?? "",
    description: job.descriptionPlain ?? "",
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
  }));
}

async function fetchAshby(source) {
  const payload = await getJson(
    `https://api.ashbyhq.com/posting-api/job-board/${source.board}`,
  );

  return (payload.jobs ?? []).map((job) => ({
    source: "ashby",
    sourceKey: sourceKey(source),
    sourceJobId: job.jobUrl ?? job.applyUrl,
    company: source.company,
    title: job.title ?? "Untitled internship",
    location: job.location ?? "Location not listed",
    applyUrl: job.applyUrl ?? job.jobUrl,
    department: job.department ?? "",
    team: job.team ?? "",
    description: job.descriptionPlain ?? "",
    postedAt: job.publishedAt,
  }));
}

async function fetchSource(source) {
  if (source.provider === "greenhouse") return fetchGreenhouse(source);
  if (source.provider === "lever") return fetchLever(source);
  if (source.provider === "ashby") return fetchAshby(source);
  throw new Error(`Unsupported provider: ${source.provider}`);
}

async function saveJob(job, now) {
  const id = stableId(job);
  const existing = await documentClient.send(
    new GetCommand({ TableName: tableName, Key: { id } }),
  );

  await documentClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        id,
        company: job.company,
        title: job.title,
        location: job.location,
        applyUrl: job.applyUrl,
        source: job.source,
        sourceKey: job.sourceKey,
        sourceJobId: job.sourceJobId,
        postedAt: job.postedAt,
        firstSeenAt: existing.Item?.firstSeenAt ?? now,
        discoverySort: existing.Item?.discoverySort ?? `${now}#${id}`,
        lastSeenAt: now,
        active: true,
        missingRuns: 0,
        categoryStatus: "software#active",
      },
    }),
  );

  return id;
}

async function activeJobs() {
  const jobs = [];
  let exclusiveStartKey;

  do {
    const page = await documentClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: "active = :active",
        ExpressionAttributeValues: { ":active": true },
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    jobs.push(...(page.Items ?? []));
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return jobs;
}

async function markMissingJobs(seenIds, successfulSources) {
  const existingJobs = await activeJobs();

  await Promise.all(
    existingJobs.map(async (job) => {
      if (seenIds.has(job.id) || !successfulSources.has(job.sourceKey)) return;

      const missingRuns = Number(job.missingRuns ?? 0) + 1;
      const active = missingRuns < 3;
      await documentClient.send(
        new UpdateCommand({
          TableName: tableName,
          Key: { id: job.id },
          UpdateExpression:
            "SET missingRuns = :missingRuns, active = :active, categoryStatus = :categoryStatus",
          ExpressionAttributeValues: {
            ":missingRuns": missingRuns,
            ":active": active,
            ":categoryStatus": active ? "software#active" : "software#inactive",
          },
        }),
      );
    }),
  );
}

export async function handler() {
  if (!tableName) throw new Error("TABLE_NAME is required");

  const results = await Promise.allSettled(sources.map(fetchSource));
  const now = new Date().toISOString();
  const successfulSources = new Set();
  const collectedJobs = [];
  const failures = [];

  results.forEach((result, index) => {
    const source = sources[index];
    if (result.status === "fulfilled") {
      successfulSources.add(sourceKey(source));
      collectedJobs.push(...result.value.filter(isSoftwareInternship));
    } else {
      failures.push({ source: sourceKey(source), error: String(result.reason) });
    }
  });

  const uniqueJobs = mergeDuplicateLocations(collectedJobs);
  const seenIds = new Set();
  for (const job of uniqueJobs) {
    if (!job.applyUrl) continue;
    seenIds.add(await saveJob(job, now));
  }

  await markMissingJobs(seenIds, successfulSources);

  const summary = {
    checkedSources: sources.length,
    successfulSources: successfulSources.size,
    savedJobs: seenIds.size,
    failures,
  };
  console.log(JSON.stringify(summary));
  return summary;
}
