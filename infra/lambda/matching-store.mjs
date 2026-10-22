import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
const db = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
const table = () => process.env.MATCHING_TABLE;
export const store = {
  async get(userId, id) { return (await db.send(new GetCommand({ TableName: table(), Key: { userId, id }, ConsistentRead: true }))).Item; },
  async put(userId, id, value) { await db.send(new PutCommand({ TableName: table(), Item: { ...value, userId, id } })); },
  async patch(userId, id, values) {
    const keys = Object.keys(values);
    await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id }, UpdateExpression: 'SET ' + keys.map((_, i) => `#k${i} = :v${i}`).join(', '), ExpressionAttributeNames: Object.fromEntries(keys.map((k, i) => [`#k${i}`, k])), ExpressionAttributeValues: Object.fromEntries(keys.map((k, i) => [`:v${i}`, values[k]])) }));
  },
  async items(userId, prefix = '') {
    const items = []; let cursor;
    do {
      const page = await db.send(new QueryCommand({ TableName: table(), KeyConditionExpression: 'userId = :user AND begins_with(id, :prefix)', ExpressionAttributeValues: { ':user': userId, ':prefix': prefix }, ExclusiveStartKey: cursor, ConsistentRead: true }));
      items.push(...(page.Items || [])); cursor = page.LastEvaluatedKey;
    } while (cursor);
    return items;
  },
  async removeAll(userId) {
    // Stop delivery before removing the rest of the saved data.
    await db.send(new DeleteCommand({ TableName: table(), Key: { userId, id: 'profile' } }));
    for (const row of await store.items(userId)) await db.send(new DeleteCommand({ TableName: table(), Key: { userId, id: row.id } }));
  },
  async requestStatus(userId, requestId, status, message, updatedAt) {
    try {
      await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id: 'request' }, UpdateExpression: 'SET #status = :status, message = :message, updatedAt = :stamp', ConditionExpression: 'requestId = :request', ExpressionAttributeNames: { '#status': 'status' }, ExpressionAttributeValues: { ':status': status, ':message': message, ':stamp': updatedAt, ':request': requestId } }));
    } catch (error) { if (error.name !== 'ConditionalCheckFailedException') throw error; }
  },
  async claimRequest(userId, now) {
    try {
      await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id: 'state' }, UpdateExpression: 'SET requestAfter = :next', ConditionExpression: 'attribute_not_exists(requestAfter) OR requestAfter < :now', ExpressionAttributeValues: { ':next': now + 60000, ':now': now } })); return true;
    } catch (error) { if (error.name === 'ConditionalCheckFailedException') return false; throw error; }
  },
  async claimVerification(userId, now) {
    const day = new Date(now).toISOString().slice(0, 10);
    try {
      await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id: `verification-limit#${day}` }, UpdateExpression: 'SET requestAfter = :next, expiresAt = :expiry ADD requests :one', ConditionExpression: '(attribute_not_exists(requestAfter) OR requestAfter < :now) AND (attribute_not_exists(requests) OR requests < :max)', ExpressionAttributeValues: { ':next': now + 60000, ':now': now, ':expiry': Math.floor(now / 1000) + 86400, ':one': 1, ':max': 5 } })); return true;
    } catch (error) { if (error.name === 'ConditionalCheckFailedException') return false; throw error; }
  },
  async verificationAttempt(userId, channel, hash, now) {
    try {
      await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id: `verification#${channel}` }, UpdateExpression: 'ADD attempts :one', ConditionExpression: '#hash = :hash AND consumed = :false AND expiresAt > :now AND attempts < :max', ExpressionAttributeNames: { '#hash': 'hash' }, ExpressionAttributeValues: { ':hash': hash, ':false': false, ':now': Math.floor(now / 1000), ':max': 5, ':one': 1 } })); return true;
    } catch (error) { if (error.name === 'ConditionalCheckFailedException') return false; throw error; }
  },
  async lock(userId, token, now) {
    try {
      await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id: 'state' }, UpdateExpression: 'SET lockUntil = :until, lockToken = :token', ConditionExpression: 'attribute_not_exists(lockUntil) OR lockUntil < :now', ExpressionAttributeValues: { ':until': now + 240000, ':now': now, ':token': token } })); return true;
    } catch (error) { if (error.name === 'ConditionalCheckFailedException') return false; throw error; }
  },
  async unlock(userId, token) {
    try { await db.send(new UpdateCommand({ TableName: table(), Key: { userId, id: 'state' }, UpdateExpression: 'REMOVE lockUntil, lockToken', ConditionExpression: 'lockToken = :token', ExpressionAttributeValues: { ':token': token } })); } catch (error) { if (error.name !== 'ConditionalCheckFailedException') throw error; }
  },
  async jobs(track) {
    const jobs = []; let cursor;
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
    do {
      const page = await db.send(new QueryCommand({ TableName: process.env.TABLE_NAME, IndexName: 'category-discovery-index', KeyConditionExpression: 'categoryStatus = :status AND discoverySort >= :cutoff', ExpressionAttributeValues: { ':status': `${track}#active`, ':cutoff': cutoff }, ScanIndexForward: false, ExclusiveStartKey: cursor, Limit: Math.min(200, 1000 - jobs.length) }));
      jobs.push(...(page.Items || [])); cursor = page.LastEvaluatedKey;
    } while (cursor && jobs.length < 1000);
    return jobs;
  },
};
