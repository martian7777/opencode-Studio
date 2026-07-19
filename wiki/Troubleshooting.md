# Troubleshooting

Common issues and how to fix them.

---

## "opencode" command not found

**Symptom:** The extension shows "Error: opencode not found" or fails to start the server.

**Fix:**
1. Install opencode from [opencode.ai](https://opencode.ai)
2. Verify: `opencode --version` in your terminal
3. If installed but not on PATH, set `opencode.binaryPath` in settings

---

## "Error from provider … Upstream request failed"

**Symptom:** Chat shows a provider error with a Retry button.

**Cause:** This comes from the **AI model provider**, not the extension. Common reasons:
- 💳 **Rate limited** — you've exceeded API quota
- 🔑 **Auth failure** — API key is invalid or expired
- 💰 **No credits** — account balance is zero
- 🔌 **Provider outage** — the service is temporarily down

**Fix:**
1. Check your API key and credits with the provider
2. Switch to a different model/provider from the header dropdown
3. Click **Retry** once the issue is resolved

---

## Server won't start

**Symptom:** Status stays on "Starting…" or shows "Error".

**Fix:**
1. Check Output panel → **opencode** for error logs
2. Verify opencode works standalone: `opencode serve` in terminal
3. Try `opencode: Restart Server` from the command palette
4. Ensure no other instance is using the same port

---

## Webview is blank

**Symptom:** The sidebar opens but shows nothing.

**Fix:**
1. Try `Developer: Reload Window` from the command palette
2. Disable other extensions that might conflict
3. Check Developer Tools Console (`Help → Toggle Developer Tools`) for errors

---

## Attachments don't work

**Symptom:** Images or files can't be attached.

**Fix:**
1. Make sure you're pasting/dropping into the **input area** (not the message list)
2. Check file size — very large files may time out
3. Verify the file type is supported (images, text, code, data files)

---

## Remote / SSH Issues

**Symptom:** Extension doesn't work over SSH or Remote.

**Fix:**
1. Install opencode on the **remote** machine
2. Set `opencode.serverUrl` to point to a server running on the remote
3. The extension runs in the remote extension host, so opencode must be accessible there

---

## Still stuck?

- 🐛 [Open an issue](https://github.com/martian7777/opencode-gui/issues) with reproduction steps
- 💬 Ask in [Discussions](https://github.com/martian7777/opencode-gui/discussions)
- 📋 Include the Output panel logs (Output → opencode)
