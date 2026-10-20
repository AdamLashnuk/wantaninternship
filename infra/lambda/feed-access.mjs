import { verifiedAccount, premiumAccess } from "./account-access.mjs";
export async function feedAccess(event, { getRecord, account = verifiedAccount }) {
  if (event.queryStringParameters?.preview === "home" || !event.headers?.authorization) return false;
  try { const user = await account(event); return premiumAccess(await getRecord(user.id)); }
  catch (error) { if (error.status === 401) return false; throw error; }
}
export function feedWindow(query = {}, premium = false) {
  const raw = Number(query.limit ?? 50);
  return { limit: premium ? (Number.isFinite(raw) ? Math.min(Math.max(Math.floor(raw), 1), 250) : 50) : 10, cursor: premium ? query.cursor : undefined };
}
