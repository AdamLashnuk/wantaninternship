// The complete feed is public. No identity or billing lookups are required.
export async function feedAccess() { return true; }
export function feedWindow(query = {}) {
  const raw = Number(query.limit ?? 50);
  const home = query.preview === "home";
  return { limit: home ? 10 : (Number.isFinite(raw) ? Math.min(Math.max(Math.floor(raw), 1), 250) : 50), cursor: home ? undefined : query.cursor };
}
