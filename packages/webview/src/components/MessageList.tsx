import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useStore, retryLast } from "../state/store.ts";
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
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-4">
      {messages.map((m) => (
        <MessageRow key={m.info.id} message={m} />
      ))}
      {busy && <TypingIndicator />}
      {error && <ErrorRow message={error} />}
      <div ref={bottomRef} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center text-center px-6">
      <div className="max-w-xs">
        <div
          className="mx-auto mb-4 grid place-items-center w-14 h-14 rounded-2xl text-xl font-bold"
          style={{ background: "linear-gradient(180deg,var(--oc-accent),var(--oc-accent-2))", color: "#04140d" }}
        >
          &gt;_
        </div>
        <div className="text-lg font-semibold mb-1">How can I help?</div>
        <div className="text-sm" style={{ color: "var(--vscode-descriptionForeground)" }}>
          Attach images with paste or drag &amp; drop, reference files with{" "}
          <Kbd>@</Kbd>, and run commands with <Kbd>/</Kbd>.
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-block px-1.5 rounded font-mono text-xs"
      style={{ background: "var(--oc-surface-2)", border: "1px solid var(--oc-border)" }}
    >
      {children}
    </span>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  const isUser = role === "user";
  return (
    <div
      className="shrink-0 grid place-items-center w-6 h-6 rounded-lg text-[11px] font-bold"
      style={
        isUser
          ? { background: "var(--oc-surface-2)", color: "var(--vscode-foreground)" }
          : { background: "linear-gradient(180deg,var(--oc-accent),var(--oc-accent-2))", color: "#04140d" }
      }
    >
      {isUser ? "you" : ">_"}
    </div>
  );
}

function MessageRow({ message }: { message: MessageWithParts }) {
  const isUser = message.info.role === "user";
  return (
    <div className={`oc-enter flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <Avatar role={isUser ? "user" : "assistant"} />
      <div
        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 space-y-2"
        style={{
          background: isUser ? "var(--oc-surface-2)" : "var(--oc-surface)",
          border: "1px solid var(--oc-border)",
          borderTopRightRadius: isUser ? 6 : undefined,
          borderTopLeftRadius: isUser ? undefined : 6,
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
        className="rounded-xl max-h-64 border"
        style={{ borderColor: "var(--oc-border)" }}
      />
    );
  }
  return (
    <div
      className="text-xs inline-flex items-center gap-1.5 rounded-lg px-2 py-1"
      style={{ background: "var(--oc-surface-2)", border: "1px solid var(--oc-border)" }}
    >
      <span>📎</span>
      <span>{part.filename ?? part.url ?? part.mime}</span>
    </div>
  );
}

function ToolPartView({ part }: { part: MessagePart }) {
  const status = part.state?.status;
  const title = part.state?.title ?? part.tool ?? "tool";
  const icon = status === "completed" ? "✓" : status === "error" ? "✗" : "•";
  const color = status === "completed" ? "var(--oc-accent)" : status === "error" ? "#f85149" : "var(--vscode-descriptionForeground)";
  return (
    <details className="text-xs rounded-lg" style={{ background: "var(--oc-surface-2)", border: "1px solid var(--oc-border)" }}>
      <summary className="cursor-pointer px-2 py-1.5 flex items-center gap-1.5 select-none">
        <span style={{ color }}>{icon}</span>
        <span className="font-mono opacity-80">{part.tool}</span>
        <span className="opacity-60 truncate">{title}</span>
      </summary>
      {part.state?.output && (
        <pre className="px-2 py-1.5 overflow-x-auto whitespace-pre-wrap border-t" style={{ maxHeight: 240, borderColor: "var(--oc-border)" }}>
          {part.state.output}
        </pre>
      )}
    </details>
  );
}

function TypingIndicator() {
  return (
    <div className="oc-enter flex gap-2.5">
      <Avatar role="assistant" />
      <div className="rounded-2xl px-3.5 py-3 flex items-center gap-1" style={{ background: "var(--oc-surface)", border: "1px solid var(--oc-border)" }}>
        <span className="oc-dot" />
        <span className="oc-dot" />
        <span className="oc-dot" />
      </div>
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  const busy = useStore((s) => s.busy);
  const canRetry = useStore((s) => !!s.lastPrompt);
  return (
    <div
      className="oc-enter flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
      style={{ background: "rgba(248,81,73,0.12)", border: "1px solid rgba(248,81,73,0.35)", color: "#f85149" }}
    >
      <span className="mt-0.5">⚠</span>
      <span className="flex-1 leading-relaxed">{message}</span>
      {canRetry && (
        <button onClick={() => void retryLast()} disabled={busy} className="oc-btn oc-btn-ghost !py-0.5 !px-2 shrink-0" style={{ color: "#f85149" }}>
          ↻ Retry
        </button>
      )}
    </div>
  );
}
