import { useStore, newSession, setModel, setAgent } from "../state/store.ts";
import { StatusPill } from "./StatusPill.tsx";

export function Header({ onToggleSessions }: { onToggleSessions: () => void }) {
  const models = useStore((s) => s.models);
  const agents = useStore((s) => s.agents);
  const selectedModel = useStore((s) => s.selectedModel);
  const selectedAgent = useStore((s) => s.selectedAgent);

  return (
    <div
      className="flex flex-col gap-2.5 px-3 py-2.5 border-b backdrop-blur-sm"
      style={{ borderColor: "var(--oc-border)", background: "var(--oc-surface)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconButton title="Sessions" onClick={onToggleSessions} label="☰" />
          <BrandMark />
        </div>
        <div className="flex items-center gap-2">
          <StatusPill />
          <button
            title="New session"
            onClick={() => void newSession()}
            className="oc-btn oc-btn-ghost !px-2 !py-1 text-base leading-none"
          >
            ＋
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={selectedAgent ?? ""}
          onChange={(v) => setAgent(v || undefined)}
          title="Agent"
          icon="◆"
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
          icon="✦"
          options={models.map((m) => ({ value: `${m.providerID}/${m.modelID}`, label: m.label }))}
          placeholder="model"
        />
      </div>
    </div>
  );
}

function BrandMark() {
  return (
    <div className="flex items-center gap-1.5 select-none">
      <span
        className="grid place-items-center w-5 h-5 rounded-md text-[11px] font-bold"
        style={{ background: "linear-gradient(180deg,var(--oc-accent),var(--oc-accent-2))", color: "#04140d" }}
      >
        &gt;_
      </span>
      <span className="font-semibold tracking-wide">opencode</span>
    </div>
  );
}

function IconButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button title={title} onClick={onClick} className="oc-btn oc-btn-ghost !px-2 !py-1 leading-none">
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
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  title: string;
  placeholder: string;
  icon: string;
}) {
  return (
    <label
      className="flex-1 min-w-0 flex items-center gap-1.5 rounded-lg px-2 py-1 oc-focus-ring"
      style={{ background: "var(--oc-surface-2)", border: "1px solid var(--oc-border)" }}
      title={title}
    >
      <span className="text-xs opacity-60">{icon}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-transparent text-xs outline-none cursor-pointer"
        style={{ color: "var(--vscode-foreground)" }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--vscode-dropdown-background)", color: "var(--vscode-dropdown-foreground)" }}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
