import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import {
  canonicalizeApplicationUrl,
  deduplicateJobs,
  inferOpportunityType,
  inferSoftwareCategory,
  hasOpportunitySignal,
  isRelevantSoftware,
  parseListingsJson,
  parseSpeedyMarkdown,
} from "./normalize.mjs";

const atsSources = JSON.parse(readFileSync(new URL("./sources.json", import.meta.url), "utf8"));
const githubSources = JSON.parse(readFileSync(new URL("./github-sources.json", import.meta.url), "utf8"));
const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});
const tableName = process.env.TABLE_NAME;
const userAgent = "WantAnInternship/2.0 (https://wantaninternship.com)";

function sourceKey(source) {
  return `${source.provider}:${source.board}`;
}

function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function directJob(source, raw) {
  const locations = raw.locations?.length ? raw.locations : [raw.location ?? "Location not listed"];
  const applicationUrl = canonicalizeApplicationUrl(raw.applicationUrl);
  return {
    company: source.company,
    companyWebsite: source.website,
    title: raw.title ?? "Untitled opportunity",
    opportunityType: inferOpportunityType(raw.title, ""),
    softwareCategory: inferSoftwareCategory(raw.title),
    location: locations.length > 1 ? "Multiple locations" : locations[0],
    locations,
    applicationUrl,
    applyUrl: applicationUrl,
    postedAt: raw.postedAt,
    source: source.provider,
    sourceKey: sourceKey(source),
    sourceUrl: raw.sourceUrl,
    sourceJobId: String(raw.sourceJobId ?? applicationUrl),
    active: true,
    sourcePriority: 100,
  };
}

async function getJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": userAgent },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function fetchGreenhouse(source) {
  const payload = await getJson(`https://boards-api.greenhouse.io/v1/boards/${source.board}/jobs?content=true`);
  return (payload.jobs ?? []).map((job) => directJob(source, {
    sourceJobId: job.id,
    title: job.title,
    locations: [job.location?.name ?? "Location not listed"],
    applicationUrl: job.absolute_url,
    postedAt: job.updated_at,
    sourceUrl: `https://boards.greenhouse.io/${source.board}`,
    searchable: [job.title, ...(job.departments ?? []).map((item) => item.name), stripHtml(job.content)].join(" "),
  })).filter(isRelevantSoftware);
}

async function fetchLever(source) {
  const payload = await getJson(`https://api.lever.co/v0/postings/${source.board}?mode=json`);
  return (Array.isArray(payload) ? payload : []).map((job) => directJob(source, {
    sourceJobId: job.id,
    title: job.text,
    locations: [job.categories?.location ?? "Location not listed"],
    applicationUrl: job.applyUrl ?? job.hostedUrl,
    postedAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
    sourceUrl: `https://jobs.lever.co/${source.board}`,
  })).filter(isRelevantSoftware);
}

async function fetchAshby(source) {
  const payload = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${source.board}`);
  return (payload.jobs ?? []).map((job) => directJob(source, {
    sourceJobId: job.jobUrl ?? job.applyUrl,
    title: job.title,
    locations: [job.location ?? "Location not listed"],
    applicationUrl: job.applyUrl ?? job.jobUrl,
    postedAt: job.publishedAt,
    sourceUrl: `https://jobs.ashbyhq.com/${source.board}`,
  })).filter(isRelevantSoftware);
}

async function fetchAtsSource(source) {
  if (source.provider === "greenhouse") return fetchGreenhouse(source);
  if (source.provider === "lever") return fetchLever(source);
  if (source.provider === "ashby") return fetchAshby(source);
  throw new Error(`Unsupported ATS provider: ${source.provider}`);
}

function cacheId(key) {
  return `meta#github#${createHash("sha1").update(key).digest("hex")}`;
}

async function updateGithubCache(source, values) {
  await documentClient.send(new PutCommand({
    TableName: tableName,
    Item: { id: cacheId(source.key), kind: "github-cache", sourceKey: source.key, ...values },
  }));
}

