import { z } from 'zod';
import { Buffer } from 'node:buffer';
import { githubConfig } from '../../config/env';

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

export interface ValidatorInfoFile {
  name: string;
  path: string;
  sha: string;
  url: string;
  downloadUrl?: string;
}

export interface GithubClient {
  listValidatorInfo(networkFolder: NetworkFolder): Promise<ValidatorInfoFile[]>;
  fetchValidatorJson(contentUrl: string): Promise<unknown | null>;
}

export class MonadGithubClient implements GithubClient {
  private headers?: { Authorization: string };

  constructor() {
    this.headers = githubConfig.token ? { Authorization: `Bearer ${githubConfig.token}` } : undefined;
  }

  async listValidatorInfo(networkFolder: NetworkFolder): Promise<ValidatorInfoFile[]> {
    const url = `https://api.github.com/repos/monad-developers/validator-info/contents/${networkFolder}?ref=main`;
    const res = await fetch(url, { headers: this.headers });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const json = await res.json();
    const parsed = ghContentSchema.parse(json);
    return parsed
      .filter((i) => i.type === 'file')
      .map((i) => ({
        name: i.name,
        path: i.path,
        sha: i.sha,
        url: i.url,
        downloadUrl: i.download_url ?? undefined,
      }));
  }

  async fetchValidatorJson(contentUrl: string): Promise<unknown | null> {
    const res = await fetch(contentUrl, { headers: this.headers });
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
}
