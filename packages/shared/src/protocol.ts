/**
 * RPC protocol shared between the VS Code extension host and the webview GUI.
 *
 * The webview never talks to the network. It sends typed requests to the host,
 * which owns the @opencode-ai/sdk client and the opencode server process, and
 * relays results + a live event stream back.
 */

/** A file/image attachment as accepted by the opencode prompt API (FilePartInput). */
export interface FilePartInput {
  type: "file";
  mime: string;
  filename?: string;
  /** Data URL (base64) for pasted/dropped bytes, or a file:// / workspace path reference. */
  url: string;
}

export interface TextPartInput {
  type: "text";
  text: string;
}

export type PartInput = TextPartInput | FilePartInput;

export interface ModelRef {
  providerID: string;
  modelID: string;
}

/** Parameters for each RPC method the host understands. Keep in sync with the handler. */
export interface RpcRequests {
  "server.status": void;
  "session.list": void;
  "session.create": { title?: string; parentID?: string };
  "session.get": { id: string };
  "session.messages": { id: string };
  "session.prompt": {
    id: string;
    parts: PartInput[];
    model?: ModelRef;
    agent?: string;
  };
  "session.command": {
    id: string;
    command: string;
    arguments?: string;
    agent?: string;
    model?: ModelRef;
  };
  "session.abort": { id: string };
  "find.files": { query: string };
  "find.text": { pattern: string };
  "find.symbols": { query: string };
  "command.list": void;
  "config.get": void;
  "config.providers": void;
  "app.agents": void;
}

export type RpcMethod = keyof RpcRequests;

/** Message: webview -> host. */
export interface RpcRequestMessage<M extends RpcMethod = RpcMethod> {
  kind: "rpc-request";
  id: number;
  method: M;
  params: RpcRequests[M];
}

/** Message: host -> webview, in response to a request. */
export interface RpcResponseMessage {
  kind: "rpc-response";
  id: number;
  result?: unknown;
  error?: { message: string; stack?: string };
}

export interface ServerStatus {
  state: "starting" | "connected" | "error" | "stopped";
  url?: string;
  managed: boolean;
  message?: string;
}

/** Message: host -> webview, unsolicited (server events + status). */
export type HostEventMessage =
  | { kind: "event"; event: OpencodeEvent }
  | { kind: "server-status"; status: ServerStatus };

/** A single event from the opencode SSE stream. Shape is passed through untyped-ish. */
export interface OpencodeEvent {
  type: string;
  properties?: Record<string, unknown>;
}

export type HostToWebview = RpcResponseMessage | HostEventMessage;

/** Non-RPC control messages the webview can send to the host. */
export type ControlMessage =
  | { kind: "webview-ready" }
  | { kind: "server-restart" };

export type WebviewToHost = RpcRequestMessage | ControlMessage;
