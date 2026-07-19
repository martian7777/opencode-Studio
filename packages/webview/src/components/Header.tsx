import { useStore, newSession, setModel, setAgent } from "../state/store.ts";
import { StatusPill } from "./StatusPill.tsx";

export function Header({ onToggleSessions }: { onToggleSessions: () => void }) {
  const models = useStore((s) => s.models);
  const agents = useStore((s) => s.agents);
  const selectedModel = useStore((s) => s.selectedModel);
  const selectedAgent = useStore((s) => s.selectedAgent);

  return (
    <div className="flex flex-col gap-2 px-3 py-2 border-b" style={{ borderColor: "var(--vscode-panel-border)" }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconButton title="Sessions" onClick={onToggleSessions} label="☰" />
          <span className="font-semibold tracking-wide">opencode</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill />
          <IconButton title="New session" onClick={() => void newSession()} label="＋" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedAgent ?? ""}
          onChange={(v) => setAgent(v || undefined)}
          title="Agent"
          options={agents.map((a) => ({ value: a.name, label: a.name }))}
          placeholder="agent"
        />
        <Select
          value={selectedModel ? `${selectedModel.providerID}/${selectedModel.modelID}` : ""}
          onChange={(v) => {
            const m = models.find((x) => `${x.providerID}/${x.modelID}` === v);
            if (m) setModel(m);
          }}
          title="Model"
          options={models.map((m) => ({ value: `${m.providerID}/${m.modelID}`, label: m.label }))}
          placeholder="model"
        />
      </div>
    </div>
  );
}

function IconButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-6 h-6 flex items-center justify-center rounded hover:opacity-80"
      style={{ background: "var(--vscode-toolbar-hoverBackground, transparent)" }}
    >
      {label}
    </button>
  );
}

function Select({
  value,
  onChange,
  options,
  title,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  title: string;
  placeholder: string;
}) {
  return (
    <select
      title={title}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 min-w-0 text-xs rounded px-1.5 py-1 outline-none"
      style={{
        background: "var(--vscode-dropdown-background)",
        color: "var(--vscode-dropdown-foreground)",
        border: "1px solid var(--vscode-dropdown-border, transparent)",
      }}
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
