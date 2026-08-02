import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { App, Button, Card, Col, Divider, Form, Input, Row, Steps, Typography } from 'antd';
import {
  BranchesOutlined,
  GithubOutlined,
  KeyOutlined,
  LinkOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { gitOps } from '../utils/git';
import { storage, type RepoConfig } from '../utils/storage';
import { useIsMobile } from '../hooks/useIsMobile';
import './RepoSetup.css';

const { Title, Paragraph } = Typography;

interface RepoSetupProps {
  onConnected: (config: RepoConfig) => void;
}

export default function RepoSetup({ onConnected }: RepoSetupProps) {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const isMobile = useIsMobile();
  const [connecting, setConnecting] = useState(false);

  const handleFinish = async (values: RepoConfig) => {
    setConnecting(true);
    try {
      await gitOps.clone(values);
      storage.setRepoConfig(values);
      message.success('仓库连接成功，开始写作吧 ✍️');
      onConnected(values);
      navigate('/', { replace: true });
    } catch (err) {
      message.error(`连接失败：${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="setup-page">
      <Card className="setup-card" bordered={false}>
        <Row>
          <Col xs={24} md={11} className="setup-brand">
            <div className="brand-logo">📔</div>
            <Title level={isMobile ? 3 : 2} className="brand-title">Online Diary</Title>
            <Paragraph className="brand-desc">
              存储在 GitHub 仓库里的在线日记本，每一篇都可追溯版本，永不丢失。
            </Paragraph>
            {!isMobile && (
              <>
                <Divider className="brand-divider" />
                <Steps
                  direction="vertical"
                  size="small"
                  items={[
                    { title: '创建仓库', description: '新建 GitHub 仓库，包含 content/posts/2026/ 目录结构' },
                    { title: '生成 Token', description: '在 GitHub Settings → Tokens 创建带 repo 权限的令牌' },
                    { title: '连接开始写作', description: '填写右侧表单，立即写下第一篇日记' },
                  ]}
                />
              </>
            )}
          </Col>

          <Col xs={24} md={13} className="setup-form">
            <Title level={3}>连接你的仓库</Title>
            <Paragraph type="secondary">Token 仅保存在浏览器 localStorage 中，不会上传到任何服务器</Paragraph>

            <Form<RepoConfig>
              layout="vertical"
              requiredMark={false}
              initialValues={{ branch: 'main' }}
              onFinish={handleFinish}
            >
              <Form.Item
                name="token"
                label="GitHub Token"
                rules={[{ required: true, message: '请输入 GitHub Token' }]}
                extra={
                  <span>
                    还没有？去{' '}
                    <a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noreferrer">
                      https://github.com/settings/personal-access-tokens
                    </a>{' '}
                    创建一个
                  </span>
                }
              >
                <Input.Password prefix={<KeyOutlined />} placeholder="ghp_..." autoComplete="off" size={isMobile ? 'large' : 'middle'} />
              </Form.Item>

              <Row gutter={12}>
                <Col xs={24} sm={12}>
                  <Form.Item name="owner" label="仓库 Owner" rules={[{ required: true, message: '请输入仓库 Owner' }]}>
                    <Input prefix={<UserOutlined />} placeholder="octocat" size={isMobile ? 'large' : 'middle'} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="repo" label="仓库名" rules={[{ required: true, message: '请输入仓库名' }]}>
                    <Input prefix={<GithubOutlined />} placeholder="my-diary" size={isMobile ? 'large' : 'middle'} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="branch" label="默认分支">
                <Input prefix={<BranchesOutlined />} placeholder="main" size={isMobile ? 'large' : 'middle'} />
              </Form.Item>

              <Button type="primary" htmlType="submit" size="large" block loading={connecting} icon={<LinkOutlined />}>
                {connecting ? '正在连接…' : '连接仓库'}
              </Button>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
