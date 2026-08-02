import { useEffect, useState } from 'react';
import {
  App, Button, Card, DatePicker, Empty, Flex, Input, Layout, List, Select, Spin, Typography,
} from 'antd';
import {
  CheckOutlined, CloudUploadOutlined, EditOutlined, FileTextOutlined,
  GithubOutlined, LogoutOutlined, PlusOutlined, SaveOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { storage, type RepoConfig } from '../utils/storage';
import { gitOps } from '../utils/git';
import { parseFrontMatter, generateFrontMatter } from '../utils/markdown';
import MarkdownEditor from './MarkdownEditor';
import './DiaryEditor.css';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

interface DiaryEditorProps {
  repoConfig: RepoConfig;
  onLogout: () => void;
}

export default function DiaryEditor({ repoConfig, onLogout }: DiaryEditorProps) {
  const { message } = App.useApp();

  const [years, setYears] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(storage.getCurrentYear() || String(new Date().getFullYear()));
  const [selectedDate, setSelectedDate] = useState(storage.getCurrentDate() || '');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    loadYears();
  }, []);

  useEffect(() => {
    loadDates(selectedYear);
    storage.setCurrentYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (selectedDate && !creatingNew) {
      loadDiaryContent(selectedYear, selectedDate);
      storage.setCurrentDate(selectedDate);
    }
  }, [selectedDate, selectedYear, creatingNew]);

  const loadYears = async () => {
    try {
      const yearsList = await gitOps.listYears();
      if (yearsList.length === 0) {
        setYears([String(new Date().getFullYear())]);
      } else {
        setYears(yearsList);
        if (!selectedYear || !yearsList.includes(selectedYear)) {
          setSelectedYear(yearsList[yearsList.length - 1]);
        }
      }
    } catch (err) {
      message.error('加载年份失败：' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const loadDates = async (year: string) => {
    try {
      const datesList = await gitOps.listDates(year);
      setDates(datesList);
      if (datesList.length > 0 && !selectedDate) {
        setSelectedDate(datesList[datesList.length - 1]);
      }
    } catch (err) {
      message.error('加载日期失败：' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const loadDiaryContent = async (year: string, date: string) => {
    setLoading(true);
    try {
      const raw = await gitOps.readFile(year, date);
      if (raw) {
        const entry = parseFrontMatter(raw);
        setTitle(entry.frontMatter.title);
        setDateTime(entry.frontMatter.date);
        setContent(entry.content);
      } else {
        setTitle('');
        setDateTime(new Date().toISOString());
        setContent('');
      }
      setCreatingNew(false);
    } catch (err) {
      message.error('加载日记失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleNewDate = (date: Dayjs | null) => {
    if (!date) return;
    const year = date.format('YYYY');
    const dateStr = date.format('YYYY-MM-DD');

    // Picking an existing date in the current year: just open it
    if (year === selectedYear && dates.includes(dateStr)) {
      setCreatingNew(false);
      setSelectedDate(dateStr);
      return;
    }

    if (!years.includes(year)) {
      setYears((prev) => [...prev, year].sort());
    }
    setSelectedYear(year);
    setSelectedDate(dateStr);
    setTitle(`${dateStr} 日记`);
    setDateTime(new Date().toISOString());
    setContent('');
    setCreatingNew(true);
  };

  const handleSaveDraft = () => {
    storage.setDraft({ title, date: dateTime, content });
    message.success('草稿已保存到本地');
  };

  const handleCommit = async () => {
    if (!selectedDate || !title) {
      message.warning('请先选择日期并填写标题');
      return;
    }
    setSaving(true);
    try {
      const frontMatter = generateFrontMatter(title, dateTime);
      const fullContent = frontMatter + '\n' + content;
      await gitOps.commit(`Add/Update diary: ${selectedDate}`, selectedYear, selectedDate, fullContent);
      storage.clearDraft();
      if (!dates.includes(selectedDate)) {
        setDates((prev) => [...prev, selectedDate].sort());
      }
      setCreatingNew(false);
      message.success('日记已保存并提交到本地仓库');
    } catch (err) {
      message.error('提交失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    try {
      await gitOps.push(repoConfig.token, repoConfig.branch);
      message.success('已成功推送到 GitHub 🎉');
    } catch (err) {
      message.error('推送失败：' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPushing(false);
    }
  };

  return (
    <Layout className="diary-layout">
      <Header className="editor-header">
        <Flex align="center" gap={12}>
          <span className="header-logo">📔</span>
          <div className="header-meta">
            <Text className="header-title">Online Diary</Text>
            <Text className="header-repo">
              <GithubOutlined /> {repoConfig.owner}/{repoConfig.repo}
              <span className="header-branch">@{repoConfig.branch}</span>
            </Text>
          </div>
        </Flex>
        <Button ghost icon={<LogoutOutlined />} onClick={onLogout}>
          退出登录
        </Button>
      </Header>

      <Layout>
        <Sider width={264} theme="light" className="editor-sider">
          <div className="sider-block">
            <Text type="secondary" className="sider-label">年份</Text>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: '100%' }}
              options={years.map((y) => ({ label: `${y} 年`, value: y }))}
            />
          </div>

          <div className="sider-block">
            <Text type="secondary" className="sider-label">新建日记</Text>
            <DatePicker
              style={{ width: '100%' }}
              placeholder="选择日期开始写"
              suffixIcon={<PlusOutlined />}
              value={null}
              onChange={handleNewDate}
              allowClear={false}
            />
          </div>

          <div className="sider-block sider-dates">
            <Text type="secondary" className="sider-label">全部日记（{dates.length}）</Text>
            <List
              className="date-list"
              dataSource={[...dates].sort().reverse()}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="这一年还没有日记" /> }}
              renderItem={(date) => (
                <List.Item
                  className={date === selectedDate ? 'date-item date-item-active' : 'date-item'}
                  onClick={() => setSelectedDate(date)}
                >
                  <FileTextOutlined className="date-item-icon" />
                  {date}
                </List.Item>
              )}
            />
          </div>
        </Sider>

        <Content className="editor-content">
          {loading ? (
            <Flex justify="center" align="center" className="editor-loading">
              <Spin size="large" />
            </Flex>
          ) : (
            <Card className="editor-card" bordered={false}>
              <Flex vertical gap={16}>
                <Flex gap={12} wrap="wrap">
                  <Input
                    className="title-input"
                    size="large"
                    prefix={<EditOutlined />}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="给这篇日记起个标题…"
                  />
                  <DatePicker
                    size="large"
                    showTime
                    value={dateTime ? dayjs(dateTime) : null}
                    onChange={(d) => setDateTime(d ? d.toISOString() : new Date().toISOString())}
                  />
                </Flex>

                <MarkdownEditor content={content} onChange={setContent} />

                <Flex justify="flex-end" gap={8} className="editor-actions">
                  <Button icon={<SaveOutlined />} onClick={handleSaveDraft} disabled={saving || pushing}>
                    保存草稿
                  </Button>
                  <Button type="primary" icon={<CheckOutlined />} loading={saving} disabled={pushing} onClick={handleCommit}>
                    保存并提交
                  </Button>
                  <Button icon={<CloudUploadOutlined />} loading={pushing} disabled={saving} onClick={handlePush}>
                    Push 到 GitHub
                  </Button>
                </Flex>
              </Flex>
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
