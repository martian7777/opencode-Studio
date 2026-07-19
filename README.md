<div align="center">

# opencode GUI

**A modern, cross-IDE GUI for [opencode](https://opencode.ai).**

Chat with **image & file attachments**, **file search**, **`@`-mentions**, and
**slash commands** the features the terminal surface never had.

One web bundle, every major editor.

</div>

---

## Works in

| Editor | How | Status |
| --- | --- | --- |
| **VS Code** | Marketplace / VSIX | ✅ |
| **Cursor** | Open VSX / VSIX | ✅ |
| **Windsurf** | Open VSX / VSIX | ✅ |
| **Antigravity** | Open VSX / VSIX | ✅ |
| **VSCodium** · **code-server** | Open VSX / VSIX | ✅ |

All the VS Code-family editors run the **same extension** they share the
extension API, so one build covers them all.

## Features

- 🖼️ **Image & file attachments**: paste, drag-and-drop, or pick. The gap that
  started this project.
- 🔎 **`@`-mention file search** : fuzzy workspace search as you type.
- ⚡ **`/` slash commands**: discover and run opencode commands from a palette.
- 💬 **Streaming chat**: live token/tool streaming with markdown, tool cards, and
  inline images.
- 🧠 **Model & agent pickers**: switch provider/model and agent (build, plan, …).
- 🗂️ **Sessions**: browse, resume, and start conversations.
- ♻️ **Resilient**: transient failures retry with backoff; provider errors show a
  one-click **Retry**.

## How it works

```
React GUI (webview)  ──postMessage RPC──►  Extension host (Node)
                     ◄──events/results───   ├─ spawns `opencode serve`
                                            └─ @opencode-ai/sdk client
                                                     │ HTTP + SSE
                                                     ▼
                                              opencode server
```

The webview never touches the network. The host owns the `@opencode-ai/sdk`
client and the opencode server process, and relays results + a live SSE event
stream over a small typed RPC bridge.

## Requirements

- [`opencode`](https://opencode.ai) on your `PATH` (or set `opencode.binaryPath`).

## Install

- **VS Code / Cursor / Windsurf / Antigravity / VSCodium**: search **“opencode Studio”**
  in the Extensions view, or install the `.vsix` from the
  [Releases](https://github.com/martian7777/opencode-gui/releases) page
  (`Extensions → ⋯ → Install from VSIX`).

Open the **opencode** icon in the Activity Bar. The extension auto-spawns
`opencode serve` for your workspace.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `opencode.serverUrl` | `""` | Connect to an already-running server (e.g. `http://localhost:4096`). Empty = auto-spawn a managed server. |
| `opencode.binaryPath` | `opencode` | Path to the opencode executable used when auto-spawning. |

## Reliability & scale — what actually applies

opencode GUI is a **single-user client**: each editor talks to its own local
`opencode serve`. So the classic server-scaling levers don't apply here, and the
extension deliberately doesn't ship them:

- **Sharding / load balancing** → not applicable. There is one local server per
  user; there is nothing to shard or balance. Scaling model throughput is the
  **provider's** concern, reached *through* opencode.
- **Rate limiting** → the meaningful case is the upstream **model provider**
  returning `429`/`5xx`/“Upstream request failed”. The GUI handles this on the
  client: a **single in-flight request** guard, **exponential backoff** on
  transient failures, and a **Retry** action on provider errors. It does not
  hammer the provider.

> Seeing **“Error from provider … Upstream request failed”**? That comes from the
> model backend (rate limit, credits, auth, or a flaky free endpoint), not the
> extension. Switch model/provider or hit **Retry**.

If you later run a **shared/hosted** opencode server for a team, put standard
infrastructure (reverse proxy, rate limiter, autoscaler) in front of *that
server* — the extension will happily point at it via `opencode.serverUrl`.

## Develop

```bash
npm install
npm run build          # webview -> extension/media/webview, then the host
# press F5 in VS Code (Run Extension) to launch the Extension Dev Host
```

- `npm run build:webview` / `build:extension` — build one package.
- `npm run watch` — rebuild both on change.
- `npm test` — webview unit tests.
- `npm run package` — produce the `.vsix`.

## Publishing (automated)

Push a version tag and CI publishes to **both** marketplaces:

```bash
# bump packages/extension/package.json version to X.Y.Z first
git tag vX.Y.Z && git push origin vX.Y.Z
```

[`.github/workflows/release.yml`](.github/workflows/release.yml) builds, tests,
packages, then publishes to the **VS Code Marketplace** and **Open VSX**, and
attaches the VSIX to a GitHub Release. It requires two repo secrets:

| Secret | For | Where |
| --- | --- | --- |
| `VSCE_PAT` | VS Code Marketplace | Azure DevOps PAT, *Marketplace → Manage* scope |
| `OVSX_PAT` | Open VSX (Cursor/Windsurf/Antigravity/VSCodium) | [open-vsx.org](https://open-vsx.org) access token |

## Packages

- `packages/extension`: VS Code extension host (server lifecycle, SDK client, RPC).
- `packages/webview`: the React GUI (chat, attachments, search, commands).
- `packages/shared`: the RPC protocol shared by both sides.

## License

MIT
