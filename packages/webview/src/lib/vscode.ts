import type { WebviewToHost } from "@opencode-gui/shared";

/** The API object VS Code injects into every webview. */
interface VsCodeApi {
  postMessage(msg: WebviewToHost): void;
  getState<T>(): T | undefined;
  setState<T>(state: T): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// acquireVsCodeApi() may be called only once per webview load.
let cached: VsCodeApi | undefined;

export function getVsCodeApi(): VsCodeApi {
  if (!cached) {
    cached =
      typeof acquireVsCodeApi === "function"
        ? acquireVsCodeApi()
        : // Fallback for running the app in a plain browser during `vite dev`.
          {
            postMessage: (msg) => console.debug("[postMessage]", msg),
            getState: () => undefined,
            setState: () => undefined,
          };
  }
  return cached;
}
