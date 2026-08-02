import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Flex, Spin, Typography } from 'antd';
import { storage, type RepoConfig } from './utils/storage';
import { gitOps } from './utils/git';
import DiaryEditor from './components/DiaryEditor';
import RepoSetup from './components/RepoSetup';

function App() {
  const [repoConfig, setRepoConfig] = useState<RepoConfig | null>(null);
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

  if (checking) {
    return (
      <Flex vertical align="center" justify="center" gap={16} style={{ minHeight: '100vh' }}>
        <Spin size="large" />
        <Typography.Text type="secondary">正在检查仓库状态…</Typography.Text>
      </Flex>
    );
  }

  return (
    <Routes>
      <Route
        path="/setup"
        element={repoConfig ? <Navigate to="/" replace /> : <RepoSetup onConnected={setRepoConfig} />}
      />
      <Route
        path="/"
        element={
          repoConfig ? (
            <DiaryEditor
              repoConfig={repoConfig}
              onLogout={() => {
                storage.clearAll();
                setRepoConfig(null);
              }}
            />
          ) : (
            <Navigate to="/setup" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
