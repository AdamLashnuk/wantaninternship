import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

function decodeCursor(value) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function encodeCursor(value) {
  return value ? Buffer.from(JSON.stringify(value), "utf8").toString("base64url") : undefined;
}

export async function handler(event = {}) {
  const rawLimit = Number(event.queryStringParameters?.limit ?? 50);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(Math.floor(rawLimit), 1), 250)
    : 50;
  const cursor = decodeCursor(event.queryStringParameters?.cursor);

  const [result, metadata] = await Promise.all([
    documentClient.send(new QueryCommand({
      TableName: tableName,
      IndexName: "category-discovery-index",
      KeyConditionExpression: "categoryStatus = :categoryStatus",
      ExpressionAttributeValues: { ":categoryStatus": "software#active" },
      ScanIndexForward: false,
      Limit: limit,
      ExclusiveStartKey: cursor,
      ProjectionExpression: "id, company, companyWebsite, title, opportunityType, softwareCategory, #location, locations, applicationUrl, applyUrl, #source, sources, sourceUrl, firstSeenAt, postedAt, active",
      ExpressionAttributeNames: { "#location": "location", "#source": "source" },
    })),
    documentClient.send(new GetCommand({
      TableName: tableName,
      Key: { id: "meta#collector" },
    })),
  ]);

  const meta = metadata.Item;
  const sourceCounts = meta?.sourceCounts ?? {};
  const countedJobs = Object.values(sourceCounts).reduce((sum, count) => sum + Number(count ?? 0), 0);
  const totalJobs = Number.isFinite(meta?.activeJobs) ? meta.activeJobs : countedJobs;
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
    },
    body: JSON.stringify({
      jobs: result.Items ?? [],
      nextCursor: encodeCursor(result.LastEvaluatedKey),
      updatedAt: meta?.updatedAt,
      nextRefreshAt: meta?.nextRefreshAt,
      sourceCounts,
      totalJobs,
      recentWeekJobs: Number.isFinite(meta?.recentWeekJobs) ? meta.recentWeekJobs : undefined,
      retentionDays: Number.isFinite(meta?.retentionDays) ? meta.retentionDays : undefined,
      partial: Boolean(meta?.failures?.length),
    }),
  };
}
