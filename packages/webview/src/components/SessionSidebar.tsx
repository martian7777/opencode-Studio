import { useStore, selectSession, newSession } from "../state/store.ts";

export function SessionSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sessions = useStore((s) => s.sessions);
  const activeId = useStore((s) => s.activeSessionId);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex">
      <div
        className="w-64 max-w-[80%] h-full flex flex-col border-r"
        style={{ background: "var(--vscode-sideBar-background, var(--vscode-editor-background))", borderColor: "var(--vscode-panel-border)" }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--vscode-panel-border)" }}>
          <span className="font-semibold text-sm">Sessions</span>
          <button
            onClick={() => {
              void newSession();
              onClose();
            }}
            className="text-xs px-2 py-1 rounded"
            style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}
          >
            ＋ New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin">
          {sessions.length === 0 && (
            <div className="px-3 py-4 text-xs" style={{ color: "var(--vscode-descriptionForeground)" }}>
              No sessions yet.
            </div>
          )}
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                void selectSession(s.id);
                onClose();
              }}
              className="w-full text-left px-3 py-2 text-sm truncate"
              style={{
                background: s.id === activeId ? "var(--vscode-list-activeSelectionBackground)" : "transparent",
                color: s.id === activeId ? "var(--vscode-list-activeSelectionForeground)" : "inherit",
              }}
            >
              {s.title?.trim() || "Untitled session"}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 h-full" onClick={onClose} style={{ background: "rgba(0,0,0,0.35)" }} />
    </div>
  );
}
