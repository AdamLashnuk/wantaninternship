import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./applications-handler.mjs";
export const handler = createHandler({
  database: DynamoDBDocumentClient.from(new DynamoDBClient({})),
  commands: { PutCommand, QueryCommand, UpdateCommand, DeleteCommand },
});
