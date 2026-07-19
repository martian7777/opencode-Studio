import * as vscode from "vscode";
import type {
  HostToWebview,
  WebviewToHost,
  ServerStatus,
} from "@opencode-gui/shared";
import { ServerManager } from "./server.ts";
import { handleRpc, forwardEvents } from "./rpc.ts";
import { renderWebviewHtml } from "./webview.ts";

let server: ServerManager | undefined;

export function activate(context: vscode.ExtensionContext) {
  const workspaceDir =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();

  server = new ServerManager(workspaceDir);
  const mgr = server;
  void mgr.start();

  const provider = new ChatViewProvider(context.extensionUri, mgr);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(ChatViewProvider.viewType, provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("opencodeGui.open", () => {
      const panel = vscode.window.createWebviewPanel(
        "opencodeGui.panel",
        "opencode",
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true },
      );
      const host = new WebviewHost(panel.webview, context.extensionUri, mgr);
      panel.onDidDispose(() => host.dispose());
    }),
    vscode.commands.registerCommand("opencodeGui.newSession", () => {
      provider.post({ kind: "event", event: { type: "gui.new-session" } });
    }),
    vscode.commands.registerCommand("opencodeGui.restartServer", async () => {
      await mgr.restart();
    }),
    mgr,
  );
}

export function deactivate() {
  server?.dispose();
  server = undefined;
}

/** Shared wiring between a WebviewView (sidebar) and a WebviewPanel (tab). */
class WebviewHost {
  private readonly disposables: vscode.Disposable[] = [];
  private readonly stopEvents: () => void;

  constructor(
    private readonly webview: vscode.Webview,
    extensionUri: vscode.Uri,
    private readonly mgr: ServerManager,
  ) {
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(extensionUri, "media")],
    };

    // Subscribe BEFORE loading HTML so the webview's "ready" handshake is never
    // missed, and keep pushing status changes for the life of the view.
    this.disposables.push(
      webview.onDidReceiveMessage((raw) => this.onMessage(raw as WebviewToHost)),
      mgr.onStatus((status) => this.postStatus(status)),
    );

    webview.html = renderWebviewHtml(webview, extensionUri);

    // Forward opencode server events to this webview.
    this.stopEvents = forwardEvents(mgr, (event) => this.post({ kind: "event", event }));
  }

  post(msg: HostToWebview) {
    void this.webview.postMessage(msg);
  }

  private postStatus(status: ServerStatus) {
    this.post({ kind: "server-status", status });
  }

  private async onMessage(msg: WebviewToHost) {
    if (!msg) return;
    if (msg.kind === "webview-ready") {
      // The webview is now listening; (re)send the current status so it can
      // never be stuck showing a stale/absent state.
      this.postStatus(this.mgr.status);
      return;
    }
    if (msg.kind === "server-restart") {
      await this.mgr.restart();
      return;
    }
    if (msg.kind !== "rpc-request") return;
    const { result, error } = await handleRpc(this.mgr, msg);
    this.post({ kind: "rpc-response", id: msg.id, result, error });
  }

  dispose() {
    this.stopEvents();
    for (const d of this.disposables) d.dispose();
  }
}

class ChatViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "opencodeGui.chat";
  private host?: WebviewHost;

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly mgr: ServerManager,
  ) {}

  resolveWebviewView(view: vscode.WebviewView) {
    this.host = new WebviewHost(view.webview, this.extensionUri, this.mgr);
    view.onDidDispose(() => {
      this.host?.dispose();
      this.host = undefined;
    });
  }

  post(msg: HostToWebview) {
    this.host?.post(msg);
  }
}
