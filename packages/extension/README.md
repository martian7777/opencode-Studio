<div align="center">

# opencode Studio

### The GUI that [opencode](https://opencode.ai) deserves.

**Chat with images & files · `@`-mention search · `/` slash commands · tool approval modes**

Works across **VS Code, Cursor, Windsurf, Antigravity, VSCodium & code-server**.

</div>

---

## 🎯 Why opencode Studio?

[opencode](https://opencode.ai) is a powerful AI coding agent — but its terminal surface can't show images, handle drag-and-drop, provide tool approval UI, or give you discoverability. **opencode Studio** fills that gap with a native-feeling GUI that lives right inside your editor.

---

## ✨ Features

- 🖼️ **Image & file attachments** — paste from clipboard, drag-and-drop (with visual drop zone), or pick files
- 🔎 **`@`-mention file search** — fuzzy workspace search, plus text search and symbol search
- ⚡ **`/` slash commands** — discover and run opencode commands from an autocomplete palette
- 💬 **Streaming chat** — live token streaming with GFM markdown, syntax highlighting, and inline images
- 🔧 **Tool call cards** — expandable cards showing each tool invocation with status (running/completed/error) and output
- 🧠 **Reasoning display** — model reasoning/thinking tokens render alongside regular output
- 🛡️ **Permission & mode system** — four execution modes:
  - ✋ **Manual** — approve every tool action
  - ⚡ **Auto** — auto-approve safe actions, prompt on risky ones (shell, network, delete, install)
  - ⏩ **Bypass** — approve everything automatically
  - ◔ **Plan** — read-only exploration, no edits
- 🧠 **Model & agent pickers** — switch provider/model and agent (build, plan) from header dropdowns
- 🗂️ **Session management** — browse, resume, delete (with confirmation), and start conversations
- ■ **Abort/Stop** — cancel in-flight requests with one click
- ♻️ **Built-in resilience** — transient retries with exponential backoff (3 attempts), server auto-restart (up to 5 times), one-click **Retry** on provider errors
- 🟢 **Live connection status** — real-time banner showing server state with restart button
- 📋 **Output channel** — full server logs in the Output panel

---

## 📦 Getting Started

### Prerequisites

[opencode](https://opencode.ai) must be installed and on your `PATH` (or set `opencode.binaryPath`).

### Quick Start

1. Install **opencode Studio** from the Extensions view
2. Click the **opencode** icon in the Activity Bar
3. The extension auto-spawns `opencode serve` for your workspace
4. Choose your execution mode (Manual / Auto / Bypass / Plan)
5. Start chatting!

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

### Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Enter` | Send message |
| `Shift+Enter` | New line |
| `↑` / `↓` | Navigate suggestions |
| `Tab` / `Enter` | Accept suggestion |
| `Escape` | Dismiss suggestions |

---

## 🏗️ How It Works

```
React GUI (webview)  ──postMessage RPC──►  Extension host (Node)
                     ◄──events/results───   ├─ spawns `opencode serve`
                     ◄──permissions──────   ├─ @opencode-ai/sdk client
                                            └─ SSE event stream relay
                                                     │ HTTP + SSE
                                                     ▼
                                              opencode server
```

The webview never touches the network. The extension host owns the SDK client and the server process, relaying results, events, and permission requests over a typed RPC bridge with 18 endpoints.

---

## 🔧 Troubleshooting

> **"Error from provider … Upstream request failed"** — This comes from the model backend (rate limit, credits, auth, or a flaky endpoint), not the extension. Switch model/provider or hit **Retry**.

**Other tips:**
- Make sure `opencode` is on your `PATH` — run `opencode --version` in your terminal to verify
- If the server won't start, check the Output panel → **opencode server** for logs
- Server crashes auto-restart up to 5 times — if it keeps crashing, use `opencode: Restart Server`
- For remote/SSH setups, set `opencode.serverUrl` to point to a running server

---

## 📖 Documentation

Full documentation is available on the **[Wiki](https://github.com/martian7777/opencode-gui/wiki)**.

---

## 📄 License

[MIT](https://github.com/martian7777/opencode-gui/blob/main/LICENSE)

Source & docs: [github.com/martian7777/opencode-gui](https://github.com/martian7777/opencode-gui)
