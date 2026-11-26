#!/usr/bin/env node
/**
 * 產生 sw.js 的預先快取清單（PRECACHE）與版本號（CACHE_VERSION）。
 * 新增／刪除遊戲會用到的檔案、或發佈新版前執行：
 *   node tools/gen-sw-precache.js
 * 版本號是所有快取檔案內容的雜湊，內容一變，玩家下次上線就會換新快取。
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// Files the game needs at runtime (everything else — tests, tools, docs — is left out)
function isRuntimeFile(f) {
  if (f === 'index.html' || f === 'manifest.webmanifest') return true;
  if (/^[^/]+\.(js|css)$/.test(f)) return f !== 'sw.js';
  if (/^data\/questions\/[^/]+\.js$/.test(f)) return true;
  if (/^js\/[^/]+\.js$/.test(f)) return true;
  if (f.startsWith('assets/')) {
    if (f.includes('/_source/')) return false;
    return /\.(png|webp|svg|jpg|jpeg|gif|mp3|ogg|wav)$/i.test(f);
  }
  return false;
}

function listFiles() {
  // tracked + new-but-not-ignored files, so freshly added assets are picked up before commit
  const out = execSync('git ls-files --cached --others --exclude-standard', { cwd: ROOT, encoding: 'utf8' });
  return Array.from(new Set(out.split(/\r?\n/).filter(Boolean)))
    .filter((f) => fs.existsSync(path.join(ROOT, f)))
    .filter(isRuntimeFile)
    .sort();
}

function buildPrecache() {
  const files = listFiles();
  const hash = crypto.createHash('sha1');
  files.forEach((f) => {
    hash.update(f);
    hash.update(fs.readFileSync(path.join(ROOT, f)));
  });
  return { version: hash.digest('hex').slice(0, 12), files: ['./', ...files] };
}

function writeSw() {
  const swPath = path.join(ROOT, 'sw.js');
  const sw = fs.readFileSync(swPath, 'utf8');
  const { version, files } = buildPrecache();
  const block = [
    '// <precache> 由 tools/gen-sw-precache.js 產生，請勿手動編輯',
    `const CACHE_VERSION = '${version}';`,
    `const PRECACHE = ${JSON.stringify(files, null, 2)};`,
    '// </precache>'
  ].join('\n');
  const re = /\/\/ <precache>[\s\S]*?\/\/ <\/precache>/;
  if (!re.test(sw)) throw new Error('sw.js: <precache> markers not found');
  fs.writeFileSync(swPath, sw.replace(re, block));
  console.log(`sw.js updated: ${files.length} files, version ${version}`);
}

module.exports = { buildPrecache, isRuntimeFile };

if (require.main === module) writeSw();