function retryDelay(response, attempt) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 60_000);
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) return Math.max(1_000, Math.min(reset * 1000 - Date.now(), 60_000));
  return Math.min(1000 * 2 ** attempt + Math.floor(Math.random() * 500), 10_000);
}

async function fetchGithubText(source) {
  const cached = await documentClient.send(new GetCommand({ TableName: tableName, Key: { id: cacheId(source.key) } }));
  const backoffUntil = cached.Item?.backoffUntil ? new Date(cached.Item.backoffUntil).getTime() : 0;
  if (backoffUntil > Date.now()) return { status: "backoff", jobs: [] };

  const headers = {
    Accept: "application/vnd.github.raw+json",
    "User-Agent": userAgent,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  if (cached.Item?.etag) headers["If-None-Match"] = cached.Item.etag;
  if (cached.Item?.lastModified) headers["If-Modified-Since"] = cached.Item.lastModified;

  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(source.apiUrl, {
      headers,
      signal: AbortSignal.timeout(45_000),
    });

    if (response.status === 304) {
      await updateGithubCache(source, {
        etag: cached.Item?.etag,
        lastModified: cached.Item?.lastModified,
        checkedAt: new Date().toISOString(),
      });
      return { status: "not-modified", jobs: [] };
    }

    if (response.ok) {
      const text = await response.text();
      const collectedAt = new Date().toISOString();
      await updateGithubCache(source, {
        etag: response.headers.get("etag") ?? undefined,
        lastModified: response.headers.get("last-modified") ?? undefined,
        checkedAt: collectedAt,
      });
      const config = { ...source, collectedAt };
      const jobs = source.format === "json"
        ? parseListingsJson(text, config)
        : parseSpeedyMarkdown(text, config);
      return { status: "changed", jobs };
    }

    if (response.status === 403 || response.status === 429 || response.status >= 500) {
      const delay = retryDelay(response, attempt);
      lastError = new Error(`${source.key} returned ${response.status}`);
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      await updateGithubCache(source, {
        etag: cached.Item?.etag,
        lastModified: cached.Item?.lastModified,
        checkedAt: new Date().toISOString(),
        backoffUntil: new Date(Date.now() + Math.max(delay, 60_000)).toISOString(),
        lastError: String(lastError),
      });
      throw lastError;
    }

    throw new Error(`${source.key} returned ${response.status}`);
  }
  throw lastError;
}

async function allStoredJobs() {
  const jobs = [];
  let exclusiveStartKey;
  do {
    const page = await documentClient.send(new ScanCommand({
      TableName: tableName,
      FilterExpression: "attribute_exists(active)",
      ExclusiveStartKey: exclusiveStartKey,
    }));
    jobs.push(...(page.Items ?? []));
    exclusiveStartKey = page.LastEvaluatedKey;
  } while (exclusiveStartKey);
  return jobs;
}

async function batchWrite(items) {
  for (let offset = 0; offset < items.length; offset += 25) {
    let requestItems = { [tableName]: items.slice(offset, offset + 25).map((Item) => ({ PutRequest: { Item } })) };
    for (let attempt = 0; attempt < 5 && requestItems[tableName]?.length; attempt += 1) {
      const result = await documentClient.send(new BatchWriteCommand({ RequestItems: requestItems }));
      requestItems = result.UnprocessedItems ?? {};
      if (requestItems[tableName]?.length) {
        await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
      }
    }
    if (requestItems[tableName]?.length) throw new Error("DynamoDB left unprocessed internship writes");
  }
}

function sourceKeysOf(job) {
  return job.sourceKeys?.length ? job.sourceKeys : [job.sourceKey].filter(Boolean);
}

function isOutOfScopeStoredJob(job) {
  const keys = sourceKeysOf(job);
  const hasGithubSource = keys.some((key) => key.startsWith("github:"));
  const hasDirectSource = keys.some((key) => /^(greenhouse|lever|ashby):/.test(key));
  return !isRelevantSoftware(job) || (hasDirectSource && !hasGithubSource && !hasOpportunitySignal(job.title));
}

