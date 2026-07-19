import type { OpencodeClient } from "@opencode-ai/sdk";
import type {
  RpcMethod,
  RpcRequests,
  RpcRequestMessage,
  OpencodeEvent,
} from "@opencode-gui/shared";
import { ServerManager, errMessage } from "./server.ts";

/** Unwrap a heyapi RequestResult ({ data, error }) or throw. */
async function unwrap<T>(p: Promise<{ data?: T; error?: unknown }>): Promise<T> {
  const res = await p;
  if (res.error) {
    throw new Error(typeof res.error === "string" ? res.error : JSON.stringify(res.error));
  }
  return res.data as T;
}

type Handler<M extends RpcMethod> = (
  client: OpencodeClient,
  params: RpcRequests[M],
) => Promise<unknown>;

/**
 * The single source of truth mapping RPC method names to opencode SDK calls.
 * The webview can only reach the SDK through these entries.
 */
const handlers: { [M in RpcMethod]: Handler<M> } = {
  "server.status": async (client) => {
    return unwrap(client.path.get());
  },
  "app.agents": async (client) => {
    return unwrap(client.app.agents());
  },
  "session.list": async (client) => {
    return unwrap(client.session.list());
  },
  "session.create": async (client, params) => {
    return unwrap(client.session.create({ body: { title: params.title, parentID: params.parentID } }));
  },
  "session.get": async (client, params) => {
    return unwrap(client.session.get({ path: { id: params.id } }));
  },
  "session.messages": async (client, params) => {
    return unwrap(client.session.messages({ path: { id: params.id } }));
  },
  "session.prompt": async (client, params) => {
    return unwrap(
      client.session.prompt({
        path: { id: params.id },
        body: { parts: params.parts, model: params.model, agent: params.agent },
      }),
    );
  },
  "session.command": async (client, params) => {
    return unwrap(
      client.session.command({
        path: { id: params.id },
        body: {
          command: params.command,
          arguments: params.arguments ?? "",
          agent: params.agent,
          // The command endpoint takes model as a "providerID/modelID" string.
          model: params.model ? `${params.model.providerID}/${params.model.modelID}` : undefined,
        },
      }),
    );
  },
  "session.abort": async (client, params) => {
    return unwrap(client.session.abort({ path: { id: params.id } }));
  },
  "find.files": async (client, params) => {
    return unwrap(client.find.files({ query: { query: params.query } }));
  },
  "find.text": async (client, params) => {
    return unwrap(client.find.text({ query: { pattern: params.pattern } }));
  },
  "find.symbols": async (client, params) => {
    return unwrap(client.find.symbols({ query: { query: params.query } }));
  },
  "command.list": async (client) => {
    return unwrap(client.command.list());
  },
  "config.get": async (client) => {
    return unwrap(client.config.get());
  },
  "config.providers": async (client) => {
    return unwrap(client.config.providers());
  },
};

export async function handleRpc(
  server: ServerManager,
  msg: RpcRequestMessage,
): Promise<{ result?: unknown; error?: { message: string; stack?: string } }> {
  const client = server.client;
  if (!client) {
    return { error: { message: "opencode server is not connected yet." } };
  }
  const handler = handlers[msg.method] as Handler<typeof msg.method> | undefined;
  if (!handler) {
    return { error: { message: `Unknown RPC method: ${msg.method}` } };
  }
  try {
    const result = await handler(client, msg.params as never);
    return { result };
  } catch (err) {
    return { error: { message: errMessage(err), stack: err instanceof Error ? err.stack : undefined } };
  }
}

/**
 * Subscribe to the opencode SSE event stream and forward each event.
 * Reconnects while the manager stays alive. Returns a disposer.
 */
export function forwardEvents(
  server: ServerManager,
  onEvent: (event: OpencodeEvent) => void,
): () => void {
  let stopped = false;

  const loop = async () => {
    while (!stopped) {
      const client = server.client;
      if (!client) {
        await delay(500);
        continue;
      }
      try {
        const events = await client.event.subscribe();
        for await (const event of events.stream) {
          if (stopped) return;
          onEvent(event as OpencodeEvent);
        }
      } catch {
        // Stream dropped (server restart, network). Back off and retry.
      }
      if (!stopped) await delay(1000);
    }
  };

  void loop();
  return () => {
    stopped = true;
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
