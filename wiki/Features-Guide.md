# Features Guide

A comprehensive deep dive into every opencode Studio feature.

---

## 🖼️ Image & File Attachments

The #1 reason this project exists. The opencode terminal can't handle visual context — opencode Studio can.

### Supported Methods

| Method | How | Best For |
| :--- | :--- | :--- |
| **Clipboard paste** | `Ctrl+V` / `Cmd+V` | Screenshots, copied images |
| **Drag & drop** | Drag file onto the input area | Files from your file manager |
| **File picker** | Click the 📎 **Attach** button | Browsing for specific files |

When you drag a file over the input area, a **visual drop zone** appears with a dashed border and accent highlight — so you always know exactly where to drop.

### Supported Formats

- **Images**: PNG, JPEG, GIF, WebP, SVG — render as thumbnail previews in the attachment bar
- **Documents**: Text files, code files, PDFs
- **Data**: JSON, CSV, YAML, TOML

### Attachment Chips

Each attachment shows as a removable chip above the input:
- **Images** display a 56×56 thumbnail preview
- **Other files** display the filename or MIME type
- Hover and click **×** to remove

### How It Works

Attachments are sent as `FilePartInput` objects through the RPC bridge. The webview converts files to base64 data URLs (for pasted/dropped content) or workspace-relative paths (for picked files). The extension host forwards them to the opencode server via the SDK's `session.prompt` endpoint.

---

## 🔎 `@`-Mention File Search

Type `@` anywhere in the input to trigger fuzzy file search across your workspace.

### How to Use

1. Type `@` in the message input
2. A dropdown appears with matching files (up to 30 results)
3. Continue typing to filter results
4. Select with `↑`/`↓` arrows and `Enter`/`Tab`, or click
5. The file reference is inserted into your message

### Search Types

opencode Studio supports three search methods via the RPC protocol:

| Method | Trigger | Purpose |
| :--- | :--- | :--- |
| `find.files` | `@` in input | Fuzzy file path search |
| `find.text` | Via opencode commands | Grep-style text search |
| `find.symbols` | Via opencode commands | Symbol search (functions, classes, etc.) |

### Tips

- Type `@comp` to quickly find files in a `components/` directory
- Chain multiple `@`-mentions: `@Header.tsx @Footer.tsx make these consistent`
- The search uses a sequence counter to prevent stale results from overwriting fresh ones

---

## ⚡ `/` Slash Commands

Type `/` at the start of your input to open the command palette.

### How to Use

1. Type `/` at the beginning of the message
2. A palette shows available opencode commands with descriptions
3. Filter by typing the command name
4. Select with `↑`/`↓` arrows and `Enter`/`Tab`, or click
5. Add arguments after the command: `/compact summarize the conversation`

### How It Works

Commands route to the `session.command` RPC endpoint instead of `session.prompt`. The command name and arguments are parsed from the input, and the current model and agent selections are passed along.

---

## 💬 Streaming Chat with Tool Cards

Messages stream in real-time with rich rendering.

### Message Parts

Each message is composed of typed **parts**, each rendered differently:

| Part Type | Rendering |
| :--- | :--- |
| `text` | Full GFM markdown via ReactMarkdown + remarkGfm |
| `reasoning` | Rendered like text — shows model thinking/reasoning tokens |
| `file` | Image thumbnail (for image MIME types) or file attachment chip |
| `tool` | Expandable tool call card with status and output |

### Tool Call Cards

Tool invocations appear as collapsible `<details>` elements showing:
- **Status icon**: `•` running, `✓` completed (green), `✗` error (red)
- **Tool name** in monospace font
- **Title/description** of the action
- **Expandable output** — click to see the tool's full output (scrollable, up to 240px)

### Typing Indicator

While the agent is generating, an animated three-dot typing indicator appears alongside the assistant avatar.

### Error Display

Provider errors and session errors appear as a red-tinted banner with:
- ⚠ icon and error message
- One-click **↻ Retry** button (appears when a previous prompt can be resent)

---

## 🛡️ Permission & Mode System

opencode Studio includes a full tool approval system with four execution modes.

### Modes

| Mode | Icon | Behavior |
| :--- | :---: | :--- |
| **Manual** | ✋ | Every tool action requires explicit approval |
| **Auto** | ⚡ | Safe actions auto-approve; risky ones prompt for approval |
| **Bypass** | ⏩ | Everything auto-approves — no prompts at all |
| **Plan** | ◔ | Read-only mode — explore and plan without any edits. Forces the `plan` agent |

