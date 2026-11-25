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
  for (const file of ['data.js', 'game.js']) {
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
  const s = sanitize(JSON.parse('{"player":{"enhancements":{"__proto__":{"x":1},"w1":3}},"wrongNotes":{"__proto__":{"id":"__proto__"}}}'));
  same(Object.keys(s.player.enhancements), ['w1']);
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

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
