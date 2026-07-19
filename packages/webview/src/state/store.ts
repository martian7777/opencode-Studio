import { useSyncExternalStore } from "react";
import type { OpencodeEvent, ServerStatus } from "@opencode-gui/shared";
import {
  api,
  rpc,
  type MessagePart,
  type MessageInfo,
  type MessageWithParts,
  type Permission,
  type SessionInfo,
} from "../lib/rpc.ts";

/** Permission / execution modes, mirroring the familiar agent-mode picker. */
export type Mode = "plan" | "manual" | "auto" | "bypass";

export const MODES: { id: Mode; label: string; icon: string; description: string }[] = [
  { id: "manual", label: "Manual", icon: "✋", description: "Approve every tool action before it runs." },
  { id: "auto", label: "Auto", icon: "⚡", description: "Auto-approve safe actions, ask before risky ones." },
  { id: "bypass", label: "Bypass", icon: "⏩", description: "Never ask — approve everything automatically." },
  { id: "plan", label: "Plan", icon: "◔", description: "Read-only: explore and plan without editing." },
];

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
  /** The last user parts sent, kept so a failed turn can be retried. */
  lastPrompt?: MessagePart[];
  mode: Mode;
  /** Permission requests awaiting the user's decision (Manual/Auto-risky). */
  permissions: Permission[];
}

let state: State = {
  sessions: [],
  messages: [],
  busy: false,
  agents: [],
  models: [],
  mode: "auto",
  permissions: [],
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
  set({ activeSessionId: id, messages: [], permissions: [] });
  try {
    const messages = await api.getMessages(id);
    if (state.activeSessionId === id) set({ messages });
  } catch (err) {
    set({ error: errMsg(err) });
  }
}

export async function deleteSession(id: string) {
  // Optimistically drop it; if it was active, fall back to the newest remaining.
  const remaining = state.sessions.filter((s) => s.id !== id);
  const wasActive = state.activeSessionId === id;
  set({ sessions: remaining });
  if (wasActive) {
    if (remaining.length > 0) await selectSession(remaining[0].id);
    else set({ activeSessionId: undefined, messages: [], permissions: [] });
  }
  try {
    await api.deleteSession(id);
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
  set({ lastPrompt: parts });
  let sessionId = state.activeSessionId;
  if (!sessionId) {
    const session = await api.createSession();
    sessionId = session.id;
    set({ sessions: sortSessions([session, ...state.sessions]), activeSessionId: sessionId });
  }
  set({ busy: true, error: undefined });
  try {
    await withRetry(() =>
      api.prompt({
        id: sessionId!,
        parts: parts.map(toPartInput),
        model: state.selectedModel
          ? { providerID: state.selectedModel.providerID, modelID: state.selectedModel.modelID }
          : undefined,
        agent: effectiveAgent(),
      }),
    );
  } catch (err) {
    set({ error: errMsg(err) });
  } finally {
    set({ busy: false });
  }
}

/** Resend the last user turn — used by the "Retry" action after a failure. */
export async function retryLast() {
  if (state.busy || !state.lastPrompt) return;
  await sendPrompt(state.lastPrompt);
}

/**
 * Retry a transient failure (network blip / 5xx / rate limit) with exponential
 * backoff. Provider errors that arrive over the event stream are surfaced with a
 * manual Retry instead — see the error banner in the message list.
 */
async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransient(err)) break;
      await new Promise((r) => setTimeout(r, 400 * 2 ** i));
    }
  }
  throw lastErr;
}

function isTransient(err: unknown): boolean {
  const m = errMsg(err).toLowerCase();
  return /timeout|network|fetch failed|econn|502|503|504|rate limit|overloaded|upstream/.test(m);
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
      agent: effectiveAgent(),
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

export function setMode(mode: Mode) {
  set({ mode });
}

/** Which opencode agent to run given the current mode. */
function effectiveAgent(): string | undefined {
  if (state.mode === "plan") return "plan";
  return state.selectedAgent ?? "build";
}

/** Answer a pending permission request and drop it from the queue. */
export async function respondPermission(
  perm: Permission,
  response: "once" | "always" | "reject",
) {
  set({ permissions: state.permissions.filter((p) => p.id !== perm.id) });
  try {
    await api.respondPermission(perm.sessionID, perm.id, response);
  } catch (err) {
    set({ error: errMsg(err) });
  }
}

/** Decide how to handle an incoming permission request for the current mode. */
function handlePermission(perm: Permission) {
  switch (state.mode) {
    case "bypass":
      void api.respondPermission(perm.sessionID, perm.id, "once");
      return;
    case "auto":
      if (!isRisky(perm)) {
        void api.respondPermission(perm.sessionID, perm.id, "once");
        return;
      }
      break; // risky -> fall through to prompt
    case "manual":
    case "plan":
      break; // always prompt
  }
  if (!state.permissions.some((p) => p.id === perm.id)) {
    set({ permissions: [...state.permissions, perm] });
  }
}

/** Actions that warrant a confirmation even in Auto mode. */
function isRisky(perm: Permission): boolean {
  const hay = [perm.type, perm.title, ...(Array.isArray(perm.pattern) ? perm.pattern : [perm.pattern ?? ""])]
    .join(" ")
    .toLowerCase();
  return /bash|shell|exec|external|webfetch|fetch|network|doom|delete|\brm\b|install|sudo/.test(hay);
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
    case "permission.updated": {
      // For this event the properties ARE the Permission object.
      const perm = event.properties as unknown as Permission;
      if (perm && perm.sessionID === state.activeSessionId) handlePermission(perm);
      break;
    }
    case "permission.replied": {
      const id = props.permissionID as string | undefined;
      if (id) set({ permissions: state.permissions.filter((p) => p.id !== id) });
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
    case "session.deleted": {
      const info = props.info as SessionInfo | undefined;
      const deletedId = info?.id ?? (props.sessionID as string | undefined) ?? (props.info as { id?: string } | undefined)?.id;
      if (deletedId) {
        set({ sessions: state.sessions.filter((s) => s.id !== deletedId) });
        if (state.activeSessionId === deletedId) {
          set({ activeSessionId: undefined, messages: [], permissions: [] });
        }
      }
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
