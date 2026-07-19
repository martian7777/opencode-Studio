<div align="center">

# opencode Studio

### The GUI that [opencode](https://opencode.ai) deserves.

**Chat with images & files · `@`-mention search · `/` slash commands · streaming chat**

Works across **VS Code, Cursor, Windsurf, Antigravity, VSCodium & code-server**.

</div>

---

## 🎯 Why opencode Studio?

[opencode](https://opencode.ai) is a powerful AI coding agent — but its terminal surface can't show images, handle drag-and-drop, or give you discoverability. **opencode Studio** fills that gap with a native-feeling GUI that lives right inside your editor.

---

## ✨ Features

- 🖼️ **Image & file attachments** — paste from clipboard, drag-and-drop, or pick files
- 🔎 **`@`-mention file search** — fuzzy workspace search as you type
- ⚡ **`/` slash commands** — discover and run opencode commands from a palette
- 💬 **Streaming chat** — live token/tool streaming with markdown, tool cards, and inline images
- 🧠 **Model & agent pickers** — switch provider/model and agent (build, plan, …)
- 🗂️ **Session management** — browse, resume, and start conversations
- ♻️ **Built-in resilience** — transient retries with backoff + one-click **Retry** on provider errors

---

## 📦 Getting Started

### Prerequisites

[opencode](https://opencode.ai) must be installed and on your `PATH` (or set `opencode.binaryPath`).

### Quick Start

1. Install **opencode Studio** from the Extensions view
2. Click the **opencode** icon in the Activity Bar
3. The extension auto-spawns `opencode serve` for your workspace
4. Start chatting!

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

---

## 🏗️ How It Works

```
React GUI (webview)  ──postMessage RPC──►  Extension host (Node)
                     ◄──events/results───   ├─ spawns `opencode serve`
                                            └─ @opencode-ai/sdk client
                                                     │ HTTP + SSE
                                                     ▼
                                              opencode server
```

The webview never touches the network. The extension host owns the SDK client and the server process, relaying results over a typed RPC bridge.

---

## 🔧 Troubleshooting

> **"Error from provider … Upstream request failed"** — This comes from the model backend (rate limit, credits, auth, or a flaky endpoint), not the extension. Switch model/provider or hit **Retry**.

**Other tips:**
- Make sure `opencode` is on your `PATH` — run `opencode --version` in your terminal to verify
- If the server won't start, check the Output panel → **opencode** for logs
- For remote/SSH setups, set `opencode.serverUrl` to point to a running server

---

## 📖 Documentation

Full documentation is available on the **[Wiki](https://github.com/martian7777/opencode-gui/wiki)**.

---

## 📄 License

[MIT](https://github.com/martian7777/opencode-gui/blob/main/LICENSE)

Source & docs: [github.com/martian7777/opencode-gui](https://github.com/martian7777/opencode-gui)
