# 📔 Online Diary

A **pure browser-based** Git diary application — no backend required. Clone, commit, and push directly in the browser via [isomorphic-git](https://isomorphic-git.org/), storing your Markdown diary entries in your own GitHub repository.

English | [中文](./README.md)

## ✨ Features

- 🌐 **Pure Frontend** — No server needed; all Git operations run in the browser via isomorphic-git
- 📝 **Markdown Editor** — Live preview, GFM syntax, YAML Front Matter support
- 🔀 **Full Git Workflow** — Clone / commit / push with full version history
- 💾 **Offline Support** — IndexedDB-based filesystem (LightningFS) with local draft saving
- 📅 **Date-organized** — Entries stored as `content/posts/{year}/{date}.md`
- 📱 **Mobile Responsive** — Works seamlessly on phone, tablet, and desktop
- 🔒 **Privacy First** — Token stored only in browser localStorage, never uploaded

## 🖼️ Screenshots

| Repo Setup | Diary Editor |
|:---:|:---:|
| ![Repo Setup](./docs/screenshots/setup.png) | ![Diary Editor](./docs/screenshots/editor.png) |

| Markdown Preview | Mobile View |
|:---:|:---:|
| ![Markdown Preview](./docs/screenshots/preview.png) | ![Mobile](./docs/screenshots/mobile.png) |

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install & Run

```bash
# Clone the project
git clone https://github.com/<your-username>/web-diary.git
cd web-diary

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open http://localhost:5173 in your browser.

### Production Build

```bash
npm run build
npm run preview
```

## 🔧 Usage Guide

### 1. Create a GitHub Repository

Create a new GitHub repo with the following directory structure:

```
content/
└── posts/
    └── 2026/
```

### 2. Generate a Personal Access Token

Go to [GitHub Settings → Tokens](https://github.com/settings/personal-access-tokens) and create a Fine-grained PAT with:

- **Contents**: Read and write

### 3. Connect & Start Writing

Open the app, enter your Token, repo owner, repo name, and branch, then click "Connect" to start writing.

## 🏗️ Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| UI Library | Ant Design 5 |
| Git Engine | isomorphic-git + LightningFS |
| Markdown | react-markdown + remark-gfm |
| Routing | React Router 7 |
| Linting | oxlint |

## 📁 Project Structure

```
src/
├── assets/              # Static assets
├── components/
│   ├── DiaryEditor.tsx  # Main diary editor layout
│   ├── MarkdownEditor.tsx # Markdown edit/preview component
│   └── RepoSetup.tsx    # Repository connection page
├── hooks/
│   └── useIsMobile.ts   # Mobile detection hook
├── utils/
│   ├── git.ts           # isomorphic-git operations
│   ├── markdown.ts      # Front Matter parse/generate
│   └── storage.ts       # localStorage utilities
├── App.tsx              # Routing & state management
└── main.tsx             # App entry point
```

## 📄 License

MIT
