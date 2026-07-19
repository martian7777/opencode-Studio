import { describe, it, expect } from "vitest";
import { fileToPart } from "./attachments.ts";

describe("fileToPart", () => {
  it("converts an image blob to an image/* FilePart with a data URL", async () => {
    const blob = new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" });
    const part = await fileToPart(blob, "shot.png");
    expect(part.type).toBe("file");
    expect(part.mime).toBe("image/png");
    expect(part.filename).toBe("shot.png");
    expect(part.url.startsWith("data:image/png;base64,")).toBe(true);
  });

  it("guesses mime from the filename when the blob has no type", async () => {
    const blob = new Blob(["hello"], { type: "" });
    const part = await fileToPart(blob, "notes.md");
    expect(part.mime).toBe("text/markdown");
  });

  it("falls back to octet-stream for unknown extensions", async () => {
    const blob = new Blob(["x"], { type: "" });
    const part = await fileToPart(blob, "thing.xyz");
    expect(part.mime).toBe("application/octet-stream");
  });
});
