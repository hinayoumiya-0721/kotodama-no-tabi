/**
 * 《言霊の旅（ことだまのたび）》 — Core JRPG & Japanese Learning Engine
 * Zero-dependency Vanilla ES6+ on `window.Game` (safe for file:// execution).
 * Integrates strictly with index.html DOM IDs, style.css, window.GAME_DATA,
 * window.AudioEngine, and window.SVGArt.
 */
(function (global) {
  'use strict';

  // ============================================================================
  // 1. Constants & Storage Keys
  // ============================================================================
  const SAVE_VERSION = 1;
  const SAVE_KEYS = {
    auto: 'kotodama_save_auto',
    slot1: 'kotodama_save_slot_1',
    slot2: 'kotodama_save_slot_2',
    slot3: 'kotodama_save_slot_3'
  };
  const SAVE_SLOT_LIST = [
    { key: SAVE_KEYS.auto, label: '自動存檔（Auto Save）', isAuto: true },
    { key: SAVE_KEYS.slot1, label: '存檔欄位 1', isAuto: false },
    { key: SAVE_KEYS.slot2, label: '存檔欄位 2', isAuto: false },
    { key: SAVE_KEYS.slot3, label: '存檔欄位 3', isAuto: false }
  ];

  const QUESTION_TYPE_LABELS = {
    reading: '漢字讀音',
    particle: '助詞辨析',
    conjugation: '動詞活用',
    reorder: '句子重組',
    unnatural: '找出不自然表達',
    vocab: '單字',
    grammar: '文法',
    kanji: '漢字讀音',
    listening: '聽力'
  };

  const JLPT_LEVELS = ['N4', 'N3', 'N2', 'N1'];
  const DIFFICULTY_MODES = [
    {
      id: 'adaptive',
      label: '動態自適應（推薦）',
      shortLabel: '⚡ 自適應 (N4-N1)',
      tag: '推薦',
      targetJlpt: null,
      desc: '依連勝與答題速度即時升降（N4 ↔ N3 ↔ N2 ↔ N1），最低不低於 N4。'
    },
    {
      id: 'fixed_n4',
      label: 'N4 基礎鞏固（固定）',
      shortLabel: '🌿 固定 N4',
      tag: '100% N4',
      targetJlpt: 'N4',
      desc: '全地圖與戰鬥 100% 僅抽取 N4 題目，穩固基礎文法與動詞變化。'
    },
    {
      id: 'fixed_n3',
      label: 'N3 實戰特訓（固定）',
      shortLabel: '⚔️ 固定 N3',
      tag: '100% N3',
      targetJlpt: 'N3',
      desc: '全地圖與戰鬥 100% 僅抽取 N3 題目，高強度模擬檢定實戰。'
    },
    {
      id: 'fixed_n2',
      label: 'N2 進階試煉（固定）',
      shortLabel: '🔮 固定 N2',
      tag: '100% N2',
      targetJlpt: 'N2',
      desc: '全地圖與戰鬥 100% 僅抽取 N2 題目，專攻敬語、接續詞與新聞書面語。'
    },
    {
      id: 'fixed_n1',
      label: 'N1 魔境挑戰（固定）',
      shortLabel: '🔥 N1 魔境 ×2',
      tag: 'EXP/掉落 ×2',
      targetJlpt: 'N1',
      desc: '全地圖與戰鬥 100% 僅抽取 N1 題目，勝利享雙倍經驗值與掉落率加成！'
    }
  ];

  function getDifficultyModeConfig(modeId) {
    return DIFFICULTY_MODES.find((m) => m.id === modeId) || DIFFICULTY_MODES[0];
  }

  function normalizeJlptLevel(rawJlpt, fallbackRegionId) {
    const s = String(rawJlpt || '').toUpperCase();
    if (s === 'N4' || s === 'N3' || s === 'N2' || s === 'N1') return s;
    const m = s.match(/N([1-4])/);
    if (m) return `N${m[1]}`;
    const regionDefaults = { r1: 'N4', r2: 'N4', r3: 'N3', r4: 'N3', r5: 'N2', r6: 'N1' };
    return regionDefaults[fallbackRegionId] || 'N4';
  }

  function getAdaptiveRegionFloorIdx(regionId) {
    const floors = { r1: 0, r2: 0, r3: 0, r4: 1, r5: 1, r6: 2 };
    return floors[regionId] !== undefined ? floors[regionId] : 0;
  }

  const RARITY_LABELS = {
    common: '普通',
    uncommon: '精良',
    rare: '稀有',
    epic: '史詩',
    legendary: '傳說'
  };

  const STAT_LABELS = {
    INT: '智力 INT',
    WIS: '智慧 WIS',
    CHA: '魅力 CHA',
    hp: '最大 HP',
    maxHp: '最大 HP',
    mp: '最大 MP',
    maxMp: '最大 MP'
  };

  const SKILL_IDS = [
    'vocab_insight',
    'grammar_shield',
    'speed_reading',
    'clairaudience',
    'kotodama_negotiate'
  ];

  const SKILL_DEFAULTS = {
    vocab_insight: {
      id: 'vocab_insight',
      name: '單字洞察',
      jpName: '<ruby>単語洞察<rt>たんごどうさつ</rt></ruby>',
      branch: '語彙系',
      type: 'active',
      mpCost: 10,
      maxLevel: 3,
      spCost: 1,
      desc: '戰鬥中消耗 10 MP，強制顯示本題全部漢字振假名（無視假名開關）。Lv2 起附帶攻擊加成，Lv3 額外 +1 破防。',
      levels: [
        'Lv.1：強制揭示全漢字振假名（10 MP）',
        'Lv.2：揭示假名 + 本題傷害 +15%',
        'Lv.3：揭示假名 + 本題傷害 +30% 且破防傷害 +1'
      ]
    },
    grammar_shield: {
      id: 'grammar_shield',
      name: '助詞護盾',
      jpName: '<ruby>助詞<rt>じょし</rt></ruby>シールド',
      branch: '文法系',
      type: 'passive',
      mpCost: 0,
      maxLevel: 3,
      spCost: 1,
      desc: '被動生效：戰鬥答錯承受反擊時，構築文法結界大幅減免傷害；Lv3 額外回復 5 MP。',
      levels: [
        'Lv.1：答錯反擊傷害減免 50%',
        'Lv.2：答錯反擊傷害減免 58%',
        'Lv.3：答錯反擊傷害減免 65%，且觸發時回復 5 MP'
      ]
    },
    speed_reading: {
      id: 'speed_reading',
      name: '速讀解析',
      jpName: '<ruby>速読解析<rt>そくどくかいせき</rt></ruby>',
      branch: '閱讀系',
      type: 'active',
      mpCost: 12,
      maxLevel: 3,
      spCost: 1,
      desc: '閱讀副本中消耗 12 MP，標示出目前題目對應的關鍵句並自動捲動至該處。Lv2 起提升副本結算獎勵。',
      levels: [
        'Lv.1：高亮當前題目關鍵句（12 MP）',
        'Lv.2：高亮關鍵句 + 閱讀副本獎勵 +15%',
        'Lv.3：高亮關鍵句 + 閱讀副本獎勵 +30%'
      ]
    },
    clairaudience: {
      id: 'clairaudience',
      name: '順風耳',
      jpName: '<ruby>順風耳<rt>じゅんぷうじ</rt></ruby>',
      branch: '聽力系',
      type: 'active',
      mpCost: 10,
      maxLevel: 3,
      spCost: 1,
      desc: '戰鬥中消耗 10 MP，以 0.65x 清晰慢速重播題目語音，並以言霊治癒自身 HP。',
      levels: [
        'Lv.1：0.65x 慢速重播 + 回復 15% 最大 HP（10 MP）',
        'Lv.2：0.65x 慢速重播 + 回復 22% 最大 HP',
        'Lv.3：0.65x 慢速重播 + 回復 30% 最大 HP'
      ]
    },
    kotodama_negotiate: {
      id: 'kotodama_negotiate',
      name: '言靈交涉',
      jpName: '<ruby>言霊交渉<rt>ことだまこうしょう</rt></ruby>',
      branch: '會話系',
      type: 'passive',
      mpCost: 0,
      maxLevel: 3,
      spCost: 1,
      desc: '被動生效：以得體日語與城鎮及商會交涉，大幅提高任務報酬並疊加額外商店折扣。',
      levels: [
        'Lv.1：任務金幣/經驗 +20%，額外商店折扣 10%',
        'Lv.2：任務金幣/經驗 +30%，額外商店折扣 15%',
        'Lv.3：任務金幣/經驗 +40%，額外商店折扣 20%'
      ]
    }
  };

  // ============================================================================
  // 2. Utility Helpers & Safe External Data Accessors
  // ============================================================================
  function $(id) {
    return document.getElementById(id);
  }

  function clamp(val, min, max) {
    const n = Number(val);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripRubyHtml(html) {
    if (!html) return '';
    return String(html)
      .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
      .replace(/<rp\b[^>]*>[\s\S]*?<\/rp>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatTimestamp(iso) {
    if (!iso) return '未知時間';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${day} ${hh}:${mm}`;
    } catch (_) {
      return String(iso);
    }
  }

  function formatMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function shuffleArray(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function toList(collection) {
    if (!collection) return [];
    if (Array.isArray(collection)) return collection;
    if (typeof collection === 'object') {
      return Object.keys(collection).map((k) => {
        const entry = collection[k];
        if (entry && typeof entry === 'object' && !entry.id) {
          return Object.assign({ id: k }, entry);
        }
        return entry;
      }).filter(Boolean);
    }
    return [];
  }

  function getData() {
    return global.GAME_DATA || {};
  }

  function getJobs() {
    return toList(getData().JOBS);
  }

  function getJobById(id) {
    const jobs = getJobs();
    return jobs.find((j) => j.id === id) || jobs[0] || {
      id: 'scholar',
      name: '言霊學者',
      title: '古文書解讀者',
      desc: '精於詞彙與語意解析的旅人。',
      baseHp: 100,
      baseMp: 60,
      baseINT: 14,
      baseWIS: 12,
      baseCHA: 9,
      growth: { hp: 14, mp: 8, INT: 3, WIS: 2, CHA: 1 },
      startWeaponId: null
    };
  }

  function getJobBaseStats(job) {
    const s = job && job.baseStats ? job.baseStats : (job && job.stats ? job.stats : {});
    return {
      hp: Number(job.baseHp ?? job.maxHp ?? job.hp ?? s.hp ?? s.maxHp ?? 100),
      mp: Number(job.baseMp ?? job.maxMp ?? job.mp ?? s.mp ?? s.maxMp ?? 50),
      INT: Number(job.baseINT ?? job.INT ?? job.int ?? s.INT ?? s.int ?? 10),
      WIS: Number(job.baseWIS ?? job.WIS ?? job.wis ?? s.WIS ?? s.wis ?? 10),
      CHA: Number(job.baseCHA ?? job.CHA ?? job.cha ?? s.CHA ?? s.cha ?? 10)
    };
  }

  function getJobGrowth(job) {
    const g = (job && job.growth) || {};
    return {
      hp: Number(g.hp ?? g.maxHp ?? 14),
      mp: Number(g.mp ?? g.maxMp ?? 7),
      INT: Number(g.INT ?? g.int ?? 2),
      WIS: Number(g.WIS ?? g.wis ?? 2),
      CHA: Number(g.CHA ?? g.cha ?? 2)
    };
  }

  function getJobStarterWeaponId(job) {
    if (!job) return null;
    const raw = job.startWeaponId || job.starterWeaponId || job.starterWeapon || job.weaponId || null;
    if (raw && getItemById(raw)) return raw;
    const weapons = getItems().filter((i) => i.type === 'weapon');
    return weapons[0] ? weapons[0].id : raw;
  }

  function getItems() {
    return toList(getData().ITEMS);
  }

  function getItemById(id) {
    if (!id) return null;
    const data = getData().ITEMS;
    if (data && !Array.isArray(data) && data[id]) {
      return data[id].id ? data[id] : Object.assign({ id }, data[id]);
    }
    return getItems().find((i) => i.id === id) || null;
  }

  function getSkills() {
    const raw = toList(getData().SKILLS);
    if (raw.length > 0) {
      return raw.map((sk) => Object.assign({}, SKILL_DEFAULTS[sk.id] || {}, sk));
    }
    return SKILL_IDS.map((id) => SKILL_DEFAULTS[id]);
  }

  function getSkillById(id) {
    return getSkills().find((s) => s.id === id) || SKILL_DEFAULTS[id] || null;
  }

  function getRegions() {
    return toList(getData().REGIONS);
  }

  function getRegionById(id) {
    const regions = getRegions();
    return regions.find((r) => r.id === id) || regions[0] || null;
  }

  function getEnemies() {
    return toList(getData().ENEMIES);
  }

  function getEnemyById(id) {
    if (!id) return null;
    const data = getData().ENEMIES;
    if (data && !Array.isArray(data) && data[id]) {
      return data[id].id ? data[id] : Object.assign({ id }, data[id]);
    }
    return getEnemies().find((e) => e.id === id) || null;
  }

  function getRegionBoss(regionId) {
    const region = getRegionById(regionId);
    if (region && region.bossId) {
      const b = getEnemyById(region.bossId);
      if (b) return b;
    }
    const enemies = getEnemies();
    return (
      enemies.find((e) => e.regionId === regionId && e.isBoss) ||
      enemies.find((e) => e.isBoss) ||
      enemies[0] ||
      null
    );
  }

  function getRegionNormalEnemies(regionId) {
    const region = getRegionById(regionId);
    let list = [];
    const rawIds = (region && Array.isArray(region.enemyIds) && region.enemyIds.length > 0)
      ? region.enemyIds
      : (region && Array.isArray(region.enemies) ? region.enemies : []);
    if (rawIds.length > 0) {
      list = rawIds
        .map((idOrObj) => (typeof idOrObj === 'string' ? getEnemyById(idOrObj) : idOrObj))
        .filter((e) => e && !e.isBoss);
    }
    if (list.length === 0) {
      list = getEnemies().filter((e) => e.regionId === regionId && !e.isBoss);
    }
    if (list.length === 0) {
      list = getEnemies().filter((e) => !e.isBoss);
    }
    return list;
  }

  function getNPCs() {
    return toList(getData().NPCS);
  }

  function getNPCById(id) {
    return getNPCs().find((n) => n.id === id) || null;
  }

  function getQuestions() {
    const q = getData().QUESTIONS || global.QUESTIONS || [];
    return Array.isArray(q) ? q : toList(q);
  }

  function getQuestionById(id) {
    return getQuestions().find((q) => q.id === id) || null;
  }

  function getReadingDungeons() {
    return toList(getData().READING_DUNGEONS || getData().READINGS);
  }

  function getReadingById(id) {
    return getReadingDungeons().find((r) => r.id === id) || null;
  }

  function getShrineTiers() {
    return toList(getData().SHRINE_TIERS || getData().SHRINES);
  }

  function getQuests() {
    return toList(getData().QUESTS);
  }

  function getAchievements() {
    return toList(getData().ACHIEVEMENTS);
  }

  function normalizeQuestion(raw) {
    if (!raw) return null;
    const type = raw.type || 'reading';
    const region = raw.regionId ? getRegionById(raw.regionId) : null;
    const promptZh = raw.promptZh || raw.prompt || raw.questionZh || '';
    const promptJp = raw.promptJp || raw.jp || raw.questionJp || '';
    const fullRubyJp = raw.fullRubyJp || raw.fullRuby || promptJp;
    const tts = raw.tts || stripRubyHtml(promptJp) || stripRubyHtml(fullRubyJp);

    let options = Array.isArray(raw.options) ? raw.options.slice() : [];
    const answerIndex = Number(
      raw.answerIndex ?? raw.correctIndex ?? raw.answer ?? 0
    );

    // Reorder normalization: supports both data.js `chunks: [{id, text, plain, html}]` and legacy `chips`
    let chunks = [];
    let correctOrderPlain = '';
    if (type === 'reorder') {
      if (Array.isArray(raw.chunks) && raw.chunks.length > 0) {
        chunks = raw.chunks.map((c, idx) => ({
          id: c.id !== undefined ? Number(c.id) : idx,
          text: String(c.text ?? c.plain ?? ''),
          plain: String(c.plain ?? c.text ?? ''),
          html: String(c.html ?? c.text ?? '')
        }));
        correctOrderPlain = chunks.map((c) => c.plain).join('');
      } else {
        const rawChips = raw.chips || raw.tokens || raw.words || raw.parts || [];
        const chipList = Array.isArray(rawChips) ? rawChips.map(String) : [];
        const rawOrder = raw.correctOrder || raw.answerOrder || raw.order || [];
        let ordered = chipList.slice();
        if (Array.isArray(rawOrder) && rawOrder.length > 0) {
          ordered = typeof rawOrder[0] === 'number'
            ? rawOrder.map((idx) => chipList[idx]).filter((v) => v != null)
            : rawOrder.map(String);
        }
        chunks = ordered.map((t, idx) => ({ id: idx, text: t, plain: stripRubyHtml(t), html: t }));
        correctOrderPlain = chunks.map((c) => c.plain).join('');
      }
    }

    let correctDisplay = raw.correctDisplay || raw.answerText || '';
    if (!correctDisplay) {
      if (type === 'reorder') {
        correctDisplay = chunks.map((c) => c.plain).join(' ');
      } else if (options[answerIndex] != null) {
        const opt = options[answerIndex];
        correctDisplay = typeof opt === 'object' ? (opt.jp || opt.text || opt.label || '') : String(opt);
      }
    }

    return {
      id: raw.id || `q_${Math.random().toString(36).slice(2, 8)}`,
      regionId: raw.regionId || 'r1',
      jlpt: normalizeJlptLevel(raw.jlpt || (region && region.jlpt), raw.regionId),
      difficulty: Number(raw.difficulty || 1),
      type,
      typeLabel: raw.typeLabel || QUESTION_TYPE_LABELS[type] || type,
      promptZh,
      promptJp,
      fullRubyJp,
      tts,
      options: options.map((opt) =>
        typeof opt === 'object' ? (opt.jp || opt.text || opt.label || '') : String(opt)
      ),
      answerIndex,
      chunks,
      correctOrderPlain,
      correctDisplay,
      kanaReading: raw.kanaReading || raw.reading || raw.kana || stripRubyHtml(correctDisplay),
      wrongReason: raw.wrongReason || raw.commonMistake || '注意句子中的助詞搭配、詞彙意義與時態語氣。',
      explanation: raw.explanation || raw.detail || '請朗讀正確句型並記住核心用法。',
      hint: raw.hint || raw.tip || '提示：仔細觀察句中的時間詞、助詞與動詞變化！'
    };
  }

  function formatSpeechLine(line) {
    if (!line) return { jp: '', zh: '', tts: '' };
    if (typeof line === 'string') {
      return { jp: line, zh: '', tts: stripRubyHtml(line) };
    }
    return {
      jp: line.jp || line.text || '',
      zh: line.zh || line.translation || '',
      tts: line.tts || stripRubyHtml(line.jp || line.text || '')
    };
  }

  // Safe Audio wrapper
  const Audio = {
    init() {
      try { if (global.AudioEngine && global.AudioEngine.init) global.AudioEngine.init(); } catch (_) {}
    },
    playBGM(track) {
      try { if (global.AudioEngine && global.AudioEngine.playBGM) global.AudioEngine.playBGM(track); } catch (_) {}
    },
    stopBGM() {
      try { if (global.AudioEngine && global.AudioEngine.stopBGM) global.AudioEngine.stopBGM(); } catch (_) {}
    },
    playSFX(name) {
      try { if (global.AudioEngine && global.AudioEngine.playSFX) global.AudioEngine.playSFX(name); } catch (_) {}
    },
    speak(text, rate, onEnd) {
      try {
        if (global.AudioEngine && global.AudioEngine.speak) {
          return global.AudioEngine.speak(stripRubyHtml(text), rate || 1.0, onEnd);
        }
      } catch (_) {}
      return false;
    },
    stopSpeak() {
      try { if (global.AudioEngine && global.AudioEngine.stopSpeak) global.AudioEngine.stopSpeak(); } catch (_) {}
    },
    toggleBGM() {
      try { if (global.AudioEngine && global.AudioEngine.toggleBGM) return global.AudioEngine.toggleBGM(); } catch (_) {}
      return false;
    },
    toggleSFX() {
      try { if (global.AudioEngine && global.AudioEngine.toggleSFX) return global.AudioEngine.toggleSFX(); } catch (_) {}
      return false;
    },
    getState() {
      try {
        if (global.AudioEngine && global.AudioEngine.getState) return global.AudioEngine.getState();
      } catch (_) {}
      return { bgmMuted: false, sfxMuted: false };
    }
  };

  // Safe SVGArt wrapper
  const Art = {
    logo() {
      try {
        if (global.SVGArt && typeof global.SVGArt.logo === 'function') {
          return global.SVGArt.logo();
        }
      } catch (_) {}
      return '<svg viewBox="0 0 120 120" width="96" height="96"><circle cx="60" cy="60" r="52" fill="#182038" stroke="#d4af37" stroke-width="4"/><text x="60" y="72" text-anchor="middle" fill="#f3d57a" font-size="44" font-family="serif">言</text></svg>';
    },
    hero(jobId, poseOrOpts) {
      try {
        if (global.SVGArt && typeof global.SVGArt.hero === 'function') {
          return global.SVGArt.hero(jobId, poseOrOpts);
        }
      } catch (_) {}
      return '<svg viewBox="0 0 120 120"><circle cx="60" cy="48" r="24" fill="#38bdf8"/><path d="M24 108 C24 78 96 78 96 108 Z" fill="#1e293b" stroke="#d4af37" stroke-width="3"/></svg>';
    },
    npc(npcId, emotion) {
      try {
        if (global.SVGArt && typeof global.SVGArt.npc === 'function') {
          return global.SVGArt.npc(npcId, emotion || 'neutral');
        }
      } catch (_) {}
      return '<svg viewBox="0 0 120 120"><circle cx="60" cy="50" r="24" fill="#d4af37"/><rect x="30" y="80" width="60" height="32" rx="14" fill="#334155"/></svg>';
    },
    enemy(enemyId, isBoss, pose) {
      try {
        if (global.SVGArt && typeof global.SVGArt.enemy === 'function') {
          return global.SVGArt.enemy(enemyId, Boolean(isBoss), pose || 'idle');
        }
      } catch (_) {}
      return '<svg viewBox="0 0 140 140"><polygon points="70,14 124,116 16,116" fill="#7f1d1d" stroke="#ef4444" stroke-width="4"/><circle cx="56" cy="70" r="7" fill="#fef08a"/><circle cx="84" cy="70" r="7" fill="#fef08a"/></svg>';
    },
    worldMap(regions, unlockedIds, defeatedBosses, currentRegionId) {
      try {
        if (global.SVGArt && typeof global.SVGArt.worldMap === 'function') {
          return global.SVGArt.worldMap(regions, unlockedIds, defeatedBosses, currentRegionId);
        }
      } catch (_) {}
      // Built-in interactive fallback SVG map if SVGArt.worldMap is unavailable
      const nodes = regions.map((r, idx) => {
        const x = (r.mapPos && r.mapPos.x) || (110 + idx * 120);
        const y = (r.mapPos && r.mapPos.y) || (idx % 2 === 0 ? 120 : 240);
        const unlocked = unlockedIds.includes(r.id);
        const cleared = defeatedBosses.includes(r.id);
        const current = currentRegionId === r.id;
        const cls = [
          'map-node',
          unlocked ? 'unlocked' : 'locked',
          cleared ? 'cleared' : '',
          current ? 'current' : ''
        ].filter(Boolean).join(' ');
        return `<g class="${cls}" data-region="${r.id}" style="cursor:pointer;">
          <circle cx="${x}" cy="${y}" r="26" fill="${cleared ? '#166534' : unlocked ? '#1e3a5f' : '#1f2937'}" stroke="${current ? '#f5d061' : unlocked ? '#38bdf8' : '#64748b'}" stroke-width="3"/>
          <text x="${x}" y="${y + 5}" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="bold">${escapeHtml(r.jlpt || 'N4')}</text>
          <text x="${x}" y="${y + 44}" text-anchor="middle" fill="#e2e8f0" font-size="12">${escapeHtml(r.name || r.id)}</text>
        </g>`;
      }).join('');
      return `<svg viewBox="0 0 820 360" width="100%" height="100%"><rect width="820" height="360" rx="14" fill="#0d1322"/>${nodes}</svg>`;
    },
    itemIcon(item) {
      if (!item) return '';
      try {
        if (global.SVGArt && typeof global.SVGArt.itemIcon === 'function') {
          const out = global.SVGArt.itemIcon(item.icon || item.type || 'weapon', item.rarity || 'common');
          if (out) return out;
        }
      } catch (_) {}
      const icons = { weapon: '⚔️', armor: '🛡️', accessory: '💍', consumable: '🧪' };
      return `<svg viewBox="0 0 48 48" width="40" height="40"><rect x="4" y="4" width="40" height="40" rx="10" fill="#182238" stroke="#d4af37" stroke-width="2"/><text x="24" y="31" text-anchor="middle" font-size="22">${icons[item.type] || '✨'}</text></svg>`;
    },
    badge(icon, unlocked) {
      try {
        if (global.SVGArt && typeof global.SVGArt.badge === 'function') {
          return global.SVGArt.badge(icon, Boolean(unlocked));
        }
      } catch (_) {}
      return `<svg viewBox="0 0 56 56" width="48" height="48"><circle cx="28" cy="28" r="24" fill="${unlocked ? '#422006' : '#111827'}" stroke="${unlocked ? '#f5d061' : '#475569'}" stroke-width="3"/><text x="28" y="35" text-anchor="middle" font-size="22">${unlocked ? '🏆' : '🔒'}</text></svg>`;
    },
    exploreVisual(region, eventType) {
      try {
        if (global.SVGArt && typeof global.SVGArt.regionScene === 'function') {
          return global.SVGArt.regionScene(region.id, eventType);
        }
      } catch (_) {}
      const palette = {
        r1: ['#134e4a', '#2dd4bf'],
        r2: ['#1e3a8a', '#60a5fa'],
        r3: ['#581c87', '#c084fc'],
        r4: ['#7c2d12', '#fb923c'],
        r5: ['#7f1d1d', '#f87171'],
        r6: ['#312e81', '#facc15']
      };
      const cols = palette[(region && region.id) || 'r1'] || palette.r1;
      const glyph = eventType === 'boss' ? '👹' : eventType === 'chest' ? '🎁' : eventType === 'camp' ? '🔥' : eventType === 'event' ? '🗿' : '🧭';
      return `<svg viewBox="0 0 220 120" width="100%" height="120" aria-hidden="true">
        <defs><linearGradient id="expGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${cols[0]}"/><stop offset="100%" stop-color="#0b101d"/></linearGradient></defs>
        <rect width="220" height="120" rx="12" fill="url(#expGrad)" stroke="${cols[1]}" stroke-opacity="0.45" stroke-width="2"/>
        <circle cx="110" cy="60" r="36" fill="${cols[1]}" fill-opacity="0.16" stroke="${cols[1]}" stroke-width="2"/>
        <text x="110" y="72" text-anchor="middle" font-size="34">${glyph}</text>
      </svg>`;
    }
  };

  // ============================================================================
  // 3. State Schema, Default Creation & Safe Sanitization
  // ============================================================================
  function createDefaultState() {
    const firstJob = getJobs()[0] || getJobById('scholar');
    const base = getJobBaseStats(firstJob);
    const starterWeapon = getJobStarterWeaponId(firstJob);
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      player: {
        name: '旅人',
        jobId: firstJob.id || 'scholar',
        level: 1,
        exp: 0,
        nextExp: 100,
        hp: base.hp,
        maxHp: base.hp,
        mp: base.mp,
        maxMp: base.mp,
        baseINT: base.INT,
        baseWIS: base.WIS,
        baseCHA: base.CHA,
        gold: 120,
        sp: 1,
        activeTitle: '初醒的旅人',
        unlockedTitles: ['初醒的旅人'],
        equipment: {
          weapon: starterWeapon,
          armor: null,
          accessory: null
        },
        enhancements: {}
      },
      inventory: [
        { id: 'con_herb', qty: 3 },
        { id: 'con_water', qty: 2 }
      ],
      skills: {
        vocab_insight: 0,
        grammar_shield: 0,
        speed_reading: 0,
        clairaudience: 0,
        kotodama_negotiate: 0
      },
      progress: {
        currentRegionId: 'r1',
        regionExplore: { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0 },
        defeatedBosses: [],
        unlockedAllOverride: false,
        clearedReadings: [],
        shrineBest: {}
      },
      npc: {
        mayor: { affection: 0, talkedIds: [], claimedMilestones: [] },
        merchant: { affection: 0, talkedIds: [], claimedMilestones: [] },
        scholar: { affection: 0, talkedIds: [], claimedMilestones: [] },
        priest: { affection: 0, talkedIds: [], claimedMilestones: [] }
      },
      quests: {
        claimedIds: [],
        dailyProgress: {
          win_battles: 0,
          correct_answers: 0,
          npc_talk: 0,
          complete_shrine: 0,
          reach_fever: 0
        },
        dailyDate: getTodayStr()
      },
      stats: {
        battlesWon: 0,
        totalCorrect: 0,
        totalWrong: 0,
        maxCombo: 0,
        feverCount: 0,
        breaksTriggered: 0,
        goldEarned: 0,
        enhanceCount: 0,
        npcTalks: 0,
        shrineCompleted: 0,
        shrineRankS: 0,
        encounteredEnemies: [],
        defeatedEnemies: []
      },
      mistakes: [],
      achievements: [],
      settings: {
        furigana: true,
        difficultyMode: 'adaptive',
        adaptiveStartJlpt: 'N4'
      }
    };
  }

  function sanitizeSaveData(raw) {
    const def = createDefaultState();
    if (!raw || typeof raw !== 'object') return def;

    const out = def;
    out.version = SAVE_VERSION;
    out.savedAt = typeof raw.savedAt === 'string' ? raw.savedAt : def.savedAt;

    // Player
    const rp = raw.player && typeof raw.player === 'object' ? raw.player : {};
    out.player.name = typeof rp.name === 'string' && rp.name.trim() ? rp.name.trim().slice(0, 12) : def.player.name;
    out.player.jobId = typeof rp.jobId === 'string' && getJobById(rp.jobId) ? rp.jobId : def.player.jobId;
    out.player.level = Math.max(1, Math.floor(Number(rp.level) || 1));
    out.player.exp = Math.max(0, Math.floor(Number(rp.exp) || 0));
    out.player.nextExp = Math.max(50, Math.floor(Number(rp.nextExp) || calcNextExp(out.player.level)));
    out.player.maxHp = Math.max(30, Math.floor(Number(rp.maxHp) || def.player.maxHp));
    out.player.hp = clamp(Math.floor(Number(rp.hp ?? out.player.maxHp)), 1, out.player.maxHp * 3);
    out.player.maxMp = Math.max(20, Math.floor(Number(rp.maxMp) || def.player.maxMp));
    out.player.mp = clamp(Math.floor(Number(rp.mp ?? out.player.maxMp)), 0, out.player.maxMp * 3);
    out.player.baseINT = Math.max(1, Math.floor(Number(rp.baseINT) || def.player.baseINT));
    out.player.baseWIS = Math.max(1, Math.floor(Number(rp.baseWIS) || def.player.baseWIS));
    out.player.baseCHA = Math.max(1, Math.floor(Number(rp.baseCHA) || def.player.baseCHA));
    out.player.gold = Math.max(0, Math.floor(Number(rp.gold ?? def.player.gold)));
    out.player.sp = Math.max(0, Math.floor(Number(rp.sp ?? def.player.sp)));
    out.player.unlockedTitles = Array.isArray(rp.unlockedTitles) && rp.unlockedTitles.length > 0
      ? Array.from(new Set(rp.unlockedTitles.map(String)))
      : ['初醒的旅人'];
    out.player.activeTitle = typeof rp.activeTitle === 'string' && out.player.unlockedTitles.includes(rp.activeTitle)
      ? rp.activeTitle
      : out.player.unlockedTitles[0];

    const req = rp.equipment && typeof rp.equipment === 'object' ? rp.equipment : {};
    out.player.equipment = {
      weapon: typeof req.weapon === 'string' ? req.weapon : null,
      armor: typeof req.armor === 'string' ? req.armor : null,
      accessory: typeof req.accessory === 'string' ? req.accessory : null
    };

    const renh = rp.enhancements && typeof rp.enhancements === 'object' ? rp.enhancements : {};
    out.player.enhancements = {};
    Object.keys(renh).forEach((k) => {
      out.player.enhancements[k] = clamp(Math.floor(Number(renh[k]) || 0), 0, 5);
    });

    // Inventory
    if (Array.isArray(raw.inventory)) {
      const merged = new Map();
      raw.inventory.forEach((entry) => {
        if (entry && typeof entry.id === 'string') {
          const qty = Math.floor(Number(entry.qty) || 0);
          if (qty > 0) merged.set(entry.id, (merged.get(entry.id) || 0) + qty);
        }
      });
      out.inventory = Array.from(merged.entries()).map(([id, qty]) => ({ id, qty }));
    }

    // Skills
    const rsk = raw.skills && typeof raw.skills === 'object' ? raw.skills : {};
    SKILL_IDS.forEach((sid) => {
      out.skills[sid] = clamp(Math.floor(Number(rsk[sid]) || 0), 0, 3);
    });

    // Progress
    const rpr = raw.progress && typeof raw.progress === 'object' ? raw.progress : {};
    out.progress.currentRegionId = typeof rpr.currentRegionId === 'string' ? rpr.currentRegionId : 'r1';
    const rex = rpr.regionExplore && typeof rpr.regionExplore === 'object' ? rpr.regionExplore : {};
    ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].forEach((rid) => {
      out.progress.regionExplore[rid] = clamp(Math.floor(Number(rex[rid]) || 0), 0, 100);
    });
    out.progress.defeatedBosses = Array.isArray(rpr.defeatedBosses) ? Array.from(new Set(rpr.defeatedBosses.map(String))) : [];
    out.progress.unlockedAllOverride = Boolean(rpr.unlockedAllOverride);
    out.progress.clearedReadings = Array.isArray(rpr.clearedReadings) ? Array.from(new Set(rpr.clearedReadings.map(String))) : [];
    out.progress.shrineBest = rpr.shrineBest && typeof rpr.shrineBest === 'object' ? Object.assign({}, rpr.shrineBest) : {};

    // NPCs
    const rnpc = raw.npc && typeof raw.npc === 'object' ? raw.npc : {};
    ['mayor', 'merchant', 'scholar', 'priest'].forEach((nid) => {
      const n = rnpc[nid] && typeof rnpc[nid] === 'object' ? rnpc[nid] : {};
      out.npc[nid] = {
        affection: clamp(Math.floor(Number(n.affection) || 0), 0, 100),
        talkedIds: Array.isArray(n.talkedIds) ? Array.from(new Set(n.talkedIds.map(String))) : [],
        claimedMilestones: Array.isArray(n.claimedMilestones) ? Array.from(new Set(n.claimedMilestones.map(Number))) : []
      };
    });

    // Quests (with daily date rollover)
    const rq = raw.quests && typeof raw.quests === 'object' ? raw.quests : {};
    const today = getTodayStr();
    const savedDate = typeof rq.dailyDate === 'string' ? rq.dailyDate : today;
    out.quests.claimedIds = Array.isArray(rq.claimedIds) ? Array.from(new Set(rq.claimedIds.map(String))) : [];
    if (savedDate === today) {
      const dp = rq.dailyProgress && typeof rq.dailyProgress === 'object' ? rq.dailyProgress : {};
      out.quests.dailyDate = today;
      out.quests.dailyProgress = {
        win_battles: Math.max(0, Math.floor(Number(dp.win_battles) || 0)),
        correct_answers: Math.max(0, Math.floor(Number(dp.correct_answers) || 0)),
        npc_talk: Math.max(0, Math.floor(Number(dp.npc_talk) || 0)),
        complete_shrine: Math.max(0, Math.floor(Number(dp.complete_shrine) || 0)),
        reach_fever: Math.max(0, Math.floor(Number(dp.reach_fever) || 0))
      };
    } else {
      out.quests.dailyDate = today;
      out.quests.dailyProgress = { win_battles: 0, correct_answers: 0, npc_talk: 0, complete_shrine: 0, reach_fever: 0 };
      const dailyIds = new Set(getQuests().filter((q) => (q.type || q.category) === 'daily').map((q) => q.id));
      out.quests.claimedIds = out.quests.claimedIds.filter((id) => !dailyIds.has(id));
    }

    // Stats
    const rst = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
    [
      'battlesWon', 'totalCorrect', 'totalWrong', 'maxCombo',
      'feverCount', 'breaksTriggered', 'goldEarned', 'enhanceCount',
      'npcTalks', 'shrineCompleted', 'shrineRankS'
    ].forEach((k) => {
      out.stats[k] = Math.max(0, Math.floor(Number(rst[k]) || 0));
    });
    out.stats.encounteredEnemies = Array.isArray(rst.encounteredEnemies) ? Array.from(new Set(rst.encounteredEnemies.map(String))) : [];
    out.stats.defeatedEnemies = Array.isArray(rst.defeatedEnemies) ? Array.from(new Set(rst.defeatedEnemies.map(String))) : [];

    // Mistakes
    if (Array.isArray(raw.mistakes)) {
      out.mistakes = raw.mistakes
        .filter((m) => m && typeof m.questionId === 'string')
        .map((m) => ({
          questionId: m.questionId,
          count: Math.max(1, Math.floor(Number(m.count) || 1)),
          lastWrongAt: typeof m.lastWrongAt === 'string' ? m.lastWrongAt : new Date().toISOString()
        }));
    }

    // Achievements
    out.achievements = Array.isArray(raw.achievements) ? Array.from(new Set(raw.achievements.map(String))) : [];

    // Settings
    const rset = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    out.settings.furigana = rset.furigana !== undefined ? Boolean(rset.furigana) : true;
    const validModes = new Set(DIFFICULTY_MODES.map((m) => m.id));
    out.settings.difficultyMode = typeof rset.difficultyMode === 'string' && validModes.has(rset.difficultyMode)
      ? rset.difficultyMode
      : 'adaptive';
    out.settings.adaptiveStartJlpt = rset.adaptiveStartJlpt === 'N3' ? 'N3' : 'N4';

    // Clamp HP/MP to actual derived max
    const derived = computeTotalStatsFor(out);
    out.player.hp = clamp(out.player.hp, 1, derived.maxHp);
    out.player.mp = clamp(out.player.mp, 0, derived.maxMp);

    return out;
  }

  function calcNextExp(level) {
    return Math.round(100 * Math.pow(1.28, Math.max(0, level - 1)));
  }

  // ============================================================================
  // 4. Runtime Engine State
  // ============================================================================
  let state = createDefaultState();
  let hasActiveSession = false;
  let currentView = 'title';

  // UI sub-states
  let createSelectedJobId = null;
  let createPreviewPose = 'idle';
  let createSelectedDifficultyMode = 'adaptive';
  let createAdaptiveStartJlpt = 'N4';
  let townState = {
    selectedNpcId: null,
    dialogueIndex: 0,
    currentDialogue: null,
    awaitingNext: false,
    typingTimerId: null,
    typingFullJp: '',
    typingFullZh: '',
    typingActive: false,
    currentTts: ''
  };
  let mapSelectedRegionId = 'r1';
  let exploreLogs = [];
  let explorePendingEvent = null;

  let battle = {
    active: false,
    enemy: null,
    regionId: 'r1',
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyBreak: 2,
    enemyBreakMax: 2,
    enemyStunned: false,
    stunJustTriggered: false,
    combo: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    feverActive: false,
    difficultyOffset: 0,
    currentQ: null,
    qStartTime: 0,
    speedTimerId: null,
    insightActive: false,
    usedQuestionIds: [],
    reorderPool: [],
    reorderSelected: [],
    locked: false,
    returnView: 'explore'
  };

  let reading = {
    active: false,
    dungeon: null,
    qIdx: 0,
    correctCount: 0,
    answered: false,
    answers: []
  };

  let shrine = {
    active: false,
    tier: null,
    questions: [],
    qIdx: 0,
    timeLeft: 180,
    timeLimit: 180,
    timerId: null,
    results: [],
    reorderPool: [],
    reorderSelected: []
  };

  let uiTabs = {
    inv: 'all',
    selectedInvItemId: null,
    quests: 'main',
    codex: 'bestiary',
    shop: 'buy'
  };

  let explainCallback = null;
  let saveModalLoadOnly = false;
  let genericModalCallback = null;

  // ============================================================================
  // 5. Storage Operations
  // ============================================================================
  function readRawSlot(key) {
    try {
      const txt = global.localStorage.getItem(key);
      if (!txt) return null;
      return JSON.parse(txt);
    } catch (_) {
      return null;
    }
  }

  function writeSlot(key, dataObj) {
    try {
      const clone = JSON.parse(JSON.stringify(dataObj));
      clone.version = SAVE_VERSION;
      clone.savedAt = new Date().toISOString();
      global.localStorage.setItem(key, JSON.stringify(clone));
      return true;
    } catch (err) {
      showToast('存檔寫入失敗（瀏覽器儲存空間受限）', 'error');
      return false;
    }
  }

  function deleteSlot(key) {
    try {
      global.localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function findLatestSaveKey() {
    let bestKey = null;
    let bestTime = -1;
    SAVE_SLOT_LIST.forEach((slot) => {
      const raw = readRawSlot(slot.key);
      if (raw && raw.player) {
        const ts = raw.savedAt ? Date.parse(raw.savedAt) : 0;
        if (ts > bestTime) {
          bestTime = ts;
          bestKey = slot.key;
        }
      }
    });
    return bestKey;
  }

  function autoSave() {
    if (!hasActiveSession) return false;
    state.savedAt = new Date().toISOString();
    return writeSlot(SAVE_KEYS.auto, state);
  }

  function saveToSlot(slotKey) {
    if (!hasActiveSession) {
      showToast('尚未開始冒險，無法存檔。', 'warning');
      return false;
    }
    const ok = writeSlot(slotKey, state);
    if (ok) {
      Audio.playSFX('confirm');
      showToast('💾 進度已儲存！', 'success');
      renderSaveModal();
    }
    return ok;
  }

  function loadFromSlot(slotKey) {
    const raw = readRawSlot(slotKey);
    if (!raw) {
      showToast('此存檔欄位為空。', 'warning');
      return false;
    }
    state = sanitizeSaveData(raw);
    hasActiveSession = true;
    battle.active = false;
    shrine.active = false;
    reading.active = false;
    stopBattleTimers();
    stopShrineTimer();
    applyFuriganaSetting();
    closeModal('modal-save');
    Audio.playSFX('confirm');
    showToast(`歡迎回來，${state.player.name}（Lv.${state.player.level}）！`, 'success');
    switchView('town');
    return true;
  }

  // ============================================================================
  // 6. Derived Stats, Enhancement & Skill Calculators
  // ============================================================================
  function getItemEnhancementLevel(itemId) {
    if (!itemId || !state || !state.player || !state.player.enhancements) return 0;
    return clamp(state.player.enhancements[itemId] || 0, 0, 5);
  }

  function getEnhancedItemStats(item, enhLevelOverride) {
    if (!item) return { INT: 0, WIS: 0, CHA: 0, hp: 0, mp: 0 };
    const lv = enhLevelOverride !== undefined
      ? clamp(enhLevelOverride, 0, 5)
      : getItemEnhancementLevel(item.id);
    const s = item.stats || {};
    const calc = (val) => {
      const base = Number(val || 0);
      if (base <= 0) return 0;
      if (lv <= 0) return base;
      const perLv = Math.max(1, Math.round(base * 0.15));
      return base + perLv * lv;
    };
    return {
      INT: calc(s.INT ?? s.int),
      WIS: calc(s.WIS ?? s.wis),
      CHA: calc(s.CHA ?? s.cha),
      hp: calc(s.hp ?? s.maxHp),
      mp: calc(s.mp ?? s.maxMp)
    };
  }

  function computeTotalStatsFor(st) {
    const p = st.player;
    const eq = p.equipment || {};
    let gearINT = 0, gearWIS = 0, gearCHA = 0, gearHp = 0, gearMp = 0;

    ['weapon', 'armor', 'accessory'].forEach((slot) => {
      const itemId = eq[slot];
      if (!itemId) return;
      const item = getItemById(itemId);
      if (!item) return;
      const lv = clamp((p.enhancements && p.enhancements[itemId]) || 0, 0, 5);
      const es = getEnhancedItemStats(item, lv);
      gearINT += es.INT;
      gearWIS += es.WIS;
      gearCHA += es.CHA;
      gearHp += es.hp;
      gearMp += es.mp;
    });

    const INT = p.baseINT + gearINT;
    const WIS = p.baseWIS + gearWIS;
    const CHA = p.baseCHA + gearCHA;
    const maxHp = p.maxHp + gearHp;
    const maxMp = p.maxMp + gearMp;

    const negLv = clamp((st.skills && st.skills.kotodama_negotiate) || 0, 0, 3);
    const chaShopDiscount = Math.min(28, Math.floor(CHA * 0.8));
    const skillShopDiscount = [0, 10, 15, 20][negLv];
    const totalShopDiscount = Math.min(50, chaShopDiscount + skillShopDiscount);

    return {
      INT,
      WIS,
      CHA,
      maxHp,
      maxMp,
      gearINT,
      gearWIS,
      gearCHA,
      gearHp,
      gearMp,
      baseAtk: Math.round(18 + INT * 2.1),
      critRate: Math.min(75, Number((10 + INT * 0.8).toFixed(1))),
      wisDmgReduce: Math.min(0.40, WIS * 0.011),
      readingBonus: WIS * 0.02,
      chaAffectionBonus: Math.floor(CHA / 10),
      chaShopDiscount,
      skillShopDiscount,
      totalShopDiscount,
      questRewardBonus: [0, 0.20, 0.30, 0.40][negLv]
    };
  }

  function getTotalStats() {
    return computeTotalStatsFor(state);
  }

  function getShopBuyPrice(item) {
    const base = Math.max(1, Number(item.price ?? item.cost ?? 50));
    const disc = getTotalStats().totalShopDiscount;
    return Math.max(1, Math.round(base * (1 - disc / 100)));
  }

  function getEnhanceCost(item, currentLv) {
    const base = Math.max(40, Number(item.price ?? item.cost ?? 100));
    const disc = getTotalStats().totalShopDiscount;
    const raw = Math.round(base * (0.45 + currentLv * 0.35));
    return Math.max(15, Math.round(raw * (1 - disc / 100)));
  }

  function getSellPrice(item) {
    const base = Math.max(10, Number(item.sellPrice ?? Math.floor((item.price ?? item.cost ?? 40) * 0.5)));
    return Math.max(5, base);
  }

  // ============================================================================
  // 7. Inventory, Rewards, Level-Up & Progression Helpers
  // ============================================================================
  function getItemQty(itemId) {
    const entry = state.inventory.find((i) => i.id === itemId);
    return entry ? entry.qty : 0;
  }

  function isItemEquipped(itemId) {
    const eq = state.player.equipment;
    return eq.weapon === itemId || eq.armor === itemId || eq.accessory === itemId;
  }

  function addItem(itemId, qty = 1) {
    if (!itemId || qty <= 0) return;
    const item = getItemById(itemId);
    if (!item) return;
    const existing = state.inventory.find((i) => i.id === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      state.inventory.push({ id: itemId, qty });
    }
  }

  function removeItem(itemId, qty = 1) {
    const idx = state.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;
    if (state.inventory[idx].qty < qty) return false;
    state.inventory[idx].qty -= qty;
    if (state.inventory[idx].qty <= 0) {
      state.inventory.splice(idx, 1);
    }
    return true;
  }

  function equipItem(itemId) {
    const item = getItemById(itemId);
    if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return false;
    const slot = item.type;
    const currentId = state.player.equipment[slot];
    if (currentId === itemId) return false;

    if (!removeItem(itemId, 1)) {
      showToast('背包中沒有此裝備。', 'warning');
      return false;
    }
    if (currentId) {
      addItem(currentId, 1);
    }
    state.player.equipment[slot] = itemId;
    const stats = getTotalStats();
    state.player.hp = Math.min(state.player.hp, stats.maxHp);
    state.player.mp = Math.min(state.player.mp, stats.maxMp);
    Audio.playSFX('confirm');
    showToast(`⚔️ 已裝備【${item.name}】`, 'success');
    autoSave();
    updateHUD();
    return true;
  }

  function unequipSlot(slot) {
    const currentId = state.player.equipment[slot];
    if (!currentId) return false;
    const item = getItemById(currentId);
    state.player.equipment[slot] = null;
    addItem(currentId, 1);
    const stats = getTotalStats();
    state.player.hp = Math.min(state.player.hp, stats.maxHp);
    state.player.mp = Math.min(state.player.mp, stats.maxMp);
    Audio.playSFX('click');
    showToast(`已卸下【${item ? item.name : currentId}】`, 'info');
    autoSave();
    updateHUD();
    return true;
  }

  function grantTitle(titleStr) {
    if (!titleStr) return false;
    if (!state.player.unlockedTitles.includes(titleStr)) {
      state.player.unlockedTitles.push(titleStr);
      showToast(`👑 解鎖新稱號：【${titleStr}】`, 'gold');
      return true;
    }
    return false;
  }

  function gainGold(amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0) return 0;
    state.player.gold += n;
    state.stats.goldEarned += n;
    return n;
  }

  function gainExp(amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0) return { leveledUp: false, levelsGained: 0 };
    state.player.exp += n;
    let levelsGained = 0;
    const job = getJobById(state.player.jobId);
    const growth = getJobGrowth(job);

    while (state.player.exp >= state.player.nextExp) {
      state.player.exp -= state.player.nextExp;
      state.player.level += 1;
      state.player.sp += 1;
      state.player.maxHp += growth.hp;
      state.player.maxMp += growth.mp;
      state.player.baseINT += growth.INT;
      state.player.baseWIS += growth.WIS;
      state.player.baseCHA += growth.CHA;
      state.player.nextExp = calcNextExp(state.player.level);
      levelsGained += 1;
    }

    if (levelsGained > 0) {
      const stats = getTotalStats();
      state.player.hp = stats.maxHp;
      state.player.mp = stats.maxMp;
      Audio.playSFX('levelup');
      showToast(
        `🎉 等級提升！達到 Lv.${state.player.level}（SP +${levelsGained}，HP/MP 全回復）`,
        'gold'
      );
    }

    return { leveledUp: levelsGained > 0, levelsGained };
  }

  function isRegionUnlocked(regionId) {
    const region = getRegionById(regionId);
    if (!region) return false;
    if (region.id === 'r1') return true;
    if (state.progress.unlockedAllOverride) return true;
    if (region.unlockLevel && state.player.level >= region.unlockLevel) return true;
    if (region.prevRegionId && state.progress.defeatedBosses.includes(region.prevRegionId)) return true;
    return false;
  }

  function isReadingUnlocked(rd) {
    if (!rd) return false;
    if (rd.id === 'rd_1' || !rd.unlockRegionId) return true;
    if (state.progress.unlockedAllOverride) return true;
    return isRegionUnlocked(rd.unlockRegionId);
  }

  function logMistake(questionId) {
    if (!questionId) return;
    const existing = state.mistakes.find((m) => m.questionId === questionId);
    if (existing) {
      existing.count += 1;
      existing.lastWrongAt = new Date().toISOString();
    } else {
      state.mistakes.unshift({
        questionId,
        count: 1,
        lastWrongAt: new Date().toISOString()
      });
    }
  }

  // ============================================================================
  // 8. Toast & Modal Utilities
  // ============================================================================
  function showToast(message, type = 'info') {
    const container = $('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.innerHTML = message;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(24px)';
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 3400);
  }

  function openModal(id) {
    const el = $(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.remove('open');
  }

  function showGenericModal(title, bodyHtml, icon = '✨', onClose = null) {
    const iconEl = $('generic-modal-icon');
    const titleEl = $('generic-modal-title');
    const bodyEl = $('generic-modal-body');
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    genericModalCallback = typeof onClose === 'function' ? onClose : null;
    openModal('modal-generic');
  }

  function openExplainModal(q, damageNotice, onConfirm) {
    const dmgEl = $('explain-damage-notice');
    const ansEl = $('explain-correct-answer');
    const readEl = $('explain-reading');
    const wrongEl = $('explain-wrong-reason');
    const detailEl = $('explain-detail');

    if (dmgEl) dmgEl.innerHTML = damageNotice || '';
    if (ansEl) {
      ansEl.classList.add('force-furigana');
      ansEl.innerHTML = `
        <div class="jp-text" style="font-size:1.18rem;margin-bottom:6px;">${q.fullRubyJp || q.promptJp || ''}</div>
        <div class="text-emerald" style="font-weight:700;">▶ 正解：${q.correctDisplay}</div>
      `;
    }
    if (readEl) {
      readEl.textContent = `假名讀音：${q.kanaReading || stripRubyHtml(q.correctDisplay)}`;
    }
    if (wrongEl) wrongEl.innerHTML = q.wrongReason || '';
    if (detailEl) detailEl.innerHTML = q.explanation || '';

    const ttsBtn = $('btn-explain-tts');
    const ttsSlowBtn = $('btn-explain-tts-slow');
    const speakText = q.tts || stripRubyHtml(q.fullRubyJp || q.correctDisplay);
    if (ttsBtn) ttsBtn.onclick = () => Audio.speak(speakText, 1.0);
    if (ttsSlowBtn) ttsSlowBtn.onclick = () => Audio.speak(speakText, 0.65);

    explainCallback = typeof onConfirm === 'function' ? onConfirm : null;
    openModal('modal-explain');
  }

  // ============================================================================
  // 9. HUD, Furigana & View Router
  // ============================================================================
  function applyFuriganaSetting() {
    const app = $('app');
    const btn = $('btn-toggle-furigana');
    const on = Boolean(state.settings.furigana);
    if (app) {
      app.classList.toggle('furigana-on', on);
      app.classList.toggle('furigana-off', !on);
    }
    if (btn) {
      btn.textContent = on ? '假名: 開' : '假名: 關';
      btn.classList.toggle('active', on);
    }
  }

  function syncAudioButtons() {
    const st = Audio.getState();
    const bgmBtn = $('btn-toggle-bgm');
    const sfxBtn = $('btn-toggle-sfx');
    if (bgmBtn) {
      bgmBtn.textContent = st.bgmMuted ? '🔇 BGM' : '🎵 BGM';
      bgmBtn.classList.toggle('active', !st.bgmMuted);
    }
    if (sfxBtn) {
      sfxBtn.textContent = st.sfxMuted ? '🔇 SFX' : '🔊 SFX';
      sfxBtn.classList.toggle('active', !st.sfxMuted);
    }
  }

  function syncDifficultyControls() {
    const modeId = (state && state.settings && state.settings.difficultyMode) || 'adaptive';
    const sel = $('hud-difficulty-select');
    if (sel) {
      if (sel.value !== modeId) sel.value = modeId;
      sel.classList.toggle('diff-n1-active', modeId === 'fixed_n1');
    }
    if (currentView === 'map') {
      renderMapDifficultyBar();
    }
    if (battle && battle.active) {
      updateBattleUI();
    }
  }

  function setDifficultyMode(modeId, options = {}) {
    const cfg = getDifficultyModeConfig(modeId);
    state.settings.difficultyMode = cfg.id;

    if (battle && battle.active) {
      const startIdx = state.settings.adaptiveStartJlpt === 'N3' ? 1 : 0;
      battle.adaptiveLevelIdx = Math.max(getAdaptiveRegionFloorIdx(battle.regionId), startIdx);
      updateBattleUI();
      if (!battle.locked && options.refreshCurrentBattleQuestion) {
        nextBattleQuestion();
      }
    }

    syncDifficultyControls();
    if (hasActiveSession) autoSave();

    if (!options.silent) {
      if (cfg.id === 'fixed_n1') {
        showToast('🔥 已切換至【N1 魔境挑戰】：全題庫鎖定 N1，戰鬥勝利享 EXP ×2 與掉落率 ×2！', 'gold');
      } else {
        showToast(`🎯 題庫難度已切換為【${cfg.label}】`, 'info');
      }
    }
  }

  function setAdaptiveStartJlpt(jlpt, options = {}) {
    const next = jlpt === 'N3' ? 'N3' : 'N4';
    state.settings.adaptiveStartJlpt = next;
    if (battle && battle.active && state.settings.difficultyMode === 'adaptive') {
      battle.adaptiveLevelIdx = Math.max(getAdaptiveRegionFloorIdx(battle.regionId), next === 'N3' ? 1 : 0);
      updateBattleUI();
    }
    syncDifficultyControls();
    if (hasActiveSession) autoSave();
    if (!options.silent) {
      showToast(`⚡ 動態自適應起步難度已設為【從 ${next} 起步】`, 'info');
    }
  }

  function updateHUD() {
    if (!hasActiveSession) return;
    const stats = getTotalStats();
    const p = state.player;
    p.hp = clamp(p.hp, 0, stats.maxHp);
    p.mp = clamp(p.mp, 0, stats.maxMp);

    const avatarEl = $('hud-avatar');
    if (avatarEl) avatarEl.innerHTML = Art.hero(p.jobId);
    const nameEl = $('hud-name');
    if (nameEl) nameEl.textContent = p.name;
    const lvEl = $('hud-level');
    if (lvEl) lvEl.textContent = `Lv.${p.level}`;
    const titleEl = $('hud-title');
    if (titleEl) titleEl.textContent = p.activeTitle || '初醒的旅人';

    const hpPct = stats.maxHp > 0 ? Math.round((p.hp / stats.maxHp) * 100) : 0;
    const mpPct = stats.maxMp > 0 ? Math.round((p.mp / stats.maxMp) * 100) : 0;
    const expPct = p.nextExp > 0 ? Math.min(100, Math.round((p.exp / p.nextExp) * 100)) : 0;

    if ($('hud-hp-bar')) $('hud-hp-bar').style.width = `${hpPct}%`;
    if ($('hud-hp-text')) $('hud-hp-text').textContent = `HP ${p.hp}/${stats.maxHp}`;
    if ($('hud-mp-bar')) $('hud-mp-bar').style.width = `${mpPct}%`;
    if ($('hud-mp-text')) $('hud-mp-text').textContent = `MP ${p.mp}/${stats.maxMp}`;
    if ($('hud-exp-bar')) $('hud-exp-bar').style.width = `${expPct}%`;
    if ($('hud-exp-text')) $('hud-exp-text').textContent = `EXP ${p.exp}/${p.nextExp}`;

    if ($('hud-gold')) $('hud-gold').textContent = String(p.gold);
    if ($('hud-sp')) $('hud-sp').textContent = String(p.sp);

    applyFuriganaSetting();
    syncAudioButtons();
    syncDifficultyControls();
  }

  function updateChromeVisibility(viewName) {
    const hud = $('top-hud');
    const nav = $('nav-bar');
    const hideHud = viewName === 'title' || viewName === 'create';
    const hideNav =
      hideHud ||
      viewName === 'battle' ||
      (viewName === 'shrine' && shrine.active);

    if (hud) hud.classList.toggle('hidden', hideHud);
    if (nav) nav.classList.toggle('hidden', hideNav);

    document.querySelectorAll('#nav-bar .nav-btn').forEach((btn) => {
      const target = btn.getAttribute('data-view');
      const active =
        target === viewName ||
        (viewName === 'explore' && target === 'map');
      btn.classList.toggle('active', active);
    });
  }

  function switchView(viewName) {
    // Support shorthand aliases gracefully
    if (viewName === 'char') viewName = 'character';
    if (viewName === 'inv') viewName = 'inventory';

    if (currentView !== viewName) {
      stopTypewriter();
      Audio.stopSpeak();
      if (currentView === 'battle' && viewName !== 'battle') {
        stopBattleTimers();
      }
      if (currentView === 'shrine' && viewName !== 'shrine' && shrine.active) {
        stopShrineTimer();
        shrine.active = false;
      }
    }

    currentView = viewName;

    document.querySelectorAll('.game-view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${viewName}`);
    });

    updateChromeVisibility(viewName);

    // BGM routing
    if (viewName === 'title' || viewName === 'create') {
      Audio.playBGM('title');
    } else if (viewName === 'battle') {
      Audio.playBGM(battle.enemy && battle.enemy.isBoss ? 'boss' : 'battle');
    } else if (viewName === 'shrine' && shrine.active) {
      Audio.playBGM('battle');
    } else {
      Audio.playBGM('town');
    }

    if (hasActiveSession) {
      checkAchievements();
      updateHUD();
    }

    switch (viewName) {
      case 'title': renderTitle(); break;
      case 'create': renderCreate(); break;
      case 'town': renderTown(); break;
      case 'map': renderMap(); break;
      case 'explore': renderExplore(); break;
      case 'battle': renderBattle(); break;
      case 'reading': renderReading(); break;
      case 'shrine': renderShrine(); break;
      case 'character': renderCharacter(); break;
      case 'skills': renderSkills(); break;
      case 'inventory': renderInventory(); break;
      case 'quests': renderQuests(); break;
      case 'codex': renderCodex(); break;
      default: break;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ============================================================================
  // 10. Title Screen & Character Creation
  // ============================================================================
  function renderTitle() {
    const slot = $('title-logo-slot');
    if (slot) slot.innerHTML = Art.logo();

    const latestKey = findLatestSaveKey();
    const contBtn = $('btn-title-continue');
    if (contBtn) {
      contBtn.classList.toggle('hidden', !latestKey);
    }
  }

  function renderCreate() {
    const jobs = getJobs();
    if (!createSelectedJobId || !jobs.some((j) => j.id === createSelectedJobId)) {
      createSelectedJobId = jobs[0] ? jobs[0].id : 'scholar';
    }

    const cardsEl = $('create-job-cards');
    if (cardsEl) {
      cardsEl.innerHTML = jobs.map((job) => {
        const base = getJobBaseStats(job);
        const selected = job.id === createSelectedJobId;
        return `
          <button type="button" class="job-card ${selected ? 'selected' : ''}" data-job-id="${escapeHtml(job.id)}">
            <div class="job-card-portrait">${Art.hero(job.id, selected ? 'victory' : 'idle')}</div>
            <div class="job-card-title">${escapeHtml(job.name)}</div>
            <div class="text-gold" style="font-size:0.82rem;margin-bottom:6px;">${escapeHtml(job.focus || job.title || job.subtitle || '')}</div>
            <div class="job-card-desc">${escapeHtml(job.desc || job.description || '')}</div>
            <div style="display:flex;justify-content:center;gap:8px;margin-top:8px;font-size:0.78rem;" class="text-cyan">
              <span>INT ${base.INT}</span>
              <span>WIS ${base.WIS}</span>
              <span>CHA ${base.CHA}</span>
            </div>
          </button>
        `;
      }).join('');

      cardsEl.querySelectorAll('.job-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          createSelectedJobId = btn.getAttribute('data-job-id');
          createPreviewPose = 'idle';
          Audio.playSFX('click');
          renderCreate();
        });
      });
    }

    const selectedJob = getJobById(createSelectedJobId);
    const base = getJobBaseStats(selectedJob);
    const starterWpnId = getJobStarterWeaponId(selectedJob);
    const starterWpn = getItemById(starterWpnId);

    const previewEl = $('create-hero-preview');
    if (previewEl) {
      const poseOpts = [
        { id: 'idle', label: '待機' },
        { id: 'attack', label: '出擊' },
        { id: 'hurt', label: '受擊' },
        { id: 'victory', label: '勝利' }
      ];
      previewEl.innerHTML = `
        <div class="create-portrait-frame stage-pose-${escapeHtml(createPreviewPose)}">${Art.hero(selectedJob.id, createPreviewPose)}</div>
        <div class="pose-preview-bar" role="group" aria-label="預覽動作差分">
          ${poseOpts.map((po) => `<button type="button" class="pose-pill ${createPreviewPose === po.id ? 'active' : ''}" data-preview-pose="${po.id}">${po.label}</button>`).join('')}
        </div>
        <h3 style="text-align:center;margin:2px 0 0;color:var(--gold-bright);">${escapeHtml(selectedJob.name)}</h3>
        ${selectedJob.jpName ? `<div class="jp-text text-cyan" style="text-align:center;font-size:0.86rem;margin-top:2px;">${selectedJob.jpName}</div>` : ''}
        <p class="text-muted" style="text-align:center;font-size:0.88rem;margin:4px 0 0;">${escapeHtml(selectedJob.focus || selectedJob.passive || selectedJob.trait || selectedJob.title || '')}</p>
      `;
      previewEl.querySelectorAll('[data-preview-pose]').forEach((pBtn) => {
        pBtn.addEventListener('click', () => {
          createPreviewPose = pBtn.getAttribute('data-preview-pose') || 'idle';
          Audio.playSFX('click');
          renderCreate();
        });
      });
    }

    const statsEl = $('create-stats-preview');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="char-stats-grid" style="margin-top:12px;">
          <div class="stat-tile"><span class="stat-tile-label">HP</span><span class="stat-tile-value text-emerald">${base.hp}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">MP</span><span class="stat-tile-value text-cyan">${base.mp}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">智力 INT</span><span class="stat-tile-value">${base.INT}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">智慧 WIS</span><span class="stat-tile-value">${base.WIS}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">魅力 CHA</span><span class="stat-tile-value">${base.CHA}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">初始武器</span><span class="stat-tile-value text-gold" style="font-size:0.86rem;">${escapeHtml(starterWpn ? starterWpn.name : '旅人之筆')}</span></div>
        </div>
      `;
    }

    // Difficulty Mode Selector in Character Creation
    const diffGrid = $('create-difficulty-cards');
    if (diffGrid) {
      diffGrid.innerHTML = DIFFICULTY_MODES.map((m) => {
        const selected = m.id === createSelectedDifficultyMode;
        const isN1 = m.id === 'fixed_n1';
        return `
          <button type="button" class="diff-mode-card ${selected ? 'selected' : ''} ${isN1 ? 'mode-n1' : ''}" data-diff-mode="${m.id}">
            <div class="diff-mode-head">
              <span class="diff-mode-title">${escapeHtml(m.label)}</span>
              <span class="diff-mode-tag ${isN1 ? 'tag-n1' : ''}">${escapeHtml(m.tag)}</span>
            </div>
            <div class="diff-mode-desc">${escapeHtml(m.desc)}</div>
          </button>
        `;
      }).join('');

      diffGrid.querySelectorAll('[data-diff-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          createSelectedDifficultyMode = btn.getAttribute('data-diff-mode') || 'adaptive';
          Audio.playSFX('click');
          renderCreate();
        });
      });
    }

    const startRow = $('create-adaptive-start-row');
    if (startRow) {
      startRow.classList.toggle('hidden', createSelectedDifficultyMode !== 'adaptive');
      startRow.querySelectorAll('[data-adaptive-start]').forEach((btn) => {
        const val = btn.getAttribute('data-adaptive-start');
        btn.classList.toggle('active', val === createAdaptiveStartJlpt);
        btn.onclick = () => {
          createAdaptiveStartJlpt = val === 'N3' ? 'N3' : 'N4';
          Audio.playSFX('click');
          renderCreate();
        };
      });
    }
  }

  function confirmCharacterCreation() {
    const input = $('create-name-input');
    const name = input && input.value.trim() ? input.value.trim().slice(0, 12) : '旅人';
    const job = getJobById(createSelectedJobId);
    const base = getJobBaseStats(job);
    const starterWeapon = getJobStarterWeaponId(job);

    state = createDefaultState();
    state.player.name = name;
    state.player.jobId = job.id;
    state.player.hp = base.hp;
    state.player.maxHp = base.hp;
    state.player.mp = base.mp;
    state.player.maxMp = base.mp;
    state.player.baseINT = base.INT;
    state.player.baseWIS = base.WIS;
    state.player.baseCHA = base.CHA;
    state.player.equipment.weapon = starterWeapon;
    state.settings.difficultyMode = getDifficultyModeConfig(createSelectedDifficultyMode).id;
    state.settings.adaptiveStartJlpt = createAdaptiveStartJlpt === 'N3' ? 'N3' : 'N4';

    // Ensure full derived HP/MP including starter weapon bonus
    const total = getTotalStats();
    state.player.hp = total.maxHp;
    state.player.mp = total.maxMp;

    hasActiveSession = true;
    townState.selectedNpcId = null;
    exploreLogs = [];

    const modeCfg = getDifficultyModeConfig(state.settings.difficultyMode);
    Audio.init();
    Audio.playSFX('levelup');
    autoSave();
    showToast(`✨ 記憶甦醒！${name}（${job.name}）以【${modeCfg.label}】踏上言霊大陸！`, 'gold');
    switchView('town');
  }

  // ============================================================================
  // 11. Town Hub, Typewriter NPC Dialogue, Affection & Shop/Enhance Modal
  // ============================================================================
  function tokenizeHtmlForTypewriter(html) {
    const tokens = [];
    const str = String(html || '');
    let i = 0;
    while (i < str.length) {
      if (str[i] === '<') {
        // Keep entire <ruby>...</ruby> block atomic so furigana never breaks mid-type
        if (/^<ruby\b/i.test(str.slice(i))) {
          const endRuby = str.toLowerCase().indexOf('</ruby>', i);
          if (endRuby !== -1) {
            tokens.push(str.slice(i, endRuby + 7));
            i = endRuby + 7;
            continue;
          }
        }
        const close = str.indexOf('>', i);
        if (close !== -1) {
          tokens.push(str.slice(i, close + 1));
          i = close + 1;
          continue;
        }
      }
      tokens.push(str[i]);
      i += 1;
    }
    return tokens;
  }

  function stopTypewriter() {
    if (townState.typingTimerId) {
      clearInterval(townState.typingTimerId);
      townState.typingTimerId = null;
    }
    townState.typingActive = false;
  }

  function completeTypewriterImmediately() {
    if (!townState.typingActive) return;
    stopTypewriter();
    const jpEl = $('dialogue-text-jp');
    const zhEl = $('dialogue-text-zh');
    if (jpEl) jpEl.innerHTML = townState.typingFullJp;
    if (zhEl) zhEl.innerHTML = townState.typingFullZh;
  }

  function runTypewriter(jpHtml, zhText) {
    stopTypewriter();
    const jpEl = $('dialogue-text-jp');
    const zhEl = $('dialogue-text-zh');
    townState.typingFullJp = jpHtml || '';
    townState.typingFullZh = zhText || '';

    const jpTokens = tokenizeHtmlForTypewriter(townState.typingFullJp);
    const zhChars = Array.from(townState.typingFullZh);

    if (jpEl) jpEl.innerHTML = '';
    if (zhEl) zhEl.textContent = '';

    townState.typingActive = true;
    let jpIdx = 0;
    let zhIdx = 0;

    townState.typingTimerId = setInterval(() => {
      if (jpIdx < jpTokens.length) {
        // Emit non-tag visible token + any contiguous tags in one tick
        let chunk = '';
        while (jpIdx < jpTokens.length) {
          const t = jpTokens[jpIdx++];
          chunk += t;
          if (!/^<(?!ruby\b)/i.test(t)) break;
        }
        if (jpEl) jpEl.innerHTML += chunk;
      } else if (zhIdx < zhChars.length) {
        const step = zhChars.slice(zhIdx, zhIdx + 2).join('');
        zhIdx += 2;
        if (zhEl) zhEl.textContent += step;
      } else {
        stopTypewriter();
      }
    }, 24);
  }

  function renderTown() {
    const npcs = getNPCs();
    const grid = $('town-npc-grid');
    if (!grid) return;

    grid.innerHTML = npcs.map((npc) => {
      const nState = state.npc[npc.id] || { affection: 0 };
      const selected = townState.selectedNpcId === npc.id;
      return `
        <button type="button" class="npc-card ${selected ? 'selected' : ''}" data-npc-id="${escapeHtml(npc.id)}">
          <div class="npc-avatar">${Art.npc(npc.id, 'neutral')}</div>
          <div style="flex:1;text-align:left;">
            <div class="npc-name">${escapeHtml(npc.name)}</div>
            <div class="npc-role">${escapeHtml(npc.title || npc.role || '')}</div>
            <div class="stat-bar affection-bar" style="height:14px;margin-top:6px;">
              <div class="stat-bar-fill" style="width:${clamp(nState.affection, 0, 100)}%;"></div>
              <span class="stat-bar-text" style="font-size:0.68rem;">♥ ${nState.affection}/100</span>
            </div>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.npc-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const npcId = btn.getAttribute('data-npc-id');
        Audio.playSFX('click');
        selectTownNPC(npcId);
      });
    });

    if (townState.selectedNpcId) {
      renderTownDialoguePanel(false);
    } else if (npcs.length > 0) {
      selectTownNPC(npcs[0].id);
    }
  }

  function selectTownNPC(npcId) {
    const npc = getNPCById(npcId);
    if (!npc) return;
    townState.selectedNpcId = npcId;
    townState.awaitingNext = false;

    const dialogues = Array.isArray(npc.dialogues) ? npc.dialogues : [];
    const talked = (state.npc[npcId] && state.npc[npcId].talkedIds) || [];
    // Pick first untalked dialogue or cycle
    let nextIdx = dialogues.findIndex((d) => !talked.includes(d.id));
    if (nextIdx === -1) {
      nextIdx = townState.dialogueIndex % Math.max(1, dialogues.length);
    }
    townState.dialogueIndex = nextIdx;
    townState.currentDialogue = dialogues[nextIdx] || null;

    document.querySelectorAll('#town-npc-grid .npc-card').forEach((c) => {
      c.classList.toggle('selected', c.getAttribute('data-npc-id') === npcId);
    });

    renderTownDialoguePanel(true);
  }

  function renderNpcFacilityButton(npcId) {
    if (npcId === 'merchant') {
      return '<button type="button" class="btn btn-gold" id="btn-npc-facility">🏪 開啟商會與鍛造爐</button>';
    }
    if (npcId === 'scholar') {
      return '<button type="button" class="btn btn-primary" id="btn-npc-facility">📚 前往閱讀副本</button>';
    }
    if (npcId === 'priest') {
      return '<button type="button" class="btn btn-gold" id="btn-npc-facility">⛩️ 前往試煉神殿</button>';
    }
    if (npcId === 'mayor') {
      return '<button type="button" class="btn btn-primary" id="btn-npc-facility">📜 查看冒險任務</button>';
    }
    return '';
  }

  function bindNpcFacilityButton(npcId) {
    const btn = $('btn-npc-facility');
    if (!btn) return;
    btn.onclick = () => {
      Audio.playSFX('click');
      if (npcId === 'merchant') openShopModal('buy');
      else if (npcId === 'scholar') switchView('reading');
      else if (npcId === 'priest') switchView('shrine');
      else if (npcId === 'mayor') switchView('quests');
    };
  }

  function renderTownDialoguePanel(animateText = true, overrideEmotion = null) {
    const npc = getNPCById(townState.selectedNpcId);
    if (!npc) return;

    const nState = state.npc[npc.id] || { affection: 0, talkedIds: [], claimedMilestones: [] };
    const dlg = townState.currentDialogue;
    const emotion = overrideEmotion || (dlg && dlg.emotion) || npc.defaultEmotion || 'neutral';

    const portraitEl = $('dialogue-portrait');
    if (portraitEl) {
      portraitEl.innerHTML = Art.npc(npc.id, emotion);
      portraitEl.className = portraitEl.className.replace(/\bnpc-state-\S+/g, '').trim();
      void portraitEl.offsetWidth;
      portraitEl.classList.add(`npc-state-${emotion}`);
    }
    const activeNpcCardAvatar = document.querySelector(`#town-npc-grid .npc-card[data-npc-id="${npc.id}"] .npc-avatar`);
    if (activeNpcCardAvatar) {
      activeNpcCardAvatar.innerHTML = Art.npc(npc.id, emotion);
    }
    if ($('dialogue-speaker')) $('dialogue-speaker').textContent = npc.name;
    if ($('dialogue-role-tag')) $('dialogue-role-tag').textContent = npc.title || npc.role || '城鎮居民';
    if ($('dialogue-affection-bar')) $('dialogue-affection-bar').style.width = `${clamp(nState.affection, 0, 100)}%`;
    if ($('dialogue-affection-text')) $('dialogue-affection-text').textContent = `好感度 ${nState.affection}/100`;

    // Milestones badges
    const msEl = $('dialogue-milestones');
    if (msEl) {
      const milestones = Array.isArray(npc.milestones) && npc.milestones.length > 0
        ? npc.milestones
        : [
            { threshold: 30, label: '30 贈禮' },
            { threshold: 60, label: '60 秘寶' },
            { threshold: 100, label: '100 摯友' }
          ];
      msEl.innerHTML = `<div class="milestone-row">${milestones.map((m) => {
        const th = Number(m.threshold ?? m.affection ?? 30);
        const unlocked = nState.affection >= th || nState.claimedMilestones.includes(th);
        return `<span class="milestone-pill ${unlocked ? 'unlocked' : ''}" title="${escapeHtml(m.rewardText || m.desc || m.title || '')}">♥${th} ${unlocked ? '✔' : '🔒'}</span>`;
      }).join('')}</div>`;
    }

    if (animateText && dlg) {
      const lineJp = dlg.npcLineJp || dlg.jp || dlg.text || npc.greetingJp || '';
      const lineZh = dlg.npcLineZh || dlg.zh || dlg.translation || npc.greeting || '';
      townState.currentTts = dlg.tts || stripRubyHtml(lineJp);
      runTypewriter(lineJp, lineZh);
      if ($('dialogue-feedback')) $('dialogue-feedback').innerHTML = '';
    }

    const choicesEl = $('dialogue-choices');
    const actionsEl = $('dialogue-actions');

    if (choicesEl) {
      if (dlg && !townState.awaitingNext && Array.isArray(dlg.choices) && dlg.choices.length > 0) {
        choicesEl.innerHTML = dlg.choices.map((ch, idx) => `
          <button type="button" class="dialogue-choice-btn" data-choice-idx="${idx}">
            <div class="jp-text">${ch.jp || ch.text || ''}</div>
            ${ch.zh ? `<div class="text-muted" style="font-size:0.84rem;margin-top:3px;">${escapeHtml(ch.zh)}</div>` : ''}
          </button>
        `).join('');
        choicesEl.querySelectorAll('.dialogue-choice-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const idx = Number(btn.getAttribute('data-choice-idx'));
            handleDialogueChoice(npc, dlg, idx);
          });
        });
      } else {
        choicesEl.innerHTML = '';
      }
    }

    if (actionsEl) {
      const nextBtnHtml = townState.awaitingNext
        ? '<button type="button" class="btn btn-secondary" id="btn-dialogue-next">💬 繼續交談</button>'
        : '';
      actionsEl.innerHTML = `${nextBtnHtml}${renderNpcFacilityButton(npc.id)}`;
      const nextBtn = $('btn-dialogue-next');
      if (nextBtn) {
        nextBtn.onclick = () => {
          Audio.playSFX('click');
          const dialogues = Array.isArray(npc.dialogues) ? npc.dialogues : [];
          townState.dialogueIndex = (townState.dialogueIndex + 1) % Math.max(1, dialogues.length);
          townState.currentDialogue = dialogues[townState.dialogueIndex] || null;
          townState.awaitingNext = false;
          renderTownDialoguePanel(true);
        };
      }
      bindNpcFacilityButton(npc.id);
    }
  }

  function handleDialogueChoice(npc, dlg, choiceIdx) {
    const choice = dlg.choices && dlg.choices[choiceIdx];
    if (!choice) return;

    completeTypewriterImmediately();
    const nState = state.npc[npc.id];
    const stats = getTotalStats();
    const baseDelta = Number(choice.affectionDelta ?? choice.affection ?? 10);
    const chaBonus = baseDelta > 0 ? stats.chaAffectionBonus : 0;
    const totalDelta = baseDelta + chaBonus;

    nState.affection = clamp(nState.affection + totalDelta, 0, 100);
    if (dlg.id && !nState.talkedIds.includes(dlg.id)) {
      nState.talkedIds.push(dlg.id);
    }

    state.stats.npcTalks += 1;
    state.quests.dailyProgress.npc_talk += 1;

    const emotion = choice.replyEmotion || (baseDelta >= 10 ? 'happy' : baseDelta <= 0 ? 'surprised' : 'serious');
    townState.awaitingNext = true;

    const replyJp = choice.replyJp || choice.reply || '';
    const replyZh = choice.replyZh || choice.replyTranslation || '';
    townState.currentTts = choice.replyTts || stripRubyHtml(replyJp);

    if (baseDelta > 0) Audio.playSFX('correct');
    else Audio.playSFX('click');

    if (replyJp || replyZh) {
      runTypewriter(replyJp, replyZh);
    }

    const fbEl = $('dialogue-feedback');
    if (fbEl) {
      const bonusNote = chaBonus > 0 ? `（含魅力 CHA 加成 +${chaBonus}）` : '';
      const deltaBadge = totalDelta >= 0
        ? `<span class="badge badge-emerald">♥ 好感度 +${totalDelta}${bonusNote}</span>`
        : `<span class="badge badge-crimson">♥ 好感度 ${totalDelta}</span>`;
      const cultural = choice.feedback || choice.culturalNote || choice.note || '';
      fbEl.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:6px;">${deltaBadge}</div>
        ${cultural ? `<div style="font-size:0.9rem;color:var(--text-main);">${cultural}</div>` : ''}
      `;
    }

    checkNpcMilestones(npc, nState);
    checkAchievements();
    autoSave();
    updateHUD();

    // Update left NPC grid affection bars without resetting dialogue
    renderTownNpcCardsOnly();
    renderTownDialoguePanel(false, emotion);
  }

  function renderTownNpcCardsOnly() {
    document.querySelectorAll('#town-npc-grid .npc-card').forEach((card) => {
      const nid = card.getAttribute('data-npc-id');
      const nState = state.npc[nid] || { affection: 0 };
      const fill = card.querySelector('.stat-bar-fill');
      const txt = card.querySelector('.stat-bar-text');
      if (fill) fill.style.width = `${clamp(nState.affection, 0, 100)}%`;
      if (txt) txt.textContent = `♥ ${nState.affection}/100`;
    });
  }

  function checkNpcMilestones(npc, nState) {
    const milestones = Array.isArray(npc.milestones) ? npc.milestones : [];
    milestones.forEach((m) => {
      const th = Number(m.threshold ?? m.affection ?? 30);
      if (nState.affection >= th && !nState.claimedMilestones.includes(th)) {
        nState.claimedMilestones.push(th);
        const rew = m.reward || m.rewards || m;
        const gainedParts = [];
        if (rew.gold) {
          gainGold(rew.gold);
          gainedParts.push(`🪙 ${rew.gold} 金幣`);
        }
        if (rew.exp) {
          gainExp(rew.exp);
          gainedParts.push(`⭐ ${rew.exp} EXP`);
        }
        if (rew.sp) {
          state.player.sp += Number(rew.sp);
          gainedParts.push(`✨ ${rew.sp} SP`);
        }
        if (rew.itemId) {
          addItem(rew.itemId, rew.qty || 1);
          const it = getItemById(rew.itemId);
          gainedParts.push(`🎁 ${it ? it.name : rew.itemId}`);
        }
        if (rew.title) {
          grantTitle(rew.title);
          gainedParts.push(`👑 稱號「${rew.title}」`);
        }
        Audio.playSFX('levelup');
        showToast(
          `💖 達成【${npc.name}】好感度 ${th} 里程碑！獲得：${gainedParts.join('、') || (m.desc || '專屬祝福')}`,
          'gold'
        );
      }
    });
  }

  // ---- Shop & Enhancement Modal ----
  function openShopModal(tab = 'buy') {
    uiTabs.shop = tab;
    document.querySelectorAll('#shop-tabs .tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === tab);
    });
    renderShopModal();
    openModal('modal-shop');
  }

  function renderShopModal() {
    const stats = getTotalStats();
    const banner = $('shop-discount-banner');
    if (banner) {
      banner.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;">
          <span>🪙 持有金幣：<strong class="text-gold">${state.player.gold}</strong></span>
          <span>
            ✨ 商會折扣：<strong class="text-emerald">-${stats.totalShopDiscount}%</strong>
            <span class="text-muted" style="font-size:0.84rem;">（魅力 CHA -${stats.chaShopDiscount}% + 言靈交涉 -${stats.skillShopDiscount}%）</span>
          </span>
        </div>
      `;
    }

    const content = $('shop-content');
    if (!content) return;

    if (uiTabs.shop === 'buy') {
      const items = getItems().filter((it) => it.shoppable !== false && it.shop !== false && it.buyable !== false && Number(it.price ?? it.cost ?? 0) > 0);
      if (items.length === 0) {
        content.innerHTML = '<p class="empty-hint">商會目前沒有上架商品。</p>';
        return;
      }
      content.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;">
        ${items.map((item) => {
          const basePrice = Number(item.price ?? item.cost ?? 50);
          const finalPrice = getShopBuyPrice(item);
          const owned = getItemQty(item.id) + (isItemEquipped(item.id) ? 1 : 0);
          const statBadges = renderItemStatTags(item, 0);
          const canAfford = state.player.gold >= finalPrice;
          return `
            <div class="panel-card" style="padding:14px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;flex-shrink:0;">${Art.itemIcon(item)}</div>
                <div style="flex:1;">
                  <div style="font-weight:700;">${escapeHtml(item.name)}</div>
                  <div style="display:flex;gap:6px;align-items:center;margin-top:2px;">
                    <span class="rarity-badge rarity-${item.rarity || 'common'}">${RARITY_LABELS[item.rarity] || '普通'}</span>
                    <span class="text-muted" style="font-size:0.78rem;">持有：${owned}</span>
                  </div>
                </div>
              </div>
              <div style="font-size:0.84rem;" class="text-muted">${escapeHtml(item.desc || item.description || '')}</div>
              ${statBadges ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${statBadges}</div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:6px;">
                <div>
                  ${finalPrice < basePrice ? `<span class="text-muted" style="text-decoration:line-through;font-size:0.8rem;margin-right:6px;">${basePrice}</span>` : ''}
                  <strong class="text-gold">🪙 ${finalPrice}</strong>
                </div>
                <button type="button" class="btn btn-sm ${canAfford ? 'btn-gold' : 'btn-secondary'}" data-buy-id="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>購買</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>`;

      content.querySelectorAll('[data-buy-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const item = getItemById(btn.getAttribute('data-buy-id'));
          if (!item) return;
          const cost = getShopBuyPrice(item);
          if (state.player.gold < cost) {
            showToast('金幣不足！', 'error');
            return;
          }
          state.player.gold -= cost;
          addItem(item.id, 1);
          Audio.playSFX('chest');
          showToast(`🛒 購買了【${item.name}】（-${cost} 金幣）`, 'success');
          autoSave();
          updateHUD();
          renderShopModal();
        });
      });
    } else if (uiTabs.shop === 'enhance') {
      // Gather all unique owned + equipped gear
      const gearIds = new Set();
      ['weapon', 'armor', 'accessory'].forEach((s) => {
        if (state.player.equipment[s]) gearIds.add(state.player.equipment[s]);
      });
      state.inventory.forEach((entry) => {
        const it = getItemById(entry.id);
        if (it && ['weapon', 'armor', 'accessory'].includes(it.type)) gearIds.add(it.id);
      });

      const gearList = Array.from(gearIds).map(getItemById).filter(Boolean);
      if (gearList.length === 0) {
        content.innerHTML = '<p class="empty-hint">目前沒有可強化的裝備。</p>';
        return;
      }

      content.innerHTML = `<div style="display:flex;flex-direction:column;gap:12px;">
        ${gearList.map((item) => {
          const lv = getItemEnhancementLevel(item.id);
          const isMax = lv >= 5;
          const cost = isMax ? 0 : getEnhanceCost(item, lv);
          const curStats = getEnhancedItemStats(item, lv);
          const nextStats = isMax ? curStats : getEnhancedItemStats(item, lv + 1);
          const equippedTag = isItemEquipped(item.id) ? '<span class="badge badge-gold">裝備中</span>' : '';
          const canAfford = !isMax && state.player.gold >= cost;

          const diffs = ['INT', 'WIS', 'CHA', 'hp', 'mp']
            .filter((k) => curStats[k] > 0 || nextStats[k] > 0)
            .map((k) => isMax
              ? `<span class="pill">${STAT_LABELS[k]} +${curStats[k]}</span>`
              : `<span class="pill">${STAT_LABELS[k]} +${curStats[k]} <b class="text-emerald">→ +${nextStats[k]}</b></span>`
            ).join('');

          return `
            <div class="panel-card" style="padding:14px;display:flex;flex-wrap:wrap;align-items:center;gap:12px;">
              <div style="width:46px;height:46px;flex-shrink:0;">${Art.itemIcon(item)}</div>
              <div style="flex:1;min-width:190px;">
                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                  <strong>${escapeHtml(item.name)} ${lv > 0 ? `<span class="text-gold">+${lv}</span>` : ''}</strong>
                  ${equippedTag}
                  <span class="rarity-badge rarity-${item.rarity || 'common'}">${RARITY_LABELS[item.rarity] || '普通'}</span>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">${diffs}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                ${isMax
                  ? '<span class="badge badge-gold">已達最高 +5</span>'
                  : `<div class="text-gold" style="font-weight:700;">🪙 ${cost}</div>
                     <button type="button" class="btn btn-sm ${canAfford ? 'btn-gold' : 'btn-secondary'}" data-enhance-id="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>⚒️ 強化至 +${lv + 1}</button>`
                }
              </div>
            </div>
          `;
        }).join('')}
      </div>`;

      content.querySelectorAll('[data-enhance-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-enhance-id');
          const item = getItemById(id);
          if (!item) return;
          const lv = getItemEnhancementLevel(id);
          if (lv >= 5) return;
          const cost = getEnhanceCost(item, lv);
          if (state.player.gold < cost) {
            showToast('金幣不足，無法強化！', 'error');
            return;
          }
          state.player.gold -= cost;
          state.player.enhancements[id] = lv + 1;
          state.stats.enhanceCount += 1;
          Audio.playSFX('levelup');
          showToast(`⚒️ 鍛造成功！【${item.name}】提升至 +${lv + 1}！`, 'gold');
          checkAchievements();
          autoSave();
          updateHUD();
          renderShopModal();
        });
      });
    } else if (uiTabs.shop === 'sell') {
      const sellable = state.inventory.filter((e) => e.qty > 0 && getItemById(e.id));
      if (sellable.length === 0) {
        content.innerHTML = '<p class="empty-hint">背包中沒有可出售的物品（已裝備物品須先卸下）。</p>';
        return;
      }
      content.innerHTML = `<div style="display:flex;flex-direction:column;gap:10px;">
        ${sellable.map((entry) => {
          const item = getItemById(entry.id);
          const sp = getSellPrice(item);
          return `
            <div class="panel-card" style="padding:12px;display:flex;align-items:center;gap:12px;">
              <div style="width:40px;height:40px;flex-shrink:0;">${Art.itemIcon(item)}</div>
              <div style="flex:1;">
                <strong>${escapeHtml(item.name)}</strong> <span class="text-muted">x${entry.qty}</span>
                <div class="text-muted" style="font-size:0.82rem;">${escapeHtml(item.desc || item.description || '')}</div>
              </div>
              <div class="text-gold" style="font-weight:700;">+🪙 ${sp}</div>
              <button type="button" class="btn btn-sm btn-secondary" data-sell-id="${escapeHtml(item.id)}">出售 1 個</button>
            </div>
          `;
        }).join('')}
      </div>`;

      content.querySelectorAll('[data-sell-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-sell-id');
          const item = getItemById(id);
          if (!item || !removeItem(id, 1)) return;
          const sp = getSellPrice(item);
          gainGold(sp);
          Audio.playSFX('click');
          showToast(`💰 出售了【${item.name}】，獲得 ${sp} 金幣`, 'info');
          autoSave();
          updateHUD();
          renderShopModal();
        });
      });
    }
  }

  function renderItemStatTags(item, enhLv) {
    const es = getEnhancedItemStats(item, enhLv);
    return ['INT', 'WIS', 'CHA', 'hp', 'mp']
      .filter((k) => es[k] > 0)
      .map((k) => `<span class="pill pill-cyan">${STAT_LABELS[k]} +${es[k]}</span>`)
      .join('');
  }

  // ============================================================================
  // 12. World Map & Region Exploration
  // ============================================================================
  function renderMapDifficultyBar() {
    const bar = $('map-difficulty-bar');
    if (!bar) return;
    const modeId = (state && state.settings && state.settings.difficultyMode) || 'adaptive';
    const startJlpt = (state && state.settings && state.settings.adaptiveStartJlpt) || 'N4';
    const cfg = getDifficultyModeConfig(modeId);
    bar.classList.toggle('mode-n1-active', modeId === 'fixed_n1');

    bar.innerHTML = `
      <div class="map-diff-top-row">
        <div class="map-diff-title">
          <span>🎯 題庫難度模式</span>
          ${modeId === 'fixed_n1' ? '<span class="badge badge-crimson">🔥 EXP ×2・掉落 ×2</span>' : ''}
        </div>
        <div class="map-diff-pills" role="group" aria-label="切換難度模式">
          ${DIFFICULTY_MODES.map((m) => `
            <button type="button" class="map-diff-pill ${m.id === modeId ? 'active' : ''} ${m.id === 'fixed_n1' ? 'pill-n1' : ''}" data-map-diff="${m.id}">
              ${escapeHtml(m.shortLabel)}
            </button>
          `).join('')}
        </div>
      </div>
      <div class="map-diff-meta">
        <span>${escapeHtml(cfg.label)}：${escapeHtml(cfg.desc)}</span>
        ${modeId === 'adaptive' ? `
          <div style="display:flex;align-items:center;gap:6px;">
            <span class="adaptive-start-label">起步：</span>
            <button type="button" class="btn btn-sm adaptive-start-btn ${startJlpt === 'N4' ? 'active' : ''}" data-map-start="N4">N4 起步</button>
            <button type="button" class="btn btn-sm adaptive-start-btn ${startJlpt === 'N3' ? 'active' : ''}" data-map-start="N3">N3 起步</button>
          </div>
        ` : ''}
      </div>
    `;

    bar.querySelectorAll('[data-map-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        setDifficultyMode(btn.getAttribute('data-map-diff'));
      });
    });
    bar.querySelectorAll('[data-map-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        setAdaptiveStartJlpt(btn.getAttribute('data-map-start'));
      });
    });
  }

  function renderMap() {
    renderMapDifficultyBar();
    const regions = getRegions();
    const unlockedIds = regions.filter((r) => isRegionUnlocked(r.id)).map((r) => r.id);

    const countEl = $('map-unlocked-count');
    if (countEl) countEl.textContent = `${unlockedIds.length} / ${regions.length}`;

    const svgWrap = $('world-map-svg-container');
    if (svgWrap) {
      svgWrap.innerHTML = Art.worldMap(
        regions,
        unlockedIds,
        state.progress.defeatedBosses,
        state.progress.currentRegionId
      );

      svgWrap.querySelectorAll('.map-node').forEach((node) => {
        node.addEventListener('click', () => {
          const rid = node.getAttribute('data-region') || node.getAttribute('data-region-id');
          if (!rid) return;
          Audio.playSFX('click');
          mapSelectedRegionId = rid;
          renderMapRegionDetail(rid);
        });
      });
    }

    if (!mapSelectedRegionId || !getRegionById(mapSelectedRegionId)) {
      mapSelectedRegionId = state.progress.currentRegionId || 'r1';
    }
    renderMapRegionDetail(mapSelectedRegionId);
  }

  function renderMapRegionDetail(regionId) {
    const region = getRegionById(regionId);
    const panel = $('map-region-detail');
    if (!panel || !region) return;

    const unlocked = isRegionUnlocked(region.id);
    const defeated = state.progress.defeatedBosses.includes(region.id);
    const explorePct = state.progress.regionExplore[region.id] || 0;
    const boss = getRegionBoss(region.id);
    const normals = getRegionNormalEnemies(region.id);

    const unlockHint = unlocked
      ? (defeated ? '<span class="badge badge-emerald">✔ Boss 已討伐</span>' : '<span class="badge badge-cyan">已解鎖</span>')
      : `<span class="badge badge-crimson">🔒 需達 Lv.${region.unlockLevel || '?'} 或擊敗前一區域 Boss</span>`;

    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
        <h3 style="margin:0;color:var(--gold-bright);">${escapeHtml(region.name)}</h3>
        <span class="jlpt-badge">${escapeHtml(region.jlpt || 'N4')}</span>
      </div>
      <div style="margin-bottom:10px;">${unlockHint}</div>
      <p style="font-size:0.9rem;color:var(--text-muted);margin:0 0 12px;">${escapeHtml(region.desc || region.description || '')}</p>
      <div class="region-stat-grid" style="margin-bottom:12px;">
        <div class="region-stat-box">
          <div class="text-muted" style="font-size:0.76rem;">探索度</div>
          <div class="text-gold" style="font-weight:700;">${explorePct}%</div>
        </div>
        <div class="region-stat-box">
          <div class="text-muted" style="font-size:0.76rem;">區域 Boss</div>
          <div style="font-weight:700;font-size:0.86rem;">${escapeHtml(boss ? boss.name : '未知')}</div>
        </div>
      </div>
      <div style="margin-bottom:14px;">
        <div class="text-muted" style="font-size:0.8rem;margin-bottom:4px;">棲息魔物</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${normals.map((e) => `<span class="pill">${escapeHtml(e.name)}</span>`).join('')}
        </div>
      </div>
      <button id="btn-enter-region" type="button" class="btn ${unlocked ? 'btn-gold' : 'btn-secondary'} btn-block" ${unlocked ? '' : 'disabled'}>
        ${unlocked ? '⚔️ 踏入此區域' : '🔒 尚未解鎖'}
      </button>
    `;

    const enterBtn = $('btn-enter-region');
    if (enterBtn && unlocked) {
      enterBtn.addEventListener('click', () => {
        state.progress.currentRegionId = region.id;
        explorePendingEvent = null;
        Audio.playSFX('confirm');
        autoSave();
        switchView('explore');
      });
    }
  }

  function addExploreLog(text, type = 'story') {
    const ts = new Date().toTimeString().slice(0, 5);
    exploreLogs.unshift({ text, type, ts });
    if (exploreLogs.length > 25) exploreLogs.pop();
    renderExploreLog();
  }

  function renderExploreLog() {
    const logEl = $('explore-log');
    if (!logEl) return;
    if (exploreLogs.length === 0) {
      logEl.innerHTML = '<div class="log-entry log-story">準備好踏入未知的領域了。點擊「前進探索」展開冒險。</div>';
      return;
    }
    logEl.innerHTML = exploreLogs
      .map((l) => `<div class="log-entry log-${l.type}"><span class="text-muted">[${l.ts}]</span> ${l.text}</div>`)
      .join('');
  }

  function renderExplore() {
    const region = getRegionById(state.progress.currentRegionId) || getRegions()[0];
    if (!region) return;
    const pct = clamp(state.progress.regionExplore[region.id] || 0, 0, 100);
    const bossReady = pct >= 100 || state.progress.defeatedBosses.includes(region.id);
    const boss = getRegionBoss(region.id);

    if ($('explore-region-title')) $('explore-region-title').textContent = region.name;
    if ($('explore-region-jlpt')) $('explore-region-jlpt').textContent = region.jlpt || 'N4';
    if ($('explore-progress-text')) $('explore-progress-text').textContent = `${pct}%`;
    if ($('explore-progress-bar')) $('explore-progress-bar').style.width = `${pct}%`;

    const bossBtn = $('btn-explore-boss');
    if (bossBtn) {
      bossBtn.disabled = !bossReady;
      bossBtn.classList.toggle('aura-pulse', bossReady);
      bossBtn.textContent = bossReady
        ? `👹 挑戰 Boss：${boss ? boss.name : '區域首領'}`
        : '🔒 區域 Boss（探索達 100% 解鎖）';
    }

    const stepBtn = $('btn-explore-step');
    if (stepBtn) {
      stepBtn.disabled = Boolean(explorePendingEvent);
      stepBtn.textContent = pct >= 100 ? '👹 直面區域 Boss！' : '🧭 前進探索 (+25%)';
    }

    if (!explorePendingEvent) {
      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, pct >= 100 ? 'boss' : 'step');
      if ($('explore-event-title')) {
        $('explore-event-title').textContent = pct >= 100
          ? `⚠️ ${boss ? boss.name : '區域 Boss'} 正在深處等待`
          : `${region.name}・荒野行進`;
      }
      if ($('explore-event-desc')) {
        $('explore-event-desc').textContent = pct >= 100
          ? '區域探索已達 100%！你可以直接點擊「挑戰 Boss」迎戰守護首領，或先整備道具與技能。'
          : (region.desc || '點擊「前進探索」深入探索領域，可能遭遇魔物、古代寶箱、路邊事件或營火休憩。');
      }
      if ($('explore-event-choices')) $('explore-event-choices').innerHTML = '';
    }

    renderExploreLog();
  }

  function handleExploreStep() {
    if (explorePendingEvent) return;
    const region = getRegionById(state.progress.currentRegionId);
    if (!region) return;

    const prevPct = clamp(state.progress.regionExplore[region.id] || 0, 0, 100);
    if (prevPct >= 100) {
      triggerRegionBossBattle(region.id);
      return;
    }

    const nextPct = Math.min(100, prevPct + 25);
    state.progress.regionExplore[region.id] = nextPct;
    autoSave();

    // Reaching 100% triggers Boss Awakening alert!
    if (nextPct >= 100) {
      const boss = getRegionBoss(region.id);
      Audio.playSFX('boss_enter');
      addExploreLog(`🔥 探索度達到 100%！強大魔氣湧現——區域首領【${boss ? boss.name : 'Boss'}】現身了！`, 'battle');
      renderExplore();
      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, 'boss');
      if ($('explore-event-title')) $('explore-event-title').textContent = `💀 區域首領現身：${boss ? boss.name : 'Boss'}`;
      if ($('explore-event-desc')) $('explore-event-desc').textContent = '深處的古老封印已鬆動！點擊「挑戰 Boss」或再次前進即可展開首領對決！';
      showToast(`⚠️ 區域探索 100%！【${boss ? boss.name : '區域 Boss'}】已可挑戰！`, 'warning');
      return;
    }

    // Weighted random encounter (< 100%)
    const roll = Math.random();
    if (roll < 0.55) {
      // Monster Battle (55%)
      const normals = getRegionNormalEnemies(region.id);
      const enemy = normals[Math.floor(Math.random() * normals.length)];
      if (enemy) {
        addExploreLog(`⚔️ 遭遇野生魔物【${enemy.name}】！準備進行言霊對決！`, 'battle');
        startBattle(enemy, { returnView: 'explore' });
      }
    } else if (roll < 0.73) {
      // Ancient Treasure Chest (18%)
      const diff = Number(region.difficulty || 1);
      const goldFound = 25 + diff * 18 + Math.floor(Math.random() * 20);
      const dropPool = ['con_herb', 'con_water', 'con_break_scroll', 'con_fever_charm'];
      const dropId = dropPool[Math.floor(Math.random() * dropPool.length)];
      const dropItem = getItemById(dropId);

      gainGold(goldFound);
      if (dropItem) addItem(dropItem.id, 1);
      Audio.playSFX('chest');
      autoSave();
      updateHUD();
      renderExplore();

      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, 'chest');
      if ($('explore-event-title')) $('explore-event-title').textContent = '🎁 發現古代言霊寶箱！';
      if ($('explore-event-desc')) {
        $('explore-event-desc').textContent = `開啟刻有古假名封印的寶箱，獲得 🪙 ${goldFound} 金幣${dropItem ? ` 與【${dropItem.name}】x1` : ''}！`;
      }
      addExploreLog(`🎁 發現古代寶箱！獲得 ${goldFound} 金幣${dropItem ? `與【${dropItem.name}】` : ''}。`, 'loot');
      showToast(`🎁 獲得 ${goldFound} 金幣${dropItem ? ` + ${dropItem.name}` : ''}！`, 'gold');
    } else if (roll < 0.88) {
      // Roadside Story Event (15%)
      const events = Array.isArray(region.events) && region.events.length > 0
        ? region.events
        : [{
            id: 'fallback_stele',
            title: '古代文字石碑',
            desc: '路旁矗立著覆滿青苔的古老石碑，微弱的言霊光輝正等待旅人解讀。',
            choices: [
              { label: '📖 仔細研讀碑文', outcome: '你解讀出失傳的語法片語，思緒變得更加清明！', reward: { exp: 35, mp: 15 } },
              { label: '🔍 搜尋石碑周圍', outcome: '在石碑基座縫隙中拾得旅人遺落的錢袋！', reward: { gold: 45 } }
            ]
          }];
      const ev = events[Math.floor(Math.random() * events.length)];
      presentRoadsideEvent(region, ev);
    } else {
      // Campfire Rest (12%)
      const stats = getTotalStats();
      const healHp = Math.round(stats.maxHp * 0.5);
      const healMp = Math.round(stats.maxMp * 0.5);
      state.player.hp = Math.min(stats.maxHp, state.player.hp + healHp);
      state.player.mp = Math.min(stats.maxMp, state.player.mp + healMp);
      Audio.playSFX('heal');
      autoSave();
      updateHUD();
      renderExplore();

      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, 'camp');
      if ($('explore-event-title')) $('explore-event-title').textContent = '🔥 旅途營火休憩';
      if ($('explore-event-desc')) {
        $('explore-event-desc').textContent = `你在避風處燃起溫暖營火，稍作整頓並溫習旅途筆記。回復 HP +${healHp}、MP +${healMp}！`;
      }
      addExploreLog(`🔥 營火休憩，回復 HP +${healHp}、MP +${healMp}。`, 'heal');
    }
  }

  function presentRoadsideEvent(region, ev) {
    explorePendingEvent = ev;
    Audio.playSFX('click');
    renderExplore();

    if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, 'event');
    if ($('explore-event-title')) $('explore-event-title').textContent = `🗿 路邊奇遇：${ev.title || '神祕遺跡'}`;
    if ($('explore-event-desc')) {
      const quoteHtml = ev.jpQuote ? `<div class="jp-text text-gold" style="margin-top:8px;">「${ev.jpQuote}」</div>` : '';
      $('explore-event-desc').innerHTML = `${ev.desc || ev.text || ''}${quoteHtml}`;
    }

    const choicesEl = $('explore-event-choices');
    if (choicesEl) {
      const choices = Array.isArray(ev.choices) ? ev.choices : [];
      choicesEl.innerHTML = choices.map((ch, idx) => `
        <button type="button" class="btn btn-secondary" data-ev-choice="${idx}">
          ${ch.label || ch.text || `選擇 ${idx + 1}`}
        </button>
      `).join('');

      choicesEl.querySelectorAll('[data-ev-choice]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-ev-choice'));
          resolveRoadsideChoice(region, ev, choices[idx]);
        });
      });
    }
  }

  function resolveRoadsideChoice(region, ev, choice) {
    explorePendingEvent = null;
    if (!choice) {
      renderExplore();
      return;
    }

    const rew = choice.reward || choice.effect || choice;
    const stats = getTotalStats();
    const parts = [];

    if (rew.gold) {
      gainGold(rew.gold);
      parts.push(`🪙 +${rew.gold} 金幣`);
    }
    if (rew.exp) {
      gainExp(rew.exp);
      parts.push(`⭐ +${rew.exp} EXP`);
    }
    if (rew.hpPct) {
      const h = Math.round((stats.maxHp * Number(rew.hpPct)) / 100);
      if (h !== 0) {
        state.player.hp = clamp(state.player.hp + h, 1, stats.maxHp);
        parts.push(`💚 HP ${h >= 0 ? '+' : ''}${h}`);
      }
    } else if (rew.hp) {
      const h = Math.round(rew.hp);
      state.player.hp = clamp(state.player.hp + h, 1, stats.maxHp);
      parts.push(`💚 HP ${h >= 0 ? '+' : ''}${h}`);
    }
    if (rew.mpPct) {
      const m = Math.round((stats.maxMp * Number(rew.mpPct)) / 100);
      if (m !== 0) {
        state.player.mp = clamp(state.player.mp + m, 0, stats.maxMp);
        parts.push(`💧 MP ${m >= 0 ? '+' : ''}${m}`);
      }
    } else if (rew.mp) {
      const m = Math.round(rew.mp);
      state.player.mp = clamp(state.player.mp + m, 0, stats.maxMp);
      parts.push(`💧 MP ${m >= 0 ? '+' : ''}${m}`);
    }
    if (rew.itemId) {
      addItem(rew.itemId, rew.qty || 1);
      const it = getItemById(rew.itemId);
      parts.push(`🎁 ${it ? it.name : rew.itemId}`);
    }

    Audio.playSFX(parts.length > 0 ? 'chest' : 'click');
    const summary = parts.length > 0 ? `（${parts.join('、')}）` : '';
    const outcomeText = `${choice.outcome || choice.resultText || '你做出了決定並繼續前行。'}${summary}`;

    addExploreLog(`🗿 ${ev.title || '奇遇'}：${outcomeText}`, 'story');
    autoSave();
    updateHUD();

    if ($('explore-event-desc')) $('explore-event-desc').textContent = outcomeText;
    if ($('explore-event-choices')) $('explore-event-choices').innerHTML = '';
    const stepBtn = $('btn-explore-step');
    if (stepBtn) stepBtn.disabled = false;

    if (rew.triggerBattle) {
      const normals = getRegionNormalEnemies(region.id);
      if (normals[0]) startBattle(normals[0], { returnView: 'explore' });
    }
  }

  function triggerRegionBossBattle(regionId) {
    const boss = getRegionBoss(regionId || state.progress.currentRegionId);
    if (!boss) {
      showToast('找不到此區域的首領資料。', 'error');
      return;
    }
    addExploreLog(`👹 挑戰區域首領【${boss.name}】！`, 'battle');
    startBattle(boss, { returnView: 'explore' });
  }

  // ============================================================================
  // 13. Break-Gauge Turn-Based Battle Engine + Dynamic Difficulty + Teaching Modal
  // ============================================================================
  const HERO_BATTLE_LINES = {
    intro: {
      swordsman: {
        jp: '<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>刃<rt>やいば</rt></ruby>よ、<ruby>真実<rt>しんじつ</rt></ruby>を<ruby>斬<rt>き</rt></ruby>り<ruby>裂<rt>さ</rt></ruby>け！',
        zh: '言靈之刃啊，斬開真實吧！'
      },
      scholar: {
        jp: '<ruby>古<rt>いにしえ</rt></ruby>の<ruby>知識<rt>ちしき</rt></ruby>で、<ruby>言葉<rt>ことば</rt></ruby>の<ruby>秩序<rt>ちつじょ</rt></ruby>を<ruby>取<rt>と</rt></ruby>り<ruby>戻<rt>もど</rt></ruby>します。',
        zh: '以古老的知識，取回語言的秩序。'
      },
      bard: {
        jp: 'さあ、<ruby>響<rt>ひび</rt></ruby>け<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>旋律<rt>せんりつ</rt></ruby>！',
        zh: '來吧，迴響吧言靈的旋律！'
      }
    },
    attack: [
      {
        jp: '<ruby>見切<rt>みき</rt></ruby>った！この<ruby>言霊<rt>ことだま</rt></ruby>を<ruby>受<rt>う</rt></ruby>け<ruby>止<rt>と</rt></ruby>めろ！',
        zh: '看穿了！接下這道言靈吧！'
      },
      {
        jp: 'そこだ！<ruby>正解<rt>せいかい</rt></ruby>の<ruby>一撃<rt>いちげき</rt></ruby>を<ruby>喰<rt>く</rt></ruby>らえ！',
        zh: '就是這裡！吃我正解的一擊！'
      },
      {
        jp: '<ruby>響<rt>ひび</rt></ruby>き<ruby>渡<rt>わた</rt></ruby>れ、<ruby>正<rt>ただ</rt></ruby>しき<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>刃<rt>やいば</rt></ruby>！',
        zh: '迴盪吧，正確的言靈之刃！'
      }
    ],
    crit: {
      jp: '<ruby>見切<rt>みき</rt></ruby>った！<ruby>会心<rt>かいしん</rt></ruby>の<ruby>言霊<rt>ことだま</rt></ruby>を<ruby>受<rt>う</rt></ruby>け<ruby>止<rt>と</rt></ruby>めろ！',
      zh: '看穿了！接下會心一擊的言靈吧！'
    },
    break: {
      jp: '<ruby>護盾<rt>たて</rt></ruby>は<ruby>砕<rt>くだ</rt></ruby>けた！<ruby>今<rt>いま</rt></ruby>が<ruby>決<rt>き</rt></ruby>め<ruby>時<rt>どき</rt></ruby>だ！',
      zh: '護盾碎裂了！現在正是決勝時刻！'
    },
    hurt: [
      {
        jp: 'くっ……！<ruby>読<rt>よ</rt></ruby>み<ruby>違<rt>ちが</rt></ruby>えたか……！',
        zh: '唔……！看錯了嗎……！'
      },
      {
        jp: 'しまった……！だが、まだ<ruby>負<rt>ま</rt></ruby>けない！',
        zh: '糟了……！但我還不會認輸！'
      }
    ],
    victory: {
      jp: 'やった！<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>秩序<rt>ちつじょ</rt></ruby>を<ruby>守<rt>まも</rt></ruby>り<ruby>抜<rt>ぬ</rt></ruby>いたぞ！',
      zh: '太好了！成功守護了言靈的秩序！'
    },
    skillVocab: {
      jp: '<ruby>発動<rt>はつどう</rt></ruby>——【<ruby>単語洞察<rt>たんごどうさつ</rt></ruby>】！すべての<ruby>読<rt>よ</rt></ruby>みを<ruby>照<rt>て</rt></ruby>らせ！',
      zh: '發動——【單字洞察】！照亮所有讀音吧！'
    },
    skillListen: {
      jp: '<ruby>発動<rt>はつどう</rt></ruby>——【<ruby>順風耳<rt>じゅんぷうじ</rt></ruby>】！<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>響<rt>ひび</rt></ruby>きよ、わが<ruby>力<rt>ちから</rt></ruby>に！',
      zh: '發動——【順風耳】！讓言靈的迴響化為我的力量！'
    }
  };

  function ensureBattleStageDecor() {
    const arena = document.querySelector('#view-battle .battle-arena');
    if (arena && !arena.querySelector('.battle-vs-crest')) {
      const crest = document.createElement('div');
      crest.className = 'battle-vs-crest';
      crest.setAttribute('aria-hidden', 'true');
      crest.innerHTML = '<span>VS</span>';
      arena.appendChild(crest);
    }
    const playerSide = document.querySelector('#view-battle .combatant-card.player-side');
    if (playerSide && !$('battle-hero-speech')) {
      const bubble = document.createElement('div');
      bubble.id = 'battle-hero-speech';
      bubble.className = 'hero-speech-bubble';
      const heroArt = $('battle-hero-art');
      if (heroArt && heroArt.parentNode === playerSide) {
        playerSide.insertBefore(bubble, heroArt);
      } else {
        playerSide.prepend(bubble);
      }
    }
  }

  function stopBattleTimers() {
    if (battle.speedTimerId) {
      clearInterval(battle.speedTimerId);
      battle.speedTimerId = null;
    }
    if (battle.poseTimerId) {
      clearTimeout(battle.poseTimerId);
      battle.poseTimerId = null;
    }
  }

  function showHeroSpeech(jpHtml, zhText = '', variant = '') {
    ensureBattleStageDecor();
    const el = $('battle-hero-speech');
    if (!el) return;
    el.className = 'hero-speech-bubble' + (variant ? ` ${variant}` : '');
    if (!jpHtml && !zhText) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="jp-text">「${jpHtml || ''}」</div>
      ${zhText ? `<div class="speech-zh">${escapeHtml(zhText)}</div>` : ''}
    `;
    el.classList.remove('speech-pop');
    void el.offsetWidth;
    el.classList.add('speech-pop');
  }

  function renderBattleStageArt(force = false) {
    if (!battle.enemy) return;
    const p = state.player;
    const enemy = battle.enemy;
    const hPose = battle.heroPose || 'idle';
    const ePose = battle.enemyPose || 'idle';

    const heroKey = `${p.jobId}:${hPose}`;
    const heroArtEl = $('battle-hero-art');
    if (heroArtEl && (force || battle.renderedHeroKey !== heroKey)) {
      heroArtEl.innerHTML = Art.hero(p.jobId, hPose);
      battle.renderedHeroKey = heroKey;
    }

    const enemyKey = `${enemy.id}:${Boolean(enemy.isBoss)}:${ePose}`;
    const enemyArtEl = $('battle-enemy-art');
    if (enemyArtEl && (force || battle.renderedEnemyKey !== enemyKey)) {
      enemyArtEl.innerHTML = Art.enemy(enemy.id, enemy.isBoss, ePose);
      battle.renderedEnemyKey = enemyKey;
    }

    const playerCard = document.querySelector('#view-battle .combatant-card.player-side');
    if (playerCard) {
      playerCard.classList.remove('stage-pose-idle', 'stage-pose-attack', 'stage-pose-hurt', 'stage-pose-victory');
      if (hPose !== 'idle') void playerCard.offsetWidth;
      playerCard.classList.add(`stage-pose-${hPose}`);
    }

    const enemyCard = document.querySelector('#view-battle .combatant-card.enemy-side');
    if (enemyCard) {
      enemyCard.classList.remove('stage-enemy-idle', 'stage-enemy-hit', 'stage-enemy-break', 'stage-enemy-attack', 'stage-enemy-defeat');
      if (ePose !== 'idle') void enemyCard.offsetWidth;
      enemyCard.classList.add(`stage-enemy-${ePose}`);
    }
  }

  function setBattlePoses(heroPose, enemyPose, revertMs = 0) {
    if (battle.poseTimerId) {
      clearTimeout(battle.poseTimerId);
      battle.poseTimerId = null;
    }
    battle.heroPose = heroPose || 'idle';
    battle.enemyPose = enemyPose || (battle.enemyStunned ? 'break' : 'idle');
    renderBattleStageArt(false);

    if (revertMs > 0) {
      battle.poseTimerId = setTimeout(() => {
        battle.poseTimerId = null;
        if (!battle.active) return;
        battle.heroPose = 'idle';
        battle.enemyPose = battle.enemyStunned ? 'break' : 'idle';
        renderBattleStageArt(false);
      }, revertMs);
    }
  }

  function startBattle(enemyOrId, options = {}) {
    const enemy = typeof enemyOrId === 'string' ? getEnemyById(enemyOrId) : enemyOrId;
    if (!enemy) {
      showToast('魔物資料遺失，無法進入戰鬥。', 'error');
      return;
    }

    if (!state.stats.encounteredEnemies.includes(enemy.id)) {
      state.stats.encounteredEnemies.push(enemy.id);
    }

    const breakMax = Math.max(1, Number(enemy.breakMax || (enemy.isBoss ? 3 : 2)));
    const enemyMaxHp = Math.max(40, Number(enemy.hp || enemy.maxHp || 100));
    const battleRegionId = enemy.regionId || state.progress.currentRegionId || 'r1';
    const startAdaptiveIdx = Math.max(
      getAdaptiveRegionFloorIdx(battleRegionId),
      state.settings.adaptiveStartJlpt === 'N3' ? 1 : 0
    );

    battle = {
      active: true,
      enemy,
      regionId: battleRegionId,
      enemyHp: enemyMaxHp,
      enemyMaxHp,
      enemyBreak: breakMax,
      enemyBreakMax: breakMax,
      enemyStunned: false,
      stunJustTriggered: false,
      combo: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      feverActive: false,
      difficultyOffset: 0,
      adaptiveLevelIdx: startAdaptiveIdx,
      currentQ: null,
      qStartTime: 0,
      speedTimerId: null,
      poseTimerId: null,
      heroPose: 'idle',
      enemyPose: 'idle',
      renderedHeroKey: '',
      renderedEnemyKey: '',
      attackLineCount: 0,
      insightActive: false,
      usedQuestionIds: [],
      reorderPool: [],
      reorderSelected: [],
      locked: false,
      returnView: options.returnView || 'explore'
    };

    const viewEl = $('view-battle');
    if (viewEl) viewEl.classList.remove('fever-active');

    ensureBattleStageDecor();
    switchView('battle');

    const introHero = HERO_BATTLE_LINES.intro[state.player.jobId] || HERO_BATTLE_LINES.intro.swordsman;
    showHeroSpeech(introHero.jp, introHero.zh);
    setBattlePoses('idle', 'idle');

    if (enemy.isBoss) {
      Audio.playSFX('boss_enter');
      const intro = formatSpeechLine(enemy.introLine);
      showEnemySpeech(intro.jp || `${enemy.name} 釋放出壓倒性的言霊威壓！`, intro.zh);
      if (intro.tts) Audio.speak(intro.tts, 1.0);
    } else {
      const intro = formatSpeechLine(enemy.introLine);
      showEnemySpeech(intro.jp || `${enemy.name} 擋住了去路！`, intro.zh);
    }

    nextBattleQuestion();
  }

  function showEnemySpeech(jpHtml, zhText = '') {
    const el = $('battle-enemy-speech');
    if (!el) return;
    if (!jpHtml && !zhText) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="jp-text">${jpHtml || ''}</div>
      ${zhText ? `<div class="speech-zh">${escapeHtml(zhText)}</div>` : ''}
    `;
    el.classList.remove('speech-pop');
    void el.offsetWidth;
    el.classList.add('speech-pop');
  }

  function spawnFloatingNumber(target, text, cssClass) {
    const container = $(target === 'enemy' ? 'battle-enemy-fx' : 'battle-hero-fx');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `floating-num ${cssClass || 'num-dmg'}`;
    el.textContent = text;
    el.style.left = `${35 + Math.random() * 30}%`;
    el.style.top = `${20 + Math.random() * 25}%`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function triggerCombatAnim(selector, animClass) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove(animClass);
    void el.offsetWidth;
    el.classList.add(animClass);
    setTimeout(() => el.classList.remove(animClass), 650);
  }

  function renderBattle() {
    if (!battle.active || !battle.enemy) return;
    updateBattleUI();
  }

  function updateBattleUI() {
    if (!battle.active || !battle.enemy) return;
    const enemy = battle.enemy;
    const stats = getTotalStats();
    const p = state.player;
    const region = getRegionById(battle.regionId);

    if ($('battle-region-label')) {
      $('battle-region-label').textContent = `${region ? region.name : '戰場'}｜${enemy.isBoss ? '💀 BOSS 戰' : '⚔️ 遭遇戰'}`;
    }
    if ($('battle-combo-badge')) {
      $('battle-combo-badge').textContent = `🔥 Combo x${battle.combo}`;
    }
    if ($('battle-fever-badge')) {
      $('battle-fever-badge').classList.toggle('hidden', !battle.feverActive);
    }
    const viewEl = $('view-battle');
    if (viewEl) viewEl.classList.toggle('fever-active', battle.feverActive);

    const activeMode = getDifficultyModeConfig(state.settings.difficultyMode);
    const activeJlpt = getEffectiveBattleJlpt();
    const isDemonRealm = activeMode.id === 'fixed_n1';
    if ($('battle-difficulty-badge')) {
      const diffText = activeMode.id === 'adaptive'
        ? `難度：動態自適應（當前 ${activeJlpt}）`
        : `難度：${activeMode.label}`;
      $('battle-difficulty-badge').textContent = diffText;
    }
    if ($('battle-n1-bonus-badge')) {
      $('battle-n1-bonus-badge').classList.toggle('hidden', !isDemonRealm);
    }

    // Player side
    ensureBattleStageDecor();
    renderBattleStageArt(false);
    if ($('battle-hero-name')) $('battle-hero-name').textContent = `${p.name} (Lv.${p.level})`;
    const hpPct = stats.maxHp > 0 ? Math.round((p.hp / stats.maxHp) * 100) : 0;
    const mpPct = stats.maxMp > 0 ? Math.round((p.mp / stats.maxMp) * 100) : 0;
    if ($('battle-hero-hp-bar')) $('battle-hero-hp-bar').style.width = `${hpPct}%`;
    if ($('battle-hero-hp-text')) $('battle-hero-hp-text').textContent = `HP ${p.hp}/${stats.maxHp}`;
    if ($('battle-hero-mp-bar')) $('battle-hero-mp-bar').style.width = `${mpPct}%`;
    if ($('battle-hero-mp-text')) $('battle-hero-mp-text').textContent = `MP ${p.mp}/${stats.maxMp}`;

    const buffsEl = $('battle-player-buffs');
    if (buffsEl) {
      const buffs = [];
      if (battle.insightActive) buffs.push('<span class="badge badge-cyan">👁️ 單字洞察啟動</span>');
      if (battle.feverActive) buffs.push('<span class="badge badge-gold">⚡ FEVER 火力+25%</span>');
      if ((state.skills.grammar_shield || 0) > 0) {
        const red = [0, 50, 58, 65][state.skills.grammar_shield];
        buffs.push(`<span class="badge badge-violet">🛡️ 助詞護盾 -${red}%</span>`);
      }
      buffsEl.innerHTML = buffs.join('');
    }

    // Enemy side
    const arenaEl = document.querySelector('#view-battle .battle-arena');
    if (arenaEl) arenaEl.classList.toggle('boss-battle-stage', Boolean(enemy.isBoss));
    const enemyCard = document.querySelector('#view-battle .combatant-card.enemy-side');
    if (enemyCard) enemyCard.classList.toggle('boss-card', Boolean(enemy.isBoss));

    if ($('battle-enemy-name')) $('battle-enemy-name').textContent = enemy.name;
    if ($('battle-enemy-weakness')) {
      const wkLabel = enemy.weaknessLabel || QUESTION_TYPE_LABELS[enemy.weakness] || enemy.weakness || '單字';
      $('battle-enemy-weakness').textContent = `弱點：${wkLabel}`;
    }

    const eHpPct = battle.enemyMaxHp > 0 ? Math.round((battle.enemyHp / battle.enemyMaxHp) * 100) : 0;
    if ($('battle-enemy-hp-bar')) $('battle-enemy-hp-bar').style.width = `${eHpPct}%`;
    if ($('battle-enemy-hp-text')) $('battle-enemy-hp-text').textContent = `HP ${battle.enemyHp}/${battle.enemyMaxHp}`;

    // Break pips
    const pipsEl = $('battle-break-pips');
    if (pipsEl) {
      let html = '';
      for (let i = 0; i < battle.enemyBreakMax; i++) {
        const filled = !battle.enemyStunned && i < battle.enemyBreak;
        html += `<span class="break-pip ${filled ? 'filled' : 'broken'}"></span>`;
      }
      pipsEl.innerHTML = html;
    }

    const stunEl = $('battle-enemy-stun-badge');
    if (stunEl) {
      stunEl.textContent = battle.enemyStunned ? '💫 BREAK! 暈眩（承受 1.6x 傷害）' : `護盾 ${battle.enemyBreak}/${battle.enemyBreakMax}`;
    }

    // Skill buttons
    const vocabLv = state.skills.vocab_insight || 0;
    const listenLv = state.skills.clairaudience || 0;
    const btnVocab = $('btn-skill-vocab');
    if (btnVocab) {
      btnVocab.textContent = vocabLv > 0 ? `👁️ 單字洞察 Lv.${vocabLv} (10 MP)` : '🔒 單字洞察（未學習）';
      btnVocab.disabled = vocabLv <= 0 || p.mp < 10 || battle.insightActive || battle.locked;
    }
    const btnListen = $('btn-skill-listen');
    if (btnListen) {
      btnListen.textContent = listenLv > 0 ? `🎐 順風耳 Lv.${listenLv} (10 MP)` : '🔒 順風耳（未學習）';
      btnListen.disabled = listenLv <= 0 || p.mp < 10 || battle.locked;
    }

    renderBattleConsumables();
  }

  function renderBattleConsumables() {
    const wrap = $('battle-consumables');
    if (!wrap) return;
    const cons = state.inventory
      .map((e) => ({ entry: e, item: getItemById(e.id) }))
      .filter((x) => x.item && x.item.type === 'consumable' && x.entry.qty > 0);

    if (cons.length === 0) {
      wrap.innerHTML = '<span class="text-muted" style="font-size:0.82rem;">無可用消耗品</span>';
      return;
    }

    wrap.innerHTML = cons.map(({ entry, item }) => `
      <button type="button" class="btn btn-sm btn-secondary" data-use-con="${escapeHtml(item.id)}" ${battle.locked ? 'disabled' : ''} title="${escapeHtml(item.desc || '')}">
        🧪 ${escapeHtml(item.name)} x${entry.qty}
      </button>
    `).join('');

    wrap.querySelectorAll('[data-use-con]').forEach((btn) => {
      btn.addEventListener('click', () => {
        useBattleConsumable(btn.getAttribute('data-use-con'));
      });
    });
  }

  function getEffectiveBattleJlpt() {
    const modeCfg = getDifficultyModeConfig(state.settings.difficultyMode);
    if (modeCfg.targetJlpt) return modeCfg.targetJlpt;
    const idx = clamp(Number(battle.adaptiveLevelIdx || 0), 0, JLPT_LEVELS.length - 1);
    return JLPT_LEVELS[idx];
  }

  function pickBattleQuestion() {
    const allRaw = getQuestions();
    if (allRaw.length === 0) return null;

    const targetJlpt = getEffectiveBattleJlpt();
    const usedSet = new Set(battle.usedQuestionIds);
    const getJlptOf = (q) => normalizeJlptLevel(q.jlpt, q.regionId);
    const filterUnused = (list) => list.filter((q) => !usedSet.has(q.id));

    // If struggling (>=2 consecutive wrong), review a mistake strictly matching targetJlpt
    if (battle.consecutiveWrong >= 2 && state.mistakes.length > 0) {
      const mistakePool = state.mistakes
        .map((m) => getQuestionById(m.questionId))
        .filter((q) => q && !usedSet.has(q.id) && getJlptOf(q) === targetJlpt);
      if (mistakePool.length > 0) {
        return normalizeQuestion(mistakePool[Math.floor(Math.random() * mistakePool.length)]);
      }
    }

    const allTargetJlpt = allRaw.filter((q) => getJlptOf(q) === targetJlpt);
    const regionTargetJlpt = allTargetJlpt.filter((q) => q.regionId === battle.regionId);

    // Tier 1: Current region + target JLPT (unused)
    let pool = filterUnused(regionTargetJlpt);
    // Tier 2: Global across all regions + target JLPT (seamless補位, never stalls!)
    if (pool.length === 0) {
      pool = filterUnused(allTargetJlpt);
    }
    // Tier 3: If all questions of targetJlpt were used in this battle, clear targetJlpt history (avoid immediate repeat)
    if (pool.length === 0 && allTargetJlpt.length > 0) {
      const lastId = battle.currentQ ? battle.currentQ.id : null;
      const targetIds = new Set(allTargetJlpt.map((q) => q.id));
      battle.usedQuestionIds = battle.usedQuestionIds.filter((id) => !targetIds.has(id) || id === lastId);
      const freshUsed = new Set(battle.usedQuestionIds);
      pool = regionTargetJlpt.filter((q) => !freshUsed.has(q.id));
      if (pool.length === 0) {
        pool = allTargetJlpt.filter((q) => !freshUsed.has(q.id));
      }
      if (pool.length === 0) {
        pool = allTargetJlpt;
      }
    }
    // Ultimate safety fallback if database somehow has 0 items of targetJlpt
    if (pool.length === 0) {
      pool = filterUnused(allRaw);
      if (pool.length === 0) {
        battle.usedQuestionIds = [];
        pool = allRaw;
      }
    }

    // Slight bias toward enemy weakness inside the strictly filtered pool
    const weakMatches = pool.filter((q) => q.type === battle.enemy.weakness);
    if (weakMatches.length > 0 && Math.random() < 0.42) {
      pool = weakMatches;
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    return normalizeQuestion(chosen);
  }

  function nextBattleQuestion() {
    if (!battle.active) return;
    stopBattleTimers();

    const q = pickBattleQuestion();
    if (!q) {
      showToast('題庫為空，無法生成戰鬥題目。', 'error');
      return;
    }

    battle.currentQ = q;
    battle.usedQuestionIds.push(q.id);
    battle.insightActive = false;
    battle.locked = false;
    battle.reorderSelected = [];
    battle.heroPose = 'idle';
    battle.enemyPose = battle.enemyStunned ? 'break' : 'idle';

    const qCard = $('battle-question-card');
    if (qCard) qCard.classList.remove('force-furigana');

    const isWeak = q.type === battle.enemy.weakness;
    const typeLabel = q.typeLabel || QUESTION_TYPE_LABELS[q.type] || q.type;
    if ($('battle-q-type')) {
      $('battle-q-type').innerHTML = `${typeLabel}（${escapeHtml(q.jlpt)}）${isWeak ? ' <b class="text-gold">⚡弱點</b>' : ''}`;
    }

    if ($('battle-q-prompt-zh')) $('battle-q-prompt-zh').innerHTML = q.promptZh;
    if ($('battle-q-prompt-jp')) {
      $('battle-q-prompt-jp').innerHTML = q.type === 'listening'
        ? '<span class="text-cyan">🎧 請點擊上方「🔊 朗讀」聆聽日文語音並選出正確答案</span>'
        : q.promptJp;
    }

    // Show adaptive hint if consecutiveWrong >= 2
    const hintEl = $('battle-q-hint');
    if (hintEl) {
      if (battle.consecutiveWrong >= 2) {
        hintEl.textContent = `💡 輔助提示：${q.hint}`;
        hintEl.classList.remove('hidden');
      } else {
        hintEl.textContent = '';
        hintEl.classList.add('hidden');
      }
    }

    renderBattleQuestionOptions(q);
    updateBattleUI();
    startBattleSpeedTimer();

    if (q.type === 'listening' && q.tts) {
      Audio.speak(q.tts, 1.0);
    }
  }

  function startBattleSpeedTimer() {
    stopBattleTimers();
    battle.qStartTime = performance.now();
    const bar = $('battle-speed-bar');
    const txt = $('battle-speed-text');
    if (bar) bar.style.width = '100%';
    if (txt) txt.textContent = '⚡ 速答破防加成 10.0s';

    battle.speedTimerId = setInterval(() => {
      const elapsed = (performance.now() - battle.qStartTime) / 1000;
      const left = Math.max(0, 10 - elapsed);
      if (bar) bar.style.width = `${(left / 10) * 100}%`;
      if (left <= 0) {
        if (txt) txt.textContent = '🧘 沉著思考中（無速答破防加成）';
        stopBattleTimers();
      } else {
        if (txt) txt.textContent = `⚡ 速答破防加成 ${left.toFixed(1)}s`;
      }
    }, 100);
  }

  function renderBattleQuestionOptions(q) {
    const container = $('battle-options-container');
    if (!container) return;

    if (q.type === 'reorder') {
      battle.reorderPool = shuffleArray(q.chunks.map((c) => ({ id: c.id, text: c.text, plain: c.plain, html: c.html })));
      battle.reorderSelected = [];
      container.classList.remove('options-grid');
      renderReorderUI(container, battle.reorderPool, battle.reorderSelected, () => {
        const answerStr = battle.reorderSelected.map((c) => c.plain).join('');
        handleBattleAnswer(answerStr === q.correctOrderPlain, null);
      });
      return;
    }

    container.classList.add('options-grid');
    const letters = ['A', 'B', 'C', 'D'];
    container.innerHTML = q.options.map((opt, idx) => `
      <button type="button" class="option-btn" data-opt-idx="${idx}">
        <span class="badge badge-gold" style="margin-right:8px;">${letters[idx] || idx + 1}</span>
        <span class="jp-text">${opt}</span>
      </button>
    `).join('');

    container.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (battle.locked) return;
        const idx = Number(btn.getAttribute('data-opt-idx'));
        handleBattleAnswer(idx === q.answerIndex, idx);
      });
    });
  }

  function renderReorderUI(container, pool, selected, onSubmit) {
    const usedIds = new Set(selected.map((s) => s.id));
    container.innerHTML = `
      <div class="reorder-wrap">
        <div class="text-muted" style="font-size:0.84rem;margin-bottom:6px;">依正確日文語序點擊下方詞塊（點擊已放入的詞塊可收回）：</div>
        <div class="reorder-dropzone ${selected.length > 0 ? 'has-items' : ''}">
          ${selected.length === 0
            ? '<span class="text-muted">請點擊下方語詞碎片組成完整句子…</span>'
            : selected.map((chip, pos) => `<button type="button" class="reorder-chip jp-text" data-remove-pos="${pos}">${chip.html || chip.text}</button>`).join('')
          }
        </div>
        <div class="reorder-bank">
          ${pool.map((chip) => `
            <button type="button" class="reorder-chip jp-text ${usedIds.has(chip.id) ? 'used' : ''}" data-add-id="${chip.id}" ${usedIds.has(chip.id) ? 'disabled' : ''}>
              ${chip.html || chip.text}
            </button>
          `).join('')}
        </div>
        <div class="reorder-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-reorder-clear">↺ 清空重排</button>
          <button type="button" class="btn btn-gold" id="btn-reorder-submit" ${selected.length < pool.length ? 'disabled' : ''}>⚔️ 詠唱提交</button>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-add-id'));
        const chip = pool.find((c) => c.id === id);
        if (!chip) return;
        Audio.playSFX('click');
        selected.push(chip);
        renderReorderUI(container, pool, selected, onSubmit);
      });
    });

    container.querySelectorAll('[data-remove-pos]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pos = Number(btn.getAttribute('data-remove-pos'));
        Audio.playSFX('click');
        selected.splice(pos, 1);
        renderReorderUI(container, pool, selected, onSubmit);
      });
    });

    const clearBtn = container.querySelector('#btn-reorder-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        Audio.playSFX('click');
        selected.length = 0;
        renderReorderUI(container, pool, selected, onSubmit);
      });
    }

    const submitBtn = container.querySelector('#btn-reorder-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (selected.length < pool.length) return;
        onSubmit();
      });
    }
  }

  function handleBattleAnswer(isCorrect, chosenIdx) {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    battle.locked = true;
    stopBattleTimers();

    const q = battle.currentQ;
    const enemy = battle.enemy;
    const elapsedSec = (performance.now() - battle.qStartTime) / 1000;

    // Highlight buttons for 4-choice
    if (chosenIdx !== null) {
      document.querySelectorAll('#battle-options-container .option-btn').forEach((btn) => {
        const idx = Number(btn.getAttribute('data-opt-idx'));
        btn.disabled = true;
        if (idx === q.answerIndex) btn.classList.add('correct');
        else if (idx === chosenIdx && !isCorrect) btn.classList.add('wrong');
      });
    }

    if (isCorrect) {
      battle.consecutiveCorrect += 1;
      battle.consecutiveWrong = 0;
      battle.combo += 1;
      state.stats.totalCorrect += 1;
      state.quests.dailyProgress.correct_answers += 1;
      state.stats.maxCombo = Math.max(state.stats.maxCombo, battle.combo);

      if (battle.consecutiveCorrect >= 3 && !battle.feverActive) {
        battle.feverActive = true;
        battle.difficultyOffset = 1;
        state.stats.feverCount += 1;
        state.quests.dailyProgress.reach_fever = (state.quests.dailyProgress.reach_fever || 0) + 1;
        showToast('⚡ FEVER TIME 啟動！攻擊火力 +25%、結算 EXP/金幣 ×1.5！', 'gold');
      } else if (battle.consecutiveCorrect >= 2 && battle.difficultyOffset < 0) {
        battle.difficultyOffset = 0;
      }

      // Dynamic Adaptive Difficulty step-up (N4 -> N3 -> N2 -> N1) on streak & speed
      if (state.settings.difficultyMode === 'adaptive') {
        const fastStreak = elapsedSec <= 8.5 && battle.consecutiveCorrect >= 2 && battle.consecutiveCorrect % 2 === 0;
        const steadyStreak = battle.consecutiveCorrect >= 3 && battle.consecutiveCorrect % 3 === 0;
        if ((fastStreak || steadyStreak) && battle.adaptiveLevelIdx < JLPT_LEVELS.length - 1) {
          battle.adaptiveLevelIdx += 1;
          showToast(`⚡ 自適應難度提升至 ${JLPT_LEVELS[battle.adaptiveLevelIdx]}！`, 'info');
        }
      }

      const isWeakness = q.type === enemy.weakness;
      const isFast = elapsedSec <= 10;
      let breakDmg = 0;
      if (isWeakness && isFast) breakDmg = 2;
      else if (isWeakness || isFast) breakDmg = 1;
      if (battle.insightActive && (state.skills.vocab_insight || 0) >= 3) {
        breakDmg += 1;
      }

      const stats = getTotalStats();
      const isCrit = Math.random() * 100 < stats.critRate;
      const insightLv = state.skills.vocab_insight || 0;
      const insightMult = battle.insightActive ? [1, 1, 1.15, 1.30][insightLv] : 1;
      const wasAlreadyStunned = battle.enemyStunned;

      const dmg = Math.max(
        5,
        Math.round(
          (18 + stats.INT * 2.1) *
          (1 + Math.min(battle.combo, 10) * 0.08) *
          (battle.feverActive ? 1.25 : 1.0) *
          (wasAlreadyStunned ? 1.6 : 1.0) *
          (isCrit ? 1.5 : 1.0) *
          insightMult
        )
      );

      battle.enemyHp = Math.max(0, battle.enemyHp - dmg);

      let brokeNow = false;
      if (!wasAlreadyStunned && breakDmg > 0) {
        battle.enemyBreak = Math.max(0, battle.enemyBreak - breakDmg);
        if (battle.enemyBreak <= 0) {
          battle.enemyStunned = true;
          battle.stunJustTriggered = true;
          brokeNow = true;
          state.stats.breaksTriggered += 1;
        }
      }

      const attackLines = HERO_BATTLE_LINES.attack;
      const heroAttackLine = brokeNow
        ? HERO_BATTLE_LINES.break
        : isCrit
          ? HERO_BATTLE_LINES.crit
          : attackLines[battle.attackLineCount % attackLines.length];
      battle.attackLineCount = (battle.attackLineCount || 0) + 1;

      showHeroSpeech(heroAttackLine.jp, heroAttackLine.zh, brokeNow ? 'speech-victory' : 'speech-attack');
      setBattlePoses('attack', brokeNow ? 'break' : 'hit');

      if (brokeNow) {
        Audio.playSFX('break');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-shake');
        spawnFloatingNumber('enemy', 'BREAK! 破防暈眩!', 'num-break');
        setTimeout(() => spawnFloatingNumber('enemy', `-${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'num-crit' : 'num-dmg'), 140);
        const brkLine = formatSpeechLine(enemy.breakLine);
        showEnemySpeech(brkLine.jp || 'ぐわっ……！護盾被徹底擊碎了！', brkLine.zh);
      } else {
        Audio.playSFX(isCrit ? 'crit' : 'correct');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-shake');
        spawnFloatingNumber('enemy', `-${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'num-crit' : 'num-dmg');
        if (enemy.hitLine && Math.random() < 0.5) {
          const hit = formatSpeechLine(enemy.hitLine);
          showEnemySpeech(hit.jp, hit.zh);
        }
      }

      battle.insightActive = false;
      updateBattleUI();
      updateHUD();

      if (battle.enemyHp <= 0) {
        setTimeout(() => {
          if (!battle.active) return;
          setBattlePoses('victory', 'defeat');
          showHeroSpeech(HERO_BATTLE_LINES.victory.jp, HERO_BATTLE_LINES.victory.zh, 'speech-victory');
        }, 450);
        setTimeout(() => handleBattleVictory(), 1100);
      } else {
        setTimeout(() => {
          if (!battle.active) return;
          if (wasAlreadyStunned) {
            // Enemy spent its stunned turn taking 1.6x damage; now recover shield
            battle.enemyStunned = false;
            battle.enemyBreak = battle.enemyBreakMax;
            showEnemySpeech(`${enemy.name} 從破防暈眩中恢復了護盾！`);
          }
          battle.stunJustTriggered = false;
          nextBattleQuestion();
        }, 900);
      }
    } else {
      // Wrong Answer -> Friendly Capped Damage + MANDATORY Teaching Explanation Modal
      battle.consecutiveWrong += 1;
      battle.consecutiveCorrect = 0;
      battle.combo = 0;
      battle.feverActive = false;
      if (battle.consecutiveWrong >= 2) {
        battle.difficultyOffset = -1;
        if (state.settings.difficultyMode === 'adaptive' && battle.adaptiveLevelIdx > 0) {
          battle.adaptiveLevelIdx = Math.max(0, battle.adaptiveLevelIdx - 1);
          showToast(`🌿 自適應難度調整為 ${JLPT_LEVELS[battle.adaptiveLevelIdx]}（最低鎖定 N4）`, 'info');
        }
      }

      state.stats.totalWrong += 1;
      logMistake(q.id);

      const stats = getTotalStats();
      let dmg = 0;
      let damageNotice = '';

      if (battle.enemyStunned) {
        dmg = 0;
        damageNotice = '💫 敵人處於【破防暈眩】狀態，無法反擊！（受到 0 點傷害）';
        battle.enemyStunned = false;
        battle.enemyBreak = battle.enemyBreakMax;
        spawnFloatingNumber('player', 'STUNNED 0', 'num-shield');
      } else {
        const rawAtk = Number(enemy.atk || 18);
        const wisRed = stats.wisDmgReduce;
        const shieldLv = state.skills.grammar_shield || 0;
        const shieldRed = [0, 0.50, 0.58, 0.65][shieldLv];
        const reduced = Math.round(rawAtk * (1 - wisRed) * (1 - shieldRed));
        const cap = Math.max(1, Math.floor(stats.maxHp * 0.35));
        const capped = reduced > cap;
        dmg = Math.max(1, Math.min(reduced, cap));

        state.player.hp = Math.max(0, state.player.hp - dmg);

        let mpRestoreNote = '';
        if (shieldLv >= 3) {
          state.player.mp = Math.min(stats.maxMp, state.player.mp + 5);
          mpRestoreNote = '，並回復 +5 MP';
        }

        const tags = [];
        if (wisRed > 0) tags.push(`智慧 WIS -${Math.round(wisRed * 100)}%`);
        if (shieldLv > 0) tags.push(`【助詞護盾 Lv.${shieldLv}】-${Math.round(shieldRed * 100)}%${mpRestoreNote}`);
        if (capped) tags.push('友善學習上限保護（單次最高 35% 最大 HP）');

        damageNotice = `💥 答錯承受 ${enemy.name} 反擊：<strong>-${dmg} HP</strong>${tags.length ? `（${tags.join('；')}）` : ''}`;
        spawnFloatingNumber('player', `-${dmg}`, 'num-enemy-dmg');
      }

      Audio.playSFX('wrong');
      const hurtLines = HERO_BATTLE_LINES.hurt;
      const hurtLine = hurtLines[(battle.consecutiveWrong - 1) % hurtLines.length];
      showHeroSpeech(hurtLine.jp, hurtLine.zh, 'speech-hurt');
      setBattlePoses('hurt', dmg > 0 ? 'attack' : 'break');
      triggerCombatAnim('#view-battle .combatant-card.player-side', 'anim-shake');
      battle.insightActive = false;
      updateBattleUI();
      updateHUD();
      autoSave();

      // Open MANDATORY Teaching Modal (only closes on clicking 「我已理解」)
      openExplainModal(q, damageNotice, () => {
        if (!battle.active) return;
        if (state.player.hp <= 0) {
          const total = getTotalStats();
          state.player.hp = Math.max(1, Math.round(total.maxHp * 0.3));
          battle.active = false;
          stopBattleTimers();
          autoSave();
          showToast('🕊️ 體力耗盡，結界已將你平安送回黎明之村（未損失金幣與經驗值，保留 30% HP）。', 'warning');
          switchView('town');
        } else {
          nextBattleQuestion();
        }
      });
    }
  }

  function handleBattleVictory() {
    if (!battle.active || !battle.enemy) return;
    stopBattleTimers();
    const enemy = battle.enemy;
    const regionId = battle.regionId;
    const feverMult = battle.feverActive ? 1.5 : 1.0;
    const isDemonRealm = state.settings.difficultyMode === 'fixed_n1';
    const n1ExpMult = isDemonRealm ? 2.0 : 1.0;
    const n1DropMult = isDemonRealm ? 2.0 : 1.0;

    const baseExp = Number(enemy.exp ?? enemy.expReward ?? (enemy.isBoss ? 120 : 40));
    const baseGold = Number(enemy.gold ?? enemy.goldReward ?? (enemy.isBoss ? 140 : 35));
    const finalExp = Math.round(baseExp * feverMult * n1ExpMult);
    const finalGold = Math.round(baseGold * feverMult);

    state.stats.battlesWon += 1;
    state.quests.dailyProgress.win_battles += 1;
    if (!state.stats.defeatedEnemies.includes(enemy.id)) {
      state.stats.defeatedEnemies.push(enemy.id);
    }

    const rewardLines = [
      `⭐ 獲得經驗值：<strong>+${finalExp} EXP</strong>${battle.feverActive ? ' <span class="badge badge-gold">FEVER ×1.5</span>' : ''}${isDemonRealm ? ' <span class="badge badge-crimson">🔥 N1 魔境 EXP ×2</span>' : ''}`,
      `🪙 獲得金幣：<strong>+${finalGold} 金幣</strong>`
    ];
    if (isDemonRealm) {
      rewardLines.push('🔥 <strong>N1 魔境挑戰加成生效：</strong>經驗值雙倍、戰利品掉落率 ×2！');
    }

    gainGold(finalGold);
    const lvRes = gainExp(finalExp);
    if (lvRes.leveledUp) {
      rewardLines.push(`🎉 升級至 <strong>Lv.${state.player.level}</strong>（SP +${lvRes.levelsGained}）！`);
    }

    // Boss first-clear & region unlock
    let bossStoryHtml = '';
    if (enemy.isBoss) {
      const defLine = formatSpeechLine(enemy.defeatLine);
      if (defLine.jp || defLine.zh) {
        bossStoryHtml = `<div class="panel-card" style="padding:12px;margin-bottom:12px;border-left:3px solid var(--gold);">
          <div class="jp-text">${defLine.jp}</div>
          ${defLine.zh ? `<div class="text-muted" style="font-size:0.86rem;margin-top:4px;">${escapeHtml(defLine.zh)}</div>` : ''}
        </div>`;
      }
      const isFirstBossClear = !state.progress.defeatedBosses.includes(regionId);
      if (isFirstBossClear) {
        state.progress.defeatedBosses.push(regionId);
        const fcr = enemy.firstClearReward;
        if (fcr && typeof fcr === 'object') {
          if (fcr.gold) {
            gainGold(fcr.gold);
            rewardLines.push(`🪙 首通加碼金幣：<strong>+${fcr.gold} 金幣</strong>`);
          }
          if (fcr.exp) {
            const fLv = gainExp(fcr.exp);
            rewardLines.push(`⭐ 首通加碼經驗：<strong>+${fcr.exp} EXP</strong>`);
            if (fLv.leveledUp) {
              rewardLines.push(`🎉 升級至 <strong>Lv.${state.player.level}</strong>！`);
            }
          }
          if (fcr.itemId && getItemById(fcr.itemId)) {
            addItem(fcr.itemId, 1);
            rewardLines.push(`🎁 首通秘寶：<strong>【${getItemById(fcr.itemId).name}】</strong>`);
          }
        } else {
          const firstItem = enemy.firstClearItem || (typeof fcr === 'string' ? fcr : null) || enemy.dropItemId;
          if (firstItem && getItemById(firstItem)) {
            addItem(firstItem, 1);
            rewardLines.push(`🎁 首通秘寶：<strong>【${getItemById(firstItem).name}】</strong>`);
          }
        }
        const regions = getRegions();
        const nextRegion = regions.find((r) => r.prevRegionId === regionId);
        if (nextRegion) {
          rewardLines.push(`🗺️ 解鎖新區域：<strong>【${nextRegion.name}（${nextRegion.jlpt}）】</strong>！`);
        }
      }
    } else {
      // Chance for normal drop from enemy or region.dropTable (2x chance in N1 Demon Realm mode)
      const region = getRegionById(regionId);
      const dropTable = region && Array.isArray(region.dropTable) ? region.dropTable : [];
      let droppedId = null;
      for (let i = 0; i < dropTable.length; i++) {
        const effChance = Math.min(0.95, Number(dropTable[i].chance || 0.2) * n1DropMult);
        if (Math.random() < effChance) {
          droppedId = dropTable[i].itemId;
          break;
        }
      }
      if (!droppedId) {
        const directDrop = enemy.dropItemId || (Array.isArray(enemy.drops) && enemy.drops[0]);
        if (directDrop && Math.random() < Math.min(0.95, 0.35 * n1DropMult)) droppedId = directDrop;
      }
      if (droppedId && getItemById(droppedId)) {
        addItem(droppedId, 1);
        rewardLines.push(`🎁 戰利品掉落：<strong>【${getItemById(droppedId).name}】</strong>${isDemonRealm ? ' <span class="badge badge-crimson">🔥 掉落 ×2</span>' : ''}`);
      }
    }

    Audio.playSFX('victory');
    setBattlePoses('victory', 'defeat');
    battle.active = false;
    checkAchievements();
    autoSave();
    updateHUD();

    const victoryHeroHtml = `<div class="victory-portrait-banner">
      <div class="victory-portrait-art">${Art.hero(state.player.jobId, 'victory')}</div>
      <div class="victory-portrait-quote">
        <div class="jp-text">「${HERO_BATTLE_LINES.victory.jp}」</div>
        <div class="text-muted" style="font-size:0.84rem;margin-top:4px;">${escapeHtml(HERO_BATTLE_LINES.victory.zh)}</div>
      </div>
    </div>`;

    const targetView = battle.returnView || 'explore';
    showGenericModal(
      enemy.isBoss ? `🏆 首領討伐成功：${enemy.name}` : `⚔️ 戰鬥勝利：擊敗 ${enemy.name}`,
      `${victoryHeroHtml}${bossStoryHtml}<div style="display:flex;flex-direction:column;gap:8px;font-size:0.96rem;">
        ${rewardLines.map((l) => `<div>${l}</div>`).join('')}
      </div>`,
      enemy.isBoss ? '👑' : '⚔️',
      () => switchView(targetView)
    );
  }

  function useVocabInsight() {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    const lv = state.skills.vocab_insight || 0;
    if (lv <= 0) {
      showToast('尚未解鎖【單字洞察】，請至技能樹消耗 1 SP 學習！', 'warning');
      return;
    }
    if (state.player.mp < 10) {
      showToast('MP 不足（需要 10 MP）！', 'warning');
      return;
    }
    if (battle.insightActive) return;

    state.player.mp -= 10;
    battle.insightActive = true;
    const qCard = $('battle-question-card');
    if (qCard) qCard.classList.add('force-furigana');
    const jpEl = $('battle-q-prompt-jp');
    if (jpEl && battle.currentQ.type === 'reading' && battle.currentQ.fullRubyJp) {
      jpEl.innerHTML = battle.currentQ.fullRubyJp;
    }
    const hintEl = $('battle-q-hint');
    if (hintEl && battle.currentQ.hint) {
      hintEl.textContent = `👁️ 洞察提示：${battle.currentQ.hint}`;
      hintEl.classList.remove('hidden');
    }

    Audio.playSFX('skill');
    showHeroSpeech(HERO_BATTLE_LINES.skillVocab.jp, HERO_BATTLE_LINES.skillVocab.zh, 'speech-skill');
    setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 1100);
    const extra = lv === 3 ? '（本題傷害 +30%、破防 +1）' : lv === 2 ? '（本題傷害 +15%）' : '';
    showToast(`👁️ 發動【單字洞察 Lv.${lv}】！全漢字假名已顯現${extra}`, 'info');
    updateBattleUI();
    updateHUD();
  }

  function useClairaudience() {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    const lv = state.skills.clairaudience || 0;
    if (lv <= 0) {
      showToast('尚未解鎖【順風耳】，請至技能樹消耗 1 SP 學習！', 'warning');
      return;
    }
    if (state.player.mp < 10) {
      showToast('MP 不足（需要 10 MP）！', 'warning');
      return;
    }

    state.player.mp -= 10;
    const stats = getTotalStats();
    const ratio = [0, 0.15, 0.22, 0.30][lv];
    const heal = Math.max(10, Math.round(stats.maxHp * ratio));
    state.player.hp = Math.min(stats.maxHp, state.player.hp + heal);

    Audio.playSFX('heal');
    Audio.speak(battle.currentQ.tts || stripRubyHtml(battle.currentQ.fullRubyJp), 0.65);
    showHeroSpeech(HERO_BATTLE_LINES.skillListen.jp, HERO_BATTLE_LINES.skillListen.zh, 'speech-skill');
    setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 1100);
    spawnFloatingNumber('player', `+${heal} HP`, 'num-heal');
    showToast(`🎐 發動【順風耳 Lv.${lv}】！慢速重播語音並回復 +${heal} HP`, 'success');
    updateBattleUI();
    updateHUD();
  }

  function useBattleConsumable(itemId) {
    if (!battle.active || battle.locked) return;
    const item = getItemById(itemId);
    if (!item || !removeItem(itemId, 1)) return;

    const stats = getTotalStats();
    const eff = item.effect || {};
    const effType = eff.type || '';
    const itemSpeechJp = `【${escapeHtml(item.name)}】を<ruby>使<rt>つか</rt></ruby>う！`;
    const itemSpeechZh = `使用【${item.name}】！`;

    if (itemId === 'con_herb' || effType === 'heal_hp' || eff.healHpPct || eff.hp) {
      const val = eff.healHpPct
        ? Math.max(10, Math.round((stats.maxHp * Number(eff.healHpPct)) / 100))
        : Number(eff.value || eff.hp || Math.round(stats.maxHp * 0.45));
      state.player.hp = Math.min(stats.maxHp, state.player.hp + val);
      Audio.playSFX('heal');
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-skill');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 900);
      spawnFloatingNumber('player', `+${val} HP`, 'num-heal');
      showToast(`🧪 使用【${item.name}】，回復 +${val} HP！`, 'success');
    } else if (itemId === 'con_water' || effType === 'heal_mp' || eff.healMpPct || eff.mp) {
      const val = eff.healMpPct
        ? Math.max(8, Math.round((stats.maxMp * Number(eff.healMpPct)) / 100))
        : Number(eff.value || eff.mp || Math.round(stats.maxMp * 0.5));
      state.player.mp = Math.min(stats.maxMp, state.player.mp + val);
      Audio.playSFX('skill');
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-skill');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 900);
      spawnFloatingNumber('player', `+${val} MP`, 'num-shield');
      showToast(`🧪 使用【${item.name}】，回復 +${val} MP！`, 'info');
    } else if (itemId === 'con_break_scroll' || effType === 'break' || eff.breakDamage) {
      const bVal = Number(eff.breakDamage || eff.value || 2);
      const bonusDmg = Number(eff.bonusDamage || 25);
      battle.enemyHp = Math.max(0, battle.enemyHp - bonusDmg);
      if (!battle.enemyStunned) {
        battle.enemyBreak = Math.max(0, battle.enemyBreak - bVal);
        if (battle.enemyBreak <= 0) {
          battle.enemyStunned = true;
          battle.stunJustTriggered = true;
          state.stats.breaksTriggered += 1;
          Audio.playSFX('break');
          triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
          spawnFloatingNumber('enemy', 'BREAK! 破防暈眩!', 'num-break');
        } else {
          Audio.playSFX('skill');
          spawnFloatingNumber('enemy', `護盾 -${bVal}`, 'num-break');
        }
      }
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-attack');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'hit', 950);
      if (bonusDmg > 0) {
        setTimeout(() => spawnFloatingNumber('enemy', `-${bonusDmg}`, 'num-dmg'), 120);
      }
      showToast(`📜 使用【${item.name}】，造成 ${bVal} 點破防與 ${bonusDmg} 點傷害！`, 'gold');
      if (battle.enemyHp <= 0) {
        autoSave();
        updateBattleUI();
        updateHUD();
        setTimeout(() => {
          if (!battle.active) return;
          setBattlePoses('victory', 'defeat');
          showHeroSpeech(HERO_BATTLE_LINES.victory.jp, HERO_BATTLE_LINES.victory.zh, 'speech-victory');
        }, 420);
        setTimeout(() => handleBattleVictory(), 1050);
        return;
      }
    } else if (itemId === 'con_fever_charm' || effType === 'fever' || eff.feverInstant) {
      battle.feverActive = true;
      battle.combo = Math.max(battle.combo, 3);
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-victory');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 950);
      battle.consecutiveCorrect = Math.max(battle.consecutiveCorrect, 3);
      state.stats.feverCount += 1;
      state.quests.dailyProgress.reach_fever = (state.quests.dailyProgress.reach_fever || 0) + 1;
      if (eff.healHpPct) {
        const healVal = Math.max(10, Math.round((stats.maxHp * Number(eff.healHpPct)) / 100));
        state.player.hp = Math.min(stats.maxHp, state.player.hp + healVal);
        spawnFloatingNumber('player', `+${healVal} HP`, 'num-heal');
      }
      Audio.playSFX('levelup');
      spawnFloatingNumber('player', 'FEVER!', 'num-crit');
      showToast(`⚡ 使用【${item.name}】，立即進入 FEVER TIME！`, 'gold');
    } else {
      // Generic heal fallback
      const val = Math.round(stats.maxHp * 0.35);
      state.player.hp = Math.min(stats.maxHp, state.player.hp + val);
      Audio.playSFX('heal');
      spawnFloatingNumber('player', `+${val} HP`, 'num-heal');
    }

    autoSave();
    updateBattleUI();
    updateHUD();
  }

  // ============================================================================
  // 14. Reading Comprehension Dungeon (`#view-reading`)
  // ============================================================================
  function renderReading() {
    const listView = $('reading-list-view');
    const activeView = $('reading-active-view');
    if (listView) listView.classList.toggle('hidden', reading.active);
    if (activeView) activeView.classList.toggle('hidden', !reading.active);

    if (!reading.active) {
      renderReadingList();
    } else {
      renderReadingActive();
    }
  }

  function renderReadingList() {
    const grid = $('reading-cards-grid');
    if (!grid) return;
    const dungeons = getReadingDungeons();

    grid.innerHTML = dungeons.map((rd) => {
      const unlocked = isReadingUnlocked(rd);
      const cleared = state.progress.clearedReadings.includes(rd.id);
      const rew = rd.rewards || {};
      const expBase = Number(rd.rewardExp ?? rew.exp ?? 120);
      const goldBase = Number(rd.rewardGold ?? rew.gold ?? 120);
      const reqRegion = rd.unlockRegionId ? getRegionById(rd.unlockRegionId) : null;
      return `
        <div class="reading-card panel-card ${unlocked ? '' : 'locked'}" style="${unlocked ? '' : 'opacity:0.62;'}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
            <span class="jlpt-badge">${escapeHtml(rd.jlpt || 'N4')}</span>
            ${cleared ? '<span class="badge badge-emerald">✔ 已通關</span>' : (unlocked ? '<span class="badge badge-cyan">可挑戰</span>' : '<span class="badge badge-crimson">🔒 未解鎖</span>')}
          </div>
          <h3 style="margin:0 0 4px;color:var(--gold-bright);">${escapeHtml(rd.title)}</h3>
          ${rd.topic ? `<div class="text-cyan" style="font-size:0.84rem;margin-bottom:6px;">主題：${escapeHtml(rd.topic)}</div>` : ''}
          ${rd.jpTitle ? `<div class="jp-text text-muted" style="font-size:0.88rem;margin-bottom:8px;">${rd.jpTitle}</div>` : ''}
          <p style="font-size:0.88rem;color:var(--text-muted);margin:0 0 12px;">${escapeHtml(rd.desc || rd.description || '')}</p>
          <div style="font-size:0.82rem;margin-bottom:12px;" class="text-gold">
            報酬：⭐ ${expBase} EXP・🪙 ${goldBase} 金幣（受智慧 WIS 加成）
          </div>
          <button type="button" class="btn ${unlocked ? 'btn-gold' : 'btn-secondary'} btn-block" data-rd-id="${escapeHtml(rd.id)}" ${unlocked ? '' : 'disabled'}>
            ${unlocked ? '📖 開始閱讀試煉' : `🔒 解鎖區域【${reqRegion ? reqRegion.name : rd.unlockRegionId}】後開放`}
          </button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-rd-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const rd = getReadingById(btn.getAttribute('data-rd-id'));
        if (!rd || !isReadingUnlocked(rd)) return;
        Audio.playSFX('confirm');
        reading = {
          active: true,
          dungeon: rd,
          qIdx: 0,
          correctCount: 0,
          answered: false,
          answers: []
        };
        renderReading();
      });
    });
  }

  function renderReadingActive() {
    const rd = reading.dungeon;
    if (!rd) return;

    if ($('reading-active-title')) $('reading-active-title').textContent = rd.title;
    if ($('reading-active-meta')) $('reading-active-meta').textContent = rd.jlpt || 'N4';

    const srLv = state.skills.speed_reading || 0;
    const skillBtn = $('btn-reading-skill');
    if (skillBtn) {
      skillBtn.textContent = srLv > 0 ? `📜 速讀解析 Lv.${srLv} (12 MP)` : '🔒 速讀解析（未學習）';
      skillBtn.disabled = srLv <= 0 || state.player.mp < 12;
    }

    // Render paragraphs (preserve any existing .highlighted classes only on current question if re-rendered)
    const paraContainer = $('reading-paragraphs');
    if (paraContainer && paraContainer.getAttribute('data-rd-rendered') !== rd.id) {
      paraContainer.setAttribute('data-rd-rendered', rd.id);
      const paragraphs = Array.isArray(rd.paragraphs) ? rd.paragraphs : [];
      paraContainer.innerHTML = paragraphs.map((p, idx) => {
        const html = typeof p === 'string' ? p : (p.html || p.jp || p.text || '');
        const tts = typeof p === 'string' ? stripRubyHtml(p) : (p.tts || stripRubyHtml(html));
        return `
          <div class="reading-para" data-para-idx="${idx}">
            <div class="jp-text" style="margin-bottom:8px;">${html}</div>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn btn-sm btn-audio" data-para-tts="${idx}" data-rate="1.0">🔊 朗讀</button>
              <button type="button" class="btn btn-sm btn-audio" data-para-tts="${idx}" data-rate="0.65">🐢 慢速</button>
            </div>
          </div>
        `;
      }).join('');

      paraContainer.querySelectorAll('[data-para-tts]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-para-tts'));
          const rate = Number(btn.getAttribute('data-rate')) || 1.0;
          const p = paragraphs[idx];
          const text = typeof p === 'string' ? stripRubyHtml(p) : (p.tts || stripRubyHtml(p.html || p.jp || p.text));
          Audio.speak(text, rate);
        });
      });
    }

    renderReadingQuestion();
  }

  function renderReadingQuestion() {
    const rd = reading.dungeon;
    if (!rd || !Array.isArray(rd.questions)) return;
    const q = rd.questions[reading.qIdx];
    if (!q) return;

    const total = rd.questions.length;
    if ($('reading-q-progress')) $('reading-q-progress').textContent = `第 ${reading.qIdx + 1} / ${total} 題`;
    if ($('reading-q-category')) $('reading-q-category').textContent = q.category || q.type || '閱讀理解';
    if ($('reading-q-prompt')) $('reading-q-prompt').innerHTML = q.prompt || q.promptZh || q.promptJp || '';
    if ($('reading-q-feedback')) $('reading-q-feedback').innerHTML = '';

    const nextBtn = $('btn-reading-next');
    if (nextBtn) {
      nextBtn.classList.add('hidden');
      nextBtn.textContent = reading.qIdx + 1 >= total ? '🏆 完成閱讀副本' : '下一題 ➡';
    }

    const optsEl = $('reading-q-options');
    if (optsEl) {
      const letters = ['A', 'B', 'C', 'D'];
      const ansIdx = Number(q.answerIndex ?? q.answer ?? 0);
      optsEl.innerHTML = (q.options || []).map((opt, idx) => `
        <button type="button" class="option-btn" data-rd-opt="${idx}">
          <span class="badge badge-gold" style="margin-right:8px;">${letters[idx] || idx + 1}</span>
          <span class="jp-text">${typeof opt === 'object' ? (opt.jp || opt.text) : opt}</span>
        </button>
      `).join('');

      optsEl.querySelectorAll('[data-rd-opt]').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (reading.answered) return;
          reading.answered = true;
          const chosen = Number(btn.getAttribute('data-rd-opt'));
          const isCorrect = chosen === ansIdx;
          if (isCorrect) {
            reading.correctCount += 1;
            state.stats.totalCorrect += 1;
            state.quests.dailyProgress.correct_answers += 1;
            Audio.playSFX('correct');
          } else {
            state.stats.totalWrong += 1;
            Audio.playSFX('wrong');
          }

          optsEl.querySelectorAll('[data-rd-opt]').forEach((b) => {
            const idx = Number(b.getAttribute('data-rd-opt'));
            b.disabled = true;
            if (idx === ansIdx) b.classList.add('correct');
            else if (idx === chosen && !isCorrect) b.classList.add('wrong');
          });

          const fb = $('reading-q-feedback');
          if (fb) {
            fb.innerHTML = `
              <div class="explain-section ${isCorrect ? 'explain-answer' : 'explain-diagnosis'}" style="margin-top:12px;">
                <div class="explain-label">${isCorrect ? '✔ 回答正確！' : '✘ 回答錯誤'}</div>
                <div class="explain-content">${q.explanation || '請回頭對照文章關鍵句。'}</div>
              </div>
            `;
          }

          if (nextBtn) nextBtn.classList.remove('hidden');
          updateHUD();
        });
      });
    }
  }

  function useSpeedReadingSkill() {
    if (!reading.active || !reading.dungeon) return;
    const lv = state.skills.speed_reading || 0;
    if (lv <= 0) {
      showToast('尚未解鎖【速讀解析】，請至技能樹學習！', 'warning');
      return;
    }
    if (state.player.mp < 12) {
      showToast('MP 不足（需要 12 MP）！', 'warning');
      return;
    }

    state.player.mp -= 12;
    Audio.playSFX('skill');

    const matches = document.querySelectorAll(`#reading-paragraphs .key-sentence[data-q="${reading.qIdx}"]`);
    if (matches.length > 0) {
      matches.forEach((el) => el.classList.add('highlighted'));
      matches[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      showToast(`📜 發動【速讀解析 Lv.${lv}】！已標記本題關鍵句！`, 'gold');
    } else {
      // Fallback highlight paragraph matching qIdx
      const para = document.querySelector(`#reading-paragraphs .reading-para[data-para-idx="${reading.qIdx}"]`);
      if (para) {
        para.style.borderColor = 'var(--gold)';
        para.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      showToast(`📜 發動【速讀解析 Lv.${lv}】！已定位重點段落！`, 'gold');
    }

    updateHUD();
    renderReadingActive();
  }

  function advanceReadingQuestion() {
    if (!reading.active || !reading.dungeon) return;
    const total = reading.dungeon.questions.length;
    if (reading.qIdx + 1 < total) {
      reading.qIdx += 1;
      reading.answered = false;
      renderReadingQuestion();
    } else {
      finishReadingDungeon();
    }
  }

  function finishReadingDungeon() {
    const rd = reading.dungeon;
    const total = rd.questions.length || 3;
    const correct = reading.correctCount;
    const passed = correct >= Math.ceil(total * 0.66);

    const stats = getTotalStats();
    const srLv = state.skills.speed_reading || 0;
    const srMult = [1, 1, 1.15, 1.30][srLv];
    const wisMult = 1 + stats.readingBonus;
    const accMult = passed ? 1.0 : Math.max(0.35, correct / total);

    const rew = rd.rewards || {};
    const exp = Math.round(Number(rd.rewardExp ?? rew.exp ?? 120) * accMult * wisMult * srMult);
    const gold = Math.round(Number(rd.rewardGold ?? rew.gold ?? 120) * accMult * wisMult * srMult);

    gainGold(gold);
    const lvRes = gainExp(exp);

    const lines = [
      `📊 測驗成績：<strong>${correct} / ${total}</strong>（${passed ? '通關成功！' : '未達及格標準，獲得練習報酬'}）`,
      `⭐ 經驗值：<strong>+${exp} EXP</strong>（含 WIS +${Math.round(stats.readingBonus * 100)}%${srMult > 1 ? `、速讀解析 +${Math.round((srMult - 1) * 100)}%` : ''}）`,
      `🪙 金幣：<strong>+${gold} 金幣</strong>`
    ];

    if (passed) {
      const firstClear = !state.progress.clearedReadings.includes(rd.id);
      if (firstClear) {
        state.progress.clearedReadings.push(rd.id);
        const firstItem = rd.firstClearItemId || rew.firstClearItem || rew.itemId;
        if (firstItem && getItemById(firstItem)) {
          addItem(firstItem, 1);
          lines.push(`🎁 初次通關稀有飾品：<strong>【${getItemById(firstItem).name}】</strong>`);
        }
      }
      Audio.playSFX('victory');
    } else {
      Audio.playSFX('click');
    }

    if (lvRes.leveledUp) {
      lines.push(`🎉 升級至 <strong>Lv.${state.player.level}</strong>！`);
    }

    reading.active = false;
    const paraContainer = $('reading-paragraphs');
    if (paraContainer) paraContainer.removeAttribute('data-rd-rendered');

    checkAchievements();
    autoSave();
    updateHUD();

    showGenericModal(
      passed ? `📚 閱讀副本通關：${rd.title}` : `📖 閱讀練習完成：${rd.title}`,
      `<div style="display:flex;flex-direction:column;gap:8px;">${lines.map((l) => `<div>${l}</div>`).join('')}</div>`,
      passed ? '🏆' : '📖',
      () => renderReading()
    );
  }

  // ============================================================================
  // 15. Trial Shrine — JLPT Timed Mock Exam (`#view-shrine`)
  // ============================================================================
  function stopShrineTimer() {
    if (shrine.timerId) {
      clearInterval(shrine.timerId);
      shrine.timerId = null;
    }
  }

  function renderShrine() {
    const selView = $('shrine-select-view');
    const examView = $('shrine-exam-view');
    const resView = $('shrine-result-view');

    if (shrine.active) {
      if (selView) selView.classList.add('hidden');
      if (examView) examView.classList.remove('hidden');
      if (resView) resView.classList.add('hidden');
      renderShrineQuestion();
    } else if (shrine.results && shrine.results.length > 0 && shrine.tier) {
      if (selView) selView.classList.add('hidden');
      if (examView) examView.classList.add('hidden');
      if (resView) resView.classList.remove('hidden');
    } else {
      if (selView) selView.classList.remove('hidden');
      if (examView) examView.classList.add('hidden');
      if (resView) resView.classList.add('hidden');
      renderShrineTiers();
    }
  }

  function renderShrineTiers() {
    const grid = $('shrine-tiers-grid');
    if (!grid) return;
    const tiers = getShrineTiers();

    grid.innerHTML = tiers.map((tier) => {
      const best = state.progress.shrineBest[tier.id];
      const bestText = best ? `最佳成績：<b class="rank-${best.rank}">${best.rank}</b>（${best.score}/${best.total}）` : '尚未挑戰';
      const qCount = Number(tier.questionCount || 10);
      const timeSec = Number(tier.timeLimitSec || 180);
      const badgeMatch = String(tier.name || tier.title || '').match(/N\d[–-]N\d|N\d/);
      const badgeLabel = tier.jlpt || (badgeMatch ? badgeMatch[0] : '試煉');
      return `
        <div class="shrine-tier-card panel-card">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="jlpt-badge">${escapeHtml(badgeLabel)}</span>
            <span class="text-muted" style="font-size:0.82rem;">⏱ ${formatMMSS(timeSec)}・${qCount} 題</span>
          </div>
          <h3 style="margin:0 0 6px;color:var(--gold-bright);">${escapeHtml(tier.name || tier.title)}</h3>
          <p class="text-muted" style="font-size:0.88rem;margin:0 0 10px;">${escapeHtml(tier.desc || tier.description || '')}</p>
          <div style="font-size:0.85rem;margin-bottom:12px;">${bestText}</div>
          <button type="button" class="btn btn-gold btn-block" data-shrine-id="${escapeHtml(tier.id)}">⛩️ 開始限時試煉</button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-shrine-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tier = tiers.find((t) => t.id === btn.getAttribute('data-shrine-id'));
        if (tier) startShrineExam(tier);
      });
    });
  }

  function startShrineExam(tier) {
    const allRaw = getQuestions();
    const targetRegions = Array.isArray(tier.regionIds || tier.regions) ? (tier.regionIds || tier.regions) : [];
    const targetJlpts = Array.isArray(tier.jlpts) ? tier.jlpts : [];
    const targetJlpt = tier.jlpt || '';
    const needed = Number(tier.questionCount || 10);

    let pool = allRaw.filter((q) => {
      const qJlpt = normalizeJlptLevel(q.jlpt, q.regionId);
      if (targetJlpts.length > 0) return targetJlpts.includes(qJlpt);
      return (
        (targetRegions.length > 0 && targetRegions.includes(q.regionId)) ||
        (targetJlpt && targetJlpt.includes(qJlpt))
      );
    });
    pool = shuffleArray(pool);

    if (pool.length < needed) {
      const existingIds = new Set(pool.map((q) => q.id));
      const extras = shuffleArray(allRaw.filter((q) => !existingIds.has(q.id)));
      pool = pool.concat(extras);
    }

    const picked = pool.slice(0, needed).map(normalizeQuestion).filter(Boolean);
    if (picked.length === 0) {
      showToast('題庫為空，無法開始試煉。', 'error');
      return;
    }

    const limit = Number(tier.timeLimitSec || 180);
    shrine = {
      active: true,
      tier,
      questions: picked,
      qIdx: 0,
      timeLeft: limit,
      timeLimit: limit,
      timerId: null,
      results: [],
      reorderPool: [],
      reorderSelected: []
    };

    Audio.playSFX('boss_enter');
    Audio.playBGM('battle');
    updateChromeVisibility('shrine');
    renderShrine();

    stopShrineTimer();
    shrine.timerId = setInterval(() => {
      shrine.timeLeft -= 1;
      updateShrineTimerUI();
      if (shrine.timeLeft <= 0) {
        finishShrineExam(true);
      }
    }, 1000);
    updateShrineTimerUI();
  }

  function updateShrineTimerUI() {
    const pct = shrine.timeLimit > 0 ? Math.max(0, (shrine.timeLeft / shrine.timeLimit) * 100) : 0;
    const bar = $('shrine-timer-bar');
    const txt = $('shrine-timer-text');
    const danger = shrine.timeLeft <= 30 || pct <= 20;

    if (bar) {
      bar.style.width = `${pct}%`;
      bar.classList.toggle('timer-danger', danger);
    }
    if (txt) {
      txt.textContent = formatMMSS(shrine.timeLeft);
      txt.classList.toggle('timer-danger', danger);
    }
  }

  function renderShrineQuestion() {
    const q = shrine.questions[shrine.qIdx];
    if (!q) return;

    if ($('shrine-tier-title')) $('shrine-tier-title').textContent = shrine.tier.name || shrine.tier.title;
    if ($('shrine-q-counter')) $('shrine-q-counter').textContent = `${shrine.qIdx + 1} / ${shrine.questions.length}`;
    if ($('shrine-q-type')) $('shrine-q-type').textContent = `${q.typeLabel || QUESTION_TYPE_LABELS[q.type] || q.type}（${q.jlpt}）`;
    if ($('shrine-q-prompt-zh')) $('shrine-q-prompt-zh').innerHTML = q.promptZh;
    if ($('shrine-q-prompt-jp')) {
      $('shrine-q-prompt-jp').innerHTML = q.type === 'listening'
        ? '<span class="text-cyan">🎧 聽力試題：點擊上方「🔊 朗讀題目」後作答</span>'
        : q.promptJp;
    }

    const ttsBtn = $('btn-shrine-tts');
    if (ttsBtn) {
      ttsBtn.onclick = () => Audio.speak(q.tts || stripRubyHtml(q.promptJp), 1.0);
    }

    const container = $('shrine-options-container');
    if (!container) return;

    if (q.type === 'reorder') {
      shrine.reorderPool = shuffleArray(q.chunks.map((c) => ({ id: c.id, text: c.text, plain: c.plain, html: c.html })));
      shrine.reorderSelected = [];
      container.classList.remove('options-grid');
      renderReorderUI(container, shrine.reorderPool, shrine.reorderSelected, () => {
        const userAns = shrine.reorderSelected.map((c) => c.plain).join('');
        recordShrineAnswer(q, userAns === q.correctOrderPlain, userAns);
      });
    } else {
      container.classList.add('options-grid');
      const letters = ['A', 'B', 'C', 'D'];
      container.innerHTML = q.options.map((opt, idx) => `
        <button type="button" class="option-btn" data-shrine-opt="${idx}">
          <span class="badge badge-gold" style="margin-right:8px;">${letters[idx] || idx + 1}</span>
          <span class="jp-text">${opt}</span>
        </button>
      `).join('');

      container.querySelectorAll('[data-shrine-opt]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const idx = Number(btn.getAttribute('data-shrine-opt'));
          recordShrineAnswer(q, idx === q.answerIndex, q.options[idx] || '');
        });
      });
    }

    if (q.type === 'listening' && q.tts) {
      Audio.speak(q.tts, 1.0);
    }
  }

  function recordShrineAnswer(q, isCorrect, userDisplay) {
    Audio.playSFX(isCorrect ? 'correct' : 'wrong');
    shrine.results.push({ q, isCorrect, userDisplay });

    if (isCorrect) {
      state.stats.totalCorrect += 1;
      state.quests.dailyProgress.correct_answers += 1;
    } else {
      state.stats.totalWrong += 1;
      logMistake(q.id);
    }

    shrine.qIdx += 1;
    if (shrine.qIdx >= shrine.questions.length) {
      finishShrineExam(false);
    } else {
      renderShrineQuestion();
    }
  }

  function finishShrineExam(timedOut) {
    stopShrineTimer();
    Audio.stopSpeak();
    shrine.active = false;
    updateChromeVisibility('shrine');
    Audio.playBGM('town');

    // Fill unanswered questions if time ran out
    while (shrine.results.length < shrine.questions.length) {
      const q = shrine.questions[shrine.results.length];
      shrine.results.push({ q, isCorrect: false, userDisplay: '（逾時未作答）' });
      state.stats.totalWrong += 1;
      logMistake(q.id);
    }

    const total = shrine.questions.length;
    const correct = shrine.results.filter((r) => r.isCorrect).length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const rank = pct >= 90 ? 'S' : pct >= 75 ? 'A' : pct >= 60 ? 'B' : 'C';

    const rankMult = { S: 1.5, A: 1.2, B: 1.0, C: 0.55 }[rank];
    const rew = shrine.tier.rewards || {};
    const exp = Math.round(Number(shrine.tier.baseExp ?? rew.exp ?? 160) * rankMult);
    const gold = Math.round(Number(shrine.tier.baseGold ?? rew.gold ?? 160) * rankMult);

    gainGold(gold);
    const lvRes = gainExp(exp);

    state.stats.shrineCompleted += 1;
    state.quests.dailyProgress.complete_shrine += 1;
    if (rank === 'S') state.stats.shrineRankS += 1;

    // Personal best
    const rankOrder = { C: 1, B: 2, A: 3, S: 4 };
    const prev = state.progress.shrineBest[shrine.tier.id];
    const isNewBest = !prev || rankOrder[rank] > rankOrder[prev.rank] || (rank === prev.rank && correct > prev.score);
    if (isNewBest) {
      state.progress.shrineBest[shrine.tier.id] = {
        rank,
        score: correct,
        total,
        timeLeft: Math.max(0, shrine.timeLeft)
      };
    }

    const rewardItems = [
      `⭐ 經驗值：<strong>+${exp} EXP</strong>`,
      `🪙 金幣：<strong>+${gold} 金幣</strong>`
    ];

    if (rank === 'S' || rank === 'A' || rank === 'B') {
      const rewardTitle = shrine.tier.rewardTitle || rew.title || `${shrine.tier.jlpt || '言霊'}試煉突破者`;
      if (grantTitle(rewardTitle)) {
        rewardItems.push(`👑 解鎖試煉稱號：<strong>【${rewardTitle}】</strong>`);
      }
    }

    if (rank === 'S' || rank === 'A') {
      const rareAccId = shrine.tier.rewardItemId || rew.accessoryId || rew.rareItemId || rew.itemId;
      if (rareAccId && getItemById(rareAccId) && getItemQty(rareAccId) === 0 && !isItemEquipped(rareAccId)) {
        addItem(rareAccId, 1);
        rewardItems.push(`💍 獲得神殿稀有報酬：<strong>【${getItemById(rareAccId).name}】</strong>`);
      }
    }

    if (lvRes.leveledUp) {
      rewardItems.push(`🎉 等級提升至 <strong>Lv.${state.player.level}</strong>！`);
    }

    Audio.playSFX(rank === 'S' || rank === 'A' ? 'victory' : 'confirm');
    checkAchievements();
    autoSave();
    updateHUD();

    // Render Result View
    const badgeEl = $('shrine-rank-badge');
    if (badgeEl) {
      badgeEl.textContent = rank;
      badgeEl.className = `shrine-rank-badge rank-medal rank-${rank}`;
    }

    const sumEl = $('shrine-result-summary');
    if (sumEl) {
      sumEl.innerHTML = `
        <h3 style="margin:0 0 6px;">${escapeHtml(shrine.tier.name || shrine.tier.title)} — ${timedOut ? '時間到！' : '試煉結束！'}</h3>
        <div>答對題數：<strong>${correct} / ${total}（${pct}%）</strong>・剩餘時間：<strong>${formatMMSS(shrine.timeLeft)}</strong></div>
      `;
    }

    const rewBox = $('shrine-rewards-box');
    if (rewBox) {
      rewBox.innerHTML = rewardItems.map((l) => `<div>${l}</div>`).join('');
    }

    const revEl = $('shrine-review-list');
    if (revEl) {
      revEl.innerHTML = shrine.results.map((r, idx) => `
        <div class="review-item ${r.isCorrect ? 'correct' : 'wrong'}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:4px;">
            <strong>第 ${idx + 1} 題（${QUESTION_TYPE_LABELS[r.q.type] || r.q.type}）</strong>
            <span class="badge ${r.isCorrect ? 'badge-emerald' : 'badge-crimson'}">${r.isCorrect ? '✔ 正確' : '✘ 錯誤'}</span>
          </div>
          <div style="font-size:0.88rem;color:var(--text-muted);">${r.q.promptZh}</div>
          <div class="jp-text force-furigana" style="margin:4px 0;">${r.q.fullRubyJp || r.q.promptJp}</div>
          <div style="font-size:0.86rem;">
            你的作答：<span class="${r.isCorrect ? 'text-emerald' : 'text-crimson'}">${r.userDisplay}</span> ｜
            正解：<strong class="text-emerald">${r.q.correctDisplay}</strong>
          </div>
          <div class="text-muted" style="font-size:0.84rem;margin-top:4px;">📖 ${r.q.explanation}</div>
        </div>
      `).join('');
    }

    renderShrine();
  }

  // ============================================================================
  // 16. Character, Skill Tree, Inventory, Quests & Codex
  // ============================================================================
  function renderCharacter() {
    const p = state.player;
    const job = getJobById(p.jobId);
    const stats = getTotalStats();

    const charArtEl = $('char-hero-art');
    if (charArtEl) {
      charArtEl.innerHTML = Art.hero(p.jobId, 'idle');
      charArtEl.setAttribute('data-char-pose', 'idle');
      charArtEl.title = '點擊切換展示動作差分';
      charArtEl.onclick = () => {
        const order = ['idle', 'attack', 'victory', 'hurt'];
        const cur = charArtEl.getAttribute('data-char-pose') || 'idle';
        const next = order[(order.indexOf(cur) + 1) % order.length];
        charArtEl.setAttribute('data-char-pose', next);
        charArtEl.innerHTML = Art.hero(p.jobId, next);
        Audio.playSFX('click');
      };
    }
    if ($('char-identity')) {
      $('char-identity').innerHTML = `
        <h3 style="margin:0;color:var(--gold-bright);">${escapeHtml(p.name)}</h3>
        <div class="text-cyan" style="font-size:0.9rem;margin:4px 0;">${escapeHtml(job.name)}・Lv.${p.level}</div>
        <div class="text-muted" style="font-size:0.82rem;">EXP ${p.exp} / ${p.nextExp}</div>
      `;
    }

    const titleSelect = $('char-title-select');
    if (titleSelect) {
      titleSelect.innerHTML = p.unlockedTitles.map((t) =>
        `<option value="${escapeHtml(t)}" ${t === p.activeTitle ? 'selected' : ''}>${escapeHtml(t)}</option>`
      ).join('');
      titleSelect.onchange = () => {
        state.player.activeTitle = titleSelect.value;
        Audio.playSFX('click');
        autoSave();
        updateHUD();
        showToast(`👑 已佩戴稱號【${state.player.activeTitle}】`, 'gold');
      };
    }

    const statsEl = $('char-stats-grid');
    if (statsEl) {
      const tiles = [
        { label: '最大 HP', val: `${stats.maxHp}`, sub: stats.gearHp ? `基礎 ${p.maxHp} + 裝備 ${stats.gearHp}` : '' },
        { label: '最大 MP', val: `${stats.maxMp}`, sub: stats.gearMp ? `基礎 ${p.maxMp} + 裝備 ${stats.gearMp}` : '' },
        { label: '智力 INT', val: `${stats.INT}`, sub: `基礎 ${p.baseINT} + 裝備 ${stats.gearINT}` },
        { label: '智慧 WIS', val: `${stats.WIS}`, sub: `基礎 ${p.baseWIS} + 裝備 ${stats.gearWIS}` },
        { label: '魅力 CHA', val: `${stats.CHA}`, sub: `基礎 ${p.baseCHA} + 裝備 ${stats.gearCHA}` },
        { label: '基礎言霊傷害', val: `${stats.baseAtk}`, sub: `暴擊率 ${stats.critRate}%` },
        { label: '智慧防禦減傷', val: `${Math.round(stats.wisDmgReduce * 100)}%`, sub: `閱讀獎勵 +${Math.round(stats.readingBonus * 100)}%` },
        { label: '商店總折扣', val: `-${stats.totalShopDiscount}%`, sub: `好感加成 +${stats.chaAffectionBonus}` }
      ];
      statsEl.innerHTML = tiles.map((t) => `
        <div class="stat-tile">
          <span class="stat-tile-label">${t.label}</span>
          <span class="stat-tile-value">${t.val}</span>
          ${t.sub ? `<span class="text-muted" style="font-size:0.72rem;">${t.sub}</span>` : ''}
        </div>
      `).join('');
    }

    const eqEl = $('char-equip-slots');
    if (eqEl) {
      const slots = [
        { key: 'weapon', label: '⚔️ 武器' },
        { key: 'armor', label: '🛡️ 防具' },
        { key: 'accessory', label: '💍 飾品' }
      ];
      eqEl.innerHTML = slots.map((s) => {
        const itemId = p.equipment[s.key];
        const item = itemId ? getItemById(itemId) : null;
        const lv = item ? getItemEnhancementLevel(item.id) : 0;
        return `
          <div class="equip-slot-card">
            <div style="font-size:0.8rem;" class="text-muted">${s.label}</div>
            ${item
              ? `<div style="display:flex;align-items:center;gap:10px;margin:6px 0;">
                  <div style="width:38px;height:38px;flex-shrink:0;">${Art.itemIcon(item)}</div>
                  <div style="flex:1;">
                    <div style="font-weight:700;">${escapeHtml(item.name)} ${lv > 0 ? `<span class="text-gold">+${lv}</span>` : ''}</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">${renderItemStatTags(item, lv)}</div>
                  </div>
                </div>
                <button type="button" class="btn btn-sm btn-secondary" data-unequip-slot="${s.key}">卸下</button>`
              : '<div class="text-muted" style="padding:12px 0;font-size:0.86rem;">尚未裝備</div>'
            }
          </div>
        `;
      }).join('');

      eqEl.querySelectorAll('[data-unequip-slot]').forEach((btn) => {
        btn.addEventListener('click', () => {
          unequipSlot(btn.getAttribute('data-unequip-slot'));
          renderCharacter();
        });
      });
    }

    const learnEl = $('char-learning-stats');
    if (learnEl) {
      const st = state.stats;
      const totalAns = st.totalCorrect + st.totalWrong;
      const acc = totalAns > 0 ? Math.round((st.totalCorrect / totalAns) * 100) : 0;
      learnEl.innerHTML = `
        <div class="char-stats-grid">
          <div class="stat-tile"><span class="stat-tile-label">總答對率</span><span class="stat-tile-value text-emerald">${acc}%</span></div>
          <div class="stat-tile"><span class="stat-tile-label">答對 / 答錯</span><span class="stat-tile-value">${st.totalCorrect} / ${st.totalWrong}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">最高連擊</span><span class="stat-tile-value text-gold">${st.maxCombo}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">FEVER 次數</span><span class="stat-tile-value text-amber">${st.feverCount}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">破防暈眩</span><span class="stat-tile-value text-cyan">${st.breaksTriggered}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">戰鬥勝利</span><span class="stat-tile-value">${st.battlesWon}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">閱讀通關</span><span class="stat-tile-value">${state.progress.clearedReadings.length} / ${getReadingDungeons().length || 5}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">試煉完成</span><span class="stat-tile-value">${st.shrineCompleted}</span></div>
        </div>
      `;
    }
  }

  function renderSkills() {
    const spEl = $('skills-sp-display');
    if (spEl) spEl.textContent = `可用技能點：${state.player.sp} SP`;

    const grid = $('skills-tree-grid');
    if (!grid) return;
    const skills = getSkills();

    grid.innerHTML = skills.map((sk) => {
      const lv = state.skills[sk.id] || 0;
      const maxLv = Number(sk.maxLevel || 3);
      const spCost = Number(sk.spCost || 1);
      const isMax = lv >= maxLv;
      const canUpgrade = !isMax && state.player.sp >= spCost;
      const isActive = (sk.type || 'active') === 'active';

      const pips = Array.from({ length: maxLv }, (_, i) =>
        `<span class="skill-pip ${i < lv ? 'filled' : ''}"></span>`
      ).join('');

      const levelLines = Array.isArray(sk.levelEffects) ? sk.levelEffects : (Array.isArray(sk.levels) ? sk.levels : []);

      return `
        <div class="skill-branch-card panel-card">
          <div class="skill-header">
            <div>
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <h3 style="margin:0;color:var(--gold-bright);">${escapeHtml(sk.name)}</h3>
                <span class="badge ${isActive ? 'badge-active' : 'badge-passive'}">${isActive ? `主動 ${sk.mpCost || 10} MP` : '被動常駐'}</span>
              </div>
              <div class="text-muted" style="font-size:0.82rem;margin-top:2px;">${sk.branch || ''} ${sk.jpName ? `・${sk.jpName}` : ''}</div>
            </div>
            <div style="text-align:right;">
              <div class="text-gold" style="font-weight:700;">Lv.${lv} / ${maxLv}</div>
              <div class="skill-pips" style="margin-top:4px;">${pips}</div>
            </div>
          </div>
          <p style="font-size:0.88rem;color:var(--text-main);margin:10px 0;">${escapeHtml(sk.desc || sk.description || '')}</p>
          <div style="display:flex;flex-direction:column;gap:4px;font-size:0.82rem;margin-bottom:14px;">
            ${levelLines.map((line, i) => `
              <div class="${i < lv ? 'text-emerald' : i === lv ? 'text-gold' : 'text-muted'}">
                ${i < lv ? '✔' : i === lv ? '▶' : '○'} ${escapeHtml(typeof line === 'string' ? line : (line.desc || line.text || ''))}
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn ${isMax ? 'btn-secondary' : canUpgrade ? 'btn-gold' : 'btn-secondary'} btn-block" data-upgrade-skill="${escapeHtml(sk.id)}" ${canUpgrade ? '' : 'disabled'}>
            ${isMax ? '✨ 已滿級' : lv === 0 ? `✨ 解鎖技能（消耗 ${spCost} SP）` : `⬆️ 升級至 Lv.${lv + 1}（消耗 ${spCost} SP）`}
          </button>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('[data-upgrade-skill]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sid = btn.getAttribute('data-upgrade-skill');
        const sk = getSkillById(sid);
        if (!sk) return;
        const lv = state.skills[sid] || 0;
        const maxLv = Number(sk.maxLevel || 3);
        const cost = Number(sk.spCost || 1);
        if (lv >= maxLv || state.player.sp < cost) return;

        state.player.sp -= cost;
        state.skills[sid] = lv + 1;
        Audio.playSFX('levelup');
        showToast(`✨ 習得【${sk.name} Lv.${lv + 1}】！`, 'gold');
        checkAchievements();
        autoSave();
        updateHUD();
        renderSkills();
      });
    });
  }

  function renderInventory() {
    document.querySelectorAll('#inv-tabs .tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === uiTabs.inv);
    });

    // Combine equipped + bag items for display
    const cards = [];
    ['weapon', 'armor', 'accessory'].forEach((slot) => {
      const id = state.player.equipment[slot];
      const it = id ? getItemById(id) : null;
      if (it && (uiTabs.inv === 'all' || it.type === uiTabs.inv)) {
        cards.push({ item: it, qty: 1, equipped: true });
      }
    });
    state.inventory.forEach((entry) => {
      const it = getItemById(entry.id);
      if (it && entry.qty > 0 && (uiTabs.inv === 'all' || it.type === uiTabs.inv)) {
        cards.push({ item: it, qty: entry.qty, equipped: false });
      }
    });

    const grid = $('inv-grid');
    if (!grid) return;

    if (cards.length === 0) {
      grid.innerHTML = '<p class="empty-hint">此分類目前沒有物品。</p>';
      if ($('inv-detail-panel')) $('inv-detail-panel').innerHTML = '<p class="empty-hint">請選擇背包中的物品以檢視詳細資訊。</p>';
      return;
    }

    if (!uiTabs.selectedInvItemId || !cards.some((c) => c.item.id === uiTabs.selectedInvItemId)) {
      uiTabs.selectedInvItemId = cards[0].item.id;
    }

    grid.innerHTML = cards.map((c, idx) => {
      const lv = getItemEnhancementLevel(c.item.id);
      const selected = c.item.id === uiTabs.selectedInvItemId;
      return `
        <button type="button" class="inv-item-card ${selected ? 'selected' : ''}" data-inv-idx="${idx}">
          ${c.equipped ? '<span class="equipped-tag">裝備中</span>' : ''}
          ${c.qty > 1 ? `<span class="inv-item-qty">x${c.qty}</span>` : ''}
          <div class="inv-item-icon">${Art.itemIcon(c.item)}</div>
          <div style="font-size:0.84rem;font-weight:700;text-align:center;">${escapeHtml(c.item.name)}${lv > 0 ? ` <span class="text-gold">+${lv}</span>` : ''}</div>
          <span class="rarity-badge rarity-${c.item.rarity || 'common'}" style="margin-top:4px;">${RARITY_LABELS[c.item.rarity] || '普通'}</span>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.inv-item-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = cards[Number(btn.getAttribute('data-inv-idx'))];
        if (!c) return;
        Audio.playSFX('click');
        uiTabs.selectedInvItemId = c.item.id;
        renderInventoryDetail(c);
        grid.querySelectorAll('.inv-item-card').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    const selectedCard = cards.find((c) => c.item.id === uiTabs.selectedInvItemId) || cards[0];
    renderInventoryDetail(selectedCard);
  }

  function renderInventoryDetail(card) {
    const panel = $('inv-detail-panel');
    if (!panel || !card) return;
    const item = card.item;
    const lv = getItemEnhancementLevel(item.id);
    const isGear = ['weapon', 'armor', 'accessory'].includes(item.type);

    let compareHtml = '';
    if (isGear && !card.equipped) {
      const curId = state.player.equipment[item.type];
      const curItem = curId ? getItemById(curId) : null;
      const curStats = curItem ? getEnhancedItemStats(curItem) : { INT: 0, WIS: 0, CHA: 0, hp: 0, mp: 0 };
      const newStats = getEnhancedItemStats(item, lv);
      const diffs = ['INT', 'WIS', 'CHA', 'hp', 'mp']
        .filter((k) => curStats[k] !== 0 || newStats[k] !== 0)
        .map((k) => {
          const delta = newStats[k] - curStats[k];
          const cls = delta > 0 ? 'text-emerald' : delta < 0 ? 'text-crimson' : 'text-muted';
          const sign = delta > 0 ? `+${delta}` : `${delta}`;
          return `<div>${STAT_LABELS[k]}：${curStats[k]} → ${newStats[k]} <strong class="${cls}">(${sign})</strong></div>`;
        }).join('');
      if (diffs) {
        compareHtml = `<div class="panel-card" style="padding:10px;margin:10px 0;font-size:0.84rem;">
          <div class="text-muted" style="margin-bottom:4px;">與目前裝備對比（${curItem ? escapeHtml(curItem.name) : '無'}）：</div>
          ${diffs}
        </div>`;
      }
    }

    let actionBtns = '';
    if (isGear) {
      actionBtns = card.equipped
        ? `<button type="button" class="btn btn-secondary btn-block" id="btn-inv-unequip">卸下裝備</button>`
        : `<button type="button" class="btn btn-gold btn-block" id="btn-inv-equip">⚔️ 穿戴裝備</button>
           <button type="button" class="btn btn-secondary btn-block" id="btn-inv-sell" style="margin-top:8px;">💰 出售（+${getSellPrice(item)} 金幣）</button>`;
    } else if (item.type === 'consumable') {
      const eff = item.effect || {};
      const usableOutOfBattle = item.id === 'con_herb' || item.id === 'con_water' || Boolean(eff.healHpPct || eff.healMpPct || eff.type === 'heal_hp' || eff.type === 'heal_mp');
      actionBtns = `${usableOutOfBattle ? '<button type="button" class="btn btn-gold btn-block" id="btn-inv-use">🧪 立即使用</button>' : '<div class="text-muted" style="font-size:0.84rem;margin-bottom:8px;">⚡ 此道具需於戰鬥中使用</div>'}
        <button type="button" class="btn btn-secondary btn-block" id="btn-inv-sell" style="margin-top:8px;">💰 出售 1 個（+${getSellPrice(item)} 金幣）</button>`;
    }

    panel.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="width:52px;height:52px;">${Art.itemIcon(item)}</div>
        <div>
          <h3 style="margin:0;color:var(--gold-bright);">${escapeHtml(item.name)}${lv > 0 ? ` +${lv}` : ''}</h3>
          <span class="rarity-badge rarity-${item.rarity || 'common'}">${RARITY_LABELS[item.rarity] || '普通'}</span>
        </div>
      </div>
      <p style="font-size:0.88rem;color:var(--text-muted);">${escapeHtml(item.desc || item.description || '')}</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">${renderItemStatTags(item, lv)}</div>
      ${compareHtml}
      <div style="margin-top:12px;">${actionBtns}</div>
    `;

    const eqBtn = $('btn-inv-equip');
    if (eqBtn) eqBtn.onclick = () => { equipItem(item.id); renderInventory(); };
    const uneqBtn = $('btn-inv-unequip');
    if (uneqBtn) uneqBtn.onclick = () => { unequipSlot(item.type); renderInventory(); };
    const useBtn = $('btn-inv-use');
    if (useBtn) {
      useBtn.onclick = () => {
        if (!removeItem(item.id, 1)) return;
        const stats = getTotalStats();
        const eff = item.effect || {};
        if (item.id === 'con_herb' || eff.healHpPct || eff.type === 'heal_hp') {
          const val = eff.healHpPct
            ? Math.max(10, Math.round((stats.maxHp * Number(eff.healHpPct)) / 100))
            : Number(eff.value || Math.round(stats.maxHp * 0.45));
          state.player.hp = Math.min(stats.maxHp, state.player.hp + val);
          Audio.playSFX('heal');
          showToast(`💚 使用【${item.name}】，回復 +${val} HP！`, 'success');
        } else {
          const val = eff.healMpPct
            ? Math.max(8, Math.round((stats.maxMp * Number(eff.healMpPct)) / 100))
            : Number(eff.value || Math.round(stats.maxMp * 0.5));
          state.player.mp = Math.min(stats.maxMp, state.player.mp + val);
          Audio.playSFX('skill');
          showToast(`💧 使用【${item.name}】，回復 +${val} MP！`, 'info');
        }
        autoSave();
        updateHUD();
        renderInventory();
      };
    }
    const sellBtn = $('btn-inv-sell');
    if (sellBtn) {
      sellBtn.onclick = () => {
        if (!removeItem(item.id, 1)) return;
        const sp = getSellPrice(item);
        gainGold(sp);
        Audio.playSFX('click');
        showToast(`💰 出售【${item.name}】，獲得 +${sp} 金幣`, 'info');
        autoSave();
        updateHUD();
        renderInventory();
      };
    }
  }

  // ---- Quests Evaluator & Renderer ----
  function evaluateGoalProgress(obj) {
    if (!obj) return { current: 0, target: 1, done: false };
    if (typeof obj.getProgress === 'function') {
      const res = obj.getProgress(state);
      const target = Number(res.target || 1);
      const current = Number(res.current || 0);
      return { current: Math.min(current, target), target, done: current >= target };
    }
    if (typeof obj.check === 'function') {
      const done = Boolean(obj.check(state));
      return { current: done ? 1 : 0, target: 1, done };
    }

    const cond = obj.condition || obj.objective || obj;
    const type = cond.checkType || cond.targetType || cond.metric || cond.conditionType || cond.goalType || cond.reqType || cond.type || '';
    const isDaily = obj.type === 'daily' || obj.category === 'daily';
    const rawTarget = cond.targetCount ?? cond.count ?? cond.goal ?? (typeof cond.target === 'number' ? cond.target : undefined) ?? cond.value ?? 1;
    const target = Math.max(1, Number(rawTarget) || 1);
    const targetId = cond.targetId || cond.regionId || cond.npcId || cond.readingId || (typeof cond.target === 'string' ? cond.target : null);
    let current = 0;

    switch (type) {
      case 'defeat_boss':
      case 'boss': {
        if (targetId) {
          const bossEnemy = getEnemyById(targetId);
          const cleared =
            state.progress.defeatedBosses.includes(targetId) ||
            state.stats.defeatedEnemies.includes(targetId) ||
            Boolean(bossEnemy && state.progress.defeatedBosses.includes(bossEnemy.regionId));
          return { current: cleared ? 1 : 0, target: 1, done: cleared };
        }
        current = state.progress.defeatedBosses.length;
        break;
      }
      case 'bossesDefeated':
        current = state.progress.defeatedBosses.length;
        break;
      case 'win_battles':
      case 'battles':
      case 'battlesWon':
        current = isDaily ? state.quests.dailyProgress.win_battles : state.stats.battlesWon;
        break;
      case 'correct_answers':
      case 'correct':
      case 'totalCorrect':
        current = isDaily ? state.quests.dailyProgress.correct_answers : state.stats.totalCorrect;
        break;
      case 'npc_talk':
      case 'talk':
        current = isDaily ? state.quests.dailyProgress.npc_talk : state.stats.npcTalks;
        break;
      case 'complete_shrine':
      case 'shrine':
        current = isDaily ? state.quests.dailyProgress.complete_shrine : state.stats.shrineCompleted;
        break;
      case 'shrine_rank_s':
      case 'shrineRankS':
        current = state.stats.shrineRankS;
        break;
      case 'clear_reading':
      case 'reading':
      case 'readingCleared': {
        if (targetId) {
          const cleared = state.progress.clearedReadings.includes(targetId);
          return { current: cleared ? 1 : 0, target: 1, done: cleared };
        }
        current = state.progress.clearedReadings.length;
        break;
      }
      case 'level':
      case 'reach_level':
        current = state.player.level;
        break;
      case 'affection':
      case 'maxAffection': {
        if (targetId && state.npc[targetId]) {
          current = state.npc[targetId].affection;
        } else {
          current = Math.max(0, ...Object.values(state.npc).map((n) => n.affection || 0));
        }
        break;
      }
      case 'enhance':
      case 'enhance_item':
        current = state.stats.enhanceCount;
        break;
      case 'combo':
      case 'max_combo':
      case 'maxCombo':
        current = state.stats.maxCombo;
        break;
      case 'fever':
      case 'feverCount':
      case 'reach_fever':
        current = isDaily ? (state.quests.dailyProgress.reach_fever || 0) : state.stats.feverCount;
        break;
      case 'break':
      case 'breaks':
      case 'breaksTriggered':
        current = state.stats.breaksTriggered;
        break;
      case 'gold_earned':
      case 'goldEarned':
        current = state.stats.goldEarned;
        break;
      case 'itemsOwned': {
        const ownedSet = new Set();
        ['weapon', 'armor', 'accessory'].forEach((s) => {
          if (state.player.equipment[s]) ownedSet.add(state.player.equipment[s]);
        });
        state.inventory.forEach((e) => { if (e && e.qty > 0) ownedSet.add(e.id); });
        current = ownedSet.size;
        break;
      }
      case 'defeated_enemies':
        current = state.stats.defeatedEnemies.length;
        break;
      case 'skills_learned':
        current = Object.values(state.skills).reduce((a, b) => a + b, 0);
        break;
      default:
        current = 0;
    }

    return { current: Math.min(current, target), target, done: current >= target };
  }

  function renderQuests() {
    document.querySelectorAll('#quest-tabs .tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === uiTabs.quests);
    });

    const listEl = $('quest-list');
    if (!listEl) return;
    const stats = getTotalStats();
    const negMult = 1 + stats.questRewardBonus;

    const quests = getQuests().filter((q) => (q.type || q.category || 'main') === uiTabs.quests);
    if (quests.length === 0) {
      listEl.innerHTML = '<p class="empty-hint">此分類目前沒有任務。</p>';
      return;
    }

    listEl.innerHTML = quests.map((q) => {
      const claimed = state.quests.claimedIds.includes(q.id);
      const prog = evaluateGoalProgress(q);
      const ready = !claimed && prog.done;
      const pct = prog.target > 0 ? Math.round((prog.current / prog.target) * 100) : 0;

      const rew = q.rewards || q.reward || {};
      const finalExp = rew.exp ? Math.round(rew.exp * negMult) : 0;
      const finalGold = rew.gold ? Math.round(rew.gold * negMult) : 0;
      const rewParts = [];
      if (finalExp) rewParts.push(`⭐ ${finalExp} EXP`);
      if (finalGold) rewParts.push(`🪙 ${finalGold} 金幣`);
      if (rew.sp) rewParts.push(`✨ ${rew.sp} SP`);
      if (rew.itemId) {
        const it = getItemById(rew.itemId);
        rewParts.push(`🎁 ${it ? it.name : rew.itemId}`);
      }
      if (rew.title) rewParts.push(`👑 稱號「${rew.title}」`);

      return `
        <div class="quest-card panel-card ${claimed ? 'quest-completed' : ready ? 'quest-ready' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
            <div>
              <h3 style="margin:0 0 4px;color:var(--gold-bright);">${escapeHtml(q.title || q.name)}</h3>
              <p class="text-muted" style="font-size:0.88rem;margin:0;">${escapeHtml(q.desc || q.description || '')}</p>
            </div>
            <div>
              ${claimed
                ? '<span class="badge badge-emerald">✔ 已領取</span>'
                : ready
                  ? `<button type="button" class="btn btn-gold btn-sm" data-claim-quest="${escapeHtml(q.id)}">🎁 領取報酬</button>`
                  : `<span class="badge">${prog.current} / ${prog.target}</span>`
              }
            </div>
          </div>
          <div class="progress-track" style="margin:10px 0 8px;">
            <div class="progress-fill" style="width:${pct}%;"></div>
          </div>
          <div style="font-size:0.84rem;" class="text-gold">
            報酬：${rewParts.join('・') || '冒險榮譽'}
            ${stats.questRewardBonus > 0 ? `<span class="text-emerald" style="margin-left:6px;">（言靈交涉 +${Math.round(stats.questRewardBonus * 100)}%）</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-claim-quest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const qid = btn.getAttribute('data-claim-quest');
        claimQuestReward(qid);
      });
    });
  }

  function claimQuestReward(questId) {
    const q = getQuests().find((x) => x.id === questId);
    if (!q || state.quests.claimedIds.includes(questId)) return;
    const prog = evaluateGoalProgress(q);
    if (!prog.done) return;

    const stats = getTotalStats();
    const negMult = 1 + stats.questRewardBonus;
    const rew = q.rewards || q.reward || {};

    state.quests.claimedIds.push(questId);
    const parts = [];
    if (rew.exp) {
      const e = Math.round(rew.exp * negMult);
      gainExp(e);
      parts.push(`⭐ +${e} EXP`);
    }
    if (rew.gold) {
      const g = Math.round(rew.gold * negMult);
      gainGold(g);
      parts.push(`🪙 +${g} 金幣`);
    }
    if (rew.sp) {
      state.player.sp += Number(rew.sp);
      parts.push(`✨ +${rew.sp} SP`);
    }
    if (rew.itemId) {
      addItem(rew.itemId, rew.qty || 1);
      const it = getItemById(rew.itemId);
      parts.push(`🎁 ${it ? it.name : rew.itemId}`);
    }
    if (rew.title) {
      grantTitle(rew.title);
      parts.push(`👑 ${rew.title}`);
    }

    Audio.playSFX('levelup');
    showToast(`📜 完成任務【${q.title || q.name}】！獲得：${parts.join('、')}`, 'gold');
    checkAchievements();
    autoSave();
    updateHUD();
    renderQuests();
  }

  // ---- Achievements Auto-Checker ----
  function checkAchievements() {
    if (!hasActiveSession) return;
    const list = getAchievements();
    let anyNew = false;

    list.forEach((ach) => {
      if (state.achievements.includes(ach.id)) return;
      const prog = evaluateGoalProgress(ach);
      if (prog.done) {
        state.achievements.push(ach.id);
        anyNew = true;
        const rew = ach.rewards || ach.reward || {};
        const notes = [];
        if (rew.gold) { gainGold(rew.gold); notes.push(`🪙 +${rew.gold}`); }
        if (rew.exp) { gainExp(rew.exp); notes.push(`⭐ +${rew.exp} EXP`); }
        if (rew.sp) { state.player.sp += Number(rew.sp); notes.push(`✨ +${rew.sp} SP`); }
        if (rew.title) { grantTitle(rew.title); notes.push(`👑 稱號「${rew.title}」`); }

        Audio.playSFX('levelup');
        showToast(
          `🏆 成就解鎖：【${ach.title || ach.name}】${notes.length ? `（${notes.join('、')}）` : ''}`,
          'achievement'
        );
      }
    });

    if (anyNew) autoSave();
  }

  // ---- Codex (Bestiary, Achievements, Mistake Notebook) ----
  function renderCodex() {
    document.querySelectorAll('#codex-tabs .tab-btn').forEach((b) => {
      b.classList.toggle('active', b.getAttribute('data-tab') === uiTabs.codex);
    });

    const summaryEl = $('codex-summary');
    const contentEl = $('codex-content');
    if (!contentEl) return;

    if (uiTabs.codex === 'bestiary') {
      const enemies = getEnemies();
      const found = enemies.filter((e) => state.stats.encounteredEnemies.includes(e.id) || state.stats.defeatedEnemies.includes(e.id)).length;
      if (summaryEl) {
        summaryEl.innerHTML = `👹 已遭遇魔物：<strong>${found} / ${enemies.length}</strong> ｜ 已討伐種類：<strong>${state.stats.defeatedEnemies.length} / ${enemies.length}</strong>`;
      }
      contentEl.innerHTML = `<div class="bestiary-grid">
        ${enemies.map((e) => {
          const seen = state.stats.encounteredEnemies.includes(e.id) || state.stats.defeatedEnemies.includes(e.id);
          const defeated = state.stats.defeatedEnemies.includes(e.id);
          const region = getRegionById(e.regionId);
          return `
            <div class="bestiary-card ${seen ? '' : 'undiscovered'}">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span class="badge ${e.isBoss ? 'badge-crimson' : 'badge-cyan'}">${e.isBoss ? 'BOSS' : (region ? region.jlpt : 'N4')}</span>
                ${defeated ? '<span class="badge badge-emerald">已討伐</span>' : (seen ? '<span class="badge">已遭遇</span>' : '<span class="badge">未發現</span>')}
              </div>
              <div class="bestiary-art-wrap">${Art.enemy(e.id, e.isBoss)}</div>
              <h4 style="margin:0;color:var(--gold-bright);">${seen ? escapeHtml(e.name) : '？？？'}</h4>
              ${seen
                ? `<div style="font-size:0.82rem;" class="text-cyan">弱點：${escapeHtml(e.weaknessLabel || QUESTION_TYPE_LABELS[e.weakness] || e.weakness)}｜HP ${e.maxHp ?? e.hp}・ATK ${e.atk}</div>
                   <p class="text-muted" style="font-size:0.82rem;margin:0;">${escapeHtml(e.lore || e.desc || '')}</p>`
                : '<p class="text-muted" style="font-size:0.82rem;margin:0;">於對應區域探索並遭遇此魔物以解鎖情報。</p>'
              }
            </div>
          `;
        }).join('')}
      </div>`;
    } else if (uiTabs.codex === 'achievements') {
      const achs = getAchievements();
      const unlockedCount = achs.filter((a) => state.achievements.includes(a.id)).length;
      if (summaryEl) {
        summaryEl.innerHTML = `🏆 已解鎖成就：<strong>${unlockedCount} / ${achs.length}</strong>`;
      }
      contentEl.innerHTML = `<div class="achievements-grid">
        ${achs.map((a) => {
          const unlocked = state.achievements.includes(a.id);
          const prog = evaluateGoalProgress(a);
          const rew = a.rewards || a.reward || {};
          const rList = [];
          if (rew.gold) rList.push(`🪙${rew.gold}`);
          if (rew.sp) rList.push(`✨${rew.sp}SP`);
          if (rew.title) rList.push(`👑${rew.title}`);
          return `
            <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}">
              <div class="achievement-badge-slot">${Art.badge(a.icon || 'trophy', unlocked)}</div>
              <div style="flex:1;">
                <div style="font-weight:700;color:${unlocked ? 'var(--gold-bright)' : 'var(--text-main)'};">${escapeHtml(a.title || a.name)}</div>
                <div class="text-muted" style="font-size:0.82rem;margin:2px 0 4px;">${escapeHtml(a.desc || a.description || '')}</div>
                <div style="font-size:0.78rem;display:flex;justify-content:space-between;gap:6px;">
                  <span class="text-gold">${rList.join(' ')}</span>
                  <span class="${unlocked ? 'text-emerald' : 'text-muted'}">${unlocked ? '✔ 已達成' : `${prog.current}/${prog.target}`}</span>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>`;
    } else if (uiTabs.codex === 'mistakes') {
      if (summaryEl) {
        summaryEl.innerHTML = `📝 錯題筆記收錄：<strong>${state.mistakes.length} 題</strong>（答錯時自動收錄，點擊「標記已掌握」即可移出）`;
      }
      if (state.mistakes.length === 0) {
        contentEl.innerHTML = '<div class="panel-card" style="padding:28px;text-align:center;"><p class="empty-hint">🎉 太棒了！錯題本目前空空如也！</p></div>';
        return;
      }

      contentEl.innerHTML = `<div class="mistake-list">
        ${state.mistakes.map((m) => {
          const rawQ = getQuestionById(m.questionId);
          if (!rawQ) return '';
          const q = normalizeQuestion(rawQ);
          return `
            <div class="mistake-card force-furigana">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <div>
                  <span class="jlpt-badge">${escapeHtml(q.jlpt)}</span>
                  <span class="badge badge-crimson" style="margin-left:6px;">錯 ${m.count} 次</span>
                  <span class="badge" style="margin-left:6px;">${QUESTION_TYPE_LABELS[q.type] || q.type}</span>
                </div>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="btn btn-sm btn-audio" data-mistake-tts="${escapeHtml(q.id)}" data-rate="1.0">🔊 朗讀</button>
                  <button type="button" class="btn btn-sm btn-audio" data-mistake-tts="${escapeHtml(q.id)}" data-rate="0.65">🐢 慢速</button>
                  <button type="button" class="btn btn-sm btn-secondary" data-master-q="${escapeHtml(q.id)}">✔ 標記已掌握</button>
                </div>
              </div>
              <div class="text-muted" style="font-size:0.86rem;margin-bottom:4px;">${q.promptZh}</div>
              <div class="mistake-question jp-text" style="font-size:1.1rem;margin-bottom:6px;">${q.fullRubyJp || q.promptJp}</div>
              <div style="margin-bottom:4px;">正解：<strong class="text-emerald">${q.correctDisplay}</strong>（${escapeHtml(q.kanaReading)}）</div>
              <div style="font-size:0.86rem;color:var(--text-muted);">💡 ${q.explanation}</div>
            </div>
          `;
        }).join('')}
      </div>`;

      contentEl.querySelectorAll('[data-mistake-tts]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const rawQ = getQuestionById(btn.getAttribute('data-mistake-tts'));
          if (!rawQ) return;
          const q = normalizeQuestion(rawQ);
          Audio.speak(q.tts || stripRubyHtml(q.fullRubyJp), Number(btn.getAttribute('data-rate')) || 1.0);
        });
      });

      contentEl.querySelectorAll('[data-master-q]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qid = btn.getAttribute('data-master-q');
          state.mistakes = state.mistakes.filter((m) => m.questionId !== qid);
          Audio.playSFX('correct');
          showToast('✔ 已從錯題筆記移出！', 'success');
          autoSave();
          renderCodex();
        });
      });
    }
  }

  // ============================================================================
  // 17. Save / Load Modal
  // ============================================================================
  function openSaveModal(loadOnly = false) {
    saveModalLoadOnly = Boolean(loadOnly || !hasActiveSession);
    renderSaveModal();
    openModal('modal-save');
  }

  function renderSaveModal() {
    const listEl = $('save-slots-list');
    if (!listEl) return;

    listEl.innerHTML = SAVE_SLOT_LIST.map((slot) => {
      const raw = readRawSlot(slot.key);
      const hasData = Boolean(raw && raw.player);
      const job = hasData ? getJobById(raw.player.jobId) : null;
      const region = hasData && raw.progress ? getRegionById(raw.progress.currentRegionId) : null;

      return `
        <div class="panel-card" style="padding:14px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
          <div>
            <div style="font-weight:700;color:var(--gold-bright);">${escapeHtml(slot.label)}</div>
            ${hasData
              ? `<div style="font-size:0.9rem;margin-top:4px;">
                  <strong>${escapeHtml(raw.player.name)}</strong>（${escapeHtml(job ? job.name : '')} Lv.${raw.player.level || 1}）
                  ・🪙 ${raw.player.gold || 0}・📍 ${escapeHtml(region ? region.name : '黎明之村')}
                </div>
                <div class="text-muted" style="font-size:0.78rem;margin-top:2px;">存檔時間：${formatTimestamp(raw.savedAt)}</div>`
              : '<div class="text-muted" style="font-size:0.86rem;margin-top:4px;">（空欄位）</div>'
            }
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${!saveModalLoadOnly && !slot.isAuto
              ? `<button type="button" class="btn btn-sm btn-gold" data-save-key="${slot.key}">💾 儲存</button>`
              : ''
            }
            ${hasData
              ? `<button type="button" class="btn btn-sm btn-primary" data-load-key="${slot.key}">📂 讀取</button>
                 <button type="button" class="btn btn-sm btn-danger" data-del-key="${slot.key}">🗑️ 刪除</button>`
              : ''
            }
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('[data-save-key]').forEach((btn) => {
      btn.addEventListener('click', () => saveToSlot(btn.getAttribute('data-save-key')));
    });
    listEl.querySelectorAll('[data-load-key]').forEach((btn) => {
      btn.addEventListener('click', () => loadFromSlot(btn.getAttribute('data-load-key')));
    });
    listEl.querySelectorAll('[data-del-key]').forEach((btn) => {
      btn.addEventListener('click', () => {
        deleteSlot(btn.getAttribute('data-del-key'));
        Audio.playSFX('cancel');
        showToast('已刪除該存檔欄位。', 'info');
        renderSaveModal();
        if (currentView === 'title') renderTitle();
      });
    });
  }

  // ============================================================================
  // 18. Discreet Corner Dev / Test Tool
  // ============================================================================
  function ensureSessionForDev() {
    if (!hasActiveSession) {
      showToast('請先創建角色或讀取存檔後再使用測試工具！', 'warning');
      return false;
    }
    return true;
  }

  function devLevelUp(levels) {
    if (!ensureSessionForDev()) return;
    const job = getJobById(state.player.jobId);
    const growth = getJobGrowth(job);
    for (let i = 0; i < levels; i++) {
      state.player.level += 1;
      state.player.sp += 1;
      state.player.maxHp += growth.hp;
      state.player.maxMp += growth.mp;
      state.player.baseINT += growth.INT;
      state.player.baseWIS += growth.WIS;
      state.player.baseCHA += growth.CHA;
      state.player.nextExp = calcNextExp(state.player.level);
    }
    const stats = getTotalStats();
    state.player.hp = stats.maxHp;
    state.player.mp = stats.maxMp;
    Audio.playSFX('levelup');
    checkAchievements();
    autoSave();
    updateHUD();
    refreshActiveView();
    showToast(`🔧 測試工具：等級 +${levels}（目前 Lv.${state.player.level}，SP +${levels}，HP/MP 全滿）`, 'gold');
  }

  function refreshActiveView() {
    if (!hasActiveSession) return;
    switch (currentView) {
      case 'town': renderTown(); break;
      case 'map': renderMap(); break;
      case 'explore': renderExplore(); break;
      case 'battle': updateBattleUI(); break;
      case 'reading': renderReading(); break;
      case 'shrine': if (!shrine.active) renderShrine(); break;
      case 'character': renderCharacter(); break;
      case 'skills': renderSkills(); break;
      case 'inventory': renderInventory(); break;
      case 'quests': renderQuests(); break;
      case 'codex': renderCodex(); break;
      default: break;
    }
  }

  // ============================================================================
  // 19. Global Event Binding & Bootstrap
  // ============================================================================
  function bindStaticEvents() {
    // Top HUD controls
    if ($('btn-toggle-furigana')) {
      $('btn-toggle-furigana').addEventListener('click', () => {
        state.settings.furigana = !state.settings.furigana;
        Audio.playSFX('click');
        applyFuriganaSetting();
        autoSave();
      });
    }
    if ($('btn-toggle-bgm')) {
      $('btn-toggle-bgm').addEventListener('click', () => {
        Audio.toggleBGM();
        syncAudioButtons();
      });
    }
    if ($('btn-toggle-sfx')) {
      $('btn-toggle-sfx').addEventListener('click', () => {
        Audio.toggleSFX();
        syncAudioButtons();
      });
    }
    if ($('hud-difficulty-select')) {
      $('hud-difficulty-select').addEventListener('change', (e) => {
        Audio.playSFX('click');
        setDifficultyMode(e.target.value, { refreshCurrentBattleQuestion: true });
      });
    }
    if ($('btn-open-save')) {
      $('btn-open-save').addEventListener('click', () => {
        Audio.playSFX('click');
        openSaveModal(false);
      });
    }

    // Main Navigation Bar
    document.querySelectorAll('#nav-bar .nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (!view) return;
        Audio.playSFX('click');
        if (view === 'reading') {
          reading.active = false;
          const p = $('reading-paragraphs');
          if (p) p.removeAttribute('data-rd-rendered');
        }
        if (view === 'shrine' && !shrine.active) {
          shrine.results = [];
          shrine.tier = null;
        }
        switchView(view);
      });
    });

    // Title Screen buttons
    if ($('btn-title-continue')) {
      $('btn-title-continue').addEventListener('click', () => {
        const key = findLatestSaveKey();
        if (key) loadFromSlot(key);
      });
    }
    if ($('btn-title-new')) {
      $('btn-title-new').addEventListener('click', () => {
        Audio.init();
        Audio.playSFX('confirm');
        switchView('create');
      });
    }
    if ($('btn-title-load')) {
      $('btn-title-load').addEventListener('click', () => {
        Audio.init();
        Audio.playSFX('click');
        openSaveModal(true);
      });
    }

    // Character Creation buttons
    if ($('btn-create-confirm')) {
      $('btn-create-confirm').addEventListener('click', confirmCharacterCreation);
    }
    if ($('btn-create-back')) {
      $('btn-create-back').addEventListener('click', () => {
        Audio.playSFX('cancel');
        switchView('title');
      });
    }

    // Town Quick Actions & Dialogue Speech Click-to-Complete
    if ($('btn-town-rest')) {
      $('btn-town-rest').addEventListener('click', () => {
        const stats = getTotalStats();
        state.player.hp = stats.maxHp;
        state.player.mp = stats.maxMp;
        Audio.playSFX('heal');
        autoSave();
        updateHUD();
        showToast('🛏️ 在黎明之村充分休憩，HP 與 MP 已完全回復！', 'success');
      });
    }
    if ($('btn-town-map')) $('btn-town-map').addEventListener('click', () => { Audio.playSFX('click'); switchView('map'); });
    if ($('btn-town-reading')) $('btn-town-reading').addEventListener('click', () => { Audio.playSFX('click'); reading.active = false; switchView('reading'); });
    if ($('btn-town-shrine')) $('btn-town-shrine').addEventListener('click', () => { Audio.playSFX('click'); shrine.results = []; shrine.tier = null; switchView('shrine'); });

    const speechBox = document.querySelector('#town-dialogue-panel .dialogue-speech-box');
    if (speechBox) {
      speechBox.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        completeTypewriterImmediately();
      });
    }
    if ($('btn-dialogue-tts')) {
      $('btn-dialogue-tts').addEventListener('click', () => {
        if (townState.currentTts) Audio.speak(townState.currentTts, 1.0);
      });
    }
    if ($('btn-dialogue-tts-slow')) {
      $('btn-dialogue-tts-slow').addEventListener('click', () => {
        if (townState.currentTts) Audio.speak(townState.currentTts, 0.65);
      });
    }

    // Explore buttons
    if ($('btn-explore-retreat')) $('btn-explore-retreat').addEventListener('click', () => { Audio.playSFX('click'); explorePendingEvent = null; switchView('map'); });
    if ($('btn-explore-step')) $('btn-explore-step').addEventListener('click', handleExploreStep);
    if ($('btn-explore-boss')) $('btn-explore-boss').addEventListener('click', () => triggerRegionBossBattle(state.progress.currentRegionId));
    if ($('btn-explore-camp')) $('btn-explore-camp').addEventListener('click', () => { Audio.playSFX('click'); switchView('inventory'); });

    // Battle controls
    if ($('btn-battle-tts-normal')) {
      $('btn-battle-tts-normal').addEventListener('click', () => {
        if (battle.currentQ) Audio.speak(battle.currentQ.tts || stripRubyHtml(battle.currentQ.fullRubyJp), 1.0);
      });
    }
    if ($('btn-battle-tts-slow')) {
      $('btn-battle-tts-slow').addEventListener('click', () => {
        if (battle.currentQ) Audio.speak(battle.currentQ.tts || stripRubyHtml(battle.currentQ.fullRubyJp), 0.65);
      });
    }
    if ($('btn-skill-vocab')) $('btn-skill-vocab').addEventListener('click', useVocabInsight);
    if ($('btn-skill-listen')) $('btn-skill-listen').addEventListener('click', useClairaudience);
    if ($('btn-battle-flee')) {
      $('btn-battle-flee').addEventListener('click', () => {
        if (!battle.active) return;
        stopBattleTimers();
        battle.active = false;
        Audio.playSFX('cancel');
        showToast('🏃 已安全撤退回營地。', 'info');
        switchView(battle.returnView || 'explore');
      });
    }

    // Reading controls
    if ($('btn-reading-skill')) $('btn-reading-skill').addEventListener('click', useSpeedReadingSkill);
    if ($('btn-reading-next')) $('btn-reading-next').addEventListener('click', advanceReadingQuestion);
    if ($('btn-reading-exit')) {
      $('btn-reading-exit').addEventListener('click', () => {
        Audio.playSFX('cancel');
        Audio.stopSpeak();
        reading.active = false;
        const p = $('reading-paragraphs');
        if (p) p.removeAttribute('data-rd-rendered');
        renderReading();
      });
    }

    // Shrine controls
    if ($('btn-shrine-quit')) {
      $('btn-shrine-quit').addEventListener('click', () => {
        stopShrineTimer();
        Audio.stopSpeak();
        shrine.active = false;
        shrine.results = [];
        shrine.tier = null;
        Audio.playSFX('cancel');
        Audio.playBGM('town');
        updateChromeVisibility('shrine');
        renderShrine();
      });
    }
    if ($('btn-shrine-return')) {
      $('btn-shrine-return').addEventListener('click', () => {
        Audio.playSFX('click');
        shrine.results = [];
        shrine.tier = null;
        renderShrine();
      });
    }

    // Tab bars (Inventory, Quests, Codex, Shop)
    document.querySelectorAll('#inv-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.inv = btn.getAttribute('data-tab') || 'all';
        renderInventory();
      });
    });
    document.querySelectorAll('#quest-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.quests = btn.getAttribute('data-tab') || 'main';
        renderQuests();
      });
    });
    document.querySelectorAll('#codex-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.codex = btn.getAttribute('data-tab') || 'bestiary';
        renderCodex();
      });
    });
    document.querySelectorAll('#shop-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.shop = btn.getAttribute('data-tab') || 'buy';
        document.querySelectorAll('#shop-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderShopModal();
      });
    });

    // Modals
    // IMPORTANT: #modal-explain can ONLY be closed via #btn-explain-confirm!
    if ($('btn-explain-confirm')) {
      $('btn-explain-confirm').addEventListener('click', () => {
        Audio.stopSpeak();
        Audio.playSFX('confirm');
        closeModal('modal-explain');
        const cb = explainCallback;
        explainCallback = null;
        if (cb) cb();
      });
    }

    if ($('btn-shop-close')) $('btn-shop-close').addEventListener('click', () => { Audio.playSFX('click'); closeModal('modal-shop'); });
    if ($('btn-save-close')) $('btn-save-close').addEventListener('click', () => { Audio.playSFX('click'); closeModal('modal-save'); });
    if ($('btn-generic-close')) {
      $('btn-generic-close').addEventListener('click', () => {
        Audio.playSFX('click');
        closeModal('modal-generic');
        const cb = genericModalCallback;
        genericModalCallback = null;
        if (cb) cb();
      });
    }

    // Backdrop click closes ONLY non-mandatory modals (never #modal-explain!)
    ['modal-shop', 'modal-save', 'modal-generic'].forEach((mid) => {
      const overlay = $(mid);
      if (!overlay) return;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(mid);
          if (mid === 'modal-generic' && genericModalCallback) {
            const cb = genericModalCallback;
            genericModalCallback = null;
            cb();
          }
        }
      });
    });

    // Discreet Corner Dev / Test Tool
    const drawer = $('dev-drawer');
    if ($('btn-dev-toggle') && drawer) {
      $('btn-dev-toggle').addEventListener('click', () => {
        drawer.classList.toggle('hidden');
      });
    }
    if ($('dev-close') && drawer) {
      $('dev-close').addEventListener('click', () => {
        drawer.classList.add('hidden');
      });
    }

    if ($('dev-add-gold')) {
      $('dev-add-gold').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        gainGold(5000);
        Audio.playSFX('chest');
        autoSave();
        updateHUD();
        if ($('modal-shop') && $('modal-shop').classList.contains('open')) renderShopModal();
        showToast('🪙 測試工具：獲得 +5000 金幣！', 'gold');
      });
    }
    if ($('dev-level-up')) $('dev-level-up').addEventListener('click', () => devLevelUp(1));
    if ($('dev-level-5')) $('dev-level-5').addEventListener('click', () => devLevelUp(5));
    if ($('dev-full-heal')) {
      $('dev-full-heal').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        const stats = getTotalStats();
        state.player.hp = stats.maxHp;
        state.player.mp = stats.maxMp;
        Audio.playSFX('heal');
        autoSave();
        updateHUD();
        refreshActiveView();
        showToast('💚 測試工具：HP / MP 已完全回復！', 'success');
      });
    }
    if ($('dev-add-sp')) {
      $('dev-add-sp').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        state.player.sp += 10;
        Audio.playSFX('levelup');
        autoSave();
        updateHUD();
        refreshActiveView();
        showToast('✨ 測試工具：獲得 +10 SP！', 'gold');
      });
    }
    if ($('dev-unlock-all')) {
      $('dev-unlock-all').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        state.progress.unlockedAllOverride = true;
        Audio.playSFX('levelup');
        autoSave();
        refreshActiveView();
        showToast('🗺️ 測試工具：已解鎖全部 6 大區域與全部 10 座閱讀副本！', 'gold');
      });
    }
    if ($('dev-trigger-boss')) {
      $('dev-trigger-boss').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        if (drawer) drawer.classList.add('hidden');
        triggerRegionBossBattle(state.progress.currentRegionId || 'r1');
      });
    }
    if ($('dev-reset-all')) {
      $('dev-reset-all').addEventListener('click', () => {
        Object.values(SAVE_KEYS).forEach(deleteSlot);
        stopBattleTimers();
        stopShrineTimer();
        stopTypewriter();
        Audio.stopSpeak();
        state = createDefaultState();
        hasActiveSession = false;
        battle.active = false;
        shrine.active = false;
        reading.active = false;
        if (drawer) drawer.classList.add('hidden');
        closeModal('modal-explain');
        closeModal('modal-shop');
        closeModal('modal-save');
        closeModal('modal-generic');
        Audio.playSFX('cancel');
        showToast('🗑️ 已清空所有本機存檔並回到標題畫面。', 'warning');
        switchView('title');
      });
    }
  }

  function init() {
    bindStaticEvents();
    applyFuriganaSetting();
    syncAudioButtons();
    syncDifficultyControls();
    switchView('title');
  }

  // ============================================================================
  // 20. Export Public Engine API on `window.Game`
  // ============================================================================
  const Game = {
    init,
    getState: () => state,
    sanitizeSaveData,
    createDefaultState,
    setDifficultyMode,
    setAdaptiveStartJlpt,
    getDifficultyModeConfig,
    getTotalStats,
    getEnhancedItemStats,
    isRegionUnlocked,
    isReadingUnlocked,
    switchView,
    autoSave,
    saveToSlot,
    loadFromSlot,
    openSaveModal,
    openShopModal,
    startBattle,
    triggerRegionBossBattle,
    equipItem,
    unequipSlot,
    addItem,
    removeItem,
    gainExp,
    gainGold,
    checkAchievements,
    updateHUD,
    showToast
  };

  global.Game = Game;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => Game.init());
    } else {
      Game.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
