/** Only allow same-origin path redirects (open redirect hardening). */
export function safeRedirectPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}
