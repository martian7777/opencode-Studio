# opencode GUI — JetBrains plugin

Phase 2 of the cross-IDE GUI. Hosts the **same** React web bundle as the VS Code
extension inside a JCEF tool window, so IntelliJ, PyCharm, WebStorm, GoLand, etc.
get the full opencode GUI — chat, image/file attachments, `@`-file search, and
`/`-commands.

## How it reuses the VS Code UI

The web bundle only assumes a VS Code webview host: `acquireVsCodeApi()` and
`window.postMessage`. This plugin provides that exact contract with a small JS
shim, so **the React app runs unmodified**:

```
React GUI (JCEF)  ──JBCefJSQuery──►  Kotlin host (OpencodeWebviewPanel)
                  ◄─window.postMessage─  ├─ OpencodeServer (spawns `opencode serve`)
                                         └─ OpencodeApi (HTTP + SSE to the server)
```

`RpcBridge` maps the same RPC method names (`session.prompt`, `find.files`,
`command.list`, …) to opencode's REST endpoints — the Kotlin equivalent of the
extension host's dispatch table. `OpencodeApi.subscribeEvents` streams SSE events
back to the UI exactly like the extension's `forwardEvents`.

## Build

The plugin bundles the web GUI from `../extension/media/webview`, so build that
first:

```bash
# from the repo root
npm install
npm run build:webview
```

Then build the plugin. Because this environment has no Gradle wrapper jar checked
in, do one of:

- **IntelliJ IDEA** (easiest): open `packages/jetbrains` as a Gradle project; the
  IDE uses its bundled Gradle. Run the `runIde` task to launch a sandbox IDE with
  the plugin, or `buildPlugin` to produce a zip under `build/distributions/`.
- **CLI**: with Gradle 8.10+ installed, run `gradle wrapper` once (creates
  `gradlew`), then `./gradlew buildPlugin`.

The tool window is named **opencode** (right dock). It auto-spawns
`opencode serve` for the open project.

## Settings

**Settings → Tools → opencode GUI** (parity with the VS Code settings):

- **Server URL** — connect to an already-running server; blank auto-spawns.
- **opencode binary path** — the executable used when auto-spawning.

Changes apply next time the tool window opens.

## Publish to the JetBrains Marketplace

Automated by [`.github/workflows/release-jetbrains.yml`](../../.github/workflows/release-jetbrains.yml)
on a `jb-v*` tag. It builds the shared web bundle, then signs and publishes the
plugin. Required repo secrets:

| Secret | Purpose |
| --- | --- |
| `JETBRAINS_MARKETPLACE_TOKEN` | Marketplace upload token |
| `CERTIFICATE_CHAIN`, `PRIVATE_KEY`, `PRIVATE_KEY_PASSWORD` | [Plugin signing](https://plugins.jetbrains.com/docs/intellij/plugin-signing.html) |

The first version must be uploaded manually once (Marketplace approval); after
that, tag pushes publish updates.

## Notes / limits

- Requires an IDE build with JCEF (all recent JetBrains IDEs on the JetBrains
  Runtime). The tool window shows a message if JCEF is unavailable.
- Restarting the server after changing settings currently means reopening the
  tool window (or use the in-UI Retry, which sends a restart).
