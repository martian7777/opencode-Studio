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
│  │ • Chat UI           │        │ • Server lifecycle mgmt  │  │
│  │ • Composer input    │        │ • @opencode-ai/sdk       │  │
│  │ • Attachments       │ typed  │ • RPC request handler    │  │
│  │ • Session sidebar   │ bridge │ • SSE event relay        │  │
│  │ • Model/agent picks │        │ • Webview panel mgmt     │  │
│  │ • @-mention search  │        │                          │  │
│  │ • /command palette  │        │                          │  │
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
                                  └─────────────────────┘
                                             │
                                    API calls to providers
                                             │
                                             ▼
                                  ┌─────────────────────┐
                                  │  AI Model Providers  │
                                  │  (OpenAI, Anthropic, │
                                  │   Google, Ollama…)   │
                                  └─────────────────────┘
```

---

## Package Structure

The project is a monorepo managed with npm workspaces.

### `packages/shared` — RPC Protocol

The **contract** between the webview and extension host.

```
packages/shared/
└── src/
    └── protocol.ts    # All type definitions for the RPC bridge
```

**Key types:**
- `RpcRequests` — Map of method names to parameter types
- `RpcRequestMessage` / `RpcResponseMessage` — Typed request/response envelopes
- `HostEventMessage` — Unsolicited events (SSE stream, server status)
- `FilePartInput` / `TextPartInput` — Attachment types
- `ServerStatus` — Connection state machine
- `ControlMessage` — Non-RPC control messages (`webview-ready`, `server-restart`)

### `packages/extension` — Extension Host

The Node.js backend running inside the editor's extension host process.

```
packages/extension/
└── src/
    ├── extension.ts   # Activation entry point, lifecycle management
    ├── server.ts      # opencode server process spawning & management
    ├── rpc.ts         # RPC request handler (routes methods to SDK calls)
    └── webview.ts     # Webview panel creation and HTML bootstrapping
```

**Responsibilities:**
- **Server lifecycle** (`server.ts`): Spawn `opencode serve`, detect readiness, handle crashes, auto-restart
- **RPC handler** (`rpc.ts`): Receive typed requests from the webview, call the `@opencode-ai/sdk`, send typed responses
- **Event relay**: Subscribe to the opencode SSE event stream and forward events to the webview
- **Webview management** (`webview.ts`): Create the webview panel, inject the built React app, manage CSP

### `packages/webview` — React GUI

The frontend UI rendered inside the VS Code webview.

```
packages/webview/
└── src/
    ├── main.tsx               # React entry point
    ├── App.tsx                # Root component and layout
    ├── index.css              # Global styles (Tailwind + custom)
    ├── components/
    │   ├── Composer.tsx       # Message input with attachments & @-mentions
    │   ├── MessageList.tsx    # Chat message rendering
    │   ├── Header.tsx         # Model/agent pickers, session controls
    │   ├── SessionSidebar.tsx # Session list and navigation
    │   ├── ConnectionBanner.tsx # Server status indicator
    │   ├── StatusPill.tsx     # Connection status badge
    │   └── Suggestions.tsx    # Quick-start suggestions
    ├── lib/                   # Utilities (RPC client, VS Code API bridge)
    └── state/                 # State management (React context/stores)
```

---

## Data Flow

### Sending a Message

```
User types message + attaches image
         │
         ▼
┌─ Composer.tsx ───────────────────────────────┐
│ 1. Build PartInput[] (text + FilePartInput)  │
│ 2. Send RPC: session.prompt                  │
└──────────────────────┬───────────────────────┘
                       │ postMessage
                       ▼
┌─ rpc.ts (Extension Host) ────────────────────┐
│ 3. Receive RpcRequestMessage                 │
│ 4. Call sdk.session.prompt(id, parts)        │
│ 5. Send RpcResponseMessage back              │
└──────────────────────┬───────────────────────┘
                       │ HTTP POST
                       ▼
┌─ opencode server ────────────────────────────┐
│ 6. Forward prompt to AI provider             │
│ 7. Stream response via SSE                   │
└──────────────────────┬───────────────────────┘
                       │ SSE events
                       ▼
┌─ server.ts (Extension Host) ─────────────────┐
│ 8. Receive SSE events                        │
│ 9. Forward as HostEventMessage to webview    │
└──────────────────────┬───────────────────────┘
                       │ postMessage
                       ▼
┌─ MessageList.tsx ────────────────────────────┐
│ 10. Render streaming tokens, tool cards      │
│ 11. Update UI in real-time                   │
└──────────────────────────────────────────────┘
```

### Server Lifecycle

```
Extension activates
       │
       ▼
   Is opencode.serverUrl set?
       │
   ┌───┴───┐
   │ Yes   │ No
   │       │
   ▼       ▼
Connect  Spawn `opencode serve`
to URL       │
   │         ├─ Find free port
   │         ├─ Start child process
   │         ├─ Poll for readiness
   │         └─ Connect when ready
   │              │
   └──────┬───────┘
          │
          ▼
   Subscribe to SSE events
   Relay to webview
          │
          ▼
   Ready for user interaction
```

---

## RPC Protocol

All communication between the webview and extension host uses a typed RPC protocol over `postMessage`.

### Request Methods

| Method | Parameters | Purpose |
| :--- | :--- | :--- |
| `server.status` | `void` | Get current server connection state |
| `session.list` | `void` | List all sessions |
| `session.create` | `{ title?, parentID? }` | Create a new session |
| `session.get` | `{ id }` | Get session details |
| `session.messages` | `{ id }` | Get messages for a session |
| `session.prompt` | `{ id, parts[], model?, agent? }` | Send a prompt with attachments |
| `session.command` | `{ id, command, arguments?, agent?, model? }` | Run a slash command |
| `session.abort` | `{ id }` | Cancel an in-flight request |
| `find.files` | `{ query }` | Fuzzy file search |
| `find.text` | `{ pattern }` | Text search in workspace |
| `find.symbols` | `{ query }` | Symbol search |
| `command.list` | `void` | List available slash commands |
| `config.get` | `void` | Get opencode configuration |
| `config.providers` | `void` | List configured model providers |
| `app.agents` | `void` | List available agents |

### Message Types

```
Webview → Host:
  ├── RpcRequestMessage   { kind: "rpc-request", id, method, params }
  ├── { kind: "webview-ready" }
  └── { kind: "server-restart" }

Host → Webview:
  ├── RpcResponseMessage  { kind: "rpc-response", id, result?, error? }
  ├── { kind: "event", event }       (SSE event passthrough)
  └── { kind: "server-status", status }
```

---

## Build Pipeline

```
packages/webview (Vite)          packages/extension (esbuild)
       │                                │
   npm run build:webview           npm run build:extension
       │                                │
       ▼                                ▼
   dist/ → copied to              dist/extension.js
   extension/media/webview/       (bundled Node.js module)
       │                                │
       └────────────┬───────────────────┘
                    │
                npm run package
                    │
                    ▼
            opencode-gui.vsix
```

---

## Security Model

- The webview runs in a sandboxed iframe with a strict **Content Security Policy**
- The webview **never makes network requests** — all communication goes through `postMessage` to the extension host
- File access is mediated by the extension host using the VS Code API
- The opencode server runs on `localhost` only
