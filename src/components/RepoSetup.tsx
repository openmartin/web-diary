import { useState } from 'react';
import type { RepoConfig } from '../utils/storage';
import './RepoSetup.css';

interface RepoSetupProps {
  onSetup: (config: RepoConfig) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function RepoSetup({ onSetup, loading, error }: RepoSetupProps) {
  const [token, setToken] = useState('');
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [branch, setBranch] = useState('main');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !owner || !repo) {
      alert('Please fill in all fields');
      return;
    }
    await onSetup({ token, owner, repo, branch });
  };

  return (
    <div className="repo-setup">
      <div className="repo-setup-card">
        <h1>📔 Online Diary</h1>
        <p>Connect to your GitHub repository to start writing</p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="token">GitHub Token*</label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              disabled={loading}
            />
            <small>
              Create a token at <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer">
                github.com/settings/tokens
              </a>
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="owner">Repository Owner*</label>
            <input
              id="owner"
              type="text"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="e.g., octocat"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="repo">Repository Name*</label>
            <input
              id="repo"
              type="text"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="e.g., my-diary"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="branch">Default Branch</label>
            <input
              id="branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="main"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className={loading ? 'loading' : ''}>
            {loading ? 'Connecting...' : 'Connect Repository'}
          </button>
        </form>

        <div className="info-box">
          <h3>First time?</h3>
          <ol>
            <li>Create a new GitHub repository with folder structure: <code>content/posts/2026/</code></li>
            <li>Create a personal access token with repo scope</li>
            <li>Fill in the form above and connect</li>
            <li>Start writing your diary!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
