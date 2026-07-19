import { useEffect } from "react";

export interface Suggestion {
  id: string;
  label: string;
  detail?: string;
}

/** A keyboard-navigable popup used for both @-file and /-command completion. */
export function Suggestions({
  items,
  activeIndex,
  onPick,
  onActiveChange,
  header,
}: {
  items: Suggestion[];
  activeIndex: number;
  onPick: (item: Suggestion) => void;
  onActiveChange: (index: number) => void;
  header?: string;
}) {
  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) onActiveChange(items.length - 1);
  }, [items.length, activeIndex, onActiveChange]);

  if (items.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 right-0 mb-1 max-h-56 overflow-y-auto scroll-thin rounded border shadow-lg z-10"
      style={{
        background: "var(--vscode-dropdown-background, var(--vscode-editor-background))",
        borderColor: "var(--vscode-panel-border)",
      }}
    >
      {header && (
        <div className="px-2 py-1 text-[10px] uppercase tracking-wide sticky top-0" style={{ color: "var(--vscode-descriptionForeground)", background: "inherit" }}>
          {header}
        </div>
      )}
      {items.map((item, i) => (
        <button
          key={item.id}
          onMouseDown={(e) => {
            e.preventDefault();
            onPick(item);
          }}
          onMouseEnter={() => onActiveChange(i)}
          className="w-full text-left px-2 py-1 flex items-center gap-2"
          style={{
            background: i === activeIndex ? "var(--vscode-list-activeSelectionBackground)" : "transparent",
            color: i === activeIndex ? "var(--vscode-list-activeSelectionForeground)" : "inherit",
          }}
        >
          <span className="truncate text-sm">{item.label}</span>
          {item.detail && <span className="ml-auto truncate text-xs opacity-60">{item.detail}</span>}
        </button>
      ))}
    </div>
  );
}