export async function handler() {
  if (!tableName) throw new Error("TABLE_NAME is required");

  const atsResults = await Promise.allSettled(atsSources.map(fetchAtsSource));
  const githubResults = await Promise.allSettled(githubSources.map(fetchGithubText));
  const now = new Date().toISOString();
  const successfulKeys = new Set();
  const collected = [];
  const failures = [];

  atsResults.forEach((result, index) => {
    const source = atsSources[index];
    if (result.status === "fulfilled") {
      successfulKeys.add(sourceKey(source));
      collected.push(...result.value);
    } else {
      failures.push({ source: sourceKey(source), error: String(result.reason) });
    }
  });

  githubResults.forEach((result, index) => {
    const source = githubSources[index];
    if (result.status === "fulfilled") {
      if (result.value.status === "changed") {
        successfulKeys.add(source.key);
        collected.push(...result.value.jobs);
      }
    } else {
      failures.push({ source: source.key, error: String(result.reason) });
    }
  });

  const existing = await allStoredJobs();
  const existingById = new Map(existing.map((job) => [job.id, job]));
  const uniqueJobs = deduplicateJobs(collected);
  const seenIds = new Set(uniqueJobs.map((job) => job.id));

  const saved = uniqueJobs.map((job) => {
    const prior = existingById.get(job.id);
    return {
      id: job.id,
      company: job.company,
      companyWebsite: job.companyWebsite,
      title: job.title,
      opportunityType: job.opportunityType,
      softwareCategory: job.softwareCategory,
      location: job.location,
      locations: job.locations,
      applicationUrl: job.applicationUrl,
      applyUrl: job.applicationUrl,
      postedAt: job.postedAt,
      firstSeenAt: prior?.firstSeenAt ?? now,
      discoverySort: prior?.discoverySort ?? `${now}#${job.id}`,
      source: job.source,
      sources: job.sources,
      sourceKey: job.sourceKey,
      sourceKeys: job.sourceKeys,
      sourceUrl: job.sourceUrl,
      lastSeenAt: now,
      active: true,
      missingRuns: 0,
      categoryStatus: "software#active",
    };
  });

  const missingUpdates = existing.flatMap((job) => {
    if (seenIds.has(job.id)) return [];
    if (isOutOfScopeStoredJob(job)) {
      return [{
        ...job,
        missingRuns: Math.max(3, Number(job.missingRuns ?? 0)),
        active: false,
        categoryStatus: "software#inactive",
      }];
    }
    if (!sourceKeysOf(job).some((key) => successfulKeys.has(key))) return [];
    const missingRuns = Number(job.missingRuns ?? 0) + 1;
    const active = missingRuns < 3;
    return [{
      ...job,
      missingRuns,
      active,
      categoryStatus: active ? "software#active" : "software#inactive",
    }];
  });

  await batchWrite([...saved, ...missingUpdates]);

  const activeById = new Map(existing.filter((job) => job.active).map((job) => [job.id, job]));
  for (const job of [...saved, ...missingUpdates]) {
    if (job.active) activeById.set(job.id, job);
    else activeById.delete(job.id);
  }
  const sourceCounts = {};
  for (const job of activeById.values()) {
    sourceCounts[job.source] = (sourceCounts[job.source] ?? 0) + 1;
  }

  const updatedAt = new Date().toISOString();
  await documentClient.send(new PutCommand({
    TableName: tableName,
    Item: {
      id: "meta#collector",
      kind: "collector-meta",
      updatedAt,
      nextRefreshAt: new Date(new Date(updatedAt).getTime() + 3_600_000).toISOString(),
      sourceCounts,
      activeJobs: activeById.size,
      checkedSources: atsSources.length + githubSources.length,
      successfulSources: successfulKeys.size,
      failures,
    },
  }));

  const summary = {
    checkedSources: atsSources.length + githubSources.length,
    successfulSources: successfulKeys.size,
    savedJobs: saved.length,
    activeJobs: activeById.size,
    sourceCounts,
    failures,
  };
  console.log(JSON.stringify(summary));
  return summary;
}
