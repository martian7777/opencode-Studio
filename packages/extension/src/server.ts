import { spawn, type ChildProcess } from "node:child_process";
import * as vscode from "vscode";
import { createOpencodeClient, type OpencodeClient } from "@opencode-ai/sdk";
import type { ServerStatus } from "@opencode-gui/shared";

/**
 * Owns the opencode server lifecycle and the SDK client.
 *
 * Two modes:
 *  - override: `opencode.serverUrl` is set -> just connect to it (unmanaged).
 *  - managed:  spawn `opencode serve` in the workspace, parse its URL, connect,
 *              and restart it on crash.
 */
export class ServerManager {
  private proc?: ChildProcess;
  private disposed = false;
  private restarts = 0;
  private _client?: OpencodeClient;
  private _status: ServerStatus = { state: "stopped", managed: true };

  private readonly onStatusEmitter = new vscode.EventEmitter<ServerStatus>();
  readonly onStatus = this.onStatusEmitter.event;

  private readonly output: vscode.OutputChannel;

  constructor(private readonly workspaceDir: string) {
    this.output = vscode.window.createOutputChannel("opencode server");
  }

  get client(): OpencodeClient | undefined {
    return this._client;
  }

  get status(): ServerStatus {
    return this._status;
  }

  private setStatus(status: ServerStatus) {
    this._status = status;
    this.onStatusEmitter.fire(status);
  }

  private config() {
    return vscode.workspace.getConfiguration("opencode");
  }

  async start(): Promise<void> {
    const override = (this.config().get<string>("serverUrl") ?? "").trim();
    if (override) {
      this.setStatus({ state: "starting", managed: false, url: override });
      this._client = createOpencodeClient({ baseUrl: override });
      // Verify reachability before declaring connected.
      try {
        await this._client.app.agents();
        this.setStatus({ state: "connected", managed: false, url: override });
      } catch (err) {
        this.setStatus({
          state: "error",
          managed: false,
          url: override,
          message: `Could not reach ${override}: ${errMessage(err)}`,
        });
      }
      return;
    }
    await this.spawnManaged();
  }

  private async spawnManaged(): Promise<void> {
    this.setStatus({ state: "starting", managed: true });
    const binary = (this.config().get<string>("binaryPath") ?? "opencode").trim() || "opencode";

    let url: string;
    try {
      url = await this.launch(binary);
    } catch (err) {
      this.setStatus({ state: "error", managed: true, message: errMessage(err) });
      return;
    }

    this._client = createOpencodeClient({ baseUrl: url });
    this.restarts = 0;
    this.setStatus({ state: "connected", managed: true, url });
  }

  /** Spawn the process and resolve once it prints its listening URL. */
  private launch(binary: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const proc = spawn(
        binary,
        ["serve", "--hostname=127.0.0.1", "--port=0", "--print-logs"],
        { cwd: this.workspaceDir, env: process.env, shell: process.platform === "win32" },
      );
      this.proc = proc;

      let settled = false;
      let buffer = "";
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(new Error("Timed out waiting for opencode server to start (30s)."));
        this.kill();
      }, 30_000);

      const scan = (chunk: Buffer) => {
        const text = chunk.toString();
        this.output.append(text);
        if (settled) return;
        buffer += text;
        for (const line of buffer.split("\n")) {
          if (line.includes("opencode server listening")) {
            const match = line.match(/on\s+(https?:\/\/[^\s]+)/);
            if (match) {
              settled = true;
              clearTimeout(timeout);
              resolve(match[1].trim());
              return;
            }
          }
        }
      };

      proc.stdout?.on("data", scan);
      proc.stderr?.on("data", scan);

      proc.on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        reject(new Error(`Failed to launch '${binary}': ${err.message}`));
      });

      proc.on("exit", (code) => {
        this.proc = undefined;
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error(`opencode server exited (code ${code}) before it was ready.`));
          return;
        }
        this.onManagedExit(code, binary);
      });
    });
  }

  private onManagedExit(code: number | null, binary: string) {
    if (this.disposed) return;
    this.setStatus({
      state: "error",
      managed: true,
      message: `Server exited (code ${code}). Restarting…`,
    });
    if (this.restarts >= 5) {
      this.setStatus({
        state: "error",
        managed: true,
        message: "Server crashed repeatedly. Check the 'opencode server' output, then run 'opencode: Restart Server'.",
      });
      return;
    }
    const delay = Math.min(1000 * 2 ** this.restarts, 15_000);
    this.restarts += 1;
    setTimeout(() => {
      if (this.disposed) return;
      this.launch(binary)
        .then((url) => {
          this._client = createOpencodeClient({ baseUrl: url });
          this.setStatus({ state: "connected", managed: true, url });
        })
        .catch((err) => {
          this.setStatus({ state: "error", managed: true, message: errMessage(err) });
          this.onManagedExit(null, binary);
        });
    }, delay);
  }

  async restart(): Promise<void> {
    this.kill();
    this.restarts = 0;
    await this.start();
  }

  private kill() {
    if (this.proc) {
      try {
        this.proc.kill();
      } catch {
        /* ignore */
      }
      this.proc = undefined;
    }
  }

  dispose() {
    this.disposed = true;
    this.kill();
    this.onStatusEmitter.dispose();
    this.output.dispose();
  }
}

export function errMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
