import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { store } from './matching-store.mjs';
import { createMatchingWorker } from './matching-worker-core.mjs';
const ses = new SESv2Client({ maxAttempts: 1 });
export const handler = createMatchingWorker({ store, sendEmail: async ({ from, to, subject, text }) => {
  await ses.send(new SendEmailCommand({ FromEmailAddress: from, Destination: { ToAddresses: [to] }, Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' } } } } }));
} });
