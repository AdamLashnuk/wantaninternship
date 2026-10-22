import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { store } from './matching-store.mjs';
import { createSettingsHandler } from './settings-handler.mjs';
const lambda = new LambdaClient({});
export const handler = createSettingsHandler({ store, enqueue: async event => { await lambda.send(new InvokeCommand({ FunctionName: process.env.MATCHING_WORKER_NAME, InvocationType: 'Event', Payload: Buffer.from(JSON.stringify(event)) })); } });
