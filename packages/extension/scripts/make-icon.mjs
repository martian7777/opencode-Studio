// Generates media/icon.png (128x128) with no external deps.
// A rounded green-gradient tile with a white ">_" terminal prompt — the product mark.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const S = 128;
const buf = new Uint8Array(S * S * 4); // RGBA

function set(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  const na = a / 255;
  const oa = buf[i + 3] / 255;
  const outA = na + oa * (1 - na);
  if (outA === 0) return;
  buf[i] = (r * na + buf[i] * oa * (1 - na)) / outA;
  buf[i + 1] = (g * na + buf[i + 1] * oa * (1 - na)) / outA;
  buf[i + 2] = (b * na + buf[i + 2] * oa * (1 - na)) / outA;
  buf[i + 3] = outA * 255;
}

const radius = 28;
function inRoundedRect(x, y) {
  const min = 0, max = S - 1;
  const rx = Math.min(Math.max(x, min + radius), max - radius);
  const ry = Math.min(Math.max(y, min + radius), max - radius);
  const dx = x < min + radius || x > max - radius ? x - rx : 0;
  const dy = y < min + radius || y > max - radius ? y - ry : 0;
  return dx * dx + dy * dy <= radius * radius;
}

// Background: vertical gradient #34d399 -> #059669 inside a rounded tile.
for (let y = 0; y < S; y++) {
  const t = y / (S - 1);
  const r = Math.round(0x34 + (0x05 - 0x34) * t);
  const g = Math.round(0xd3 + (0x96 - 0xd3) * t);
  const b = Math.round(0x99 + (0x69 - 0x99) * t);
  for (let x = 0; x < S; x++) if (inRoundedRect(x, y)) set(x, y, r, g, b, 255);
}

function disc(cx, cy, rad, r, g, b, a = 255) {
  for (let y = Math.floor(cy - rad); y <= Math.ceil(cy + rad); y++)
    for (let x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= rad) set(x, y, r, g, b, a);
      else if (d <= rad + 1) set(x, y, r, g, b, a * (rad + 1 - d)); // AA edge
    }
}

function thickLine(x0, y0, x1, y1, w, r, g, b) {
  const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w / 2, r, g, b);
  }
}

// ">" chevron
thickLine(44, 42, 70, 64, 12, 255, 255, 255);
thickLine(70, 64, 44, 86, 12, 255, 255, 255);
// "_" underscore
for (let y = 82; y <= 92; y++) for (let x = 78; x <= 98; x++) set(x, y, 255, 255, 255, 255);

// ---- PNG encode ----
function crc32(bytes) {
  let c = ~0;
  for (let i = 0; i < bytes.length; i++) {
    c ^= bytes[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([t, Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA
const raw = Buffer.alloc(S * (S * 4 + 1));
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0; // filter: none
  for (let x = 0; x < S * 4; x++) raw[y * (S * 4 + 1) + 1 + x] = buf[y * S * 4 + x];
}
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw)),
  chunk("IEND", Buffer.alloc(0)),
]);

const out = fileURLToPath(new URL("../media/icon.png", import.meta.url));
mkdirSync(fileURLToPath(new URL("../media", import.meta.url)), { recursive: true });
writeFileSync(out, png);
console.log("wrote", out, png.length, "bytes");
