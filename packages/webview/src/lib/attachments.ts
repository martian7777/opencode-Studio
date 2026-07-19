import type { MessagePart } from "./rpc.ts";

let counter = 0;

/** Read a File/Blob into a FilePart with a base64 data URL (what opencode accepts). */
export function fileToPart(file: File | Blob, filename?: string): Promise<MessagePart> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
    reader.onload = () => {
      const name = filename ?? (file instanceof File ? file.name : `pasted-${Date.now()}`);
      resolve({
        id: `local-${counter++}`,
        type: "file",
        mime: file.type || guessMime(name),
        filename: name,
        url: String(reader.result),
      });
    };
    reader.readAsDataURL(file);
  });
}

/** Extract image/file blobs from a paste event's clipboard. */
export async function partsFromClipboard(items: DataTransferItemList): Promise<MessagePart[]> {
  const parts: MessagePart[] = [];
  for (const item of Array.from(items)) {
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file) parts.push(await fileToPart(file));
    }
  }
  return parts;
}

export async function partsFromDrop(files: FileList): Promise<MessagePart[]> {
  const parts: MessagePart[] = [];
  for (const file of Array.from(files)) parts.push(await fileToPart(file));
  return parts;
}

function guessMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    pdf: "application/pdf",
    txt: "text/plain",
    md: "text/markdown",
    json: "application/json",
  };
  return (ext && map[ext]) || "application/octet-stream";
}
