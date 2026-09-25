// Record each Open Library cover's pixel size in src/data/book-covers.json so
// books can be drawn at their true proportions instead of cropped to 2:3.
//
//   node scripts/books/cover-sizes.mjs
//
// Entries are { id, w, h } (Open Library cover id + size) or null (no cover).
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "src/data/book-covers.json";
const covers = JSON.parse(readFileSync(FILE, "utf8"));

// Width/height from a JPEG's start-of-frame marker
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) return null;
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  return null;
}

for (const [record, entry] of Object.entries(covers)) {
  if (entry === null || (typeof entry === "object" && entry.w)) continue;
  const id = typeof entry === "number" ? entry : entry.id;
  const res = await fetch(`https://covers.openlibrary.org/b/id/${id}-L.jpg`, {
    headers: { "User-Agent": "kevinkudu.xyz bookshelf" },
  });
  const size = res.ok ? jpegSize(Buffer.from(await res.arrayBuffer())) : null;
  covers[record] = size ? { id, ...size } : { id };
  if (!size) console.warn(`no size for ${record} (cover ${id})`);
}

writeFileSync(FILE, JSON.stringify(covers, null, 2) + "\n");
const sized = Object.values(covers).filter((c) => c?.w);
const ratios = sized.map((c) => c.w / c.h);
console.log(`sized ${sized.length} covers; aspect w/h ranges ${Math.min(...ratios).toFixed(2)}–${Math.max(...ratios).toFixed(2)} (2:3 = 0.67)`);
console.log(`would crop noticeably at 2:3 (>5% off): ${ratios.filter((r) => Math.abs(r - 2 / 3) > 0.033).length}`);
