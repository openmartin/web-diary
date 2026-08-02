# 📔 Online Diary - Pure Browser Git Diary

A pure frontend web application for writing and managing your diary entries directly in a GitHub repository using isomorphic-git. All git operations happen in your browser - no backend required.

## Features

- ✅ **Pure Browser Git**: Uses isomorphic-git + LightningFS to perform git operations entirely in the browser
- ✅ **GitHub Integration**: Clone, commit, and push diary entries directly to GitHub
- ✅ **Offline Support**: Edit diary entries even without internet, commit locally, then push when ready
- ✅ **Markdown Editor**: Write in Markdown with real-time preview
- ✅ **Local Storage**: Automatically saves drafts to browser local storage
- ✅ **Fixed Front Matter**: Automatic generation of YAML front matter for easy parsing
- ✅ **Year/Date Organization**: Browse and manage diary entries by year and date

## Getting Started

### Prerequisites

- Node.js 16+ and npm/pnpm
- A GitHub repository with the structure: `content/posts/{year}/{date}.md`
- A GitHub personal access token with `repo` scope

### Setup GitHub Repository

1. Create a new GitHub repository
2. Create the directory structure:
   ```
   content/posts/2026/
   ```
3. Create a personal access token:
   - Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
   - Click "Generate new token (classic)"
   - Select `repo` scope
   - Copy and save the token

### Installation

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173/`

### Building for Production

```bash
npm run build
npm run preview
```

## Usage

### 1. Connect to Your Repository

1. Enter your GitHub personal access token
2. Enter your repository owner (username or organization)
3. Enter your repository name
4. Select your default branch (default: `main`)
5. Click "Connect Repository"

The app will clone your repository to browser storage (IndexedDB).

### 2. Write a Diary Entry

1. Select a year from the sidebar (or add a new year)
2. Select a date or create a new one (format: `YYYY-MM-DD`)
3. Enter the diary title
4. Select the date/time (automatically set to current time)
5. Write your diary content in Markdown
6. Click "Preview" to see how it looks

### 3. Save Your Work

- **Save Draft**: Saves to browser local storage only
- **Save & Commit**: Writes file to git and creates a local commit
- **Push to GitHub**: Pushes your commits to GitHub

## File Format

Diary entries use Markdown with fixed YAML front matter:

```markdown
---
title: "2026-06-12 Summer Days"
date: 2026-06-12T23:00:00+08:00
draft: false
---

Your diary content here...

You can use **Markdown** formatting, including:
- Lists
- Code blocks
- Links
- Images
- etc.
```

## How It Works

### Browser-Side Git

This app uses **isomorphic-git**, a pure JavaScript implementation of Git that works in the browser:

1. **IndexedDB Storage**: Repository data is stored in browser IndexedDB via LightningFS
2. **Local Commits**: All commits are created locally before pushing
3. **HTTP-based Push/Pull**: Uses GitHub's HTTP API with token authentication
4. **Completely Offline**: You can edit and commit without internet

### Architecture

```
Browser
├── React App
├── Local Storage (Settings, Drafts)
├── IndexedDB (Git Repository via LightningFS)
├── Markdown Editor & Preview
└── isomorphic-git (Git Operations)
    └── GitHub REST API (Push/Pull)
```

## Development

### Project Structure

```
src/
├── App.tsx              # Main app component
├── components/
│   ├── RepoSetup.tsx    # Repository connection UI
│   ├── DiaryEditor.tsx  # Main diary editing interface
│   └── MarkdownEditor.tsx # Markdown editor with preview
├── utils/
│   ├── storage.ts       # Browser local storage utilities
│   ├── git.ts           # isomorphic-git wrapper
│   └── markdown.ts      # Front matter parsing utilities
├── App.css
└── index.css
```

### Key Technologies

- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **isomorphic-git**: Browser-based git
- **LightningFS**: IndexedDB-backed filesystem
- **react-markdown**: Markdown rendering
- **remark-gfm**: GitHub-flavored Markdown support

## Limitations & Notes

1. **Repository Size**: Large repositories may take time to clone due to browser storage limitations
2. **Authentication**: Requires GitHub personal access token (not OAuth)
3. **First Clone**: Initial repository clone may take a few moments depending on size
4. **Branch Support**: Currently supports main branch by default, can be configured during setup
5. **Conflict Resolution**: Manual handling required if conflicts occur

## Troubleshooting

### "Failed to clone repository"

- Verify your GitHub token is valid and has `repo` scope
- Ensure the repository exists and is accessible
- Check that the repository name and owner are correct

### "Failed to commit"

- Ensure you've saved changes with "Save & Commit"
- Check browser console for detailed error messages

### "Failed to push"

- Verify internet connection
- Check GitHub token has write access
- Ensure remote URL is correctly configured

### Storage Issues

- Clear IndexedDB if you experience persistent storage errors:
  1. Open Developer Tools (F12)
  2. Application → Storage → IndexedDB → diary → right-click → Delete

## Privacy & Security

- All git operations happen locally in your browser
- Your GitHub token is stored in browser local storage
- No data is sent to any server except GitHub
- Close the browser to clear session data (local storage persists)

## Future Enhancements

- [ ] OAuth authentication
- [ ] Branch support and switching
- [ ] Conflict resolution UI
- [ ] Sync status indicators
- [ ] Export functionality (PDF, etc.)
- [ ] Tag support
- [ ] Search functionality
- [ ] Dark mode
- [ ] Multi-repository support

## License

MIT

## Contributing

Contributions welcome! Feel free to submit issues and pull requests.
