import { store } from './matching-store.mjs';
import { sendEmail, sendSms } from './alert-delivery.mjs';
import { createMatchingWorker } from './matching-worker-core.mjs';
export const handler = createMatchingWorker({ store, sendEmail, sendSms });
