import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { createHandler } from "./applications-handler.mjs";
import { applicationStorage } from "./application-quota.mjs";
const database = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const commands = { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, TransactWriteCommand };
export const handler = createHandler({ database, commands, storage: applicationStorage({ database, commands, applicationsTable: process.env.APPLICATIONS_TABLE, billingTable: process.env.BILLING_TABLE }) });
