// 用纯 Node(zlib)生成一个 1024x1024 的应用图标 PNG,
// 然后可用 `npx tauri icon icons/icon-src.png` 生成各平台图标。
// 运行: node scripts/gen-icon.mjs
import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";

const SIZE = 1024;

function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  let crc = 0xffffffff;
  for (const b of buf) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

// RGBA 像素
const raw = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    // 圆角方形背景:深蓝渐变
    const t = y / SIZE;
    let r = Math.round(30 + t * 20);
    let g = Math.round(60 + t * 40);
    let b = Math.round(120 + t * 80);
    let a = 255;

    // 圆角遮罩(半径 180)
    const radius = 180;
    const dx = Math.min(x, SIZE - 1 - x);
    const dy = Math.min(y, SIZE - 1 - y);
    if (dx < radius && dy < radius) {
      const dist = Math.hypot(radius - dx, radius - dy);
      if (dist > radius) a = 0;
      else if (dist > radius - 2) a = Math.round((radius - dist) / 2 * 255);
    }

    // 中间画一个白色 "M" 形状(两条竖条 + V 形)
    const cx = x - SIZE / 2;
    const cy = y - SIZE / 2;
    const half = 300;
    if (a > 0 && Math.abs(cx) < half && Math.abs(cy) < half) {
      const bar = 70;
      const inLeftBar = Math.abs(cx + half + bar / 2 - bar) < bar;
      const inRightBar = Math.abs(cx - half - bar / 2 + bar) < bar;
      // 中间 V: 由两条斜线构成
      const slope = half / (half * 0.9);
      const vLeft = Math.abs((cx + half) * -slope - cy + half * 0.1);
      const vRight = Math.abs((cx - half) * slope - cy + half * 0.1);
      const inV = Math.abs(cx) < half * 0.7 && (vLeft < bar || vRight < bar);
      if ((Math.abs(cx + half * 0.55) < bar || Math.abs(cx - half * 0.55) < bar) || inV) {
        r = 255;
        g = 255;
        b = 255;
      }
    }

    raw[i] = r;
    raw[i + 1] = g;
    raw[i + 2] = b;
    raw[i + 3] = a;
  }
}

// 组装 PNG: 每行前加 filter 字节 0
const withFilter = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  withFilter[y * (SIZE * 4 + 1)] = 0;
  raw.copy(withFilter, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // color type RGBA
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const idat = zlib.deflateSync(withFilter, { level: 9 });

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", idat),
  chunk("IEND", Buffer.alloc(0)),
]);

const outDir = path.resolve("icons");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "icon-src.png");
fs.writeFileSync(outPath, png);
console.log("生成图标:", outPath, `(${png.length} bytes)`);
