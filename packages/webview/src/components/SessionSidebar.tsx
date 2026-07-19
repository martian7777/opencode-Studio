import { useState } from "react";
import { useStore, selectSession, newSession, deleteSession } from "../state/store.ts";
import type { SessionInfo } from "../lib/rpc.ts";

export function SessionSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const sessions = useStore((s) => s.sessions);
  const activeId = useStore((s) => s.activeSessionId);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-30 flex">
      <div
        className="w-64 max-w-[80%] h-full flex flex-col border-r"
        style={{ background: "var(--vscode-sideBar-background, var(--vscode-editor-background))", borderColor: "var(--oc-border)" }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: "var(--oc-border)" }}>
          <span className="font-semibold text-sm">Sessions</span>
          <button
            onClick={() => {
              void newSession();
              onClose();
            }}
            className="oc-btn oc-btn-primary text-xs"
          >
            ＋ New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin py-1">
          {sessions.length === 0 && (
            <div className="px-3 py-4 text-xs" style={{ color: "var(--vscode-descriptionForeground)" }}>
              No sessions yet.
            </div>
          )}
          {sessions.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              active={s.id === activeId}
              onSelect={() => {
                void selectSession(s.id);
                onClose();
              }}
            />
          ))}
        </div>
      </div>
      <div className="flex-1 h-full" onClick={onClose} style={{ background: "rgba(0,0,0,0.35)" }} />
    </div>
  );
}

function SessionRow({
  session,
  active,
  onSelect,
}: {
  session: SessionInfo;
  active: boolean;
  onSelect: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      className="group relative flex items-center mx-1 rounded-lg"
      style={{
        background: active ? "var(--vscode-list-activeSelectionBackground)" : "transparent",
        color: active ? "var(--vscode-list-activeSelectionForeground)" : "inherit",
      }}
    >
      <button onClick={onSelect} className="flex-1 min-w-0 text-left px-2.5 py-2 text-sm truncate">
        {session.title?.trim() || "Untitled session"}
      </button>

      {confirming ? (
        <div className="flex items-center gap-1 pr-1.5">
          <button
            onClick={() => {
              void deleteSession(session.id);
              setConfirming(false);
            }}
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ background: "rgba(248,81,73,0.16)", border: "1px solid rgba(248,81,73,0.4)", color: "#f85149" }}
            title="Confirm delete"
          >
            Delete
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-1.5 py-0.5 rounded oc-btn-ghost"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setConfirming(true);
          }}
          className="mr-1.5 w-6 h-6 grid place-items-center rounded opacity-0 group-hover:opacity-100 hover:!opacity-100 shrink-0"
          style={{ color: "var(--vscode-descriptionForeground)" }}
          title="Delete session"
          aria-label="Delete session"
        >
          🗑
        </button>
      )}
    </div>
  );
}
