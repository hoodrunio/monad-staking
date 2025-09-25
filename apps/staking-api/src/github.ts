import { z } from 'zod';
import { Buffer } from 'node:buffer';

const ghContentSchema = z.array(
  z.object({
    name: z.string(),
    path: z.string(),
    sha: z.string(),
    url: z.string().url(),
    download_url: z.string().url().nullable(),
    type: z.literal('file').or(z.literal('dir')),
  }),
);

export type NetworkFolder = 'testnet' | 'testnet-2' | 'mainnet';

export async function listValidatorInfo(networkFolder: NetworkFolder): Promise<
  { name: string; path: string; sha: string; url: string; downloadUrl?: string }[]
> {
  const url = `https://api.github.com/repos/monad-developers/validator-info/contents/${networkFolder}?ref=main`;
  const res = await fetch(url, {
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : undefined,
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const json = await res.json();
  const parsed = ghContentSchema.parse(json);
  return parsed
    .filter((i) => i.type === 'file')
    .map((i) => ({ name: i.name, path: i.path, sha: i.sha, url: i.url, downloadUrl: i.download_url ?? undefined }));
}

// Use GitHub Contents API to fetch file content (base64), then parse JSON if possible
export async function fetchValidatorJsonFromApi(contentUrl: string): Promise<unknown | null> {
  const res = await fetch(contentUrl, {
    headers: process.env.GITHUB_TOKEN
      ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
      : undefined,
  });
  if (!res.ok) throw new Error(`GitHub content error: ${res.status}`);
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || data.encoding !== 'base64') return null;
  const decoded = Buffer.from(data.content, 'base64').toString('utf8');
  try {
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}


