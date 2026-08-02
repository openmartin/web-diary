import * as git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';

// LightningFS provides a promise-based filesystem backed by IndexedDB
const fs = new LightningFS('diary') as any;

export interface GitRepoInfo {
  owner: string;
  repo: string;
  branch: string;
  token: string;
}

const REPO_DIR = '/repo';

export const gitOps = {
  async clone(repoInfo: GitRepoInfo): Promise<void> {
    try {
      await git.clone({
        fs,
        http,
        dir: REPO_DIR,
        url: `${window.location.origin}/github-proxy/${repoInfo.owner}/${repoInfo.repo}.git`,
        ref: repoInfo.branch,
        depth: 1,
        singleBranch: true,
        headers: {
          Authorization: `Basic ${btoa(`x-access-token:${repoInfo.token}`)}`,
        },
      } as any);
    } catch (error) {
      throw new Error(`Failed to clone: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /** Check if the local repository is valid (exists in IndexedDB) */
  async checkRepo(): Promise<boolean> {
    try {
      await fs.promises.stat(`${REPO_DIR}/.git`);
      return true;
    } catch {
      return false;
    }
  },

  async listYears(): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(`${REPO_DIR}/content/posts`);
      return entries.filter((entry: string) => !entry.startsWith('.')) as string[];
    } catch (error) {
      return [];
    }
  },

  async listDates(year: string): Promise<string[]> {
    try {
      const entries = await fs.promises.readdir(`${REPO_DIR}/content/posts/${year}`);
      return entries
        .filter((entry: string) => entry.endsWith('.md'))
        .map((entry: string) => entry.replace('.md', '')) as string[];
    } catch (error) {
      return [];
    }
  },

  async readFile(year: string, date: string): Promise<string> {
    try {
      const filePath = `${REPO_DIR}/content/posts/${year}/${date}.md`;
      const content = await fs.promises.readFile(filePath, 'utf8');
      return content as string;
    } catch (error) {
      return '';
    }
  },

  async writeFile(year: string, date: string, content: string): Promise<void> {
    try {
      const dirPath = `${REPO_DIR}/content/posts/${year}`;

      // Ensure directory exists; ignore EEXIST (LightningFS may throw even with recursive)
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
      } catch (mkdirErr: any) {
        if (mkdirErr?.code !== 'EEXIST' && mkdirErr?.message !== 'EEXIST') {
          throw mkdirErr;
        }
      }

      // Write the file; if it already exists, remove first then rewrite
      const filePath = `${dirPath}/${date}.md`;
      try {
        await fs.promises.writeFile(filePath, content, 'utf8');
      } catch (writeErr: any) {
        if (writeErr?.code === 'EEXIST' || writeErr?.message === 'EEXIST') {
          await fs.promises.unlink(filePath);
          await fs.promises.writeFile(filePath, content, 'utf8');
        } else {
          throw writeErr;
        }
      }
    } catch (error) {
      throw new Error(`Failed to write file: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async commit(message: string, year: string, date: string, content: string): Promise<void> {
    try {
      // Write file first
      await this.writeFile(year, date, content);

      // Stage the file
      await git.add({
        fs,
        dir: REPO_DIR,
        filepath: `content/posts/${year}/${date}.md`,
      } as any);

      // Commit
      await git.commit({
        fs,
        dir: REPO_DIR,
        message,
        author: {
          name: 'Diary Bot',
          email: 'diary@example.com',
        },
      } as any);
    } catch (error) {
      throw new Error(`Failed to commit: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  async push(token: string, branch: string): Promise<void> {
    try {
      await git.push({
        fs,
        http,
        dir: REPO_DIR,
        remote: 'origin',
        ref: branch,
        headers: {
          Authorization: `Basic ${btoa(`x-access-token:${token}`)}`,
        },
      } as any);
    } catch (error) {
      throw new Error(`Failed to push: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};

