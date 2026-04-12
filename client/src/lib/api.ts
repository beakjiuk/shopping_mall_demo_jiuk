export type ApiOk<T> = T & { ok: true };
export type ApiErr = { ok: false; error: string };
export type ApiResp<T> = ApiOk<T> | ApiErr;

export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token: string | null) {
  if (!token) localStorage.removeItem('token');
  else localStorage.setItem('token', token);
}

export function resolveApiUrl(path: string): string {
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_ORIGIN as string | undefined)?.replace(/\/$/, '') ?? '';
  const p = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

export async function apiFetch<T>(
  path: string,
  opts?: { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal },
): Promise<ApiResp<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(resolveApiUrl(path), {
    method: opts?.method || 'GET',
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
    signal: opts?.signal,
  });

  const json = (await res.json()) as ApiResp<T>;
  return json;
}

