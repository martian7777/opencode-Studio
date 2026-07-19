# Architecture

Technical architecture of opencode Studio — how the pieces fit together.

---

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      VS Code / Cursor / etc.                │
│                                                             │
│  ┌────────────────────┐         ┌────────────────────────┐  │
│  │    React Webview    │         │    Extension Host       │  │
│  │    (packages/       │  RPC    │    (packages/           │  │
│  │     webview)        │◀──────▶│     extension)          │  │
│  │                     │        │                          │  │
│  │ • Chat UI           │ typed  │ • Server lifecycle mgmt  │  │
│  │ • Composer input    │ bridge │ • @opencode-ai/sdk       │  │
│  │ • Attachments       │        │ • 18 RPC handlers        │  │
│  │ • Tool call cards   │ events │ • SSE event relay        │  │
│  │ • Permission UI     │ perms  │ • Permission relay       │  │
│  │ • Session sidebar   │        │ • Auto-restart logic     │  │
│  │ • Mode picker       │        │ • SDK fallback launcher  │  │
│  │ • Model/agent picks │        │ • Webview panel + CSP    │  │
│  └────────────────────┘         └──────────┬─────────────┘  │
│                                            │                │
└────────────────────────────────────────────│────────────────┘
                                             │
                                    HTTP + SSE (localhost)
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │   opencode server    │
                                  │   (managed process   │
                                  │    or external)      │
                                  └──────────┬──────────┘
                                             │
                                    API calls to providers
                                             ▼
                                  ┌─────────────────────┐
                                  │  AI Model Providers  │
                                  │  (OpenAI, Anthropic, │
                                  │   Google, Ollama…)   │
                                  └─────────────────────┘
```

---

## Package Structure

### `packages/shared` — RPC Protocol

The **contract** between the webview and extension host.

**Key types:**
- `RpcRequests` — Map of 18 method names to parameter types
- `RpcRequestMessage` / `RpcResponseMessage` — Typed request/response envelopes
- `HostEventMessage` — Unsolicited events (SSE stream, server status)
- `FilePartInput` / `TextPartInput` — Attachment types
- `ServerStatus` — Connection state machine (`starting` → `connected` → `error` → `stopped`)
- `ControlMessage` — Non-RPC messages (`webview-ready`, `server-restart`)

### `packages/extension` — Extension Host

| File | Responsibility |
| :--- | :--- |
| `extension.ts` | Activation entry point, disposable lifecycle |
| `server.ts` | Server spawn (primary + SDK fallback), auto-restart (5× with backoff), URL override mode |
| `rpc.ts` | 18 RPC handlers mapping methods → SDK calls, plus SSE event forwarding with auto-reconnect |
| `webview.ts` | Webview panel creation, HTML bootstrapping, CSP |

### `packages/webview` — React GUI

| File | Purpose |
| :--- | :--- |
| `components/Composer.tsx` | Message input with `@`-mention search, `/` command palette, attachment handling, drag-and-drop zone |
| `components/MessageList.tsx` | Message rendering: text/reasoning (markdown), file (image/chip), tool (expandable cards), typing indicator, error banner with Retry |
| `components/Header.tsx` | Mode picker (Manual/Auto/Bypass/Plan), model picker, agent selector, session controls, brand mark |
| `components/SessionSidebar.tsx` | Slide-out session list with delete confirmation |
| `components/ConnectionBanner.tsx` | Server status banner with restart button |
| `components/StatusPill.tsx` | Compact connection status badge |
| `components/Suggestions.tsx` | Autocomplete dropdown for `@` files and `/` commands |
| `lib/rpc.ts` | RPC client (`RpcClient` class), typed API wrapper (17 methods), type definitions |
| `lib/attachments.ts` | File → `MessagePart` conversion for paste, drop, and pick |
| `lib/vscode.ts` | VS Code webview API bridge |
| `state/store.ts` | Global state (useSyncExternalStore), 4 modes, permission handling, retry logic, event processing |

---

## RPC Protocol (18 Methods)

### Request Methods

| Method | Parameters | Purpose |
| :--- | :--- | :--- |
| `server.status` | — | Get server connection state |
| `session.list` | — | List all sessions |
| `session.create` | `{ title?, parentID? }` | Create a new session |
| `session.get` | `{ id }` | Get session details |
| `session.delete` | `{ id }` | Delete a session |
| `session.messages` | `{ id }` | Get messages for a session |
| `session.prompt` | `{ id, parts[], model?, agent? }` | Send a prompt with attachments |
| `session.command` | `{ id, command, args?, agent?, model? }` | Run a slash command |
| `session.abort` | `{ id }` | Cancel in-flight request |
| `session.permission` | `{ id, permissionID, response }` | Respond to permission request |
| `find.files` | `{ query }` | Fuzzy file search |
| `find.text` | `{ pattern }` | Text search (grep) |
| `find.symbols` | `{ query }` | Symbol search |
| `command.list` | — | List available slash commands |
| `config.get` | — | Get opencode configuration |
| `config.providers` | — | List configured model providers |
| `app.agents` | — | List available agents |

### Event Types

| Event | When |
| :--- | :--- |
| `message.updated` | A message is created or metadata changes |
| `message.part.updated` | A message part streams in or changes |
| `message.part.removed` | A part is removed |
| `message.removed` | A message is deleted |
| `session.idle` | Agent finishes processing |
| `session.error` | Provider or session error occurs |
| `session.updated` | Session title/metadata changes |
| `session.deleted` | Session is deleted externally |
| `permission.updated` | Tool requests approval |
| `permission.replied` | Permission was answered |
| `gui.new-session` | External trigger to create a new session |

### Message Flow

```
Webview → Host:
  ├── RpcRequestMessage   { kind: "rpc-request", id, method, params }
  ├── { kind: "webview-ready" }
  └── { kind: "server-restart" }

Host → Webview:
  ├── RpcResponseMessage  { kind: "rpc-response", id, result?, error? }
  ├── { kind: "event", event }        (SSE passthrough)
  └── { kind: "server-status", status }
```

---

## Server Lifecycle

```
Extension activates
       │
       ▼
   Is opencode.serverUrl set?
       │
   ┌───┴───┐
   │ Yes   │ No
   ▼       ▼
Connect  Try primary spawn: `opencode serve --hostname=127.0.0.1 --port=0`
to URL       │
   │     ┌───┴───┐
   │     │ OK    │ Fail
   │     │       ▼
   │     │   SDK fallback: createOpencodeServer()
   │     │       │
   │     └───┬───┘
   │         │
   └────┬────┘
        ▼
   Subscribe to SSE events (auto-reconnect loop)
   Relay events to webview
        │
        ▼
   Ready — on crash, auto-restart (up to 5×)
```

---

## Security Model

- The webview runs in a sandboxed iframe with a strict **Content Security Policy**
- The webview **never makes network requests** — all communication goes through `postMessage`
- File access is mediated by the extension host using the VS Code API
- The opencode server binds to `127.0.0.1` only (localhost)
- The SDK client uses the `heyapi` request pattern with error unwrapping
