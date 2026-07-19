# opencode GUI

A **modern GUI for [opencode](https://opencode.ai)** — chat with **image & file
attachments**, **file search**, **`@`-mentions**, and **slash commands**, on top
of the opencode server.

Works across **VS Code, Cursor, Windsurf, Antigravity, VSCodium, and code-server**.

## Features

- 🖼️ Image & file attachments — paste, drag-and-drop, or pick
- 🔎 `@`-mention fuzzy file search
- ⚡ `/` slash-command palette
- 💬 Streaming chat with markdown, tool cards, and inline images
- 🧠 Model & agent pickers (build, plan, …)
- 🗂️ Session browser · ♻️ transient-retry with backoff + one-click Retry on provider errors

## Getting started

1. Install [`opencode`](https://opencode.ai) and make sure it's on your `PATH`.
2. Open the **opencode** icon in the Activity Bar. The extension auto-spawns
   `opencode serve` for your workspace.

## Settings

- `opencode.serverUrl` — connect to an already-running server instead of
  auto-spawning (e.g. `http://localhost:4096`).
- `opencode.binaryPath` — path to the `opencode` executable.

> **“Error from provider … Upstream request failed”** comes from the model
> backend (rate limit / credits / auth / flaky endpoint), not the extension —
> switch model or hit **Retry**.

Source & docs: https://github.com/martian7777/opencode-gui
