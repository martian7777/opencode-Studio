# Troubleshooting

Common issues and how to fix them.

---

## "opencode" command not found

**Symptom:** The extension shows "Could not start opencode" or the connection banner stays red.

**Fix:**
1. Install opencode from [opencode.ai](https://opencode.ai)
2. Verify: `opencode --version` in your terminal
3. If installed but not on PATH, set `opencode.binaryPath` in settings
4. Note: If primary spawn fails, the extension tries an SDK fallback launcher automatically

---

## "Error from provider … Upstream request failed"

**Symptom:** Chat shows a red error banner with a Retry button.

**Cause:** This comes from the **AI model provider**, not the extension. Common reasons:
- 💳 **Rate limited** — you've exceeded API quota
- 🔑 **Auth failure** — API key is invalid or expired
- 💰 **No credits** — account balance is zero
- 🔌 **Provider outage** — the service is temporarily down

**Fix:**
1. Check your API key and credits with the provider
2. Switch to a different model from the header dropdown
3. Click **↻ Retry** once the issue is resolved

> The extension automatically retries transient errors (502/503/504, timeouts, rate limits) up to 3 times with exponential backoff before showing the error.

---

## Server keeps crashing

**Symptom:** Connection banner shows "Server exited (code X). Restarting…" repeatedly.

**How it works:** The extension auto-restarts the server up to 5 times with backoff (1s → 2s → 4s → 8s → 15s). After 5 failures, it stops and shows: "Server crashed repeatedly."

**Fix:**
1. Check Output panel → **opencode server** for crash logs
2. Run `opencode serve` directly in your terminal to see the error
3. After fixing the issue, use `opencode: Restart Server` from the command palette (this resets the crash counter)

---

## Server won't start (timeout)

**Symptom:** "Timed out after 60s waiting for the server to print its URL."

**Fix:**
1. Ensure `opencode` binary is correct: try `opencode serve` in terminal
2. Check if another process is blocking
3. On Windows, the extension uses `shell: true` — check for antivirus interference
4. Try setting `opencode.serverUrl` to a manually started server: `opencode serve --print-logs`

---

## Webview is blank

**Symptom:** The sidebar opens but shows nothing.

**Fix:**
1. `Developer: Reload Window` from the command palette
2. Check Developer Tools Console (`Help → Toggle Developer Tools`) for errors
3. Disable other extensions that might conflict

---

## Attachments don't work

**Symptom:** Images or files can't be attached.

**Fix:**
1. Make sure you're pasting/dropping into the **input area** (look for the dashed drop zone)
2. Check file size — very large files may fail to convert to base64
3. Verify the file type is supported (images, text, code, data files)

---

## Permission prompts not appearing

**Symptom:** In Manual or Auto mode, tool actions run without asking.

**Check:**
1. Verify your mode in the header dropdown — ⏩ **Bypass** auto-approves everything
2. In **Auto** mode, only risky actions (shell, network, delete, install) prompt
3. **Plan** mode uses the `plan` agent which may not trigger tool calls

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
- 📋 Include the Output panel logs (**Output → opencode server**)
