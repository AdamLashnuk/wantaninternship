import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { store } from './matching-store.mjs';
import { sendEmail, sendSms } from './alert-delivery.mjs';
import { createSettingsHandler } from './settings-handler.mjs';
const lambda = new LambdaClient({});
export const handler = createSettingsHandler({ store, sendVerification: async ({ channel, to, code }) => {
  if (channel === 'sms') await sendSms({ to, text: `WantAnInternship verification code: ${code}. Expires in 10 minutes. Only enter this code in your WantAnInternship settings.` });
  else await sendEmail({ from: process.env.ALERT_EMAIL_FROM, to, subject: 'Verify your WantAnInternship alert email', text: `Your verification code is ${code}. It expires in 10 minutes. Only enter it in your WantAnInternship delivery settings. If you did not request this, ignore it.` });
}, enqueue: async event => { await lambda.send(new InvokeCommand({ FunctionName: process.env.MATCHING_WORKER_NAME, InvocationType: 'Event', Payload: Buffer.from(JSON.stringify(event)) })); } });
