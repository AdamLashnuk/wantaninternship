import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { createBillingHandler } from "./billing-handler.mjs";
export const handler = createBillingHandler({ database: DynamoDBDocumentClient.from(new DynamoDBClient({})), commands: { GetCommand, UpdateCommand } });
