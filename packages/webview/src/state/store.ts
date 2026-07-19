import { useSyncExternalStore } from "react";
import type { OpencodeEvent, ServerStatus } from "@opencode-gui/shared";
import {
  api,
  rpc,
  type MessagePart,
  type MessageInfo,
  type MessageWithParts,
  type SessionInfo,
} from "../lib/rpc.ts";

export interface AgentInfo {
  name: string;
  description?: string;
  mode?: string;
}

export interface ModelOption {
  providerID: string;
  modelID: string;
  label: string;
}

interface State {
  status?: ServerStatus;
  sessions: SessionInfo[];
  activeSessionId?: string;
  /** Ordered message list for the active session. */
  messages: MessageWithParts[];
  busy: boolean;
  agents: AgentInfo[];
  models: ModelOption[];
  selectedModel?: ModelOption;
  selectedAgent?: string;
  error?: string;
}

let state: State = {
  sessions: [],
  messages: [],
  busy: false,
  agents: [],
  models: [],
};

const listeners = new Set<() => void>();

function set(partial: Partial<State>) {
  state = { ...state, ...partial };
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export function getState(): State {
  return state;
}

// ---- actions ----------------------------------------------------------------

export async function loadSessions() {
  try {
    const sessions = await api.listSessions();
    set({ sessions: sortSessions(sessions) });
    if (!state.activeSessionId && sessions.length > 0) {
      await selectSession(sessions[0].id);
    }
  } catch (err) {
    set({ error: errMsg(err) });
  }
}

export async function selectSession(id: string) {
  set({ activeSessionId: id, messages: [] });
  try {
    const messages = await api.getMessages(id);
    if (state.activeSessionId === id) set({ messages });
  } catch (err) {
    set({ error: errMsg(err) });
  }
}

export async function newSession() {
  try {
    const session = await api.createSession();
    set({ sessions: sortSessions([session, ...state.sessions]), activeSessionId: session.id, messages: [] });
  } catch (err) {
    set({ error: errMsg(err) });
  }
}

export async function sendPrompt(parts: MessagePart[]) {
  let sessionId = state.activeSessionId;
  if (!sessionId) {
    const session = await api.createSession();
    sessionId = session.id;
    set({ sessions: sortSessions([session, ...state.sessions]), activeSessionId: sessionId });
  }
  set({ busy: true, error: undefined });
  try {
    await api.prompt({
      id: sessionId,
      parts: parts.map(toPartInput),
      model: state.selectedModel
        ? { providerID: state.selectedModel.providerID, modelID: state.selectedModel.modelID }
        : undefined,
      agent: state.selectedAgent,
    });
  } catch (err) {
    set({ error: errMsg(err) });
  } finally {
    set({ busy: false });
  }
}

export async function runCommand(command: string, args: string) {
  let sessionId = state.activeSessionId;
  if (!sessionId) {
    const session = await api.createSession();
    sessionId = session.id;
    set({ sessions: sortSessions([session, ...state.sessions]), activeSessionId: sessionId });
  }
  set({ busy: true, error: undefined });
  try {
    await api.command({
      id: sessionId,
      command,
      arguments: args,
      agent: state.selectedAgent,
      model: state.selectedModel
        ? { providerID: state.selectedModel.providerID, modelID: state.selectedModel.modelID }
        : undefined,
    });
  } catch (err) {
    set({ error: errMsg(err) });
  } finally {
    set({ busy: false });
  }
}

export async function abort() {
  if (state.activeSessionId) await api.abort(state.activeSessionId);
  set({ busy: false });
}

export function setModel(model: ModelOption) {
  set({ selectedModel: model });
}

export function setAgent(agent: string | undefined) {
  set({ selectedAgent: agent });
}

export async function loadAgents() {
  try {
    const all = (await api.agents()) as AgentInfo[];
    // Show primary agents (build, plan, …) first — that's what users pick.
    const agents = [...all].sort((a, b) => rank(a) - rank(b));
    const preferred = agents.find((a) => a.name === "build") ?? agents[0];
    set({ agents, selectedAgent: state.selectedAgent ?? preferred?.name });
  } catch {
    /* non-fatal */
  }
}

function rank(a: AgentInfo): number {
  return a.mode === "primary" ? 0 : 1;
}

export async function loadModels() {
  try {
    const providers = (await api.providers()) as {
      providers?: Array<{ id: string; models?: Record<string, { name?: string }> }>;
      default?: Record<string, string>;
    };
    const models: ModelOption[] = [];
    for (const p of providers.providers ?? []) {
      for (const [modelID, m] of Object.entries(p.models ?? {})) {
        models.push({ providerID: p.id, modelID, label: `${p.id} · ${m.name ?? modelID}` });
      }
    }
    const def = providers.default ? Object.entries(providers.default)[0] : undefined;
    const selected = def
      ? models.find((m) => m.providerID === def[0] && m.modelID === def[1])
      : undefined;
    set({ models, selectedModel: state.selectedModel ?? selected ?? models[0] });
  } catch {
    /* non-fatal */
  }
}

// ---- event handling ---------------------------------------------------------

let loadedForUrl: string | undefined;

export function restartServer() {
  loadedForUrl = undefined;
  rpc.restartServer();
}

export function initStore() {
  rpc.onStatus((status) => {
    set({ status });
    // Load once per connected server URL (idempotent across missed edges /
    // reconnects), instead of relying on catching the starting->connected edge.
    if (status.state === "connected" && status.url !== loadedForUrl) {
      loadedForUrl = status.url;
      void loadSessions();
      void loadAgents();
      void loadModels();
    }
  });

  rpc.onEvent(handleEvent);

  // Announce readiness so the host (re)sends the current status even if its
  // first post landed before this webview started listening.
  rpc.ready();
}

function handleEvent(event: OpencodeEvent) {
  const props = event.properties ?? {};
  switch (event.type) {
    case "message.updated": {
      const info = props.info as MessageInfo | undefined;
      if (info && info.sessionID === state.activeSessionId) upsertMessage(info);
      break;
    }
    case "message.part.updated": {
      const part = props.part as (MessagePart & { sessionID?: string; messageID?: string }) | undefined;
      if (part && part.sessionID === state.activeSessionId) upsertPart(part);
      break;
    }
    case "message.part.removed": {
      if (props.sessionID === state.activeSessionId) removePart(String(props.messageID), String(props.partID));
      break;
    }
    case "message.removed": {
      if (props.sessionID === state.activeSessionId) {
        set({ messages: state.messages.filter((m) => m.info.id !== props.messageID) });
      }
      break;
    }
    case "session.idle": {
      if (props.sessionID === state.activeSessionId) set({ busy: false });
      break;
    }
    case "session.error": {
      set({ busy: false, error: describeError(props.error) });
      break;
    }
    case "session.updated": {
      const info = props.info as SessionInfo | undefined;
      if (info) set({ sessions: sortSessions(mergeSession(state.sessions, info)) });
      break;
    }
    case "gui.new-session":
      void newSession();
      break;
  }
}

function upsertMessage(info: MessageInfo) {
  const existing = state.messages.find((m) => m.info.id === info.id);
  if (existing) {
    set({ messages: state.messages.map((m) => (m.info.id === info.id ? { ...m, info } : m)) });
  } else {
    set({ messages: [...state.messages, { info, parts: [] }] });
  }
}

function upsertPart(part: MessagePart & { messageID?: string }) {
  const messageID = part.messageID;
  if (!messageID) return;
  const messages = state.messages.slice();
  let msg = messages.find((m) => m.info.id === messageID);
  if (!msg) {
    // Part arrived before its message.updated; create a placeholder.
    msg = { info: { id: messageID, role: "assistant", sessionID: state.activeSessionId! }, parts: [] };
    messages.push(msg);
  }
  const parts = msg.parts.slice();
  const idx = parts.findIndex((p) => p.id === part.id);
  if (idx >= 0) parts[idx] = { ...parts[idx], ...part };
  else parts.push(part);
  const updated = { ...msg, parts };
  set({ messages: messages.map((m) => (m.info.id === messageID ? updated : m)) });
}

function removePart(messageID: string, partID: string) {
  set({
    messages: state.messages.map((m) =>
      m.info.id === messageID ? { ...m, parts: m.parts.filter((p) => p.id !== partID) } : m,
    ),
  });
}

// ---- helpers ----------------------------------------------------------------

function toPartInput(part: MessagePart) {
  if (part.type === "file") {
    return { type: "file" as const, mime: part.mime ?? "application/octet-stream", filename: part.filename, url: part.url ?? "" };
  }
  return { type: "text" as const, text: part.text ?? "" };
}

function sortSessions(sessions: SessionInfo[]): SessionInfo[] {
  return [...sessions].sort((a, b) => (b.time?.updated ?? 0) - (a.time?.updated ?? 0));
}

function mergeSession(sessions: SessionInfo[], info: SessionInfo): SessionInfo[] {
  const exists = sessions.some((s) => s.id === info.id);
  return exists ? sessions.map((s) => (s.id === info.id ? info : s)) : [info, ...sessions];
}

function describeError(err: unknown): string {
  if (!err) return "Session error";
  if (typeof err === "string") return err;
  const e = err as { name?: string; data?: { message?: string } };
  return e.data?.message ?? e.name ?? "Session error";
}

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
