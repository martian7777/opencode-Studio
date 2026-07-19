# opencode GUI

A rich, cross-IDE GUI for [opencode](https://opencode.ai) — adds the features the
terminal surface is missing: **image & file attachments**, **file search**,
**`@`-mentions**, and **slash commands**, all on top of the opencode server.

Works in every VS Code–family editor from a single build: **VS Code, Cursor,
Windsurf, VSCodium, code-server**.

## How it works

```
React GUI (webview)  ──postMessage RPC──►  Extension host (Node)
                     ◄──events/results───   ├─ spawns `opencode serve`
                                            └─ @opencode-ai/sdk client
                                                     │ HTTP + SSE
                                                     ▼
                                              opencode server
```

The webview never touches the network. The extension host owns the
`@opencode-ai/sdk` client and the opencode server process, and relays results and
a live SSE event stream back over a small typed RPC bridge. Because the GUI is a
plain web bundle, the same UI can later be hosted in JetBrains (JCEF) or a browser
with only a new thin host shell — no product rewrite.

## Requirements

- [`opencode`](https://opencode.ai) installed and on your `PATH` (or set
  `opencode.binaryPath`).

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `opencode.serverUrl` | `""` | Connect to an already-running server (e.g. `http://localhost:4096`). Empty = auto-spawn a managed server. |
| `opencode.binaryPath` | `opencode` | Path to the opencode executable used when auto-spawning. |

## Develop

```bash
npm install
npm run build          # builds webview -> extension/media/webview, then the host
# then press F5 in VS Code (Run Extension) to launch the Extension Dev Host
```

- `npm run build:webview` / `npm run build:extension` build a single package.
- `npm run watch` rebuilds both on change.
- `npm test` runs the webview unit tests.
- `npm run package` produces `opencode-gui.vsix`.

## Packages

- `packages/extension` — VS Code extension host (server lifecycle, SDK client, RPC).
- `packages/webview` — the React GUI (chat, attachments, search, commands).
- `packages/shared` — the RPC protocol shared by both sides.
