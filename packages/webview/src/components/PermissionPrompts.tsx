import { useStore, respondPermission } from "../state/store.ts";
import type { Permission } from "../lib/rpc.ts";

/** Approval cards for tool actions awaiting a decision (Manual / Auto-risky). */
export function PermissionPrompts() {
  const permissions = useStore((s) => s.permissions);
  if (permissions.length === 0) return null;

  return (
    <div className="px-3 pb-2 space-y-2">
      {permissions.map((p) => (
        <PermissionCard key={p.id} perm={p} />
      ))}
    </div>
  );
}

function PermissionCard({ perm }: { perm: Permission }) {
  const patterns = Array.isArray(perm.pattern) ? perm.pattern : perm.pattern ? [perm.pattern] : [];
  return (
    <div
      className="oc-enter rounded-xl px-3 py-2.5"
      style={{ background: "var(--oc-surface-2)", border: "1px solid color-mix(in srgb, var(--oc-accent) 45%, var(--oc-border))" }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="grid place-items-center w-5 h-5 rounded-md text-[11px]"
          style={{ background: "linear-gradient(180deg,var(--oc-accent),var(--oc-accent-2))", color: "#04140d" }}
        >
          ?
        </span>
        <span className="text-sm font-medium flex-1 truncate">{perm.title || perm.type}</span>
        <span className="text-[10px] uppercase tracking-wide opacity-60">{perm.type}</span>
      </div>
      {patterns.length > 0 && (
        <div className="mb-2 text-xs font-mono opacity-70 truncate">{patterns.join(", ")}</div>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => void respondPermission(perm, "once")}
          className="oc-btn oc-btn-primary text-xs flex-1 justify-center"
        >
          Allow once
        </button>
        <button
          onClick={() => void respondPermission(perm, "always")}
          className="oc-btn text-xs flex-1 justify-center"
          style={{ background: "var(--oc-surface)", border: "1px solid var(--oc-border)" }}
        >
          Always
        </button>
        <button
          onClick={() => void respondPermission(perm, "reject")}
          className="oc-btn text-xs justify-center"
          style={{ background: "rgba(248,81,73,0.14)", border: "1px solid rgba(248,81,73,0.35)", color: "#f85149" }}
        >
          Deny
        </button>
      </div>
    </div>
  );
}
