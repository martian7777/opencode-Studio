import { useStore, restartServer } from "../state/store.ts";

/** Shown whenever the opencode server is not connected, with the reason + retry. */
export function ConnectionBanner() {
  const status = useStore((s) => s.status);
  const state = status?.state;
  if (state === "connected") return null;

  const starting = state === "starting" || state === undefined;
  const text = starting
    ? "Starting opencode server… (first launch can take a while)"
    : status?.message ?? "opencode server is not running.";

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-xs border-b"
      style={{
        borderColor: "var(--vscode-panel-border)",
        background: starting
          ? "var(--vscode-editorInfo-background, rgba(64,120,200,0.12))"
          : "rgba(248,81,73,0.14)",
        color: starting ? "var(--vscode-foreground)" : "#f85149",
      }}
    >
      <span className="flex-1">{text}</span>
      {!starting && (
        <button
          onClick={() => restartServer()}
          className="px-2 py-0.5 rounded shrink-0"
          style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
