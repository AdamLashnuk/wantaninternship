import { premiumAccess, AccessError, billingKey } from "./account-access.mjs";
export function applicationStorage({ database, commands, applicationsTable, billingTable }) {
  const { GetCommand, PutCommand, QueryCommand, TransactWriteCommand } = commands;
  async function initialize(userId) {
    const Key = { userId, id: "meta#usage" };
    if ((await database.send(new GetCommand({ TableName: applicationsTable, Key, ConsistentRead: true }))).Item) return;
    let cursor; let count = 0;
    do { const page = await database.send(new QueryCommand({ TableName: applicationsTable, KeyConditionExpression: "userId = :user", ExpressionAttributeValues: { ":user": userId }, ExclusiveStartKey: cursor, ProjectionExpression: "id", ConsistentRead: true })); count += (page.Items || []).filter(item => /^[a-f0-9]{64}$/.test(item.id)).length; cursor = page.LastEvaluatedKey; } while (cursor);
    try { await database.send(new PutCommand({ TableName: applicationsTable, Item: { ...Key, count }, ConditionExpression: "attribute_not_exists(id)" })); } catch (error) { if (error.name !== "ConditionalCheckFailedException") throw error; }
  }
  async function save(item) {
    const Key = { userId: item.userId, id: item.id };
    if ((await database.send(new GetCommand({ TableName: applicationsTable, Key, ConsistentRead: true }))).Item) return;
    await initialize(item.userId);
    const record = (await database.send(new GetCommand({ TableName: billingTable, Key: { userId: billingKey(item.userId) }, ConsistentRead: true }))).Item;
    const premium = premiumAccess(record);
    try {
      await database.send(new TransactWriteCommand({ TransactItems: [
        { Put: { TableName: applicationsTable, Item: item, ConditionExpression: "attribute_not_exists(id)" } },
        { Update: { TableName: applicationsTable, Key: { userId: item.userId, id: "meta#usage" }, UpdateExpression: "SET #count = #count + :one", ...(premium ? {} : { ConditionExpression: "#count < :limit" }), ExpressionAttributeNames: { "#count": "count" }, ExpressionAttributeValues: { ":one": 1, ...(premium ? {} : { ":limit": 10 }) } } },
      ] }));
    } catch (error) {
      if (error.name === "TransactionCanceledException") {
        if ((await database.send(new GetCommand({ TableName: applicationsTable, Key, ConsistentRead: true }))).Item) return;
        if (error.CancellationReasons?.[1]?.Code === "ConditionalCheckFailed") throw new AccessError("Your free tracker holds 10 internships. Upgrade to Premium for unlimited tracking.", 402);
      }
      throw error;
    }
  }
  async function remove(Key) {
    await initialize(Key.userId);
    try { await database.send(new TransactWriteCommand({ TransactItems: [
      { Delete: { TableName: applicationsTable, Key, ConditionExpression: "attribute_exists(id)" } },
      { Update: { TableName: applicationsTable, Key: { userId: Key.userId, id: "meta#usage" }, UpdateExpression: "SET #count = #count - :one", ConditionExpression: "#count > :zero", ExpressionAttributeNames: { "#count": "count" }, ExpressionAttributeValues: { ":one": 1, ":zero": 0 } } },
    ] })); } catch (error) { if (error.name === "TransactionCanceledException" && error.CancellationReasons?.[0]?.Code === "ConditionalCheckFailed") return; throw error; }
  }
  return { save, remove };
}
