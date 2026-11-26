#!/usr/bin/env node
/**
 * 本機預覽用的小型網頁伺服器（不需要安裝任何套件）。
 *   node tools/serve.js [根目錄=專案根目錄] [port=5173]
 * 然後開 http://127.0.0.1:5173/ （遊戲）、/promo/（宣傳影片產生器）、/presentation/（簡報）。
 *
 * 額外功能：POST /__save/<檔名> 會把內容存到 <根目錄>/promo/out/<檔名>，
 * 宣傳影片產生器用它把輸出的 MP4／PNG 寫回硬碟。只接受 127.0.0.1 的連線。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const port = Number(process.argv[3] || 5173);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.webmanifest': 'application/manifest+json', '.md': 'text/plain; charset=utf-8'
};

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (req.method === 'POST' && urlPath.startsWith('/__save/')) {
    const name = path.basename(urlPath.slice('/__save/'.length));
    if (!/^[\w.-]+$/.test(name)) { res.writeHead(400); return res.end('bad name'); }
    const dir = path.join(root, 'promo', 'out');
    fs.mkdirSync(dir, { recursive: true });
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      fs.writeFileSync(path.join(dir, name), Buffer.concat(chunks));
      res.writeHead(200); res.end('ok');
    });
    return;
  }

  let file = path.join(root, urlPath);
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (urlPath.endsWith('/')) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, '127.0.0.1', () => console.log(`serving ${root} on http://127.0.0.1:${port}`));
