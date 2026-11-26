#!/usr/bin/env node
/**
 * 題庫檢查：node tools/validate-questions.js
 * 依 index.html 的順序載入 data/questions/*.js 與 data.js，逐題檢查常見錯誤：
 *   - 題號重複、欄位缺漏、區域／JLPT／題型不在允許清單
 *   - 選擇題：選項數量、空白或重複選項、answerIndex 超出範圍
 *   - 重組題：片段數量、片段 id、plain 與 html 的純文字不一致
 *   - 聽力題：缺少朗讀文字（tts）
 *   - HTML：<ruby>／<rt>／<span> 未閉合，或 <ruby> 裡沒有 <rt>
 * 有錯誤時以 exit code 1 結束（CI 會擋下）。
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const JLPT = new Set(['N4', 'N3', 'N2', 'N1']);
const TYPES = new Set(['reading', 'particle', 'conjugation', 'reorder', 'unnatural', 'listening', 'vocab', 'grammar', 'kanji']);
const HTML_FIELDS = ['promptZh', 'promptJp', 'fullRubyJp', 'correctDisplay', 'explanation', 'wrongReason', 'hint'];

function loadGameData() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="(data\/questions\/[^"]+\.js)"><\/script>/g)].map((m) => m[1]);
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  [...files, 'data.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f }));
  return ctx.GAME_DATA;
}

const stripHtml = (s) => String(s || '').replace(/<rt>[\s\S]*?<\/rt>/g, '').replace(/<[^>]+>/g, '');
const count = (s, re) => (String(s || '').match(re) || []).length;

// Returns a list of problems in one HTML snippet (empty when fine)
function checkHtml(s) {
  const problems = [];
  if (typeof s !== 'string' || !s.includes('<')) return problems;
  const pairs = [['ruby', /<ruby>/g, /<\/ruby>/g], ['rt', /<rt>/g, /<\/rt>/g], ['span', /<span\b/g, /<\/span>/g]];
  pairs.forEach(([tag, open, close]) => {
    const o = count(s, open);
    const c = count(s, close);
    if (o !== c) problems.push(`<${tag}> 開 ${o} 個、關 ${c} 個`);
  });
  const rubies = s.match(/<ruby>[\s\S]*?<\/ruby>/g) || [];
  rubies.forEach((r) => {
    if (count(r, /<rt>/g) !== 1) problems.push(`<ruby> 裡應該剛好 1 個 <rt>：${r.slice(0, 40)}`);
    if (!stripHtml(r).trim()) problems.push(`<ruby> 沒有本文：${r.slice(0, 40)}`);
  });
  return problems;
}

function validate(data = loadGameData()) {
  const errors = [];
  const add = (id, msg) => errors.push(`${id || '(無題號)'}：${msg}`);
  const regionIds = new Set((data.REGIONS || []).map((r) => r.id));
  const seen = new Set();

  (data.QUESTIONS || []).forEach((q, i) => {
    const id = q && q.id;
    if (!id || typeof id !== 'string') { add(`#${i}`, '缺少題號 id'); return; }
    if (seen.has(id)) add(id, '題號重複');
    seen.add(id);
    if (!regionIds.has(q.regionId)) add(id, `regionId「${q.regionId}」不存在`);
    if (!JLPT.has(q.jlpt)) add(id, `jlpt「${q.jlpt}」不是 N4～N1`);
    if (!TYPES.has(q.type)) add(id, `type「${q.type}」不在允許清單`);
    if (!String(q.promptZh || '').trim()) add(id, '缺少 promptZh');
    if (q.type !== 'listening' && !String(q.promptJp || '').trim()) add(id, '缺少 promptJp');
    if (!String(q.explanation || '').trim()) add(id, '缺少 explanation');

    if (q.type === 'reorder') {
      const chunks = Array.isArray(q.chunks) ? q.chunks : [];
      if (chunks.length < 2) add(id, '重組題至少要 2 個片段');
      const chunkIds = chunks.map((c) => c && c.id);
      if (new Set(chunkIds).size !== chunkIds.length) add(id, '重組片段 id 重複');
      chunks.forEach((c, ci) => {
        if (!c || !String(c.plain || c.text || '').trim()) { add(id, `片段 ${ci} 是空的`); return; }
        if (c.html && stripHtml(c.html) !== String(c.plain)) add(id, `片段 ${ci} 的 html 純文字與 plain 不一致`);
        checkHtml(c.html).forEach((p) => add(id, `片段 ${ci} ${p}`));
      });
    } else {
      const opts = Array.isArray(q.options) ? q.options : [];
      if (opts.length < 2 || opts.length > 4) add(id, `選項數量 ${opts.length}（應為 2～4）`);
      const plain = opts.map((o) => stripHtml(o).trim());
      if (plain.some((o) => !o)) add(id, '有空白選項');
      if (new Set(plain).size !== plain.length) add(id, '有重複選項');
      if (!Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= opts.length) {
        add(id, `answerIndex ${q.answerIndex} 超出選項範圍`);
      }
      opts.forEach((o, oi) => checkHtml(o).forEach((p) => add(id, `選項 ${oi} ${p}`)));
    }

    if (q.type === 'listening' && !/[぀-ヿ一-鿿]/.test(String(q.tts || ''))) {
      add(id, '聽力題缺少日文朗讀文字 tts');
    }
    HTML_FIELDS.forEach((f) => checkHtml(q[f]).forEach((p) => add(id, `${f} ${p}`)));
  });

  return { total: (data.QUESTIONS || []).length, errors };
}

module.exports = { validate, loadGameData, checkHtml };

if (require.main === module) {
  const { total, errors } = validate();
  if (errors.length) {
    console.error(`❌ 題庫檢查：${total} 題中發現 ${errors.length} 個問題`);
    errors.forEach((e) => console.error('  - ' + e));
    process.exit(1);
  }
  console.log(`✅ 題庫檢查：${total} 題全部通過`);
}
