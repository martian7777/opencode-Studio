import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStore } from "../state/store.ts";
import type { MessagePart, MessageWithParts } from "../lib/rpc.ts";

export function MessageList() {
  const messages = useStore((s) => s.messages);
  const busy = useStore((s) => s.busy);
  const error = useStore((s) => s.error);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  if (messages.length === 0 && !busy) {
    return (
      <div className="flex-1 flex items-center justify-center text-center px-6" style={{ color: "var(--vscode-descriptionForeground)" }}>
        <div>
          <div className="text-2xl mb-2">opencode</div>
          <div className="text-sm">Ask anything. Attach images with paste or drag &amp; drop,<br />reference files with <code>@</code>, run commands with <code>/</code>.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-4">
      {messages.map((m) => (
        <MessageRow key={m.info.id} message={m} />
      ))}
      {busy && <TypingIndicator />}
      {error && (
        <div className="text-xs rounded px-2 py-1" style={{ background: "rgba(248,81,73,0.15)", color: "#f85149" }}>
          {error}
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function MessageRow({ message }: { message: MessageWithParts }) {
  const isUser = message.info.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className="max-w-[92%] rounded-lg px-3 py-2 space-y-2"
        style={{
          background: isUser
            ? "var(--vscode-input-background, rgba(127,127,127,0.12))"
            : "transparent",
          border: isUser ? "none" : "1px solid var(--vscode-panel-border)",
        }}
      >
        {message.parts.map((p) => (
          <PartView key={p.id} part={p} />
        ))}
      </div>
    </div>
  );
}

function PartView({ part }: { part: MessagePart }) {
  switch (part.type) {
    case "text":
    case "reasoning":
      if (!part.text?.trim()) return null;
      return (
        <div className="md text-sm leading-relaxed">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{part.text}</ReactMarkdown>
        </div>
      );
    case "file":
      return <FilePartView part={part} />;
    case "tool":
      return <ToolPartView part={part} />;
    case "step-start":
    case "step-finish":
    case "snapshot":
      return null;
    default:
      return null;
  }
}

function FilePartView({ part }: { part: MessagePart }) {
  const isImage = (part.mime ?? "").startsWith("image/");
  if (isImage && part.url) {
    return (
      <img
        src={part.url}
        alt={part.filename ?? "attachment"}
        className="rounded max-h-64 border"
        style={{ borderColor: "var(--vscode-panel-border)" }}
      />
    );
  }
  return (
    <div className="text-xs inline-flex items-center gap-1.5 rounded px-2 py-1" style={{ background: "rgba(127,127,127,0.15)" }}>
      <span>📎</span>
      <span>{part.filename ?? part.url ?? part.mime}</span>
    </div>
  );
}

function ToolPartView({ part }: { part: MessagePart }) {
  const status = part.state?.status;
  const title = part.state?.title ?? part.tool ?? "tool";
  const icon = status === "completed" ? "✓" : status === "error" ? "✗" : "…";
  return (
    <details className="text-xs rounded border" style={{ borderColor: "var(--vscode-panel-border)" }}>
      <summary className="cursor-pointer px-2 py-1 flex items-center gap-1.5 select-none">
        <span>{icon}</span>
        <span className="font-mono opacity-80">{part.tool}</span>
        <span className="opacity-60 truncate">{title}</span>
      </summary>
      {part.state?.output && (
        <pre className="px-2 py-1 overflow-x-auto whitespace-pre-wrap" style={{ maxHeight: 240 }}>
          {part.state.output}
        </pre>
      )}
    </details>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-1 text-sm" style={{ color: "var(--vscode-descriptionForeground)" }}>
      <span className="animate-pulse">opencode is working…</span>
    </div>
  );
}
