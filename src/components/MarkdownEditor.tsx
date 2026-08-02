import { useState } from 'react';
import { Empty, Flex, Input, Segmented, Typography } from 'antd';
import { EditOutlined, EyeOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

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
        <Typography.Text type="secondary" className="char-count">{content.length} 字</Typography.Text>
      </Flex>

      {mode === 'edit' ? (
        <Input.TextArea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="用 Markdown 记录今天的故事…"
          autoSize={{ minRows: 16, maxRows: 30 }}
          className="editor-textarea"
        />
      ) : (
        <div className="markdown-preview">
          {content ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          ) : (
            <Empty description="暂无内容，切到编辑写点什么吧" />
          )}
        </div>
      )}
    </div>
  );
}
