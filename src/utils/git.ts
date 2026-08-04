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

// ─── Rebase helpers ───────────────────────────────────────────────────────────

/** Recursively collect all file paths and their blob OIDs from a tree */
async function collectTreeFiles(
  treeOid: string,
  prefix = '',
): Promise<Map<string, string>> {
  const files = new Map<string, string>();
  const { tree } = await git.readTree({ fs, dir: REPO_DIR, oid: treeOid });
  for (const entry of tree) {
    const path = prefix ? `${prefix}/${entry.path}` : entry.path;
    if (entry.type === 'tree') {
      const sub = await collectTreeFiles(entry.oid, path);
      for (const [k, v] of sub) files.set(k, v);
    } else {
      files.set(path, entry.oid);
    }
  }
  return files;
}

/**
 * Compute the diff between parent tree and commit tree,
 * then apply changes (add/modify/delete) to the working directory.
 */
async function applyCommitChanges(commitOid: string): Promise<void> {
  const { commit } = await git.readCommit({ fs, dir: REPO_DIR, oid: commitOid });
  const currentFiles = await collectTreeFiles(commit.tree);

  let parentFiles = new Map<string, string>();
  if (commit.parent.length > 0) {
    try {
      const { commit: parentCommit } = await git.readCommit({ fs, dir: REPO_DIR, oid: commit.parent[0] });
      parentFiles = await collectTreeFiles(parentCommit.tree);
    } catch {
      // Parent not available (shallow clone) — treat all files as additions
    }
  }

  // Apply additions and modifications
  for (const [path, oid] of currentFiles) {
    if (parentFiles.get(path) !== oid) {
      const { blob } = await git.readBlob({ fs, dir: REPO_DIR, oid });
      const filePath = `${REPO_DIR}/${path}`;
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
      } catch { /* dir may already exist */ }
      try {
        await fs.promises.writeFile(filePath, new TextDecoder().decode(blob));
      } catch {
        await fs.promises.unlink(filePath);
        await fs.promises.writeFile(filePath, new TextDecoder().decode(blob));
      }
      await git.add({ fs, dir: REPO_DIR, filepath: path } as any);
    }
  }

  // Apply deletions
  for (const [path] of parentFiles) {
    if (!currentFiles.has(path)) {
      try {
        await fs.promises.unlink(`${REPO_DIR}/${path}`);
      } catch { /* file may not exist in working dir */ }
      try {
        await git.remove({ fs, dir: REPO_DIR, filepath: path } as any);
      } catch { /* may not be in index */ }
    }
  }
}

// ─── Main git operations ──────────────────────────────────────────────────────

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

  /**
   * Pull with rebase: fetch remote changes and replay local commits on top.
   * No merge commits are created — keeps a linear history.
   * Returns true if the local branch was updated, false if already up-to-date.
   */
  async pull(token: string, branch: string): Promise<boolean> {
    try {
      // 1. Fetch remote refs and objects
      await git.fetch({
        fs,
        http,
        dir: REPO_DIR,
        remote: 'origin',
        ref: branch,
        depth: 20,
        singleBranch: true,
        headers: {
          Authorization: `Basic ${btoa(`x-access-token:${token}`)}`,
        },
      } as any);

      // 2. Resolve local HEAD and remote tracking branch
      const localOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: 'HEAD' });
      const remoteOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: `origin/${branch}` });

      // Already up-to-date
      if (localOid === remoteOid) return false;

      // 3. Collect local-only commits (reachable from HEAD but not from remote)
      const remoteAncestors = new Set<string>();
      try {
        const remoteLog = await git.log({ fs, dir: REPO_DIR, ref: `origin/${branch}`, depth: 50 });
        for (const entry of remoteLog) remoteAncestors.add(entry.oid);
      } catch { /* remote log unavailable */ }

      const localCommits: string[] = [];
      const localLog = await git.log({ fs, dir: REPO_DIR, ref: 'HEAD', depth: 50 });
      for (const entry of localLog) {
        if (remoteAncestors.has(entry.oid)) break;
        localCommits.push(entry.oid);
      }

      // 4. Reset local branch to remote tip: move the branch ref first,
      // then checkout so both working directory and index are updated.
      await git.writeRef({
        fs,
        dir: REPO_DIR,
        ref: `refs/heads/${branch}`,
        value: remoteOid,
        force: true,
      } as any);
      await git.checkout({ fs, dir: REPO_DIR, ref: branch, force: true } as any);

      // Fast-forward: no local-only commits, we are done
      if (localCommits.length === 0) {
        return true;
      }

      // 5. Rebase: replay local commits on top of the remote tip
      // Replay in chronological order (oldest first)
      for (const oid of [...localCommits].reverse()) {
        const { commit } = await git.readCommit({ fs, dir: REPO_DIR, oid });

        // Apply this commit's tree diff to the working directory
        await applyCommitChanges(oid);

        // Re-create the commit with original message and author
        await git.commit({
          fs,
          dir: REPO_DIR,
          message: commit.message,
          author: commit.author,
        } as any);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to pull: ${error instanceof Error ? error.message : String(error)}`);
    }
  },

  /**
   * Push with automatic rebase-pull first to avoid non-fast-forward rejection.
   */
  async push(token: string, branch: string): Promise<void> {
    try {
      // Auto-sync: rebase local commits on top of remote before pushing
      await this.pull(token, branch);

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

