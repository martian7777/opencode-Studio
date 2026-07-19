# Features Guide

A comprehensive deep dive into every opencode Studio feature.

---

## 🖼️ Image & File Attachments

The #1 reason this project exists. The opencode terminal can't handle visual context — opencode Studio can.

### Supported Methods

| Method | How | Best For |
| :--- | :--- | :--- |
| **Clipboard paste** | `Ctrl+V` / `Cmd+V` | Screenshots, copied images |
| **Drag & drop** | Drag file onto the input area | Files from your file manager |
| **File picker** | Click the 📎 attachment button | Browsing for specific files |

### Supported Formats

- **Images**: PNG, JPEG, GIF, WebP, SVG
- **Documents**: Text files, PDFs, code files
- **Data**: JSON, CSV, YAML, TOML

### How It Works

Attachments are sent as `FilePartInput` objects through the RPC bridge. The webview converts files to base64 data URLs (for pasted/dropped content) or workspace-relative paths (for picked files). The extension host forwards them to the opencode server via the SDK.

### Use Cases

- 📸 "Fix this CSS bug" + screenshot of the broken UI
- 🎨 "Implement this design" + mockup image
- 📊 "Parse this data" + CSV drag-and-drop
- 🐛 "What does this error mean?" + screenshot of error dialog

---

## 🔎 `@`-Mention File Search

Type `@` anywhere in the input to trigger fuzzy file search across your workspace.

### How to Use

1. Type `@` in the message input
2. A dropdown appears with matching files
3. Continue typing to filter results
4. Select a file with `↑`/`↓` arrows and `Enter`, or click it
5. The file reference is inserted into your message

### What Gets Searched

The search uses `find.files` to fuzzy-match file paths in your workspace. It searches:
- File names
- Relative paths from the workspace root
- All file types

### Tips

- Type `@comp` to quickly find files in a `components/` directory
- Chain multiple `@`-mentions: `@Header.tsx @Footer.tsx make these consistent`
- The referenced files are sent as context to the AI model

---

## ⚡ `/` Slash Commands

Type `/` at the beginning of your input (or anywhere) to open the command palette.

### How to Use

1. Type `/` in the message input
2. A palette shows available opencode commands
3. Select a command with `↑`/`↓` arrows or click
4. Some commands accept arguments after the command name

### Available Commands

The commands come from the opencode server itself. Common ones include:

| Command | Description |
| :--- | :--- |
| `/compact` | Summarize and compact the current conversation |
| `/clear` | Clear the current session |
| `/help` | Show available commands |

> The full list depends on your opencode version and installed plugins.

---

## 💬 Streaming Chat

Messages stream in real-time with rich rendering.

### Rendering Features

- **Markdown** — Full GitHub-flavored markdown with headings, lists, tables, blockquotes
- **Code blocks** — Syntax-highlighted with language detection
- **Tool call cards** — Visual cards showing what tools the agent is using (file edits, terminal commands, etc.)
- **Inline images** — Images in responses render directly in the chat
- **Status indicators** — See when the agent is thinking, coding, or waiting

### Conversation Flow

1. You send a message (with optional attachments and `@`-mentions)
2. Tokens stream in as the model generates them
3. Tool calls appear as expandable cards
4. The final response renders with full markdown

---

## 🧠 Model & Agent Pickers

Switch models and agents without leaving the GUI.

### Model Picker

The header dropdown shows your current model. Click to switch between:
- Different providers (OpenAI, Anthropic, Google, etc.)
- Different models within a provider (GPT-4, Claude, Gemini, etc.)

Models come from your opencode configuration — the extension reads them via `config.providers`.

### Agent Picker

opencode supports different agent modes:
- **build** — Default agent for coding tasks
- **plan** — Planning mode for architecture and design
- Custom agents defined in your opencode config

Select an agent from the header dropdown to change the behavior for the current session.

---

## 🗂️ Session Management

### Session Sidebar

Click the session icon in the header to open the session sidebar. Here you can:
- **Browse** all sessions (conversations)
- **Resume** a previous conversation
- **Start** a new session

### Session Persistence

Sessions are managed by the opencode server, which stores them locally. They persist across editor restarts — your conversation history is always available.

### Keyboard Shortcut

Use the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and type:
- `opencode: New Session` — start fresh
- `opencode: Open in Editor Tab` — open as a full editor tab

---

## ♻️ Resilience & Error Recovery

### Automatic Retries

Transient failures (network timeouts, 5xx errors) are automatically retried with **exponential backoff**. You don't need to do anything — the extension handles it.

### Provider Error Recovery

When a model provider returns an error (rate limit, auth failure, etc.):

1. The error is displayed clearly in the chat
2. A **Retry** button appears
3. Click Retry to re-send the exact same message

### Single Request Guard

The extension enforces a single in-flight request to prevent hammering the provider with duplicate messages if you click Send multiple times.

### Connection Status

A banner at the top of the chat shows the current connection state:
- 🟢 **Connected** — everything is working
- 🟡 **Starting** — server is launching
- 🔴 **Error** — connection problem (with details)
- ⚫ **Stopped** — server is not running

---

## 🔌 Open in Editor Tab

By default, opencode Studio lives in the sidebar. But you can open it as a full editor tab:

1. `Ctrl+Shift+P` / `Cmd+Shift+P` → `opencode: Open in Editor Tab`
2. The GUI opens as a tab, giving you more screen real estate

This is useful for extended conversations or when you need more space for code blocks and images.
