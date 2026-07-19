<div align="center">

<img src="packages/extension/media/icon.png" alt="opencode Studio" width="120" />

# opencode Studio

### The GUI that opencode deserves.

[![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/martian7777.opencode-studio?label=VS%20Code%20Marketplace&logo=visual-studio-code&logoColor=white&color=0078d4)](https://marketplace.visualstudio.com/items?itemName=martian7777.opencode-studio)
[![Open VSX](https://img.shields.io/open-vsx/v/martian7777/opencode-studio?label=Open%20VSX&logo=eclipse&logoColor=white&color=c160ef)](https://open-vsx.org/extension/martian7777/opencode-studio)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e.svg)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/martian7777/opencode-gui/ci.yml?label=CI&logo=github)](https://github.com/martian7777/opencode-gui/actions)

**Chat with images & files · `@`-mention search · `/` slash commands · tool approval modes**
**Works across VS Code, Cursor, Windsurf, Antigravity, VSCodium & code-server.**

[Install](#-install) · [Features](#-features) · [Wiki](https://github.com/martian7777/opencode-gui/wiki) · [Contributing](#-contributing)

</div>

---

## 🎯 The Problem

[opencode](https://opencode.ai) is a powerful AI coding agent — but its terminal-only interface means:

- ❌ **No image attachments** — can't paste screenshots, drag UI mockups, or share error screenshots
- ❌ **No file drag-and-drop** — selecting context means typing paths manually
- ❌ **No discoverability** — commands and models are hidden behind memorized syntax
- ❌ **No tool approval UI** — no visual way to approve, reject, or auto-approve tool actions
- ❌ **No visual feedback** — streaming output is raw text, tool calls are invisible

## ✅ The Solution

**opencode Studio** wraps the full opencode server in a **native-feeling GUI** that lives right inside your editor — no new windows, no browser tabs, no context switching.

One extension. Every VS Code-family editor. All the features the terminal never had.

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🖼️ Image & File Attachments
Paste from clipboard (`Ctrl+V`), drag-and-drop with visual drop zone, or pick files — the #1 gap that started this project. Send screenshots, mockups, and documents directly in chat.

</td>
<td width="50%">

### 🔎 `@`-Mention File Search
Type `@` to fuzzy-search your entire workspace. Mention any file to add it as context — no path typing required. Supports text search and symbol search.

</td>
</tr>
<tr>
<td>

### ⚡ `/` Slash Commands
A discoverable palette of all opencode commands. Type `/` and instantly find what you need with autocomplete — no docs lookup required.

</td>
<td>

### 💬 Streaming Chat with Tool Cards
Live token streaming with full markdown + GFM rendering, syntax-highlighted code, **expandable tool-call cards** with status indicators and output, and inline image rendering.

</td>
</tr>
<tr>
<td>

### 🛡️ Permission & Mode System
Four execution modes — **Manual** (approve everything), **Auto** (approve safe, ask on risky), **Bypass** (approve all), and **Plan** (read-only). Risky actions like shell commands, network requests, and file deletions always prompt in Auto mode.

</td>
<td>

### 🧠 Model & Agent Pickers
Switch between providers (OpenAI, Anthropic, Google, Ollama…), models, and agents (build, plan) from header dropdowns. Changes take effect on the next message — no restarts.

</td>
</tr>
<tr>
<td>

### 🗂️ Session Management
Browse, resume, delete (with confirmation), and start conversations in a slide-out sidebar. Sessions persist across editor restarts via the opencode server.

</td>
<td>

### ♻️ Built-in Resilience
Transient failures retry with exponential backoff (3 attempts). Provider errors surface a one-click **Retry**. Server crashes auto-restart (up to 5 times with backoff). An **abort/stop button** cancels in-flight requests.

</td>
</tr>
</table>

### Additional Capabilities

- 🧠 **Reasoning/thinking display** — model reasoning tokens render alongside regular output
- 🔌 **SDK fallback launcher** — if primary server spawn fails, falls back to the SDK's cross-spawn launcher
- 🟢 **Live connection banner** — real-time server status (starting/connected/error/stopped) with one-click restart
- 📋 **Output channel logging** — full server logs in VS Code's Output panel (`opencode server`)
- ⏎ **Keyboard shortcuts** — `Enter` to send, `Shift+Enter` for newline, `↑`/`↓`/`Tab` for suggestion navigation, `Escape` to dismiss

---

## 🌐 Editor Compatibility

| Editor | Install Method | Status |
| :--- | :--- | :---: |
| **VS Code** | [Marketplace](https://marketplace.visualstudio.com/items?itemName=martian7777.opencode-studio) / VSIX | ✅ |
| **Cursor** | [Open VSX](https://open-vsx.org/extension/martian7777/opencode-studio) / VSIX | ✅ |
| **Windsurf** | [Open VSX](https://open-vsx.org/extension/martian7777/opencode-studio) / VSIX | ✅ |
| **Antigravity** | [Open VSX](https://open-vsx.org/extension/martian7777/opencode-studio) / VSIX | ✅ |
| **VSCodium** · **code-server** | [Open VSX](https://open-vsx.org/extension/martian7777/opencode-studio) / VSIX | ✅ |

> All editors share the VS Code extension API — **one build covers them all**.

---

## 📦 Install

### Prerequisites

- [**opencode**](https://opencode.ai) installed and on your `PATH` (or configure `opencode.binaryPath`)
- VS Code **≥ 1.75.0** (or equivalent)

### From Marketplace

1. Open Extensions in your editor (`Ctrl+Shift+X`)
2. Search **"opencode Studio"**
3. Click **Install**

### From VSIX

1. Download the latest `.vsix` from [Releases](https://github.com/martian7777/opencode-gui/releases)
2. Open Extensions → `⋯` → **Install from VSIX…**
3. Select the downloaded file

### Getting Started

1. Click the **opencode** icon in the Activity Bar
2. The extension auto-spawns `opencode serve` for your workspace
3. Start chatting — paste images, `@`-mention files, use `/` commands
4. Choose your execution mode from the header (Manual / Auto / Bypass / Plan)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Your Editor                       │
│                                                     │
│  ┌──────────────┐         ┌──────────────────────┐  │
│  │  React GUI   │──RPC──▶ │   Extension Host     │  │
│  │  (webview)   │◀─────── │   (Node.js)          │  │
│  │              │ events  │                      │  │
│  │ • Chat UI    │ results │ • Server lifecycle   │  │
│  │ • Attachments│ perms   │ • @opencode-ai/sdk   │  │
│  │ • @-mentions │         │ • RPC bridge         │  │
│  │ • /commands  │         │ • SSE event stream   │  │
│  │ • Mode picker│         │ • Permission relay   │  │
│  │ • Tool cards │         │ • Auto-restart       │  │
│  └──────────────┘         └──────────┬───────────┘  │
│                                      │              │
└──────────────────────────────────────│──────────────┘
                                       │ HTTP + SSE
                                       ▼
                              ┌─────────────────┐
                              │ opencode server  │
                              │ (local process)  │
                              └─────────────────┘
```

The webview **never touches the network**. The extension host owns the SDK client and the server process, relaying results, events, and permission requests over a typed RPC bridge.

### RPC Methods (18 endpoints)

`server.status` · `session.list` · `session.create` · `session.get` · `session.delete` · `session.messages` · `session.prompt` · `session.command` · `session.abort` · `session.permission` · `find.files` · `find.text` · `find.symbols` · `command.list` · `config.get` · `config.providers` · `app.agents`

---

## ⚙️ Settings

| Setting | Default | Description |
| :--- | :--- | :--- |
| `opencode.serverUrl` | `""` | Connect to an already-running server (e.g. `http://localhost:4096`). Leave empty to auto-spawn. |
| `opencode.binaryPath` | `opencode` | Path to the opencode executable for auto-spawning. |

### Commands

| Command | Description |
| :--- | :--- |
| `opencode: Open in Editor Tab` | Open the GUI as an editor tab instead of the sidebar |
| `opencode: New Session` | Start a fresh conversation |
| `opencode: Restart Server` | Restart the managed opencode server |

### Execution Modes

| Mode | Icon | Behavior |
| :--- | :---: | :--- |
| **Manual** | ✋ | Approve every tool action before it runs |
| **Auto** | ⚡ | Auto-approve safe actions, prompt on risky ones (shell, network, delete, install) |
| **Bypass** | ⏩ | Approve everything automatically |
| **Plan** | ◔ | Read-only — explore and plan without editing |

---

## 🔧 Reliability & Error Handling

| Concern | How It's Handled |
| :--- | :--- |
| **Transient failures** | Automatic retry with exponential backoff (400ms → 800ms → 1600ms, 3 attempts) |
| **Provider errors** | Clear error banner with one-click **Retry** button |
| **Server crashes** | Auto-restart with backoff (up to 5 times, 1s → 2s → 4s → 8s → 15s cap) |
| **Connection loss** | Live connection status banner with **Restart** button |
| **Duplicate requests** | Single in-flight request guard prevents hammering |
| **Spawn failures** | SDK fallback launcher when primary `opencode serve` spawn fails |
| **Request cancellation** | **■ Stop** button aborts in-flight requests via `session.abort` |

> **"Error from provider … Upstream request failed"** — This comes from the model backend (rate limit, credits, auth, or a flaky endpoint), not the extension. Switch model/provider or hit **Retry**.

---

## 🛠️ Development

```bash
# Clone and install
git clone https://github.com/martian7777/opencode-gui.git
cd opencode-gui
npm install

# Build everything
npm run build          # webview → extension/media/webview, then the host

# Press F5 in VS Code → "Run Extension" to launch the Extension Dev Host
```

### Scripts

| Script | What it does |
| :--- | :--- |
| `npm run build` | Build both webview (Vite) and extension (esbuild) |
| `npm run build:webview` | Build only the React webview |
| `npm run build:extension` | Build only the extension host |
| `npm run watch` | Watch mode — rebuild both on changes |
| `npm test` | Run webview unit tests (Vitest) |
| `npm run package` | Produce the `.vsix` for distribution |

### Project Structure

```
opencode-gui/
├── packages/
│   ├── extension/     # VS Code extension host
│   │   └── src/
│   │       ├── extension.ts  # Activation, lifecycle
│   │       ├── server.ts     # Server spawn, auto-restart, SDK fallback
│   │       ├── rpc.ts        # 18 RPC handlers → SDK calls + SSE relay
│   │       └── webview.ts    # Webview panel creation + CSP
│   ├── webview/       # React GUI (Vite + Tailwind)
│   │   └── src/
│   │       ├── components/   # Composer, MessageList, Header, SessionSidebar,
│   │       │                 # ConnectionBanner, StatusPill, Suggestions
│   │       ├── lib/          # RPC client, attachments, VS Code API bridge
│   │       └── state/        # Store (useSyncExternalStore), actions, modes
│   └── shared/        # Typed RPC protocol (protocol.ts)
├── .github/workflows/ # CI + automated release pipeline
└── package.json       # Monorepo root (npm workspaces)
```

---

## 🚀 Publishing

Push a version tag and CI handles the rest:

```bash
# 1. Bump version in packages/extension/package.json
# 2. Commit, tag, and push
git tag v0.1.3 && git push origin v0.1.3
```

The [release workflow](.github/workflows/release.yml) will:

1. ✅ Verify the tag matches `package.json` version
2. 🔨 Build & test
3. 📦 Package the VSIX
4. 🟦 Publish to [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=martian7777.opencode-studio)
5. 🟣 Publish to [Open VSX](https://open-vsx.org/extension/martian7777/opencode-studio)
6. 📋 Create a GitHub Release with the VSIX attached

> **Required secrets:** `VSCE_PAT` (Azure DevOps PAT) and `OVSX_PAT` (Open VSX token)

---

## 🤝 Contributing

Contributions are welcome! Please see the [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## 📖 Documentation

Visit the **[Wiki](https://github.com/martian7777/opencode-gui/wiki)** for in-depth documentation:

- [Home](https://github.com/martian7777/opencode-gui/wiki) — Overview and quick links
- [Getting Started](https://github.com/martian7777/opencode-gui/wiki/Getting-Started) — Installation and first-run guide
- [Features Guide](https://github.com/martian7777/opencode-gui/wiki/Features-Guide) — Deep dive into every feature
- [Architecture](https://github.com/martian7777/opencode-gui/wiki/Architecture) — System design and data flow
- [Configuration](https://github.com/martian7777/opencode-gui/wiki/Configuration) — All settings, commands, and modes
- [Troubleshooting](https://github.com/martian7777/opencode-gui/wiki/Troubleshooting) — Common issues and fixes
- [Development Guide](https://github.com/martian7777/opencode-gui/wiki/Development-Guide) — Building, testing, and contributing
- [FAQ](https://github.com/martian7777/opencode-gui/wiki/FAQ) — Frequently asked questions

---

## 📄 License

[MIT](LICENSE) — opencode-gui contributors

---

<div align="center">

**Built with ❤️ for the [opencode](https://opencode.ai) community**

[Report Bug](https://github.com/martian7777/opencode-gui/issues) · [Request Feature](https://github.com/martian7777/opencode-gui/issues) · [Discussions](https://github.com/martian7777/opencode-gui/discussions)

</div>
