import { useMemo } from "react";
import { useStore, computeContext } from "../state/store.ts";

/**
 * Compact context-window readout, mirroring the opencode CLI's "Context" block:
 * tokens held in the current context, percentage of the model's window used, and
 * the running session cost. Hidden until the first assistant turn reports usage.
 */
export function ContextMeter() {
  // Read stable store slices and derive stats in a memo — a selector that built
  // the object inline would break useSyncExternalStore's snapshot stability.
  const messages = useStore((s) => s.messages);
  const model = useStore((s) => s.selectedModel);
  const connected = useStore((s) => s.status?.state === "connected");
  const stats = useMemo(() => computeContext(messages, model), [messages, model]);
  if (!connected || stats.tokens === 0) return null;

  const pct = stats.fraction != null ? stats.fraction * 100 : undefined;
  const barColor =
    pct == null || pct < 60 ? "var(--oc-accent)" : pct < 85 ? "#d29922" : "#f85149";

  return (
    <div
      className="flex items-center gap-2 text-xs mb-2"
      style={{ color: "var(--vscode-descriptionForeground)" }}
      title={
        `Context: ${stats.tokens.toLocaleString()} tokens` +
        (stats.limit ? ` of ${stats.limit.toLocaleString()}` : "") +
        (pct != null ? ` (${pct.toFixed(0)}% used)` : "") +
        ` · ${formatCost(stats.cost)} spent`
      }
    >
      <span className="font-medium opacity-80">Context</span>
      <span className="tabular-nums">{formatTokens(stats.tokens)}</span>
      {pct != null && (
        <div
          className="relative flex-1 min-w-8 max-w-24 h-1 rounded-full overflow-hidden"
          style={{ background: "var(--oc-surface-2)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${Math.min(pct, 100)}%`, background: barColor }}
          />
        </div>
      )}
      {pct != null && <span className="tabular-nums">{pct.toFixed(0)}%</span>}
      <span className="ml-auto tabular-nums">{formatCost(stats.cost)}</span>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k`;
  return String(n);
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(cost > 0 && cost < 0.01 ? 4 : 2)}`;
}
