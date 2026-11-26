#!/usr/bin/env node
/**
 * PPTX 讀取器：依播放順序列出每頁的文字方塊、圖片位置與備忘稿（不需要安裝任何套件）。
 *   node tools/read-pptx.js <檔案.pptx 或已解壓縮的資料夾> [輸出.json]
 * 用途：在 PowerPoint 裡改過簡報後，比對改了什麼，再把修改匯回 presentation/index.html。
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const input = process.argv[2];
if (!input) {
  console.error('用法：node tools/read-pptx.js <檔案.pptx 或資料夾> [輸出.json]');
  process.exit(1);
}

// Minimal ZIP reader (central directory + deflate), enough for .pptx files
function unzip(buf) {
  const sig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocd = buf.lastIndexOf(sig);
  if (eocd < 0) throw new Error('不是有效的 .pptx（找不到 ZIP 目錄）');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28), elen = buf.readUInt16LE(p + 30), clen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nlen).toString('utf8');
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.slice(start, start + csize);
    files.set(name, method === 8 ? zlib.inflateRawSync(data) : data);
    p += 46 + nlen + elen + clen;
  }
  return files;
}

const isDir = fs.statSync(input).isDirectory();
const zip = isDir ? null : unzip(fs.readFileSync(input));
const exists = (p) => (isDir ? fs.existsSync(path.join(input, p)) : zip.has(p));
const rd = (p) => (isDir ? fs.readFileSync(path.join(input, p), 'utf8') : zip.get(p).toString('utf8'));
const norm = (p) => path.posix.normalize(p.replace(/\\/g, '/'));

const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');
const EMU = 914400;

function rels(p) {
  const f = path.posix.join(path.posix.dirname(p), '_rels', path.posix.basename(p) + '.rels');
  if (!exists(f)) return {};
  const out = {};
  for (const m of rd(f).matchAll(/<Relationship\b[^>]*>/g)) {
    const id = (m[0].match(/Id="([^"]+)"/) || [])[1];
    const target = (m[0].match(/Target="([^"]+)"/) || [])[1];
    if (id && target) out[id] = target;
  }
  return out;
}
function paragraphs(xml) {
  return [...xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>|<a:p\/>/g)].map((m) =>
    [...(m[1] || '').matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>|<a:br\b/g)]
      .map((t) => (t[0].startsWith('<a:br') ? '\n' : decode(t[1]))).join(''));
}
function xfrm(xml) {
  const off = xml.match(/<a:off x="(-?\d+)" y="(-?\d+)"/);
  const ext = xml.match(/<a:ext cx="(\d+)" cy="(\d+)"/);
  if (!off || !ext) return null;
  const r = (v) => +(v / EMU).toFixed(2);
  return { x: r(off[1]), y: r(off[2]), w: r(ext[1]), h: r(ext[2]) };
}

const presRels = rels('ppt/presentation.xml');
const order = [...rd('ppt/presentation.xml').matchAll(/<p:sldId [^>]*r:id="([^"]+)"/g)]
  .map((m) => norm('ppt/' + presRels[m[1]]));

const slides = order.map((p, i) => {
  const xml = rd(p);
  const r = rels(p);
  const items = [];
  for (const m of xml.matchAll(/<p:(sp|pic)>([\s\S]*?)<\/p:\1>/g)) {
    const [, kind, body] = m;
    if (kind === 'pic') {
      const emb = body.match(/r:embed="([^"]+)"/);
      items.push({ kind: 'pic', media: emb ? path.posix.basename(r[emb[1]] || '') : '', box: xfrm(body) });
    } else {
      const text = /<p:txBody>/.test(body) ? paragraphs(body).join('\n').trim() : '';
      items.push(text ? { kind: 'text', text, box: xfrm(body) } : { kind: 'shape', box: xfrm(body) });
    }
  }
  let notes = '';
  const nrel = Object.values(r).find((t) => /notesSlide/.test(t));
  if (nrel) {
    const nx = rd(norm(path.posix.join(path.posix.dirname(p), nrel)));
    const body = [...nx.matchAll(/<p:sp>([\s\S]*?)<\/p:sp>/g)].map((x) => x[1]).find((b) => /type="body"/.test(b));
    if (body) notes = paragraphs(body).join('\n').trim();
  }
  return { n: i + 1, file: path.posix.basename(p), items, notes };
});

if (process.argv[3]) fs.writeFileSync(process.argv[3], JSON.stringify(slides, null, 1));
slides.forEach((s) => {
  console.log(`\n=== 第 ${s.n} 頁 (${s.file}) ===`);
  s.items.filter((it) => it.kind !== 'shape').forEach((it) =>
    console.log(it.kind === 'pic' ? `  [圖 ${it.media}] ${JSON.stringify(it.box)}` : `  ${it.text.replace(/\n/g, ' ⏎ ')}`));
  if (s.notes) console.log('  📝 ' + s.notes.replace(/\n/g, ' '));
});
