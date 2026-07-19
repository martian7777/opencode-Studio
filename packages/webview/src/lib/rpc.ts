import type {
  HostToWebview,
  OpencodeEvent,
  RpcMethod,
  RpcRequests,
  ServerStatus,
} from "@opencode-gui/shared";
import { getVsCodeApi } from "./vscode.ts";

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

/**
 * Client half of the webview<->host RPC. `call()` returns a promise resolved
 * when the host replies; `onEvent`/`onStatus` deliver the pushed streams.
 */
class RpcClient {
  private readonly vscode = getVsCodeApi();
  private nextId = 1;
  private readonly pending = new Map<number, Pending>();
  private readonly eventListeners = new Set<(e: OpencodeEvent) => void>();
  private readonly statusListeners = new Set<(s: ServerStatus) => void>();
  private lastStatus?: ServerStatus;

  constructor() {
    window.addEventListener("message", (ev) => this.onMessage(ev.data as HostToWebview));
  }

  call<M extends RpcMethod>(
    method: M,
    ...args: RpcRequests[M] extends void ? [] : [RpcRequests[M]]
  ): Promise<unknown> {
    const id = this.nextId++;
    const params = (args[0] ?? undefined) as RpcRequests[M];
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.vscode.postMessage({ kind: "rpc-request", id, method, params });
    });
  }

  onEvent(fn: (e: OpencodeEvent) => void): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }

  onStatus(fn: (s: ServerStatus) => void): () => void {
    this.statusListeners.add(fn);
    if (this.lastStatus) fn(this.lastStatus);
    return () => this.statusListeners.delete(fn);
  }

  private onMessage(msg: HostToWebview) {
    if (!msg || typeof msg !== "object") return;
    switch (msg.kind) {
      case "rpc-response": {
        const p = this.pending.get(msg.id);
        if (!p) return;
        this.pending.delete(msg.id);
        if (msg.error) p.reject(new Error(msg.error.message));
        else p.resolve(msg.result);
        break;
      }
      case "event":
        for (const fn of this.eventListeners) fn(msg.event);
        break;
      case "server-status":
        this.lastStatus = msg.status;
        for (const fn of this.statusListeners) fn(msg.status);
        break;
    }
  }
}

export const rpc = new RpcClient();

/** Typed convenience wrappers around the raw RPC surface. */
export const api = {
  serverStatus: () => rpc.call("server.status") as Promise<unknown>,
  agents: () => rpc.call("app.agents") as Promise<unknown>,
  listSessions: () => rpc.call("session.list") as Promise<SessionInfo[]>,
  createSession: (title?: string) => rpc.call("session.create", { title }) as Promise<SessionInfo>,
  getMessages: (id: string) => rpc.call("session.messages", { id }) as Promise<MessageWithParts[]>,
  prompt: (params: RpcRequests["session.prompt"]) => rpc.call("session.prompt", params),
  command: (params: RpcRequests["session.command"]) => rpc.call("session.command", params),
  abort: (id: string) => rpc.call("session.abort", { id }),
  findFiles: (query: string) => rpc.call("find.files", { query }) as Promise<string[]>,
  findText: (pattern: string) => rpc.call("find.text", { pattern }) as Promise<TextMatch[]>,
  findSymbols: (query: string) => rpc.call("find.symbols", { query }) as Promise<unknown[]>,
  listCommands: () => rpc.call("command.list") as Promise<CommandInfo[]>,
  providers: () => rpc.call("config.providers"),
};

// Loose result shapes (the opencode API returns richer objects than we model here).
export interface SessionInfo {
  id: string;
  title?: string;
  time?: { created?: number; updated?: number };
  parentID?: string;
}

export interface MessagePart {
  id: string;
  type: string;
  text?: string;
  mime?: string;
  filename?: string;
  url?: string;
  tool?: string;
  state?: { status?: string; title?: string; output?: string; input?: unknown };
  [key: string]: unknown;
}

export interface MessageInfo {
  id: string;
  role: "user" | "assistant";
  sessionID: string;
  time?: { created?: number };
  [key: string]: unknown;
}

export interface MessageWithParts {
  info: MessageInfo;
  parts: MessagePart[];
}

export interface CommandInfo {
  name: string;
  description?: string;
  agent?: string;
  model?: string;
}

export interface TextMatch {
  path: { text: string };
  lines: { text: string };
  line_number: number;
}
