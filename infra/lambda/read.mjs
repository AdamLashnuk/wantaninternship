import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const tableName = process.env.TABLE_NAME;

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
      Limit: limit,
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
      jobs: result.Items ?? [],
      updatedAt: new Date().toISOString(),
    }),
  };
}
