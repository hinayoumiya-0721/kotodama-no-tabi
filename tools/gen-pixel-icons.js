#!/usr/bin/env node
/*
 * Pixel icon generator for 《言霊の旅》.
 * Source of truth for assets/icons/*.svg — edit the grids here, then run:
 *
 *   node tools/gen-pixel-icons.js
 *
 * Style rules (match the hand-drawn portraits in assets/portraits/):
 *   - 16x16 grid, 1px near-black outline (k), light from the top-left
 *   - 3-tone shading per material: light / base / shadow (+ w for a sparkle highlight)
 *   - no dithering, no anti-aliasing (SVG uses shape-rendering="crispEdges")
 *
 * Grid legend: '.' = transparent; every other char must exist in the icon's palette
 * (merged over SHARED). Rows must be exactly 16 chars and there must be 16 rows.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.resolve(__dirname, '..', 'assets', 'icons');

const SHARED = {
  k: '#1a1018', // outline (same near-black as the portraits)
  w: '#fff6e0', // specular highlight
  s: '#8a6a52', // generic warm shadow (wood / leather)
  m: '#c79a6b', // wood / leather base
  M: '#e8c49a'  // wood / leather light
};

// Material ramps reused across icons
const GOLD = { Y: '#ffe58a', y: '#f2b632', o: '#c47a16', d: '#7a4410' };
const RED = { R: '#ff7a6b', r: '#e03b3b', d: '#9c1f2e' };
const BLUE = { B: '#9fdcff', b: '#3fa9f5', n: '#1f5fa5' };
const STEEL = { G: '#eef2f8', g: '#a9b4c6', a: '#5d6680' };
const PURPLE = { V: '#e6d2ff', v: '#b48cff', p: '#6e45c9' };
const GREEN = { L: '#b8f08a', l: '#5ec269', e: '#2c7a3a' };
const TEAL = { C: '#c2fff2', c: '#3fd6b4', t: '#1a8a7a' };
const CREAM = { P: '#fffaf0', q: '#f1e2bf', Q: '#c9ac78' };
const SKIN = { F: '#ffd9b3', f: '#f0b583', h: '#c47d55' };
const CRIMSON = { X: '#ff9a8a', x: '#d8433a', z: '#8c1f28' };

const ICONS = {
  // ---------------------------------------------------------------- UI / stats
  coin: {
    label: '金幣', replaces: '🪙', palette: GOLD,
    grid: [
      '................',
      '.....kkkkkk.....',
      '...kkYYYyyykk...',
      '..kYYyyyyyyyok..',
      '..kYyyyyyyyyok..',
      '.kYyykkkkkkyyok.',
      '.kYyyk....kyyok.',
      '.kyyyk....kyyok.',
      '.kyyyk....kyook.',
      '.kyyyk....kyook.',
      '.kyyykkkkkkyook.',
      '..kyyyyyyyyook..',
      '..kyoyyyyyoook..',
      '...kkoooooodk...',
      '.....kkkkkk.....',
      '................'
    ]
  },
  heart: {
    label: 'HP', replaces: '♥ ❤️', palette: RED,
    grid: [
      '................',
      '................',
      '..kkkk....kkkk..',
      '.kRRrrk..kRrrrk.',
      'kRwRrrrkkRrrrrdk',
      'kRRrrrrrrrrrrrdk',
      'krrrrrrrrrrrrrdk',
      'krrrrrrrrrrrrddk',
      '.krrrrrrrrrrddk.',
      '..krrrrrrrrddk..',
      '...krrrrrrddk...',
      '....krrrrddk....',
      '.....krrddk.....',
      '......kddk......',
      '.......kk.......',
      '................'
    ]
  },
  mana: {
    label: 'MP', replaces: '💧', palette: BLUE,
    grid: [
      '................',
      '.......kk.......',
      '......kBbk......',
      '......kBbk......',
      '.....kBbbbk.....',
      '.....kBbbbk.....',
      '....kBbbbbbk....',
      '...kBwbbbbbbk...',
      '...kBwbbbbbnk...',
      '..kBbbbbbbbbnk..',
      '..kBbbbbbbbbnk..',
      '..kbbbbbbbbnnk..',
      '...kbbbbbbnnk...',
      '....knnnnnnk....',
      '.....kkkkkk.....',
      '................'
    ]
  },
  star: {
    label: 'EXP', replaces: '⭐', palette: GOLD,
    grid: [
      '................',
      '.......kk.......',
      '......kYyk......',
      '......kYyk......',
      '.....kYyyyk.....',
      'kkkkkkYyyyykkkkk',
      'kYYYYYyyyyyyyyok',
      '.kYyyyyyyyyyyok.',
      '..kyyyyyyyyyok..',
      '...kyyyyyyyok...',
      '...kyyyyyyyyk...',
      '..kyyyokkyyyok..',
      '..kyyok..kyyok..',
      '.kyok......kook.',
      '.kkk........kkk.',
      '................'
    ]
  },
  sparkle: {
    label: 'SP・技能', replaces: '✨', palette: PURPLE,
    grid: [
      '................',
      '.....k..........',
      '....kVk.........',
      '....kVk.........',
      '...kVvvk........',
      'kkkVvvvvkkk.....',
      'kVVvvwvvvvpk....',
      '.kkkpvvvpkk.....',
      '...kpvvpk...k...',
      '....kpvk...kVk..',
      '....kpk...kVvvk.',
      '.....k...kVvwvvk',
      '..........kpvpk.',
      '...........kpk..',
      '............k...',
      '................'
    ]
  },
  gear: {
    label: '設定', replaces: '⚙', palette: STEEL,
    grid: [
      '................',
      '......kkkk......',
      '..kk..kGGk..kk..',
      '.kGGkkkGgkkkgak.',
      '.kGGGggggggggak.',
      '..kGggkkkkggak..',
      '.kkGgk....kgakk.',
      'kGGggk....kgaaak',
      'kGgggk....kaaaak',
      '.kkggk....kaakk.',
      '..kggakkkkaaak..',
      '.kggaaaaaaaaaak.',
      '.kgakkkaakkkaak.',
      '..kk..kaak..kk..',
      '......kkkk......',
      '................'
    ]
  },
  save: {
    label: '存檔（記憶水晶）', replaces: '💾', palette: TEAL,
    grid: [
      '................',
      '.......kk.......',
      '......kCck......',
      '.....kCwcck.....',
      '....kCCccctk....',
      '...kCCcccccctk..',
      '..kCCcccccccttk.',
      '.kCCcccccccctttk',
      '.kCccccccccctttk',
      '..kcccccccctttk.',
      '...kccccccctttk.',
      '....kccccctttk..',
      '.....kcccttk....',
      '......kcttk.....',
      '.......kk.......',
      '................'
    ]
  },
  music: {
    label: 'BGM', replaces: '🎵', palette: Object.assign({}, PURPLE),
    grid: [
      '................',
      '.......kkkkkkk..',
      '.......kVVvvvpk.',
      '.......kVkkkkpk.',
      '.......kVk..kpk.',
      '.......kVk..kpk.',
      '.......kvk..kpk.',
      '.......kvk..kpk.',
      '...kkkkkvk..kpk.',
      '..kVVvvvvkkkkpk.',
      '.kVwvvvvpkVvvpk.',
      '.kVvvvvvpkvvvpk.',
      '.kvvvvvppkkvpkk.',
      '..kppppppk.kk...',
      '...kkkkkk.......',
      '................'
    ]
  },
  speaker: {
    label: '音效・朗讀', replaces: '🔊', palette: Object.assign({}, STEEL, BLUE),
    grid: [
      '................',
      '................',
      '......kk...b....',
      '.....kGk....b...',
      '....kGgk.....b..',
      'kkkkGggk.b...b..',
      'kGGGgggk..b..b..',
      'kGggggak..b..b..',
      'kgggggak..b..b..',
      'kaaaaaak..b..b..',
      'kkkkaaak.b...b..',
      '....kaak.....b..',
      '.....kak....b...',
      '......kk...b....',
      '................',
      '................'
    ]
  },
  eye: {
    label: '偷看中譯', replaces: '👁', palette: Object.assign({}, CREAM, BLUE),
    grid: [
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkPPPPqqkk...',
      '..kPPPkkkkqqQk..',
      '.kPPPkBbbnkqqQk.',
      'kPPPPkBwbnkqqQQk',
      'kPPPPkBbbnkqqQQk',
      '.kPPqkbbnnkqQQk.',
      '..kqqqkkkkqQQk..',
      '...kkqqqqQQkk...',
      '.....kkkkkk.....',
      '................',
      '................',
      '................'
    ]
  },
  lock: {
    label: '未解鎖', replaces: '🔒', palette: Object.assign({}, GOLD, STEEL),
    grid: [
      '................',
      '.....kkkkkk.....',
      '....kGGggaak....',
      '...kGkkkkkkak...',
      '...kGk....kak...',
      '...kgk....kak...',
      '..kkkkkkkkkkkk..',
      '..kYYYYyyyyyok..',
      '..kYyyyyyyyyok..',
      '..kYyyyyyyyyok..',
      '..kyyyykkyyyok..',
      '..kyyyykkyyook..',
      '..kyyyyyyyyook..',
      '..kooooooooodk..',
      '..kkkkkkkkkkkk..',
      '................'
    ]
  },
  check: {
    label: '完成', replaces: '✅ ✔', palette: GREEN,
    grid: [
      '................',
      '................',
      '............kk..',
      '...........kLlk.',
      '..........kLlek.',
      '.........kLlek..',
      '.kk.....kLlek...',
      'kLlk...kLlek....',
      'klllk.kLlek.....',
      '.kelllLlek......',
      '..kelllek.......',
      '...keeek........',
      '....kek.........',
      '.....k..........',
      '................',
      '................'
    ]
  },
  turtle: {
    label: '慢速朗讀', replaces: '🐢', palette: Object.assign({}, GREEN, { T: '#e8c49a', u: '#a8743f' }),
    grid: [
      '................',
      '................',
      '................',
      '.....kkkkkk.....',
      '...kkLLlllekk...',
      '..kLLkllkllek...',
      '.kLlkllllkllek..',
      '.kllkllllkleekkk',
      'kllllkkkkllekTTk',
      'keeeeeeeeeeekTuk',
      '.kkTkkkkkkTkkkk.',
      '..kTuk...kTuk...',
      '..kkkk...kkkk...',
      '................',
      '................',
      '................'
    ]
  },

  // ---------------------------------------------------------- places / navigation
  house: {
    label: '城鎮', replaces: '🏛️ 🏠', palette: Object.assign({}, CRIMSON, CREAM, BLUE),
    grid: [
      '................',
      '.......kk.......',
      '......kXxk......',
      '.....kXxxxk.....',
      '....kXxxxxxk....',
      '...kXxxxxxxxk...',
      '..kXxxxxxxxxzk..',
      '.kkkkkkkkkkkkkk.',
      '..kPPPPqqqqqQk..',
      '..kPkkkqqkkkQk..',
      '..kPkMkqqkBkQk..',
      '..kPkskqqkkkQk..',
      '..kPkMkqqqqqQk..',
      '..kPkskqqqqqQk..',
      '..kkkkkkkkkkkk..',
      '................'
    ]
  },
  map: {
    label: '世界地圖', replaces: '🗺️', palette: Object.assign({}, CREAM, { j: '#5ec269', J: '#2c7a3a', i: '#3fa9f5', x: '#e03b3b' }),
    grid: [
      '................',
      '................',
      '.kkkkk.kkkk.kkk.',
      'kPPqqkkqqqqkkqqk',
      'kPjjqkqqiiqkqqQk',
      'kPjJqkqiiqqkqxQk',
      'kPqqqkqiqqqkxqQk',
      'kPqqqkqqqjjkqxQk',
      'kPqiiiiqqjJkqqQk',
      'kPqqqkqqqqqkqqQk',
      'kPqqjkqxqqqkjjQk',
      'kPqjJkxqxqqkjJQk',
      'kqqqqkqxqqqkqqQk',
      'kQQQQkkQQQQkkQQk',
      '.kkkkk.kkkk.kkk.',
      '................'
    ]
  },
  book: {
    label: '修練・錯題筆記', replaces: '📓 📖', palette: Object.assign({}, BLUE, CREAM),
    grid: [
      '................',
      '................',
      '................',
      '.kkkk......kkkk.',
      'kPPPPkk..kkqqqqk',
      'kPQQPPPkkqqqQQqk',
      'kPPPPPPkkqqqqqqk',
      'kPQQQQPkkqQQQQqk',
      'kPPPPPPkkqqqqqqk',
      'kPQQQQPkkqQQQQqk',
      'kPPPPPPkkqqqqqqk',
      'kPPPPkkkkkkqqqqk',
      'kBBkkbbkkbbkknnk',
      '.kkbbbbkkbbbbkk.',
      '...kkkk..kkkk...',
      '................'
    ]
  },
  person: {
    // Adventurer: wide-brim travel hat, red scarf, green cape, sword hilt over the shoulder
    label: '旅人・角色', replaces: '⚔️ 角色', palette: Object.assign({}, SKIN, BLUE, CRIMSON, GREEN, STEEL, GOLD),
    grid: [
      '............kk..',
      '....kkkkk..kYk..',
      '...kMMMmmk.kYk..',
      '..kMMmmmmmkkak..',
      'kkMMmmmmmmmsskk.',
      '.kkkkkkkkkkkkk..',
      '...kFFkFFkFfk...',
      '...kFFFFFFFfk...',
      '..kXXXxxxxxxzk..',
      '.kLkXxkbbbkxzLk.',
      'kLlkBbbbbbbbnklk',
      'kLlkBbkmmmkbnklk',
      'kllkBbbbbbbbnkek',
      '.kkkbbbknnnnkkk.',
      '...kssk..kssk...',
      '...kkkk..kkkk...'
    ]
  },
  scroll: {
    label: '任務・卷軸', replaces: '📜', palette: Object.assign({}, CREAM, RED),
    grid: [
      '................',
      '..kkkkkkkkkkk...',
      '.kMMMMMMMMMMsk..',
      '.kMkkkkkkkkksk..',
      '..kPPPPPqqqqk...',
      '..kPkkkkkqqqk...',
      '..kPPPPPqqqqk...',
      '..kPkkkkkkqqk...',
      '..kPPPPqqqqqk...',
      '..kPkkkkqqqqk...',
      '..kPPPPqqqrRk...',
      '..kPPqqqqqrrk...',
      '.kkkkkkkkkkkkk..',
      '.kMMMMMMMMMMsk..',
      '..kkkkkkkkkkk...',
      '................'
    ]
  },
  torii: {
    label: '試煉神殿', replaces: '⛩️', palette: CRIMSON,
    grid: [
      '................',
      '................',
      'kkkkkkkkkkkkkkkk',
      'kXXXXXXXXXXXxxxk',
      '.kkkkkkkkkkkkkk.',
      '..kxk..kk..kxk..',
      'kkkkkkkkkkkkkkkk',
      'kxxxxxxxxxxxxzzk',
      'kkkkkkkkkkkkkkkk',
      '..kXxk....kXxk..',
      '..kXxk....kXxk..',
      '..kXxk....kXxk..',
      '..kxzk....kxzk..',
      '..kxzk....kxzk..',
      '.kkkkkk..kkkkkk.',
      '................'
    ]
  },
  chest: {
    label: '寶箱', replaces: '🎁', palette: Object.assign({}, GOLD),
    grid: [
      '................',
      '................',
      '...kkkkkkkkkk...',
      '..kMMMMMMMMMMk..',
      '.kMMkMMMMMMkssk.',
      '.kmmkmmmmmmksmk.',
      '.kkkkkkkkkkkkkk.',
      '.kYyykkkkkkyyok.',
      '.kmmmkYyykkmmsk.',
      '.kmmmkyyokkmmsk.',
      '.kmmmkkkkkkmmsk.',
      '.kmmmmmmmmmmmsk.',
      '.kYyymmmmmmyyok.',
      '.kssssssssssssk.',
      '..kkkkkkkkkkkk..',
      '................'
    ]
  },
  campfire: {
    label: '營火', replaces: '🔥', palette: { Y: '#ffe58a', y: '#ffb02e', r: '#e8543c', d: '#8c2a20' },
    grid: [
      '................',
      '.......k........',
      '......kyk.......',
      '.....kyrk..k....',
      '....kyrrk.kyk...',
      '...kyrrYrkyrk...',
      '...kyrYYyrrrk...',
      '..kyrYYwYyrrdk..',
      '..kyrYYYYyrrdk..',
      '..kyrrYYyyrddk..',
      '...kyrrrrrddk...',
      '.kkkkkkkkkkkkkk.',
      'kMMMmmkkkkmmmssk',
      '.kkssskkkksssks.',
      '..kkkk....kkkk..',
      '................'
    ]
  },
  skull: {
    label: '首領', replaces: '💀 👹', palette: Object.assign({}, CREAM),
    grid: [
      '................',
      '....kkkkkkkk....',
      '...kPPPPPqqqk...',
      '..kPPPPPPqqqQk..',
      '..kPPPPPqqqqQk..',
      '..kPkkkPqkkkQk..',
      '..kPk.kqqk.kQk..',
      '..kPkkkqqkkkQk..',
      '..kPPPqkkqqQQk..',
      '...kPqqkkqqQk...',
      '....kqkqkqkk....',
      '....kqkqkqQk....',
      '.....kkkkkk.....',
      '................',
      '................',
      '................'
    ]
  },

  // ---------------------------------------------------------------------- items
  sword: {
    label: '刀劍・冒險', replaces: '⚔️ (sword)', palette: Object.assign({}, STEEL, GOLD, { H: '#4a3a78' }),
    grid: [
      '.............kk.',
      '............kGak',
      '...........kGgak',
      '..........kGgak.',
      '.........kGgak..',
      '........kGgak...',
      '.......kGgak....',
      '......kGgak.....',
      '..kk.kGgak......',
      '..kYkkgak.......',
      '...kYyok........',
      '...kkyok........',
      '..kHkkoyk.......',
      '.kHHk..kk.......',
      'kHHk............',
      '.kk.............'
    ]
  },
  staff: {
    label: '筆・杖', replaces: '(staff)', palette: Object.assign({}, PURPLE),
    grid: [
      '..........kkk...',
      '.........kVvvk..',
      '........kVwvvpk.',
      '........kVvvvpk.',
      '.........kvppk..',
      '.........kMsk...',
      '........kMsk....',
      '.......kMsk.....',
      '......kMsk......',
      '.....kMsk.......',
      '....kMsk........',
      '...kMsk.........',
      '..kMsk..........',
      '.kMsk...........',
      '.kkk............',
      '................'
    ]
  },
  lute: {
    label: '三味線・琵琶', replaces: '(lute)', palette: Object.assign({}, { W: '#f6d9a8' }),
    grid: [
      '............kk..',
      '...........kMsk.',
      '..........kMsk..',
      '.........kMsk...',
      '........kMsk....',
      '.......kMsk.....',
      '...kkkkMsk......',
      '..kWWWWMkk......',
      '.kWWWkWWWsk.....',
      '.kWWkkkWWsk.....',
      '.kWWWkWWWsk.....',
      '.kWWWWWWssk.....',
      '..kWWWWsssk.....',
      '...kssssskk.....',
      '....kkkkk.......',
      '................'
    ]
  },
  cloak: {
    label: '斗篷・羽織', replaces: '(cloak)', palette: Object.assign({}, { A: '#7fb6e8', a: '#3f78c0', z: '#22467a' }, GOLD),
    grid: [
      '................',
      '....kkk..kkk....',
      '...kAAAkkaaak...',
      '..kAAAkYokaaak..',
      '..kAAakkkkaazk..',
      '.kAAaak..kaazzk.',
      '.kAaaak..kaazzk.',
      '.kAaaak..kaazzk.',
      'kAAaaak..kaaazzk',
      'kAaaaak..kaaazzk',
      'kAaaaak..kaaazzk',
      'kaaaaak..kaaazzk',
      'kaaaazk..kaazzzk',
      'kzzzzzk..kzzzzzk',
      '.kkkkk....kkkkk.',
      '................'
    ]
  },
  armor: {
    label: '鎧甲・外套', replaces: '🛡', palette: Object.assign({}, STEEL, GOLD),
    grid: [
      '................',
      '..kkkk....kkkk..',
      '.kGGGgkkkkggaak.',
      '.kGGgggYYggggak.',
      '..kGggkkkkggak..',
      '..kGgggggggggk..',
      '..kGggYYyyggak..',
      '..kGggYkkyggak..',
      '..kGggyyyoggak..',
      '..kGgggggggaak..',
      '..kgggkkkkgaak..',
      '..kgggaaaaaaak..',
      '...kggaaaaaak...',
      '....kkaaaakk....',
      '......kkkk......',
      '................'
    ]
  },
  robe: {
    label: '法衣・禮服', replaces: '(robe)', palette: Object.assign({}, PURPLE, CREAM, GOLD),
    grid: [
      '................',
      '................',
      '....kkk..kkk....',
      '...kVVvkkvvpk...',
      'kkkVVvvPPvvvpkkk',
      'kVVVvvvkPvvvpppk',
      'kVvvvvvkPvvvvppk',
      'kVvvvvvkPvvvvppk',
      'kkkkvvvkPvvvkkkk',
      '...kvvvkPvvvk...',
      '...kvvvkPvvvk...',
      '...kYYYYYYyok...',
      '...kvvvkPvvpk...',
      '...kvvvkPvppk...',
      '...kkkkkkkkkk...',
      '................'
    ]
  },
  amulet: {
    label: '玉佩・御守', replaces: '(amulet)', palette: Object.assign({}, GOLD, GREEN),
    grid: [
      '....kkkkkkkk....',
      '...kYk....kok...',
      '..kYk......kok..',
      '..kyk......kok..',
      '...kyk....kok...',
      '....kykkkkok....',
      '.....kYyyok.....',
      '....kkkkkkkk....',
      '...kLLLLllllk...',
      '..kLLwlllllllek.',
      '..kLllllllllek..',
      '..kLlllkklllek..',
      '...kllllllleek..',
      '....kellleeek...',
      '.....kkkkkkk....',
      '................'
    ]
  },
  ring: {
    label: '戒指・單片鏡', replaces: '💍', palette: Object.assign({}, GOLD, BLUE),
    grid: [
      '................',
      '......kkkk......',
      '.....kBwbnk.....',
      '.....kBbbnk.....',
      '......kkkk......',
      '.....kYyyok.....',
      '...kkYk..kokk...',
      '..kYYk....kook..',
      '..kYk......kok..',
      '..kyk......kok..',
      '..kyk......kok..',
      '..kyok....kodk..',
      '...kook..kodk...',
      '....kkooookk....',
      '......kkkk......',
      '................'
    ]
  },
  fan: {
    label: '摺扇・御守', replaces: '(talisman)', palette: Object.assign({}, CRIMSON, CREAM),
    grid: [
      '................',
      '................',
      '...kkkkkkkkkk...',
      '..kPXPXPXPXPXk..',
      '.kPXPXPXPXPXPxk.',
      'kPXPXPXPXPXPxxzk',
      'kkPXPXPXPXPxxzkk',
      '.kkPXPXPXPxxzkk.',
      '...kkPXPXxzkk...',
      '.....kkPxzk.....',
      '.......kMk......',
      '.......kMk......',
      '.......ksk......',
      '.......kkk......',
      '................',
      '................'
    ]
  },
  herb: {
    label: '回復藥草', replaces: '🌿 🧪', palette: GREEN,
    grid: [
      '................',
      '.........kk.....',
      '........kLlk....',
      '..kk....kLlek...',
      '.kLlk..kLLlek...',
      '.kLllk.kLllek...',
      '..kLllkkllek....',
      '...klllklek..kk.',
      '....keellkk.kLlk',
      '.....kelek.kLllk',
      '.....kekelkLllk.',
      '......kekelllk..',
      '......kekeekk...',
      '.......kek......',
      '.......kk.......',
      '................'
    ]
  },
  elixir: {
    label: '靈水・藥瓶', replaces: '🧪 (elixir)', palette: Object.assign({}, BLUE, STEEL),
    grid: [
      '................',
      '......kkkk......',
      '......kMsk......',
      '......kkkk......',
      '......kGak......',
      '......kGak......',
      '.....kGgaak.....',
      '....kGBbbnak....',
      '...kGBwbbbnak...',
      '...kGBbbbbnak...',
      '...kGbbbbbnak...',
      '...kgbbbbnnak...',
      '....kannnnak....',
      '.....kkkkkk.....',
      '................',
      '................'
    ]
  },
  charm: {
    label: '護符', replaces: '(charm / scroll)', palette: Object.assign({}, CREAM, RED),
    grid: [
      '................',
      '.....kkkkkk.....',
      '.....kPPPqk.....',
      '.....kPrrqk.....',
      '.....kPrRqk.....',
      '.....kPrrqk.....',
      '.....kPPPqk.....',
      '.....kPkkqk.....',
      '.....kPPPqk.....',
      '.....kPkkqk.....',
      '.....kPPPqk.....',
      '.....kPrrqk.....',
      '.....kqqqQk.....',
      '.....kkkkkk.....',
      '......k..k......',
      '.....k....k.....'
    ]
  }
};

// ---------------------------------------------------------------- validation
function validate(name, icon) {
  const errors = [];
  const palette = Object.assign({}, SHARED, icon.palette);
  if (icon.grid.length !== 16) errors.push(`${icon.grid.length} rows (need 16)`);
  icon.grid.forEach((row, y) => {
    if (row.length !== 16) errors.push(`row ${y} has ${row.length} chars: "${row}"`);
    [...row].forEach((ch, x) => {
      if (ch !== '.' && !palette[ch]) errors.push(`row ${y} col ${x}: unknown color '${ch}'`);
    });
  });
  if (errors.length) throw new Error(`[${name}]\n  ${errors.join('\n  ')}`);
  return palette;
}

// One <path> per color; horizontal runs merged into rectangles.
function toSvg(name, icon, palette) {
  const byColor = {};
  icon.grid.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.') { x += 1; continue; }
      let len = 1;
      while (x + len < row.length && row[x + len] === ch) len += 1;
      (byColor[palette[ch]] = byColor[palette[ch]] || []).push(`M${x} ${y}h${len}v1h-${len}z`);
      x += len;
    }
  });
  const paths = Object.entries(byColor).map(([fill, d]) => `<path fill="${fill}" d="${d.join('')}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges" data-icon="${name}">${paths}</svg>\n`;
}

function buildPreview(entries) {
  const cell = ([name, icon]) => `
      <figure class="cell">
        <div class="sizes">
          <img src="${name}.svg" width="16" height="16" alt="">
          <img src="${name}.svg" width="32" height="32" alt="">
          <img src="${name}.svg" width="64" height="64" alt="${name}">
        </div>
        <figcaption><b>${name}</b><span>${icon.label}</span><span class="was">取代：${icon.replaces}</span></figcaption>
      </figure>`;
  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>言霊の旅・像素圖示預覽</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 24px 16px 48px; background: #141230; color: #f4ecd0; font-family: "Yu Gothic UI", "Microsoft JhengHei", sans-serif; }
  h1 { margin: 0 0 4px; font-size: 1.3rem; }
  p.note { margin: 0 0 20px; color: #b3acd2; font-size: .9rem; }
  .portraits { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; align-items: flex-end; }
  .portraits img { width: 96px; height: 96px; image-rendering: pixelated; background: #24457d; border: 3px solid #1a1018; }
  .bg-toggle { margin-bottom: 16px; display: flex; gap: 8px; flex-wrap: wrap; }
  .bg-toggle button { font: inherit; padding: 6px 12px; background: #332c70; color: #f4ecd0; border: 2px solid #1a1018; cursor: pointer; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; }
  .cell { margin: 0; padding: 12px; background: #1d1a45; border: 2px solid #4a3f8f; }
  body.teal .cell { background: #1d5753; border-color: #2a7470; }
  body.light .cell { background: #f4ecd0; border-color: #c9bf9c; color: #1a1018; }
  .sizes { display: flex; align-items: flex-end; gap: 12px; min-height: 68px; }
  .sizes img { image-rendering: pixelated; }
  figcaption { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; font-size: .85rem; }
  figcaption .was { color: #b3acd2; font-size: .78rem; }
  body.light figcaption .was { color: #6b5f88; }
</style>
</head>
<body>
  <h1>像素圖示預覽（${entries.length} 個，16×16）</h1>
  <p class="note">每個圖示依序顯示 1×、2×、4×。上方為現有立繪頭像，用來比對畫風。原始格子定義在 tools/gen-pixel-icons.js。</p>
  <div class="portraits">
    <img src="../portraits/hero_swordsman.webp" alt="">
    <img src="../portraits/npc_mayor.webp" alt="">
    <img src="../portraits/npc_merchant.webp" alt="">
    <img src="../portraits/npc_priest.webp" alt="">
  </div>
  <div class="bg-toggle">
    <button type="button" onclick="document.body.className=''">夜空底</button>
    <button type="button" onclick="document.body.className='teal'">城鎮青綠底</button>
    <button type="button" onclick="document.body.className='light'">米色對話框底</button>
  </div>
  <div class="grid">${entries.map(cell).join('')}
  </div>
</body>
</html>
`;
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const entries = Object.entries(ICONS);
  const problems = [];
  entries.forEach(([name, icon]) => {
    try {
      const palette = validate(name, icon);
      fs.writeFileSync(path.join(OUT_DIR, `${name}.svg`), toSvg(name, icon, palette));
    } catch (err) {
      problems.push(err.message);
    }
  });
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  fs.writeFileSync(path.join(OUT_DIR, 'preview.html'), buildPreview(entries));
  console.log(`wrote ${entries.length} icons + preview.html to ${path.relative(process.cwd(), OUT_DIR)}`);
}

main();
