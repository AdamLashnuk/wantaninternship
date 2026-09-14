import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

function listingKey(job) {
  const normalize = (value) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return `${normalize(job.company)}:${normalize(job.title)}`;
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
  }

  return [...grouped.values()].map(({ job, locations }) => ({
    ...job,
    location: locations.size > 1 ? "Multiple locations" : job.location,
  }));
}

export async function handler(event = {}) {
  const rawLimit = Number(event.queryStringParameters?.limit ?? 25);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), 100)
    : 25;

  const result = await documentClient.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: "category-discovery-index",
      KeyConditionExpression: "categoryStatus = :categoryStatus",
      ExpressionAttributeValues: { ":categoryStatus": "software#active" },
      ScanIndexForward: false,
      Limit: Math.min(limit * 5, 500),
      ProjectionExpression:
        "id, company, title, #location, applyUrl, #source, firstSeenAt, postedAt",
      ExpressionAttributeNames: {
        "#location": "location",
        "#source": "source",
      },
    }),
  );

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
    body: JSON.stringify({
      jobs: mergeDuplicateLocations(result.Items ?? []).slice(0, limit),
      updatedAt: new Date().toISOString(),
    }),
  };
}
