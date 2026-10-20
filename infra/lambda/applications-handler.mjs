import { savedRecord, validUpdate } from "./application-records.mjs";
const TableName = process.env.APPLICATIONS_TABLE;
const reply = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });
export function createHandler({ database, commands, verify = fetch, storage }) {
const { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = commands;
return async function handler(event) {
  const token = (event.headers?.authorization || "").match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply(401, { error: "Please log in." });
  let userId;
  try {
    // GetUser verifies the token with Cognito, including expiry and revocation.
    const response = await verify(`https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/`, { method: "POST", headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser" }, body: JSON.stringify({ AccessToken: token }), signal: AbortSignal.timeout(10000) });
    if (!response.ok) return reply(response.status >= 500 ? 503 : 401, { error: "Please log in again." });
    const payload = await response.json();
    userId = payload.UserAttributes?.find(a => a.Name === "sub")?.Value;
    // Bind access to this deployment's pool and app client after Cognito verifies the token.
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
    if (!userId || claims.client_id !== process.env.ACCOUNTS_CLIENT_ID || claims.iss !== process.env.ACCOUNTS_ISSUER) return reply(401, { error: "Please log in again." });
  } catch { return reply(503, { error: "Account verification is temporarily unavailable." }); }
  const method = event.requestContext?.http?.method;
  try {
    if (method === "GET") {
      const items = []; let cursor;
      do {
        const result = await database.send(new QueryCommand({ TableName, KeyConditionExpression: "userId = :user", ExpressionAttributeValues: { ":user": userId }, ExclusiveStartKey: cursor, ConsistentRead: true }));
        items.push(...(result.Items || [])); cursor = result.LastEvaluatedKey;
      } while (cursor);
      return reply(200, { applications: items.filter(item => /^[a-f0-9]{64}$/.test(item.id)).map(({ userId, ...item }) => item).sort((a,b) => b.savedAt.localeCompare(a.savedAt)) });
    }
    let body;
    try { if ((event.body || "").length > 16000) throw Error(); body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body || "{}"); if (!body || typeof body !== "object") throw Error(); } catch { return reply(400, { error: "Invalid request." }); }
    if (method === "POST") {
      let item; try { item = savedRecord(body, userId); } catch (error) { return reply(400, { error: error.message }); }
      try { if (storage) await storage.save(item); else await database.send(new PutCommand({ TableName, Item: item, ConditionExpression: "attribute_not_exists(id)" })); }
      catch (error) { if (error.name !== "ConditionalCheckFailedException") throw error; }
      return reply(200, { id: item.id });
    }
    if (!/^[a-f0-9]{64}$/.test(body.id || "")) return reply(400, { error: "Invalid application." });
    const Key = { userId, id: body.id };
    if (method === "DELETE") { if (storage) await storage.remove(Key); else await database.send(new DeleteCommand({ TableName, Key })); return reply(200, { ok: true }); }
    if (method === "PATCH") {
      let update; try { update = validUpdate(body); } catch (error) { return reply(400, { error: error.message }); }
      await database.send(new UpdateCommand({ TableName, Key, ConditionExpression: "attribute_exists(id)", UpdateExpression: "SET #status = :status, notes = :notes, updatedAt = :now", ExpressionAttributeNames: { "#status": "status" }, ExpressionAttributeValues: { ":status": update.status, ":notes": update.notes, ":now": new Date().toISOString() } }));
      return reply(200, { ok: true });
    }
    return reply(405, { error: "Unsupported request." });
  } catch (error) {
    if (error.status === 402) return reply(402, { error: error.message, upgradeRequired: true });
    if (error.name === "ConditionalCheckFailedException") return reply(404, { error: "Application not found." });
    console.error("Applications storage error", error.name);
    return reply(503, { error: "Unable to update your tracker. Please try again." });
  }
}

}
