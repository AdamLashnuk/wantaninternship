export function settingsEndpoint() {
  const base = process.env.SETTINGS_API_URL || process.env.INTERNSHIPS_API_URL;
  if (!base) return null;
  const url = new URL(base); url.pathname = url.pathname.replace(/\/internships\/?$/, '/settings'); url.search = ''; return url;
}
