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

// 点到线段距离(用于抗锯齿笔画)
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

// 单个字母 Y 的笔画强度(0..1),cx0 为字母中心 x,坐标相对画布中心
const GLYPH_H = 470;
const GLYPH_W = 300;
const BAR = 84;
function yIntensity(cx0, cx, cy) {
  const junctionY = -GLYPH_H * 0.06; // 两条斜线交汇点(略高于垂直中心)
  const d1 = segDist(cx, cy, cx0 - GLYPH_W / 2, -GLYPH_H / 2, cx0, junctionY); // 左斜
  const d2 = segDist(cx, cy, cx0 + GLYPH_W / 2, -GLYPH_H / 2, cx0, junctionY); // 右斜
  const d3 = segDist(cx, cy, cx0, junctionY, cx0, GLYPH_H / 2); // 竖干
  const d = Math.min(d1, d2, d3);
  const half = BAR / 2;
  if (d < half - 1.5) return 1;
  if (d > half + 1.5) return 0;
  return (half + 1.5 - d) / 3;
}

// 两个 Y 的中心位置(画布中心为原点)
const GAP = 122;
const Y_CENTERS = [-(GLYPH_W / 2 + GAP / 2), GLYPH_W / 2 + GAP / 2];

// 深灰字母颜色
const GRAY = 61; // #3d3d3d

// RGBA 像素
const raw = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    // 白底圆角方形背景
    let r = 255;
    let g = 255;
    let b = 255;
    let a = 255;

    // 圆角遮罩(半径 180)
    const radius = 180;
    const dx = Math.min(x, SIZE - 1 - x);
    const dy = Math.min(y, SIZE - 1 - y);
    if (dx < radius && dy < radius) {
      const dist = Math.hypot(radius - dx, radius - dy);
      if (dist > radius) a = 0;
      else if (dist > radius - 2) a = Math.round(((radius - dist) / 2) * 255);
    }

    // 深灰色 "YY" 字母
    if (a > 0) {
      const cx = x - SIZE / 2;
      const cy = y - SIZE / 2;
      let intensity = 0;
      for (const c0 of Y_CENTERS) {
        intensity = Math.max(intensity, yIntensity(c0, cx, cy));
      }
      if (intensity > 0) {
        r = Math.round(255 + (GRAY - 255) * intensity);
        g = Math.round(255 + (GRAY - 255) * intensity);
        b = Math.round(255 + (GRAY - 255) * intensity);
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
