import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
const ses = new SESv2Client({ maxAttempts: 1 });
const sns = new SNSClient({ maxAttempts: 1 });
export async function sendEmail({ from, to, subject, text }) {
  await ses.send(new SendEmailCommand({ FromEmailAddress: from, Destination: { ToAddresses: [to] }, Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Text: { Data: text, Charset: 'UTF-8' } } } } }));
}
export async function sendSms({ to, text }) {
  if (process.env.ALERT_SMS_ENABLED !== 'true') throw new Error('SMS is not configured.');
  await sns.send(new PublishCommand({ PhoneNumber: to, Message: text, MessageAttributes: { 'AWS.SNS.SMS.SMSType': { DataType: 'String', StringValue: 'Transactional' }, 'AWS.SNS.SMS.MaxPrice': { DataType: 'Number', StringValue: '0.10' } } }));
}
