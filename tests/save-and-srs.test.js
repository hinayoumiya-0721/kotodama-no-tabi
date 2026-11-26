#!/usr/bin/env node
/*
 * Regression tests for save-import hardening and SRS rules (QA v1.4 follow-ups).
 * Zero dependencies. Loads data.js + game.js in a Node VM with a minimal DOM stub
 * (document.readyState = 'loading', so Game.init() never runs).
 *
 *   node tests/save-and-srs.test.js
 *
 * (On this machine node is not on PATH; see HANDOFF.md for its full path.)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');

function loadGame() {
  const noop = () => {};
  const store = new Map();
  const context = {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URLSearchParams,
    performance: { now: () => Date.now() },
    location: { search: '' },
    navigator: {},
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k)
    },
    document: {
      readyState: 'loading', // keeps Game.init() from running
      addEventListener: noop,
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop })
    },
    requestAnimationFrame: (fn) => setTimeout(fn, 0)
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  // Load the question bank parts in the same order as index.html, then data.js + game.js
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const questionFiles = [...html.matchAll(/<script src="(data\/questions\/[^"]+\.js)"><\/script>/g)].map((m) => m[1]);
  if (questionFiles.length === 0) throw new Error('no question bank scripts found in index.html');
  for (const file of [...questionFiles, 'data.js', 'game.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  context.__objectProto = vm.runInContext("Object.prototype", context);
  return context;
}

const ctx = loadGame();
const Game = ctx.Game;
// Values created inside the VM have that realm's prototypes: compare via JSON / the VM Object.prototype
const same = (a, b, msg) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), msg);
const VM_OBJECT_PROTO = ctx.__objectProto;
const sanitize = (obj) => Game.sanitizeSaveData(obj);
const def = Game.createDefaultState();

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

function allNumbersFinite(value, where = 'state') {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), `${where} is ${value}`);
  } else if (value && typeof value === 'object') {
    Object.keys(value).forEach((k) => allNumbersFinite(value[k], `${where}.${k}`));
  }
}

console.log('\nsanitizeSaveData');

test('player numbers: "abc" / 1e400 / {} fall back to defaults', () => {
  const s = sanitize(JSON.parse('{"player":{"gold":"abc","level":1e400,"sp":{},"exp":"x"}}'));
  assert.strictEqual(s.player.gold, def.player.gold);
  assert.strictEqual(s.player.level, 1);
  assert.strictEqual(s.player.sp, def.player.sp);
  assert.strictEqual(s.player.exp, 0);
});

test('null fields fall back to defaults instead of the minimum (BUG-4)', () => {
  const s = sanitize({ player: { gold: null, maxHp: null, baseINT: null } });
  assert.strictEqual(s.player.gold, def.player.gold);
  assert.strictEqual(s.player.maxHp, def.player.maxHp);
  assert.strictEqual(s.player.baseINT, def.player.baseINT);
});

test('numeric strings are still accepted', () => {
  assert.strictEqual(sanitize({ player: { gold: '250' } }).player.gold, 250);
});

test('player as an array is treated as missing (BUG-4)', () => {
  const s = sanitize({ player: [] });
  assert.strictEqual(s.player.name, def.player.name);
});

test('jobId "__proto__" / unknown ids fall back to default job (BUG-2)', () => {
  assert.strictEqual(sanitize({ player: { jobId: '__proto__' } }).player.jobId, def.player.jobId);
  assert.strictEqual(sanitize({ player: { jobId: 'hacker' } }).player.jobId, def.player.jobId);
  assert.strictEqual(sanitize({ player: { jobId: 'bard' } }).player.jobId, 'bard');
});

test('no Infinity / NaN anywhere after a 1e400 / garbage import (BUG-3)', () => {
  const s = sanitize(JSON.parse(`{
    "player": {},
    "inventory": [{"id":"wp_wood","qty":1e400},{"id":"__proto__","qty":3}],
    "stats": {"battlesWon":1e400,"totalCorrect":"abc"},
    "npc": {"mayor": {"claimedMilestones": ["abc", 1e400, null, 30]}},
    "progress": {"cycleCountsByJlpt": {"N4": 1e400}},
    "quests": {"dailyProgress": {"win_battles": 1e400}},
    "mistakes": [{"questionId":"q1","count":1e400}],
    "wrongNotes": {"q1": {"id":"q1","wrongCount":1e400}},
    "dailyTraining": {"dateStr":"${new Date().toDateString()}","correctCount":1e400,"reviewCount":"x"}
  }`));
  allNumbersFinite(s);
  same(s.npc.mayor.claimedMilestones, [30]);
  assert.ok(s.inventory.every((it) => it.id !== '__proto__' && it.qty <= 9999));
});

test('shrineBest is rebuilt from whitelisted fields only (BUG-1, stored XSS)', () => {
  const s = sanitize(JSON.parse(`{
    "player": {},
    "progress": {"shrineBest": {
      "tier_n4": {"rank":"<img src=x onerror=alert(1)>","score":1e400,"total":"bad"},
      "tier_n3": {"rank":"A","score":"8","total":10,"timeLeft":42,"evil":"<script>","__proto__":{"polluted":true}},
      "__proto__": {"rank":"S"}
    }}
  }`));
  assert.ok(!('tier_n4' in s.progress.shrineBest), 'entry with a non-whitelisted rank must be dropped');
  same(Object.keys(s.progress.shrineBest.tier_n3).sort(), ['rank', 'score', 'timeLeft', 'total']);
  assert.strictEqual(s.progress.shrineBest.tier_n3.score, 8);
  assert.strictEqual(Object.getPrototypeOf(s.progress.shrineBest), VM_OBJECT_PROTO);
  assert.strictEqual(vm.runInContext("({}).polluted", ctx), undefined);
  assert.strictEqual(({}).polluted, undefined);
});

test('wrongNotes / enhancements ignore __proto__ keys', () => {
  const s = sanitize(JSON.parse('{"player":{"enhancements":{"__proto__":{"x":1},"wp_wood_blade":3,"not_an_item":2}},"wrongNotes":{"__proto__":{"id":"__proto__"}}}'));
  same(Object.keys(s.player.enhancements), ['wp_wood_blade']);  // unknown item ids are dropped too (QA S-3)
  same(Object.keys(s.wrongNotes), []);
  assert.strictEqual(Object.getPrototypeOf(s.wrongNotes), VM_OBJECT_PROTO);
});

test('defeatedElites / defeatedBosses / currentRegionId filter to valid r1–r6 (BUG-2)', () => {
  same(sanitize({ player: {} }).progress.defeatedElites, []);
  same(
    sanitize({ player: {}, progress: { defeatedElites: ['r1', 'r1', 2, 'r3', '__proto__', 'toString'] } }).progress.defeatedElites,
    ['r1', 'r3']
  );
  same(
    sanitize({ player: {}, progress: { defeatedBosses: ['r2', 'r99', '__proto__', 'toString'] } }).progress.defeatedBosses,
    ['r2']
  );
  assert.strictEqual(sanitize({ player: {}, progress: { currentRegionId: '__proto__' } }).progress.currentRegionId, 'r1');
  assert.strictEqual(sanitize({ player: {}, progress: { currentRegionId: 'r4' } }).progress.currentRegionId, 'r4');
  same(sanitize({ player: {}, progress: { defeatedElites: 'r1' } }).progress.defeatedElites, []);
});

test('equipment prototype keys (__proto__ / toString) and wrong-slot items are rejected (BUG-2)', () => {
  assert.strictEqual(Game.getItemById('__proto__'), null);
  assert.strictEqual(Game.getItemById('toString'), null);
  assert.strictEqual(Game.getEnemyById('__proto__'), null);
  assert.strictEqual(Game.getEnemyById('toString'), null);
  const s = sanitize(JSON.parse('{"player":{"jobId":"swordsman","equipment":{"weapon":"__proto__","armor":"toString","accessory":"valueOf"}}}'));
  assert.strictEqual(s.player.equipment.weapon, null);
  assert.strictEqual(s.player.equipment.armor, null);
  assert.strictEqual(s.player.equipment.accessory, null);
});

test('formatBattleSpeedText keeps countdown seconds at front on 320px screens (BUG-4)', () => {
  ctx.window.innerWidth = 1280;
  assert.strictEqual(Game.formatBattleSpeedText(8.0), '⚡ 8.0s 速答');
  ctx.window.innerWidth = 320;
  assert.strictEqual(Game.formatBattleSpeedText(8.0), '⚡ 8.0s');
  assert.strictEqual(Game.formatBattleSpeedText(0), '🧘 無加成');
  delete ctx.window.innerWidth;
});

test('invalid player.hp / player.mp ("abc" / "") fall back to full HP/MP instead of 1/0 (BUG-3)', () => {
  const s = sanitize({ player: { maxHp: null, hp: 'abc', mp: '' } });
  assert.strictEqual(s.player.maxHp, def.player.maxHp);
  assert.strictEqual(s.player.hp, def.player.maxHp);
  assert.strictEqual(s.player.mp, def.player.maxMp);
});

test('unlockedTitles whitelist & showToast textContent block Stored XSS (BUG-1)', () => {
  const s = sanitize({
    player: {
      name: '<b>XSS</b>',
      unlockedTitles: ['初醒的旅人', '<img src=x onerror=alert(1)>', '言靈求道者'],
      activeTitle: '<img src=x onerror=alert(1)>'
    }
  });
  same(s.player.unlockedTitles, ['初醒的旅人', '言靈求道者']);
  assert.strictEqual(s.player.activeTitle, '初醒的旅人');

  // Verify showToast assigns textContent rather than innerHTML
  const appended = [];
  const prevGetById = ctx.document.getElementById;
  const prevCreateEl = ctx.document.createElement;
  ctx.document.getElementById = (id) => (id === 'toast-container' ? { appendChild: (el) => appended.push(el) } : null);
  ctx.document.createElement = () => ({ style: {}, classList: { add: () => {}, remove: () => {}, toggle: () => {} } });
  try {
    Game.showToast('<b>XSS</b><img src=x onerror=alert(1)>', 'gold');
    assert.strictEqual(appended.length, 1);
    assert.strictEqual(appended[0].textContent, '<b>XSS</b><img src=x onerror=alert(1)>');
    assert.strictEqual(appended[0].innerHTML, undefined);
  } finally {
    ctx.document.getElementById = prevGetById;
    ctx.document.createElement = prevCreateEl;
  }
});

console.log('\nadvanceWrongNoteSRS');

function freshNote(id, overrides = {}) {
  const st = Game.getState();
  st.wrongNotes = st.wrongNotes || {};
  st.wrongNotes[id] = Object.assign({
    id, wrongCount: 1, correctCount: 0, lastWrongAt: new Date().toISOString(),
    playerLastChoice: null, srsLevel: 1, nextReviewAt: Date.now() + 86400000, mastered: false
  }, overrides);
  return st.wrongNotes[id];
}

test('requireDue: a not-yet-due note does NOT level up (BUG-5)', () => {
  const note = freshNote('t_early');
  const res = Game.advanceWrongNoteSRS('t_early', true, { requireDue: true });
  assert.strictEqual(res.advanced, false);
  assert.strictEqual(res.early, true);
  assert.strictEqual(note.srsLevel, 1);
  assert.strictEqual(note.correctCount, 1);
});

test('requireDue: a due note levels up and schedules +3 days from Lv.1', () => {
  const note = freshNote('t_due', { nextReviewAt: Date.now() - 1000 });
  const res = Game.advanceWrongNoteSRS('t_due', true, { requireDue: true });
  assert.strictEqual(res.advanced, true);
  assert.strictEqual(note.srsLevel, 2);
  assert.ok(note.nextReviewAt > Date.now() + 2.9 * 86400000);
});

test('Lv.3 due note becomes mastered', () => {
  const note = freshNote('t_master', { srsLevel: 3, nextReviewAt: Date.now() - 1 });
  Game.advanceWrongNoteSRS('t_master', true, { requireDue: true });
  assert.strictEqual(note.mastered, true);
  assert.strictEqual(note.nextReviewAt, null);
});

console.log('\nquest destinations & objective');

const QUESTS = (() => { const q = ctx.GAME_DATA.QUESTS; return Array.isArray(q) ? q : Object.values(q); })();
const questById = (id) => QUESTS.find((q) => q.id === id);

test('defeat_boss → explore the boss region (r1 unlocked)', () => {
  const st = Game.getState();
  st.player.level = 1;
  st.progress.defeatedBosses = [];
  const d = Game.getQuestDestination(questById('q_main_1'));
  assert.strictEqual(d.kind, 'explore');
  assert.strictEqual(d.regionId, 'r1');
  assert.strictEqual(d.locked, false);
});

test('defeat_boss in a locked region is flagged locked', () => {
  const d = Game.getQuestDestination(questById('q_main_3'));
  assert.strictEqual(d.regionId, 'r3');
  assert.strictEqual(d.locked, true);
});

test('reading / shrine / npc quests map to their screens; unmapped types get no button', () => {
  const byType = (t) => QUESTS.find((q) => q.targetType === t);
  assert.strictEqual(Game.getQuestDestination(byType('clear_reading')).view, 'reading');
  assert.strictEqual(Game.getQuestDestination(byType('complete_shrine')).view, 'shrine');
  assert.strictEqual(Game.getQuestDestination(byType('npc_talk')).view, 'town');
  assert.strictEqual(Game.getQuestDestination(byType('enhance_item')), null);
  assert.strictEqual(Game.getQuestDestination(byType('reach_level')), null);
});

test('battle-count quests go to the current region, or the highest unlocked one', () => {
  const st = Game.getState();
  const q = QUESTS.find((x) => x.targetType === 'win_battles');
  st.progress.currentRegionId = 'r1';
  assert.strictEqual(Game.getQuestDestination(q).regionId, 'r1');
  st.progress.currentRegionId = 'r5';          // locked → fall back
  st.player.level = 6;                          // unlocks r2, r3 by level
  assert.strictEqual(Game.getQuestDestination(q).regionId, 'r3');
  st.player.level = 1;
  st.progress.currentRegionId = 'r1';
});

test('current objective = first unclaimed main quest', () => {
  const st = Game.getState();
  st.quests.claimedIds = [];
  assert.strictEqual(Game.getCurrentObjective().q.id, 'q_main_1');
  st.quests.claimedIds = ['q_main_1'];
  assert.strictEqual(Game.getCurrentObjective().q.id, 'q_main_2');
  st.quests.claimedIds = QUESTS.filter((q) => q.category === 'main').map((q) => q.id);
  assert.strictEqual(Game.getCurrentObjective(), null);
  st.quests.claimedIds = [];
});

console.log('\nQA_REPORT v1.5.1 fixes');

test('P1-1: battle read-aloud never speaks the answered sentence or the target word', () => {
  const plain = (h) => String(h || '').replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
  const leaks = [];
  ctx.GAME_DATA.QUESTIONS.forEach((q) => {
    if (q.type === 'listening') return;
    const said = Game.getQuestionSpeakText(q);
    const prompt = String(q.promptJp || '');
    const target = (prompt.match(/<span class="q-target"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    if (q.tts && said && said.replace(/\s/g, '') === String(q.tts).replace(/\s/g, '')) leaks.push(`${q.id}: speaks full tts`);
    if (target && said.includes(plain(target))) leaks.push(`${q.id}: speaks target "${plain(target)}"`);
    if (/q-blank/.test(prompt) && !said.includes('なになに')) leaks.push(`${q.id}: blank not masked`);
  });
  assert.strictEqual(leaks.length, 0, leaks.slice(0, 5).join('; '));
});

test('P1-1: prompts without Japanese (e.g. Chinese reorder stems) speak nothing', () => {
  const q = ctx.GAME_DATA.QUESTIONS.find((x) => x.type === 'reorder' && !/[぀-ヿ]/.test(String(x.promptJp || '').replace(/<[^>]+>/g, '')));
  assert.ok(q, 'expected at least one reorder question with a Chinese stem');
  assert.strictEqual(Game.getQuestionSpeakText(q), '');
});

test('S-2: corrupted values ({"toString":1}) never throw and fall back', () => {
  const evil = { toString: 1 };
  const s = sanitize({
    player: { name: 'A', level: evil },
    progress: { regionExplore: { r1: evil }, defeatedBosses: [evil, 'r1'], clearedReadings: [evil] },
    skills: { vocab_insight: evil },
    npc: { mayor: { affection: evil, talkedIds: [evil] } },
    stats: { encounteredEnemies: [evil] },
    wrongNotes: { q1: { id: 'q1', srsLevel: evil, nextReviewAt: evil } },
    achievements: [evil]
  });
  assert.strictEqual(s.player.level, 1);
  same(s.progress.defeatedBosses, ['r1']);
  same(s.achievements, []);
  allNumbersFinite(s);
});

test('S-3: lists are capped and unknown inventory ids are dropped', () => {
  const many = Array.from({ length: 5000 }, (_, i) => `rd_x_${i}`);
  const s = sanitize({ player: {}, progress: { clearedReadings: many }, inventory: [{ id: 'not_an_item', qty: 3 }, { id: 'con_herb', qty: 2 }] });
  assert.ok(s.progress.clearedReadings.length <= 2000);
  same(s.inventory.map((it) => it.id), ['con_herb']);
});

test('S-3: oversized import is refused before parsing', () => {
  const huge = JSON.stringify({ player: { name: 'A' }, pad: 'x'.repeat(1100000) });
  assert.strictEqual(Game.importSaveJsonCode(huge, { skipConfirm: true }), false);
});

console.log('\nonboarding & UI state');

test('tutorialStep: brand-new save defaults to 0; legacy played saves auto-skip to "done"', () => {
  assert.strictEqual(def.progress.tutorialStep, 0);
  assert.strictEqual(sanitize({ player: { name: 'New' } }).progress.tutorialStep, 0);
  assert.strictEqual(sanitize({ player: { name: 'Vet', level: 3 } }).progress.tutorialStep, 'done');
  assert.strictEqual(sanitize({ player: { name: 'Vet' }, stats: { battlesWon: 1 } }).progress.tutorialStep, 'done');
  assert.strictEqual(sanitize({ player: { name: 'Vet' }, stats: { totalCorrect: 1 } }).progress.tutorialStep, 'done');
  assert.strictEqual(sanitize({ player: { name: 'Vet' }, progress: { defeatedBosses: ['r1'] } }).progress.tutorialStep, 'done');
});

test('tutorialStep: valid steps preserved, malformed values fall back safely', () => {
  assert.strictEqual(sanitize({ player: {}, progress: { tutorialStep: 0 } }).progress.tutorialStep, 0);
  assert.strictEqual(sanitize({ player: {}, progress: { tutorialStep: 1 } }).progress.tutorialStep, 1);
  assert.strictEqual(sanitize({ player: {}, progress: { tutorialStep: 2 } }).progress.tutorialStep, 2);
  assert.strictEqual(sanitize({ player: {}, progress: { tutorialStep: 'done' } }).progress.tutorialStep, 'done');
  assert.strictEqual(sanitize({ player: {}, progress: { tutorialStep: 99 } }).progress.tutorialStep, 0);
  assert.strictEqual(sanitize({ player: {}, progress: { tutorialStep: '<script>' } }).progress.tutorialStep, 0);
  assert.strictEqual(sanitize({ player: { level: 5 }, progress: { tutorialStep: '<script>' } }).progress.tutorialStep, 'done');
});

test('setTutorialStep / getTutorialStep enforce allowed transitions', () => {
  Game.setTutorialStep(0, { silent: true });
  assert.strictEqual(Game.getTutorialStep(), 0);
  Game.setTutorialStep(1, { silent: true });
  assert.strictEqual(Game.getTutorialStep(), 1);
  Game.setTutorialStep(2, { silent: true });
  assert.strictEqual(Game.getTutorialStep(), 2);
  Game.setTutorialStep('invalid', { silent: true });
  assert.strictEqual(Game.getTutorialStep(), 'done');
  Game.setTutorialStep('done', { silent: true });
  assert.strictEqual(Game.getTutorialStep(), 'done');
});

console.log('\nsave file download/upload & XSS defense');

test('validateSaveJsonFile blocks non-JSON extensions, dangerous MIME types, empty and >1MB files', () => {
  assert.strictEqual(Game.validateSaveJsonFile(null).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'evil.html', type: 'text/html', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'evil.svg', type: 'image/svg+xml', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'evil.js', type: 'application/javascript', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'save.json.html', type: 'application/json', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'save.txt', type: 'text/plain', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'spoof.json', type: 'text/html', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'spoof.json', type: 'image/svg+xml', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'spoof.json', type: 'application/javascript', size: 120 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'empty.json', type: 'application/json', size: 0 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'huge.json', type: 'application/json', size: 1000001 }).ok, false);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'kotodama.json', type: 'application/json', size: 2048 }).ok, true);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'KOTODAMA.JSON', type: '', size: 512 }).ok, true);
  assert.strictEqual(Game.validateSaveJsonFile({ name: 'backup.json', type: 'text/plain;charset=utf-8', size: 512 }).ok, true);
});

test('importSaveJsonCode blocks binary NUL bytes, HTML docs, arrays, and clears textarea after success', () => {
  assert.strictEqual(Game.importSaveJsonCode('{"player":{"name":"A"}}\u0000PNG', { skipConfirm: true }), false);
  assert.strictEqual(Game.importSaveJsonCode('<!DOCTYPE html><script>alert(1)</script>', { skipConfirm: true }), false);
  assert.strictEqual(Game.importSaveJsonCode('[1, 2, 3]', { skipConfirm: true }), false);

  const mockTa = { value: '\uFEFF{"player":{"name":"旅人A","level":4,"gold":300}}' };
  const mockInput = { value: 'C:\\fakepath\\save.json' };
  const mockDetails = { open: true };
  const prevGetById = ctx.document.getElementById;
  const prevScrollTo = ctx.window.scrollTo;
  ctx.window.scrollTo = () => {};
  ctx.document.getElementById = (id) => {
    if (id === 'save-json-textarea') return mockTa;
    if (id === 'input-import-save-file') return mockInput;
    if (id === 'save-code-details') return mockDetails;
    return null;
  };
  try {
    const ok = Game.importSaveJsonCode(null, { skipConfirm: true });
    assert.strictEqual(ok, true);
    assert.strictEqual(mockTa.value, '', 'textarea must be cleared automatically after successful import');
    assert.strictEqual(mockInput.value, '', 'file input must be reset after import');
    assert.strictEqual(mockDetails.open, false, 'manual code details should collapse after import');
    assert.strictEqual(Game.getState().player.name, '旅人A');
    assert.strictEqual(Game.getState().player.level, 4);
  } finally {
    ctx.document.getElementById = prevGetById;
    ctx.window.scrollTo = prevScrollTo;
  }
});

test('buildSafeSaveFilename strips path/HTML/control characters and XSS payloads in JSON stay neutralized', () => {
  const fn = Game.buildSafeSaveFilename({ player: { name: '../<script>:\r\n', level: 7 } });
  assert.ok(/^kotodama-save-[^\\/:*?"<>|\x00-\x1f]+-Lv7-\d{8}\.json$/.test(fn), `unsafe filename: ${fn}`);
  assert.ok(!fn.includes('<') && !fn.includes('>') && !fn.includes('/'));

  const s = sanitize({
    player: {
      name: 'A\u0000\n<img src=x>',
      activeTitle: '<svg onload=alert(1)>',
      unlockedTitles: ['<svg onload=alert(1)>', '初醒的旅人']
    }
  });
  assert.strictEqual(s.player.name.includes('\u0000'), false);
  assert.strictEqual(s.player.name.includes('\n'), false);
  assert.strictEqual(s.player.activeTitle, '初醒的旅人');
});

test('uiScale: valid scales preserved, invalid values fall back to "normal", setUiScale updates html attribute', () => {
  assert.strictEqual(def.settings.uiScale, 'normal');
  assert.strictEqual(sanitize({ player: {}, settings: { uiScale: 'compact' } }).settings.uiScale, 'compact');
  assert.strictEqual(sanitize({ player: {}, settings: { uiScale: 'cozy' } }).settings.uiScale, 'cozy');
  assert.strictEqual(sanitize({ player: {}, settings: { uiScale: 'large' } }).settings.uiScale, 'large');
  assert.strictEqual(sanitize({ player: {}, settings: { uiScale: '<script>' } }).settings.uiScale, 'normal');

  const attrs = {};
  const prevDocEl = ctx.document.documentElement;
  ctx.document.documentElement = { setAttribute: (k, v) => { attrs[k] = v; } };
  try {
    assert.strictEqual(Game.setUiScale('compact', { silent: true }), 'compact');
    assert.strictEqual(attrs['data-ui-scale'], 'compact');
    assert.strictEqual(ctx.localStorage.getItem('kotodama_ui_scale'), 'compact');
    assert.strictEqual(Game.setUiScale('invalid_zoom', { silent: true }), 'normal');
    assert.strictEqual(attrs['data-ui-scale'], 'normal');
  } finally {
    ctx.document.documentElement = prevDocEl;
  }
});

test('bug report tool generates safe diagnostics, textContent preview, and valid GitHub Issue URL', () => {
  const diag = Game.collectBugReportDiagnostics();
  assert.ok(diag.includes('版本：v1.6.1'));
  assert.ok(diag.includes('畫面：'));
  assert.ok(diag.includes('設定：'));

  const text = Game.buildBugReportText({ category: '題目 / 日文勘誤', description: '<b>測試</b>' });
  assert.ok(text.includes('類型：題目 / 日文勘誤'));
  assert.ok(text.includes('<b>測試</b>'));

  const url = Game.buildGithubIssueUrl({ category: '功能異常 / 卡住', description: '點了沒反應' });
  assert.ok(url.startsWith('https://github.com/hinayoumiya-0721/kotodama-no-tabi/issues/new?title='));
  assert.ok(url.includes('&body='));

  const mockDiag = {};
  const prevGetById = ctx.document.getElementById;
  ctx.document.getElementById = (id) => (id === 'bug-report-diag' ? mockDiag : null);
  try {
    Game.openBugReportModal();
    assert.ok(typeof mockDiag.textContent === 'string' && mockDiag.textContent.includes('版本：'));
    assert.strictEqual(mockDiag.innerHTML, undefined, 'diagnostics must use textContent, never innerHTML');
  } finally {
    ctx.document.getElementById = prevGetById;
  }
});

test('switchPlayerJob switches character idempotently, preserves HP/MP ratio & rejects unknown jobs', () => {
  const st = Game.getState();
  st.player.jobId = 'swordsman';
  st.player.level = 5;
  st.player.gold = 999;
  st.player.equipment = { weapon: 'wp_wood_blade', armor: null, accessory: null };
  // Set baseline stats for Lv.5 swordsman by bouncing through bard -> swordsman
  assert.strictEqual(Game.switchPlayerJob('invalid_job', { silent: true }), false);
  assert.strictEqual(Game.switchPlayerJob('swordsman', { silent: true }), false);

  assert.strictEqual(Game.switchPlayerJob('bard', { silent: true }), true);
  assert.strictEqual(st.player.jobId, 'bard');
  const bardSnap = {
    maxHp: st.player.maxHp, maxMp: st.player.maxMp,
    baseINT: st.player.baseINT, baseWIS: st.player.baseWIS, baseCHA: st.player.baseCHA
  };

  // Set HP to half before switching so we verify ratio is preserved (no free full-heal exploit)
  const totalBefore = Game.getTotalStats();
  st.player.hp = Math.floor(totalBefore.maxHp / 2);

  assert.strictEqual(Game.switchPlayerJob('scholar', { silent: true }), true);
  assert.strictEqual(st.player.jobId, 'scholar');
  assert.strictEqual(st.player.level, 5);
  assert.strictEqual(st.player.gold, 999);
  assert.strictEqual(st.player.equipment.weapon, 'wp_wood_blade');
  const totalAfter = Game.getTotalStats();
  assert.ok(st.player.hp <= Math.ceil(totalAfter.maxHp * 0.55) && st.player.hp >= Math.floor(totalAfter.maxHp * 0.45), 'HP ratio preserved');

  // Switching back to bard reproduces identical base stats (idempotent)
  assert.strictEqual(Game.switchPlayerJob('bard', { silent: true }), true);
  same({
    maxHp: st.player.maxHp, maxMp: st.player.maxMp,
    baseINT: st.player.baseINT, baseWIS: st.player.baseWIS, baseCHA: st.player.baseCHA
  }, bardSnap);
});

test('drill: pool filters by JLPT/type/wrong-only; wrong answers go to notes; fixed rounds end', () => {
  const st = Game.getState();
  const all = Game.buildDrillPool({ jlpt: 'all', type: 'all', source: 'all' });
  assert.strictEqual(all.length, 720);
  const n4 = Game.buildDrillPool({ jlpt: 'N4', type: 'all', source: 'all' });
  assert.ok(n4.length > 0 && n4.length < 720);
  const reading = Game.buildDrillPool({ jlpt: 'all', type: 'reading', source: 'all' });
  assert.ok(reading.length > 0 && reading.length < 720);

  st.wrongNotes = {};
  assert.strictEqual(Game.buildDrillPool({ source: 'wrong' }).length, 0);
  assert.strictEqual(Game.startDrill({ source: 'wrong' }), false);

  assert.strictEqual(Game.startDrill({ source: 'all', jlpt: 'N4', type: 'all', count: 10, autoNext: false }), true);
  const d = Game.getDrillState();
  assert.strictEqual(d.total, 10);
  const q = d.current;
  const wrongIdx = q.type === 'reorder' ? null : (q.answerIndex + 1) % q.options.length;
  const wrongBefore = st.stats.totalWrong;
  assert.strictEqual(Game.answerDrill(q.type === 'reorder' ? 'x' : wrongIdx), false);
  assert.strictEqual(Game.answerDrill(0), null, 'cannot answer twice');
  assert.strictEqual(st.stats.totalWrong, wrongBefore + 1);
  assert.ok(st.wrongNotes[q.id], 'wrong answer recorded in notes');
  same(Game.buildDrillPool({ source: 'wrong' }), [q.id]);

  for (let i = 1; i < 10; i++) {
    Game.nextDrillQuestion();
    const cq = d.current;
    Game.answerDrill(cq.type === 'reorder' ? cq.correctOrderPlain : cq.answerIndex);
  }
  assert.strictEqual(d.active, true);
  Game.nextDrillQuestion();
  assert.strictEqual(d.active, false);
  assert.strictEqual(d.finished, true);
  assert.strictEqual(d.results.length, 10);
  assert.strictEqual(d.results.filter((r) => r.correct).length, 9);

  // Retry only the wrong ones
  assert.strictEqual(Game.startDrill(d.config, [q.id]), true);
  assert.strictEqual(d.total, 1);
  assert.strictEqual(d.current.id, q.id);
  Game.finishDrill();
});

test('PWA: sw.js precache list matches the game files (run tools/gen-sw-precache.js if this fails)', () => {
  const { buildPrecache } = require(path.join(ROOT, 'tools', 'gen-sw-precache.js'));
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const m = sw.match(/const PRECACHE = (\[[\s\S]*?\]);/);
  assert.ok(m, 'PRECACHE block found in sw.js');
  const listed = JSON.parse(m[1]);
  const expected = buildPrecache().files;
  assert.deepStrictEqual(listed, expected);
  ['./', 'index.html', 'game.js', 'data.js', 'manifest.webmanifest', 'assets/app/icon-192.png', 'data/questions/r1.js']
    .forEach((f) => assert.ok(listed.includes(f), `${f} is precached`));
  assert.ok(!listed.some((f) => /^(tests|tools)\/|\.md$|_source|preview\.html$/.test(f)), 'no dev-only files');
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.webmanifest'), 'utf8'));
  manifest.icons.forEach((icon) => assert.ok(fs.existsSync(path.join(ROOT, icon.src)), `${icon.src} exists`));
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
