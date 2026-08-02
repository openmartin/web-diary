import { useState, useEffect } from 'react';
import './App.css';
import { storage, type RepoConfig } from './utils/storage';
import { gitOps } from './utils/git';
import DiaryEditor from './components/DiaryEditor';
import RepoSetup from './components/RepoSetup';

function App() {
  const [repoConfig, setRepoConfig] = useState<RepoConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // On mount: validate stored config and local repo integrity
  useEffect(() => {
    const config = storage.getRepoConfig();
    if (!config) {
      setChecking(false);
      return;
    }
    gitOps.checkRepo().then((valid) => {
      if (valid) {
        setRepoConfig(config);
      } else {
        // Local repo data lost (e.g. IndexedDB cleared), require re-setup
        storage.clearAll();
      }
      setChecking(false);
    });
  }, []);

  const handleConfigSetup = async (config: RepoConfig) => {
    setLoading(true);
    setError(null);
    try {
      await gitOps.clone(config);
      storage.setRepoConfig(config);
      setRepoConfig(config);
    } catch (err) {
      setError(`Failed to setup repository: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    storage.clearAll();
    setRepoConfig(null);
  };

  if (checking) {
    return <div className="app-container" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!repoConfig) {
    return <RepoSetup onSetup={handleConfigSetup} loading={loading} error={error} />;
  }

  return (
    <div className="app-container">
      <DiaryEditor repoConfig={repoConfig} onLogout={handleLogout} />
    </div>
  );
}

export default App;
