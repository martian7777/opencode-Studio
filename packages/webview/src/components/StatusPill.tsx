import { useStore } from "../state/store.ts";

const COLORS: Record<string, string> = {
  connected: "#3fb950",
  starting: "#d29922",
  error: "#f85149",
  stopped: "#8b949e",
};

export function StatusPill() {
  const status = useStore((s) => s.status);
  const state = status?.state ?? "starting";
  const label =
    state === "connected"
      ? status?.managed
        ? "connected"
        : "connected (external)"
      : state === "starting"
        ? "starting…"
        : state === "error"
          ? "server error"
          : "stopped";

  return (
    <div
      className="flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full"
      title={status?.message ?? status?.url ?? ""}
      style={{ background: "var(--vscode-badge-background, rgba(127,127,127,0.15))" }}
    >
      <span
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: COLORS[state] ?? COLORS.stopped }}
      />
      <span style={{ color: "var(--vscode-descriptionForeground)" }}>{label}</span>
    </div>
  );
}
