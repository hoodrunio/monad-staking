export function getStakingApiBaseUrl(): string {
  const fromServer = process.env.STAKING_API_URL;
  const fromPublic = process.env.NEXT_PUBLIC_STAKING_API_URL;
  return fromServer ?? fromPublic ?? 'http://localhost:8787';
}

export async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const base = getStakingApiBaseUrl().replace(/\/$/, '');
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    let detail: unknown;
    try { detail = await res.json(); } catch { /* ignore */ }
    throw new Error(`API ${path} failed (${res.status}): ${JSON.stringify(detail)}`);
  }
  return res.json() as Promise<T>;
}


