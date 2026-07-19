import { useCallback, useRef, useState } from "react";
import { api, type MessagePart } from "../lib/rpc.ts";
import { fileToPart, partsFromClipboard, partsFromDrop } from "../lib/attachments.ts";
import { sendPrompt, runCommand, abort, useStore } from "../state/store.ts";
import { Suggestions, type Suggestion } from "./Suggestions.tsx";

type Mode = { kind: "none" } | { kind: "file"; token: string; start: number } | { kind: "command"; token: string };

export function Composer() {
  const busy = useStore((s) => s.busy);
  const connected = useStore((s) => s.status?.state === "connected");
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<MessagePart[]>([]);
  const [mode, setMode] = useState<Mode>({ kind: "none" });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchSeq = useRef(0);

  const addAttachments = useCallback((parts: MessagePart[]) => {
    if (parts.length) setAttachments((prev) => [...prev, ...parts]);
  }, []);

  // ---- suggestion detection (@files, /commands) ----------------------------
  const updateSuggestions = useCallback(async (value: string, caret: number) => {
    // Slash command: only when it's the very first token of the message.
    if (value.startsWith("/") && !value.slice(0, caret).includes(" ")) {
      const token = value.slice(1, caret);
      setMode({ kind: "command", token });
      const commands = await api.listCommands().catch(() => []);
      setSuggestions(
        commands
          .filter((c) => c.name.toLowerCase().includes(token.toLowerCase()))
          .map((c) => ({ id: c.name, label: `/${c.name}`, detail: c.description })),
      );
      setActiveIndex(0);
      return;
    }

    // @ file mention: find the @token immediately left of the caret.
    const upto = value.slice(0, caret);
    const at = upto.lastIndexOf("@");
    if (at >= 0 && !/\s/.test(upto.slice(at + 1))) {
      const token = upto.slice(at + 1);
      setMode({ kind: "file", token, start: at });
      const seq = ++searchSeq.current;
      const files = token ? await api.findFiles(token).catch(() => []) : [];
      if (seq !== searchSeq.current) return;
      setSuggestions(files.slice(0, 30).map((f) => ({ id: f, label: f })));
      setActiveIndex(0);
      return;
    }

    setMode({ kind: "none" });
    setSuggestions([]);
  }, []);

  const onChange = (value: string) => {
    setText(value);
    const caret = textareaRef.current?.selectionStart ?? value.length;
    void updateSuggestions(value, caret);
  };

  const pickSuggestion = (item: Suggestion) => {
    if (mode.kind === "command") {
      setText(`/${item.id} `);
      setMode({ kind: "none" });
      setSuggestions([]);
      textareaRef.current?.focus();
      return;
    }
    if (mode.kind === "file") {
      const before = text.slice(0, mode.start);
      const caret = textareaRef.current?.selectionStart ?? text.length;
      const after = text.slice(caret);
      const next = `${before}@${item.id} ${after}`;
      setText(next);
      setMode({ kind: "none" });
      setSuggestions([]);
      textareaRef.current?.focus();
    }
  };

  // ---- send ----------------------------------------------------------------
  const submit = async () => {
    const trimmed = text.trim();
    if ((!trimmed && attachments.length === 0) || busy) return;

    // A leading /command routes to the command endpoint.
    if (trimmed.startsWith("/")) {
      const [name, ...rest] = trimmed.slice(1).split(" ");
      setText("");
      setAttachments([]);
      await runCommand(name, rest.join(" "));
      return;
    }

    const parts: MessagePart[] = [...attachments];
    if (trimmed) parts.push({ id: `local-text`, type: "text", text: trimmed });
    setText("");
    setAttachments([]);
    setMode({ kind: "none" });
    setSuggestions([]);
    await sendPrompt(parts);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0 && mode.kind !== "none") {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        pickSuggestion(suggestions[activeIndex]);
        return;
      }
      if (e.key === "Escape") {
        setMode({ kind: "none" });
        setSuggestions([]);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };

  const onPaste = async (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length || Array.from(e.clipboardData.items).some((i) => i.kind === "file")) {
      e.preventDefault();
      addAttachments(await partsFromClipboard(e.clipboardData.items));
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addAttachments(await partsFromDrop(e.dataTransfer.files));
  };

  const onPickFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) for (const f of Array.from(files)) addAttachments([await fileToPart(f)]);
    e.target.value = "";
  };

  return (
    <div
      className="relative border-t px-3 py-2"
      style={{ borderColor: "var(--vscode-panel-border)" }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      {dragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded m-1" style={{ background: "var(--vscode-editor-background)", border: "2px dashed var(--vscode-focusBorder)" }}>
          Drop images or files to attach
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a, i) => (
            <AttachmentChip key={a.id} part={a} onRemove={() => setAttachments((p) => p.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}

      <div className="relative">
        <Suggestions
          items={suggestions}
          activeIndex={activeIndex}
          onPick={pickSuggestion}
          onActiveChange={setActiveIndex}
          header={mode.kind === "command" ? "Commands" : mode.kind === "file" ? "Files" : undefined}
        />
        <textarea
          ref={textareaRef}
          value={text}
          rows={3}
          placeholder={connected ? 'Ask anything…  @file  /command  (paste or drop images)' : "Waiting for opencode server…"}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="w-full resize-none rounded px-2 py-1.5 outline-none scroll-thin"
          style={{
            background: "var(--vscode-input-background)",
            color: "var(--vscode-input-foreground)",
            border: "1px solid var(--vscode-input-border, var(--vscode-panel-border))",
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-center gap-2">
          <button title="Attach files" onClick={() => fileInputRef.current?.click()} className="text-sm px-2 py-1 rounded hover:opacity-80" style={{ background: "var(--vscode-toolbar-hoverBackground, transparent)" }}>
            📎 Attach
          </button>
          <input ref={fileInputRef} type="file" multiple hidden onChange={onPickFiles} />
        </div>
        {busy ? (
          <button onClick={() => void abort()} className="text-sm px-3 py-1 rounded" style={{ background: "var(--vscode-button-secondaryBackground)", color: "var(--vscode-button-secondaryForeground)" }}>
            ■ Stop
          </button>
        ) : (
          <button onClick={() => void submit()} disabled={!connected} className="text-sm px-3 py-1 rounded disabled:opacity-50" style={{ background: "var(--vscode-button-background)", color: "var(--vscode-button-foreground)" }}>
            Send ⏎
          </button>
        )}
      </div>
    </div>
  );
}

function AttachmentChip({ part, onRemove }: { part: MessagePart; onRemove: () => void }) {
  const isImage = (part.mime ?? "").startsWith("image/");
  return (
    <div className="relative group rounded border overflow-hidden" style={{ borderColor: "var(--vscode-panel-border)" }}>
      {isImage && part.url ? (
        <img src={part.url} alt={part.filename} className="h-14 w-14 object-cover" />
      ) : (
        <div className="h-14 w-24 flex items-center justify-center text-xs px-1 text-center" style={{ background: "rgba(127,127,127,0.12)" }}>
          {part.filename ?? part.mime}
        </div>
      )}
      <button
        onClick={onRemove}
        className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100"
        style={{ background: "var(--vscode-editor-background)" }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}