### What's "Risky"?

In **Auto** mode, the following patterns trigger a confirmation prompt:

```
bash, shell, exec, external, webfetch, fetch, network,
doom, delete, rm, install, sudo
```

These are matched against the permission's `type`, `title`, and `pattern` fields.

### Permission Flow

1. The opencode server emits a `permission.updated` event
2. The extension relays it to the webview
3. Based on the current mode:
   - **Bypass**: auto-approves immediately
   - **Auto** (safe action): auto-approves immediately
   - **Auto** (risky action): adds to permission queue for user decision
   - **Manual/Plan**: always adds to permission queue
4. User responds: **Allow Once**, **Always Allow**, or **Reject**
5. Response is sent via `session.permission` RPC endpoint

### Switching Modes

Click the mode dropdown in the header bar. The mode icon (✋/⚡/⏩/◔) shows the current mode at a glance.

---

## 🧠 Model & Agent Pickers

### Model Picker

The header shows your current model in a dropdown. Models are loaded from your opencode config via `config.providers`:

- Displays as `provider · model name` (e.g., `openai · GPT-4o`)
- Auto-selects the default model from your opencode config
- Changes take effect on the next message — no restart needed

### Agent Picker / Mode

The mode dropdown doubles as the agent selector:
- **Manual/Auto/Bypass** use the selected agent (defaults to `build`)
- **Plan** forces the `plan` agent regardless of selection
- Primary agents (`build`) sort to the top

---

## 🗂️ Session Management

### Session Sidebar

Click **☰** in the header to open the session sidebar:
- **Browse** all sessions, sorted by most recently updated
- **Resume** a session by clicking it
- **Delete** with a two-step confirmation (🗑 → Delete/✕)
- **Create** a new session from the sidebar's **＋ New** button

### Session Lifecycle

| Event | Handling |
| :--- | :--- |
| `session.updated` | Session list refreshes with new title/timestamp |
| `session.deleted` | Session removed from list; if active, state clears |
| `gui.new-session` | Triggers a new session (can be initiated externally) |

### Auto-Create

If you send a message with no active session, one is automatically created.

---

## ■ Abort / Stop

While the agent is generating, a **■ Stop** button replaces the Send button. Clicking it:
1. Calls `session.abort` on the current session
2. Immediately sets `busy = false`
3. The UI returns to the ready state

---

## ♻️ Resilience & Error Recovery

### Automatic Retries (Transient Failures)

Network timeouts, 502/503/504 errors, connection refused, rate limits, and "overloaded" responses are retried automatically:

- **3 attempts** with exponential backoff: 400ms → 800ms → 1600ms
- Pattern matching: `timeout`, `network`, `fetch failed`, `econn`, `502`, `503`, `504`, `rate limit`, `overloaded`, `upstream`

### Server Auto-Restart

If the managed server process exits unexpectedly:
- Auto-restarts up to **5 times**
- Backoff: 1s → 2s → 4s → 8s → 15s (capped)
- After 5 failures: shows error message and stops retrying
- Use `opencode: Restart Server` to manually reset the counter

### SDK Fallback Launcher

If the primary `opencode serve` spawn fails (PATH issues, quoting quirks), the extension falls back to `createOpencodeServer()` from the SDK — a cross-platform launcher that handles binary resolution internally.

### Provider Error Recovery

When a model provider returns an error:
1. The error is displayed in a red banner
2. The `lastPrompt` is preserved
3. A **↻ Retry** button re-sends the exact same message
4. You can also switch models before retrying

### Connection Status Banner

A banner appears whenever the server isn't connected:
- **Blue** (starting): "Starting opencode server… (first launch can take a while)"
- **Red** (error): Shows the error message with a **Retry** button

---

## 🔌 Open in Editor Tab

By default, opencode Studio lives in the sidebar. Open it as a full editor tab:

1. `Ctrl+Shift+P` / `Cmd+Shift+P` → `opencode: Open in Editor Tab`
2. The GUI opens as a tab, giving you more screen real estate

---

## ⌨️ Keyboard Shortcuts

| Key | Context | Action |
| :--- | :--- | :--- |
| `Enter` | Input (no suggestions) | Send message |
| `Shift+Enter` | Input | Insert newline |
| `↑` / `↓` | Suggestions visible | Navigate suggestions |
| `Enter` / `Tab` | Suggestions visible | Accept suggestion |
| `Escape` | Suggestions visible | Dismiss suggestions |
