import { useState, useEffect } from 'react';
import type { RepoConfig } from '../utils/storage';
import { storage } from '../utils/storage';
import { gitOps } from '../utils/git';
import { parseFrontMatter, generateFrontMatter } from '../utils/markdown';
import './DiaryEditor.css';
import MarkdownEditor from './MarkdownEditor';

interface DiaryEditorProps {
  repoConfig: RepoConfig;
  onLogout: () => void;
}

export default function DiaryEditor({ repoConfig, onLogout }: DiaryEditorProps) {
  const [years, setYears] = useState<string[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState(storage.getCurrentYear() || new Date().getFullYear().toString());
  const [selectedDate, setSelectedDate] = useState(storage.getCurrentDate() || '');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newDateInput, setNewDateInput] = useState('');
  const [creatingNew, setCreatingNew] = useState(false);

  // Load years on mount
  useEffect(() => {
    loadYears();
  }, []);

  // Load dates when year changes
  useEffect(() => {
    loadDates(selectedYear);
    storage.setCurrentYear(selectedYear);
  }, [selectedYear]);

  // Load diary content when date changes
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
        // Add current year if no years exist
        setYears([new Date().getFullYear().toString()]);
      } else {
        setYears(yearsList);
        if (!selectedYear || !yearsList.includes(selectedYear)) {
          setSelectedYear(yearsList[yearsList.length - 1]);
        }
      }
    } catch (err) {
      setError('Failed to load years: ' + (err instanceof Error ? err.message : String(err)));
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
      setError('Failed to load dates: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const loadDiaryContent = async (year: string, date: string) => {
    setLoading(true);
    setError(null);
    try {
      const content = await gitOps.readFile(year, date);
      if (content) {
        const entry = parseFrontMatter(content);
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
      setError('Failed to load diary: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleNewDate = () => {
    if (!newDateInput.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setError('Date must be in YYYY-MM-DD format');
      return;
    }

    setSelectedDate(newDateInput);
    setTitle(`${newDateInput} 日记`);
    setDateTime(new Date().toISOString());
    setContent('');
    setCreatingNew(true);
    setNewDateInput('');
    setError(null);
  };

  const handleSaveDraft = () => {
    storage.setDraft({
      title,
      date: dateTime,
      content,
    });
    setSuccess('Draft saved locally');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCommit = async () => {
    if (!selectedDate || !title) {
      setError('Please enter a date and title');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const frontMatter = generateFrontMatter(title, dateTime);
      const fullContent = frontMatter + '\n' + content;

      const commitMessage = `Add/Update diary: ${selectedDate}`;
      await gitOps.commit(commitMessage, selectedYear, selectedDate, fullContent);

      storage.clearDraft();
      setSuccess('Diary saved and committed locally');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to commit: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  const handlePush = async () => {
    setPushing(true);
    setError(null);
    setSuccess(null);

    try {
      await gitOps.push(repoConfig.token, repoConfig.branch);
      setSuccess('Successfully pushed to GitHub');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to push: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setPushing(false);
    }
  };

  return (
    <div className="diary-editor">
      <header className="editor-header">
        <h1>📔 {repoConfig.owner}/{repoConfig.repo}</h1>
        <button onClick={onLogout} className="logout-btn">Logout</button>
      </header>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="editor-container">
        <aside className="sidebar">
          <div className="year-selector">
            <label>Year</label>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="date-selector">
            <label>Date</label>
            <select value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}>
              <option value="">Select a date</option>
              {dates.map(date => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>

          <div className="new-date">
            <label>New Date</label>
            <div className="input-group">
              <input
                type="text"
                value={newDateInput}
                onChange={(e) => setNewDateInput(e.target.value)}
                placeholder="YYYY-MM-DD"
                disabled={loading}
              />
              <button onClick={handleNewDate} disabled={!newDateInput || loading}>
                Add
              </button>
            </div>
          </div>
        </aside>

        {loading ? (
          <div className="editor-main loading">Loading...</div>
        ) : (
          <div className="editor-main">
            <div className="metadata">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Diary title"
                className="title-input"
              />
              <input
                type="datetime-local"
                value={dateTime.replace(/[+\-][\d:]*$/, '')}
                onChange={(e) => setDateTime(new Date(e.target.value).toISOString())}
                className="datetime-input"
              />
            </div>

            <MarkdownEditor content={content} onChange={setContent} />

            <div className="actions">
              <button onClick={handleSaveDraft} disabled={saving || pushing}>
                Save Draft
              </button>
              <button onClick={handleCommit} disabled={saving || pushing} className="primary">
                {saving ? 'Saving...' : 'Save & Commit'}
              </button>
              <button onClick={handlePush} disabled={pushing || saving} className="secondary">
                {pushing ? 'Pushing...' : 'Push to GitHub'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
