/** Browser origin policy for the authenticated API. No Origin means a native/server client. */
export function isAllowedOrigin(origin: string | undefined, host: string | undefined, configured: string): boolean {
  if (origin === undefined) return true;
  try {
    const url = new URL(origin);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin) return false;
    if (host && url.host === host) return true;
    return configured.split(',').map(value => value.trim()).filter(Boolean).includes(origin);
  } catch {
    return false;
  }
}
