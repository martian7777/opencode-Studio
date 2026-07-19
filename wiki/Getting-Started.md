# Getting Started

This guide walks you through installing opencode Studio and sending your first message.

---

## Prerequisites

### 1. Install opencode

opencode Studio requires the [opencode CLI](https://opencode.ai) to be installed on your system.

```bash
# Verify installation
opencode --version
```

If `opencode` is not found, visit [opencode.ai](https://opencode.ai) for installation instructions.

### 2. Configure a Model Provider

opencode needs at least one AI model provider configured. Check your opencode config:

```bash
opencode config
```

Common providers include OpenAI, Anthropic, Google, and local models via Ollama.

### 3. A VS Code-family Editor

Any of these editors will work:
- [VS Code](https://code.visualstudio.com/)
- [Cursor](https://cursor.sh/)
- [Windsurf](https://windsurf.ai/)
- [Antigravity](https://antigravity.dev/)
- [VSCodium](https://vscodium.com/)
- [code-server](https://github.com/coder/code-server)

---

## Installation

### Option A: From Marketplace (Recommended)

**VS Code users:**
1. Open the Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for **"opencode Studio"**
3. Click **Install**

**Cursor / Windsurf / Antigravity / VSCodium users:**
1. Open the Extensions view
2. Search for **"opencode Studio"** (pulls from Open VSX)
3. Click **Install**

### Option B: From VSIX

1. Download the latest `.vsix` from [GitHub Releases](https://github.com/martian7777/opencode-gui/releases)
2. In your editor: Extensions → `⋯` menu → **Install from VSIX…**
3. Select the downloaded `.vsix` file

### Option C: From Command Line

```bash
# VS Code
code --install-extension martian7777.opencode-studio

# VSCodium
codium --install-extension martian7777.opencode-studio
```

---

## First Run

### 1. Open the Sidebar

Click the **opencode** icon in the Activity Bar (left sidebar). The extension will automatically:
- Detect your workspace
- Spawn `opencode serve` as a managed background process
- Connect to the server

You'll see a connection status banner while it starts up.

### 2. Send Your First Message

Type a message in the input box at the bottom and press `Enter` (or click Send). For example:

```
Explain the structure of this project
```

### 3. Try Image Attachments

The killer feature! You can:
- **Paste** an image from clipboard (`Ctrl+V` / `Cmd+V`)
- **Drag and drop** an image file onto the input area
- **Click the attachment button** to pick a file

Then ask about it:

```
What's wrong with this UI? [attached screenshot]
```

### 4. Use @-Mentions

Type `@` in the input to open fuzzy file search. Select a file to attach it as context:

```
@src/components/Header.tsx refactor this to use a custom hook
```

### 5. Try Slash Commands

Type `/` to see available opencode commands:

```
/compact summarize the current conversation
```

---

## What's Next?

- 📖 [Features Guide](Features-Guide) — Learn all features in detail
- ⚙️ [Configuration](Configuration) — Customize settings and commands
- 🔧 [Troubleshooting](Troubleshooting) — Fix common issues
