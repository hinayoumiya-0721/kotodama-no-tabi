#!/usr/bin/env node
/**
 * 把簡報用到的圖片轉成 assets/embedded-images.js（base64）。
 * 用途：直接雙擊 index.html（file://）時，瀏覽器不允許讀取本機圖片檔，
 * 「下載 PPTX」就改用這份內嵌資料放圖片。換了 assets/ 裡的圖片後重新執行：
 *   node make-embedded-images.js
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const srcs = new Set([...html.matchAll(/(?:src|poster)="(assets\/[^"]+\.(?:png|webp|svg|jpg))"/g)].map((m) => m[1]));
const types = { png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', jpg: 'image/jpeg' };

const map = {};
[...srcs].sort().forEach((rel) => {
  const buf = fs.readFileSync(path.join(dir, rel));
  map[rel] = `data:${types[rel.split('.').pop()]};base64,${buf.toString('base64')}`;
});
fs.writeFileSync(
  path.join(dir, 'assets', 'embedded-images.js'),
  '/* 由 make-embedded-images.js 產生，請勿手動編輯 */\nwindow.DECK_IMAGES = ' + JSON.stringify(map) + ';\n'
);
console.log(`embedded ${Object.keys(map).length} images`);
