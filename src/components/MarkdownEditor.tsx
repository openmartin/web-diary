import { useMemo, useState } from 'react';
import { Empty, Flex, Input, Segmented, Typography } from 'antd';
import { EditOutlined, EyeOutlined, FileTextOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseFrontMatter } from '../utils/markdown';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
  fileName?: string;
}

export default function MarkdownEditor({ content, onChange, fileName }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const { frontMatter, content: body } = useMemo(() => parseFrontMatter(content), [content]);

  return (
    <div className="markdown-editor">
      <Flex justify="space-between" align="center" className="editor-toolbar">
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as 'edit' | 'preview')}
          options={[
            { label: '编辑', value: 'edit', icon: <EditOutlined /> },
            { label: '预览', value: 'preview', icon: <EyeOutlined /> },
          ]}
        />
        <Typography.Text type="secondary" className="char-count">{body.length} 字</Typography.Text>
      </Flex>

      {mode === 'edit' ? (
        <div className="editor-edit-pane">
          {fileName && (
            <div className="file-bar">
              <FileTextOutlined className="file-bar-icon" />
              <span className="file-bar-name">{fileName}</span>
            </div>
          )}
          <Input.TextArea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={'---\ntitle: "我的日记"\ndate: 2026-01-01T00:00:00+08:00\ndraft: false\n---\n\n用 Markdown 记录今天的故事…'}
            autoSize={{ minRows: 16, maxRows: 30 }}
            className="editor-textarea"
          />
        </div>
      ) : (
        <div className="markdown-preview">
          <header className="preview-header">
            <div className="preview-title">{frontMatter.title.trim() || '未命名日记'}</div>
            {fileName && (
              <div className="preview-filename">
                <FileTextOutlined />
                <span>{fileName}</span>
              </div>
            )}
          </header>
          {body ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          ) : (
            <Empty description="暂无内容，切到编辑写点什么吧" />
          )}
        </div>
      )}
    </div>
  );
}
