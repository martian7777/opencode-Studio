# FAQ

Frequently asked questions about opencode Studio.

---

## General

### What is opencode Studio?

A cross-IDE GUI extension for [opencode](https://opencode.ai) that adds image attachments, file search, slash commands, and streaming chat — features the terminal can't provide.

### Is this an official opencode product?

No. opencode Studio is a community-built GUI that uses the public opencode SDK and server API.

### Which editors are supported?

VS Code, Cursor, Windsurf, Antigravity, VSCodium, and code-server — any editor that supports the VS Code extension API.

### Is it free?

Yes. opencode Studio is MIT licensed and free to use. However, you need your own API keys for AI model providers (OpenAI, Anthropic, etc.), which may have usage costs.

---

## Features

### Can I use images with any model?

It depends on the model. Vision-capable models (GPT-4o, Claude 3.5 Sonnet, Gemini, etc.) can process images. Text-only models will ignore the image context.

### What file types can I attach?

Images (PNG, JPEG, GIF, WebP, SVG), text files, code files, JSON, CSV, YAML, and more. Large binary files may not work.

### Can I use multiple @-mentions in one message?

Yes! Chain as many as you need: `@file1.ts @file2.ts make these consistent`.

### Where are my sessions stored?

Sessions are managed by the opencode server and stored on your local machine. They persist across editor restarts.

---

## Technical

### Does the extension send my code to external servers?

The extension sends data only to your configured AI provider (OpenAI, Anthropic, etc.) through the opencode server. It does not send data to any other external service.

### Why does the extension spawn a server process?

opencode is designed as a client-server architecture. The `opencode serve` command starts a local HTTP server that manages sessions, handles AI provider communication, and streams responses. The extension connects to this server.

### Can I connect to a remote opencode server?

Yes. Set `opencode.serverUrl` to the remote server URL. This is useful for shared team servers or remote development setups.

### What's the difference between the sidebar and editor tab?

The sidebar is the default view (Activity Bar icon). The editor tab (`opencode: Open in Editor Tab`) gives you more screen space. Both show the same GUI.

---

## Troubleshooting

### The extension says "opencode not found"

Install opencode from [opencode.ai](https://opencode.ai) and make sure it's on your PATH, or set `opencode.binaryPath`.

### I keep getting rate limit errors

This is from your AI provider, not the extension. Check your API usage and billing, or switch to a different model.

### Can I use this with Ollama / local models?

Yes, if opencode supports your local model setup. Configure the provider in opencode's config, and it will appear in the model picker.

---

## More Questions?

- 💬 [GitHub Discussions](https://github.com/martian7777/opencode-gui/discussions)
- 🐛 [Open an Issue](https://github.com/martian7777/opencode-gui/issues)
