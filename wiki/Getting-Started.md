# Getting Started

This guide walks you through installing opencode Studio and sending your first message.

---

## Prerequisites

### 1. Install opencode

opencode Studio requires the [opencode CLI](https://opencode.ai) to be installed on your system.

```bash
opencode --version
```

If `opencode` is not found, visit [opencode.ai](https://opencode.ai) for installation instructions.

### 2. Configure a Model Provider

opencode needs at least one AI model provider configured (OpenAI, Anthropic, Google, Ollama, etc.).

### 3. A VS Code-family Editor

Any of these: VS Code, Cursor, Windsurf, Antigravity, VSCodium, or code-server.

---

## Installation

### Option A: From Marketplace (Recommended)

1. Open Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search **"opencode Studio"**
3. Click **Install**

> Cursor/Windsurf/Antigravity/VSCodium pull from Open VSX automatically.

### Option B: From VSIX

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/martian7777/opencode-gui/releases)
2. Extensions → `⋯` → **Install from VSIX…**

### Option C: From Command Line

```bash
code --install-extension martian7777.opencode-studio
```

---

## First Run

### 1. Open the Sidebar

Click the **opencode** icon in the Activity Bar. The extension will:
- Detect your workspace
- Spawn `opencode serve` on a random port (or use SDK fallback if spawn fails)
- Connect and subscribe to the SSE event stream

A blue banner shows "Starting opencode server…" while it launches.

### 2. Choose Your Execution Mode

In the header, select a mode from the dropdown:

| Mode | When to use |
| :--- | :--- |
| ✋ **Manual** | Learning / reviewing — you approve every action |
| ⚡ **Auto** (default) | Daily use — safe things auto-run, risky things prompt |
| ⏩ **Bypass** | Trusted tasks — everything runs without asking |
| ◔ **Plan** | Architecture/design — read-only, no file edits |

### 3. Send Your First Message

Type a message and press `Enter`:

```
Explain the structure of this project
```

### 4. Try Image Attachments

- **Paste** from clipboard (`Ctrl+V` / `Cmd+V`)
- **Drag and drop** onto the input area (a dashed drop zone appears)
- **Click 📎 Attach** to pick files

### 5. Use @-Mentions

Type `@` to fuzzy-search workspace files:

```
@src/components/Header.tsx refactor this to use a custom hook
```

### 6. Try Slash Commands

Type `/` to see available opencode commands:

```
/compact summarize the current conversation
```

### 7. Handle Permissions

In Manual or Auto (risky) mode, tool actions pause for your approval:
- **Allow Once** — run this one time
- **Always Allow** — auto-approve this pattern going forward
- **Reject** — deny the action

### 8. Stop a Request

Click the **■ Stop** button (replaces Send while generating) to cancel.

---

## What's Next?

- 📖 [Features Guide](Features-Guide) — Learn all features in detail
- ⚙️ [Configuration](Configuration) — Settings, modes, and keyboard shortcuts
- 🔧 [Troubleshooting](Troubleshooting) — Fix common issues
