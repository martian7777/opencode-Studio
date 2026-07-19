# FAQ

Frequently asked questions about opencode Studio.

---

## General

### What is opencode Studio?

A cross-IDE GUI extension for [opencode](https://opencode.ai) that adds image attachments, file search, slash commands, tool approval modes, streaming chat with tool cards, and session management.

### Is this an official opencode product?

No. opencode Studio is a community-built GUI that uses the public opencode SDK and server API.

### Which editors are supported?

VS Code, Cursor, Windsurf, Antigravity, VSCodium, and code-server — any editor with the VS Code extension API.

### Is it free?

Yes. MIT licensed. You need your own API keys for AI model providers, which may have usage costs.

---

## Features

### What are the execution modes?

- ✋ **Manual** — approve every tool action
- ⚡ **Auto** — auto-approve safe actions, prompt on risky ones (shell, network, delete, install)
- ⏩ **Bypass** — auto-approve everything
- ◔ **Plan** — read-only mode, no file edits

### Can I use images with any model?

It depends on the model. Vision-capable models (GPT-4o, Claude Sonnet, Gemini) can process images. Text-only models will ignore the image context.

### What file types can I attach?

Images (PNG, JPEG, GIF, WebP, SVG), text files, code files, JSON, CSV, YAML, and more.

### Can I use multiple @-mentions in one message?

Yes! Chain as many as you need: `@file1.ts @file2.ts make these consistent`.

### What does the Stop button do?

It sends `session.abort` to cancel the in-flight request immediately. The UI returns to the ready state.

### What do the tool card status icons mean?

- `•` — tool is running
- `✓` (green) — completed successfully
- `✗` (red) — error occurred

Click the card to expand and see the full output.

### Where are my sessions stored?

On your local machine, managed by the opencode server. They persist across editor restarts.

### Can I delete sessions?

Yes. Open the session sidebar (☰), hover over a session, click 🗑, then confirm with the Delete button.

---

## Technical

### Does the extension send my code to external servers?

Only to your configured AI provider through the opencode server. No other external services.

### Why does the extension spawn a server process?

opencode's client-server architecture requires `opencode serve` running locally. The extension manages this automatically. If the primary spawn fails, it falls back to the SDK's cross-platform launcher.

### Can I connect to a remote opencode server?

Yes. Set `opencode.serverUrl` to the remote URL.

### What happens if the server crashes?

It auto-restarts up to 5 times with exponential backoff (1s → 2s → 4s → 8s → 15s cap). After 5 failures, it stops and asks you to check logs.

### Can I use this with Ollama / local models?

Yes, if opencode supports your local model setup. Configure the provider in opencode's config — it'll appear in the model picker.

### What's the difference between the sidebar and editor tab?

Same GUI — the editor tab (`opencode: Open in Editor Tab`) just gives more screen space.

---

## More Questions?

- 💬 [GitHub Discussions](https://github.com/martian7777/opencode-gui/discussions)
- 🐛 [Open an Issue](https://github.com/martian7777/opencode-gui/issues)
