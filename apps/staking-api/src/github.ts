import { z } from 'zod';

const ghContentSchema = z.array(
  z.object({
    name: z.string(),
    path: z.string(),
    sha: z.string(),
    download_url: z.string().url().nullable(),
    type: z.literal('file').or(z.literal('dir')),
  }),
);

export type NetworkFolder = 'testnet' | 'testnet-2' | 'mainnet';

export async function listValidatorInfo(networkFolder: NetworkFolder): Promise<
  { name: string; path: string; sha: string; downloadUrl?: string }[]
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
    .map((i) => ({ name: i.name, path: i.path, sha: i.sha, downloadUrl: i.download_url ?? undefined }));
}

export async function downloadValidatorJson(downloadUrl: string): Promise<unknown> {
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to download validator json: ${res.status}`);
  return res.json();
}


