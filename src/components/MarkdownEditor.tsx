import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownEditor.css';

interface MarkdownEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export default function MarkdownEditor({ content, onChange }: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true);

  return (
    <div className="markdown-editor">
      <div className="editor-toggle">
        <button
          className={showPreview ? '' : 'active'}
          onClick={() => setShowPreview(false)}
        >
          Editor
        </button>
        <button
          className={showPreview ? 'active' : ''}
          onClick={() => setShowPreview(true)}
        >
          Preview
        </button>
      </div>

      {!showPreview ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Write your diary in Markdown..."
          className="editor-textarea"
        />
      ) : (
        <div className="markdown-preview">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
