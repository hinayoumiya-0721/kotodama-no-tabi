/**
 * 《言霊の旅》存檔結構與清理、執行期狀態、儲存、能力值、道具與成長（js/state.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

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
        defeatedElites: [],
        tutorialStep: 0,
        unlockedAllOverride: false,
        clearedReadings: [],
        shrineBest: {},
        solvedByJlpt: { N4: [], N3: [], N2: [], N1: [] },
        bagByJlpt: { N4: [], N3: [], N2: [], N1: [] },
        cycleCountsByJlpt: { N4: 0, N3: 0, N2: 0, N1: 0 }
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
      wrongNotes: {},
      dailyTraining: {
        dateStr: new Date().toDateString(),
        correctCount: 0,
        reviewCount: 0,
        claimedIds: []
      },
      achievements: [],
      settings: {
        furigana: true,
        immersionMode: 'standard',
        difficultyMode: 'adaptive',
        adaptiveStartJlpt: 'N4',
        uiScale: 'normal'
      }
    };
  }

  function getValidTitlesSet() {
    const valid = new Set(['初醒的旅人', ...Object.keys(TITLE_FLAVOR_TEXTS)]);
    const add = (t) => {
      if (typeof t === 'string' && t.trim()) valid.add(t.trim());
    };
    getJobs().forEach((j) => add(j && j.title));
    getQuests().forEach((q) => {
      if (!q) return;
      add(q.reward && q.reward.title);
      add(q.rewards && q.rewards.title);
    });
    getAchievements().forEach((a) => {
      if (!a) return;
      add(a.reward && a.reward.title);
      add(a.rewards && a.rewards.title);
    });
    getNPCs().forEach((n) => {
      if (!n || !Array.isArray(n.milestones)) return;
      n.milestones.forEach((m) => {
        if (!m) return;
        add(m.title);
        add(m.reward && m.reward.title);
        add(m.rewards && m.rewards.title);
      });
    });
    getShrineTiers().forEach((t) => {
      if (!t) return;
      add(t.rewardTitle);
      add(t.rewards && t.rewards.title);
      add(`${t.jlpt || '言霊'}試煉突破者`);
    });
    return valid;
  }

  function sanitizeSaveData(raw) {
    const def = createDefaultState();
    if (!raw || typeof raw !== 'object') return def;

    const out = def;
    out.version = SAVE_VERSION;
    out.savedAt = typeof raw.savedAt === 'string' ? raw.savedAt : def.savedAt;

    // Player
    const rp = raw.player && typeof raw.player === 'object' && !Array.isArray(raw.player) ? raw.player : {};
    const cleanName = typeof rp.name === 'string'
      ? rp.name.replace(/[\x00-\x1f\x7f]/g, '').trim().slice(0, 12)
      : '';
    out.player.name = cleanName || def.player.name;
    // getJobById() falls back to jobs[0] (always truthy), so validate against the real id list
    const validJobIds = new Set(getJobs().map((j) => j.id));
    out.player.jobId = typeof rp.jobId === 'string' && validJobIds.has(rp.jobId) ? rp.jobId : def.player.jobId;
    // toSafeInt rejects NaN/Infinity from malformed imports (e.g. "gold":"abc", "level":1e400)
    out.player.level = toSafeInt(rp.level, 1, 1, 999);
    out.player.exp = toSafeInt(rp.exp, 0, 0);
    out.player.nextExp = toSafeInt(rp.nextExp, Math.max(50, calcNextExp(out.player.level)), 50);
    out.player.maxHp = toSafeInt(rp.maxHp, def.player.maxHp, 30, 99999);
    out.player.hp = toSafeInt(rp.hp, out.player.maxHp, 1, out.player.maxHp * 3);
    out.player.maxMp = toSafeInt(rp.maxMp, def.player.maxMp, 20, 99999);
    out.player.mp = toSafeInt(rp.mp, out.player.maxMp, 0, out.player.maxMp * 3);
    out.player.baseINT = toSafeInt(rp.baseINT, def.player.baseINT, 1, 9999);
    out.player.baseWIS = toSafeInt(rp.baseWIS, def.player.baseWIS, 1, 9999);
    out.player.baseCHA = toSafeInt(rp.baseCHA, def.player.baseCHA, 1, 9999);
    out.player.gold = toSafeInt(rp.gold, def.player.gold, 0);
    out.player.sp = toSafeInt(rp.sp, def.player.sp, 0);
    const validTitles = getValidTitlesSet();
    const cleanTitles = Array.isArray(rp.unlockedTitles)
      ? Array.from(
          new Set(
            rp.unlockedTitles
              .filter((t) => typeof t === 'string')
              .map((t) => t.trim().slice(0, 24))
              .filter((t) => t && validTitles.has(t))
          )
        )
      : [];
    out.player.unlockedTitles = cleanTitles.length > 0 ? cleanTitles : ['初醒的旅人'];
    out.player.activeTitle = typeof rp.activeTitle === 'string' && out.player.unlockedTitles.includes(rp.activeTitle)
      ? rp.activeTitle
      : out.player.unlockedTitles[0];

    const req = rp.equipment && typeof rp.equipment === 'object' && !Array.isArray(rp.equipment) ? rp.equipment : {};
    const validEquipId = (slot, id) => {
      if (typeof id !== 'string' || !id || UNSAFE_OBJECT_KEYS.has(id)) return null;
      const item = getItemById(id);
      return item && (!item.type || item.type === slot) ? id : null;
    };
    out.player.equipment = {
      weapon: validEquipId('weapon', req.weapon),
      armor: validEquipId('armor', req.armor),
      accessory: validEquipId('accessory', req.accessory)
    };

    const renh = rp.enhancements && typeof rp.enhancements === 'object' ? rp.enhancements : {};
    out.player.enhancements = {};
    safeOwnKeys(renh).filter((k) => getItemById(k)).slice(0, SAVE_LIST_MAX).forEach((k) => {
      out.player.enhancements[k] = clamp(Math.floor(safeNum(renh[k]) || 0), 0, 5);
    });

    // Inventory
    if (Array.isArray(raw.inventory)) {
      const merged = new Map();
      raw.inventory.slice(0, SAVE_LIST_MAX).forEach((entry) => {
        if (entry && typeof entry.id === 'string' && entry.id && !UNSAFE_OBJECT_KEYS.has(entry.id) && getItemById(entry.id)) {
          const qty = toSafeInt(entry.qty, 0, 0, INVENTORY_QTY_MAX);
          if (qty > 0) merged.set(entry.id, Math.min(INVENTORY_QTY_MAX, (merged.get(entry.id) || 0) + qty));
        }
      });
      out.inventory = Array.from(merged.entries()).map(([id, qty]) => ({ id, qty }));
    }

    // Skills
    const rsk = raw.skills && typeof raw.skills === 'object' ? raw.skills : {};
    SKILL_IDS.forEach((sid) => {
      out.skills[sid] = clamp(Math.floor(safeNum(rsk[sid]) || 0), 0, 3);
    });

    // Progress
    const validRegionSet = new Set(['r1', 'r2', 'r3', 'r4', 'r5', 'r6']);
    const rpr = raw.progress && typeof raw.progress === 'object' ? raw.progress : {};
    out.progress.currentRegionId = typeof rpr.currentRegionId === 'string' && validRegionSet.has(rpr.currentRegionId)
      ? rpr.currentRegionId
      : 'r1';
    const rex = rpr.regionExplore && typeof rpr.regionExplore === 'object' ? rpr.regionExplore : {};
    ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].forEach((rid) => {
      out.progress.regionExplore[rid] = clamp(Math.floor(safeNum(rex[rid]) || 0), 0, 100);
    });
    out.progress.defeatedBosses = Array.isArray(rpr.defeatedBosses)
      ? Array.from(new Set(toStrList(rpr.defeatedBosses).filter((id) => validRegionSet.has(id))))
      : [];
    // Regions whose mid-exploration elite has been beaten (missing in pre-v1.5 saves → [])
    out.progress.defeatedElites = Array.isArray(rpr.defeatedElites)
      ? Array.from(new Set(toStrList(rpr.defeatedElites).filter((id) => validRegionSet.has(id))))
      : [];
    out.progress.unlockedAllOverride = Boolean(rpr.unlockedAllOverride);
    out.progress.clearedReadings = Array.isArray(rpr.clearedReadings) ? Array.from(new Set(toStrList(rpr.clearedReadings))) : [];
    // shrineBest is rendered into innerHTML: rebuild each entry from whitelisted fields only
    // (rank ∈ S/A/B/C, integer score/total/timeLeft) — never copy untrusted objects through.
    out.progress.shrineBest = {};
    if (rpr.shrineBest && typeof rpr.shrineBest === 'object' && !Array.isArray(rpr.shrineBest)) {
      safeOwnKeys(rpr.shrineBest).forEach((tierId) => {
        const b = rpr.shrineBest[tierId];
        if (!b || typeof b !== 'object' || !SHRINE_RANKS.includes(b.rank)) return;
        const total = toSafeInt(b.total, 0, 0, 1000);
        out.progress.shrineBest[tierId] = {
          rank: b.rank,
          score: toSafeInt(b.score, 0, 0, total),
          total,
          timeLeft: toSafeInt(b.timeLeft, 0, 0, 86400)
        };
      });
    }

    const rsj = rpr.solvedByJlpt && typeof rpr.solvedByJlpt === 'object' ? rpr.solvedByJlpt : {};
    const rbg = rpr.bagByJlpt && typeof rpr.bagByJlpt === 'object' ? rpr.bagByJlpt : {};
    const rcc = rpr.cycleCountsByJlpt && typeof rpr.cycleCountsByJlpt === 'object' ? rpr.cycleCountsByJlpt : {};
    JLPT_LEVELS.forEach((lvl) => {
      out.progress.solvedByJlpt[lvl] = Array.isArray(rsj[lvl]) ? Array.from(new Set(toStrList(rsj[lvl]))) : [];
      out.progress.bagByJlpt[lvl] = Array.isArray(rbg[lvl]) ? Array.from(new Set(toStrList(rbg[lvl]))) : [];
      out.progress.cycleCountsByJlpt[lvl] = toSafeInt(rcc[lvl], 0, 0, 100000);
    });

    // NPCs
    const rnpc = raw.npc && typeof raw.npc === 'object' ? raw.npc : {};
    ['mayor', 'merchant', 'scholar', 'priest'].forEach((nid) => {
      const n = rnpc[nid] && typeof rnpc[nid] === 'object' ? rnpc[nid] : {};
      out.npc[nid] = {
        affection: clamp(Math.floor(safeNum(n.affection) || 0), 0, 100),
        talkedIds: Array.isArray(n.talkedIds) ? Array.from(new Set(toStrList(n.talkedIds))) : [],
        claimedMilestones: Array.isArray(n.claimedMilestones)
          ? Array.from(new Set(n.claimedMilestones.map((m) => toSafeInt(m, 0, 0, 100)).filter((m) => m > 0)))
          : []
      };
    });

    // Quests (with daily date rollover)
    const rq = raw.quests && typeof raw.quests === 'object' ? raw.quests : {};
    const today = getTodayStr();
    const savedDate = typeof rq.dailyDate === 'string' ? rq.dailyDate : today;
    out.quests.claimedIds = Array.isArray(rq.claimedIds) ? Array.from(new Set(toStrList(rq.claimedIds))) : [];
    if (savedDate === today) {
      const dp = rq.dailyProgress && typeof rq.dailyProgress === 'object' ? rq.dailyProgress : {};
      out.quests.dailyDate = today;
      out.quests.dailyProgress = {
        win_battles: toSafeInt(dp.win_battles, 0, 0, COUNTER_MAX),
        correct_answers: toSafeInt(dp.correct_answers, 0, 0, COUNTER_MAX),
        npc_talk: toSafeInt(dp.npc_talk, 0, 0, COUNTER_MAX),
        complete_shrine: toSafeInt(dp.complete_shrine, 0, 0, COUNTER_MAX),
        reach_fever: toSafeInt(dp.reach_fever, 0, 0, COUNTER_MAX)
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
      out.stats[k] = toSafeInt(rst[k], 0, 0, COUNTER_MAX);
    });
    out.stats.encounteredEnemies = Array.isArray(rst.encounteredEnemies) ? Array.from(new Set(toStrList(rst.encounteredEnemies))) : [];
    out.stats.defeatedEnemies = Array.isArray(rst.defeatedEnemies) ? Array.from(new Set(toStrList(rst.defeatedEnemies))) : [];

    // Onboarding tutorial progress (pre-v1.6 saves with existing play history skip straight to 'done')
    const rawTut = rpr.tutorialStep;
    if (rawTut === 0 || rawTut === 1 || rawTut === 2 || rawTut === 'done') {
      out.progress.tutorialStep = rawTut;
    } else {
      const hasHistory =
        out.stats.battlesWon > 0 ||
        out.stats.totalCorrect > 0 ||
        out.stats.npcTalks > 0 ||
        out.player.level > 1 ||
        out.progress.defeatedBosses.length > 0;
      out.progress.tutorialStep = hasHistory ? 'done' : 0;
    }

    // Mistakes (legacy array)
    if (Array.isArray(raw.mistakes)) {
      out.mistakes = raw.mistakes.slice(0, SAVE_LIST_MAX)
        .filter((m) => m && typeof m.questionId === 'string')
        .map((m) => ({
          questionId: m.questionId,
          count: toSafeInt(m.count, 1, 1, COUNTER_MAX),
          lastWrongAt: typeof m.lastWrongAt === 'string' ? m.lastWrongAt : new Date().toISOString()
        }));
    }

    // Wrong Notes (言霊錯題筆記 + SRS Forgetting Curve - backwards compatible with old saves)
    out.wrongNotes = {};
    if (raw.wrongNotes && typeof raw.wrongNotes === 'object' && !Array.isArray(raw.wrongNotes)) {
      const nowMs = Date.now();
      safeOwnKeys(raw.wrongNotes).slice(0, SAVE_LIST_MAX).forEach((qid) => {
        const entry = raw.wrongNotes[qid];
        if (!entry || typeof entry !== 'object') return;
        const id = typeof entry.id === 'string' && entry.id ? entry.id : String(qid);
        if (UNSAFE_OBJECT_KEYS.has(id)) return;
        const rawMastered = Boolean(entry.mastered);
        const rawSrs = entry.srsLevel !== undefined && entry.srsLevel !== null
          ? clamp(Math.floor(safeNum(entry.srsLevel) || 0), 0, 4)
          : (rawMastered ? 4 : 0);
        const isMastered = rawMastered || rawSrs >= 4;
        const srsLevel = isMastered ? 4 : rawSrs;
        const nextReviewAt = isMastered
          ? null
          : (entry.nextReviewAt !== undefined && entry.nextReviewAt !== null && Number.isFinite(safeNum(entry.nextReviewAt))
              ? safeNum(entry.nextReviewAt)
              : nowMs);
        out.wrongNotes[id] = {
          id,
          wrongCount: toSafeInt(entry.wrongCount, 1, 1, COUNTER_MAX),
          lastWrongAt: typeof entry.lastWrongAt === 'string' ? entry.lastWrongAt : new Date().toISOString(),
          playerLastChoice: typeof entry.playerLastChoice === 'number' && Number.isFinite(entry.playerLastChoice)
            ? Math.floor(entry.playerLastChoice)
            : (typeof entry.playerLastChoice === 'string' ? entry.playerLastChoice.slice(0, 200) : null),
          correctCount: toSafeInt(entry.correctCount, 0, 0),
          mastered: isMastered,
          srsLevel,
          nextReviewAt
        };
      });
    }

    // Daily Training Quests (auto-resets whenever dateStr !== new Date().toDateString())
    const todayDateStr = new Date().toDateString();
    const rdt = raw.dailyTraining && typeof raw.dailyTraining === 'object' ? raw.dailyTraining : null;
    if (rdt && rdt.dateStr === todayDateStr) {
      out.dailyTraining = {
        dateStr: todayDateStr,
        correctCount: toSafeInt(rdt.correctCount, 0, 0, COUNTER_MAX),
        reviewCount: toSafeInt(rdt.reviewCount, 0, 0, COUNTER_MAX),
        claimedIds: Array.isArray(rdt.claimedIds) ? Array.from(new Set(toStrList(rdt.claimedIds))) : []
      };
    } else {
      out.dailyTraining = {
        dateStr: todayDateStr,
        correctCount: 0,
        reviewCount: 0,
        claimedIds: []
      };
    }

    // Achievements
    out.achievements = Array.isArray(raw.achievements) ? Array.from(new Set(toStrList(raw.achievements))) : [];

    // Settings (3-tier Immersion Mode backwards compatible with legacy furigana boolean)
    const rset = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    if (typeof rset.immersionMode === 'string' && IMMERSION_MODES.includes(rset.immersionMode)) {
      out.settings.immersionMode = rset.immersionMode;
    } else if (rset.furigana !== undefined) {
      out.settings.immersionMode = Boolean(rset.furigana) ? 'standard' : 'advanced';
    } else {
      out.settings.immersionMode = 'standard';
    }
    out.settings.furigana = out.settings.immersionMode === 'standard';
    const validModes = new Set(DIFFICULTY_MODES.map((m) => m.id));
    out.settings.difficultyMode = typeof rset.difficultyMode === 'string' && validModes.has(rset.difficultyMode)
      ? rset.difficultyMode
      : 'adaptive';
    out.settings.adaptiveStartJlpt = rset.adaptiveStartJlpt === 'N3' ? 'N3' : 'N4';
    out.settings.uiScale = typeof rset.uiScale === 'string' && UI_SCALE_MODES.includes(rset.uiScale)
      ? rset.uiScale
      : 'normal';

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
  let hudCollapsedMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
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
  let crossRegionNotifiedKeys = new Set();
  let uiNotesFilter = {
    jlpt: 'all',
    type: 'all',
    status: 'all'
  };

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
      if (raw && raw.player && typeof raw.player === 'object') {
        const ts = typeof raw.savedAt === 'string' ? (Date.parse(raw.savedAt) || 0) : 0;
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
      showToast('尚未啟程，無可銘刻的旅途記憶。', 'warning');
      return false;
    }
    const ok = writeSlot(slotKey, state);
    if (ok) {
      Sound.playSFX('confirm');
      showToast('💾 旅途記憶已銘刻於書卷！', 'success');
      renderSaveModal();
    }
    return ok;
  }

  function loadFromSlot(slotKey) {
    const raw = readRawSlot(slotKey);
    if (!raw) {
      showToast('此書卷尚無銘刻紀錄。', 'warning');
      return false;
    }
    let loaded;
    try {
      loaded = sanitizeSaveData(raw);
    } catch (_) {
      showToast('❌ 這個存檔已損毀，無法讀取。', 'error');
      return false;
    }
    state = loaded;
    hasActiveSession = true;
    battle.active = false;
    shrine.active = false;
    reading.active = false;
    stopBattleTimers();
    stopShrineTimer();
    applyFuriganaSetting();
    applyUiScaleSetting();
    closeModal('modal-save');
    closeModal('modal-tutorial');
    Sound.playSFX('confirm');
    showToast(`✨ 記憶書卷展開——歡迎歸來，${state.player.name}（Lv.${state.player.level}）！`, 'success');
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
    Sound.playSFX('confirm');
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
    Sound.playSFX('click');
    showToast(`已卸下【${item ? item.name : currentId}】`, 'info');
    autoSave();
    updateHUD();
    return true;
  }

  function grantTitle(titleStr, { silent = false } = {}) {
    if (!titleStr) return false;
    if (!state.player.unlockedTitles.includes(titleStr)) {
      state.player.unlockedTitles.push(titleStr);
      if (!silent) showToast(`👑 解鎖新稱號：【${titleStr}】`, 'gold');
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
      Sound.playSFX('levelup');
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

  // ---- Quest destinations: shared by the quest-card 「前往」 button and the objective bar ----
  function getHighestUnlockedRegionId() {
    let best = null;
    getRegions().forEach((r) => { if (isRegionUnlocked(r.id)) best = r.id; });
    return best || 'r1';
  }

  function getRegionIdForBoss(bossId) {
    const region = getRegions().find((r) => r.bossId === bossId);
    if (region) return region.id;
    const boss = getEnemyById(bossId);
    return boss && boss.isBoss && boss.regionId ? boss.regionId : null;
  }

  // Where a quest's 「前往」 should take the player, or null when there is no sensible place
  // (then no button is shown). Region-based targets carry `locked` so the UI can explain.
  function getQuestDestination(q) {
    if (!q) return null;
    const type = q.targetType || (q.goal && q.goal.type) || '';
    const regionDest = (regionId) => {
      const region = getRegionById(regionId);
      if (!region) return null;
      const locked = !isRegionUnlocked(region.id);
      return { kind: 'explore', regionId: region.id, locked, icon: locked ? 'lock' : 'sword', label: locked ? `${region.name}（未解鎖）` : `前往 ${region.name}` };
    };
    switch (type) {
      case 'defeat_boss':
        return regionDest(getRegionIdForBoss(q.targetId));
      case 'clear_reading':
        return { kind: 'view', view: 'reading', icon: 'book', label: '前往閱讀副本' };
      case 'complete_shrine':
        return { kind: 'view', view: 'shrine', icon: 'torii', label: '前往試煉神殿' };
      case 'npc_talk':
        return { kind: 'view', view: 'town', icon: 'house', label: '前往城鎮' };
      case 'correct_answers':
      case 'win_battles':
      case 'reach_fever': {
        const cur = state.progress.currentRegionId;
        return regionDest(cur && isRegionUnlocked(cur) ? cur : getHighestUnlockedRegionId());
      }
      default:
        return null;
    }
  }

  // ---- Current objective bar (town / world map / explore): the first unclaimed main quest ----
  function getCurrentObjective() {
    const mains = getQuests().filter((q) => (q.type || q.category || 'main') === 'main');
    const q = mains.find((x) => !state.quests.claimedIds.includes(x.id));
    if (!q) return null;
    return { q, prog: evaluateGoalProgress(q), dest: getQuestDestination(q) };
  }

  function renderObjectiveBar(containerId) {
    const el = $(containerId);
    if (!el) return;
    const obj = hasActiveSession ? getCurrentObjective() : null;
    if (!obj) {
      el.innerHTML = '';
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    const { q, prog, dest } = obj;
    const alreadyHere = dest && dest.kind === 'explore' && currentView === 'explore'
      && dest.regionId === state.progress.currentRegionId;
    let action = '';
    let actionDest = null;
    if (prog.done) {
      actionDest = { kind: 'quests', tab: 'main' };
      action = '<button type="button" class="btn btn-gold btn-sm objective-btn">🎁 領取報酬</button>';
    } else if (alreadyHere) {
      action = '<span class="badge badge-gold">📍 目標就在此區</span>';
    } else if (dest) {
      actionDest = dest;
      action = `<button type="button" class="btn btn-sm ${dest.locked ? 'btn-secondary' : 'btn-primary'} objective-btn">${pxIcon(dest.icon)} ${escapeHtml(dest.label)}</button>`;
    }
    el.innerHTML = `
      <span class="objective-label">🎯 目前目標</span>
      <span class="objective-title">${escapeHtml(q.title || q.name || '')}</span>
      <span class="objective-progress">${prog.current}/${prog.target}</span>
      ${action}
    `;
    const btn = el.querySelector('.objective-btn');
    if (btn && actionDest) btn.addEventListener('click', () => goToQuestDestination(actionDest));
  }

  // Performs the jump. All screen changes go through switchView(); per-view resets mirror
  // what the nav / town buttons already do for reading & shrine.
  function goToQuestDestination(dest) {
    if (!dest) return;
    Sound.playSFX('confirm');
    if (dest.kind === 'explore') {
      const region = getRegionById(dest.regionId);
      if (!region) return;
      if (!isRegionUnlocked(region.id)) {
        mapSelectedRegionId = region.id; // map opens with this region's (locked) details
        switchView('map');
        const prevBoss = region.prevRegionId ? getRegionBoss(region.prevRegionId) : null;
        const how = [
          region.unlockLevel ? `升到 Lv.${region.unlockLevel}` : '',
          prevBoss ? `擊敗「${prevBoss.name}」` : ''
        ].filter(Boolean).join('，或');
        showToast(`🔒 ${region.name} 尚未解鎖${how ? `：${how}` : ''}`, 'warning');
        return;
      }
      state.progress.currentRegionId = region.id;
      explorePendingEvent = null;
      autoSave();
      switchView('explore');
      return;
    }
    if (dest.kind === 'quests') {
      uiTabs.quests = dest.tab || 'main';
      switchView('quests');
      return;
    }
    if (dest.view === 'reading') {
      reading.active = false;
      const p = $('reading-paragraphs');
      if (p) p.removeAttribute('data-rd-rendered');
    } else if (dest.view === 'shrine' && !shrine.active) {
      shrine.results = [];
      shrine.tier = null;
    }
    switchView(dest.view);
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

  function ensureWrongNotesMap() {
    if (!state.wrongNotes || typeof state.wrongNotes !== 'object' || Array.isArray(state.wrongNotes)) {
      state.wrongNotes = {};
    }
    return state.wrongNotes;
  }

  function isWrongNoteDue(entry, nowMs = Date.now()) {
    if (!entry || entry.mastered) return false;
    return !entry.nextReviewAt || nowMs >= Number(entry.nextReviewAt);
  }

  function recordWrongNote(questionId, playerLastChoice = null) {
    if (!questionId) return;
    const notes = ensureWrongNotesMap();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const prev = notes[questionId];
    if (prev) {
      prev.wrongCount = Math.max(1, Number(prev.wrongCount) || 1) + 1;
      prev.lastWrongAt = nowIso;
      if (playerLastChoice !== undefined && playerLastChoice !== null) {
        prev.playerLastChoice = playerLastChoice;
      }
      prev.srsLevel = 0;
      prev.nextReviewAt = nowMs;
      prev.mastered = false;
    } else {
      notes[questionId] = {
        id: questionId,
        wrongCount: 1,
        lastWrongAt: nowIso,
        playerLastChoice: playerLastChoice !== undefined ? playerLastChoice : null,
        srsLevel: 0,
        nextReviewAt: nowMs,
        mastered: false
      };
    }
    if (getQuestionById(questionId)) {
      logMistake(questionId);
    }
    updateNavMistakeBadge();
  }

  // opts.requireDue: when true, a correct answer on a not-yet-due note only bumps correctCount
  // and does NOT raise srsLevel (prevents "all"-mode grinding from skipping the forgetting curve).
  function advanceWrongNoteSRS(questionId, isCorrect = true, opts = {}) {
    if (!questionId) {
      return { advanced: false, mastered: false, srsLevel: 0, daysAdded: 0, label: '' };
    }
    if (isCorrect === false) {
      recordWrongNote(questionId);
      return {
        advanced: false,
        mastered: false,
        srsLevel: 0,
        daysAdded: 0,
        label: 'SRS Lv.0（記憶重置・今日到期）'
      };
    }
    if (!state.wrongNotes || !state.wrongNotes[questionId]) {
      return { advanced: false, mastered: false, srsLevel: 0, daysAdded: 0, label: '' };
    }
    const entry = state.wrongNotes[questionId];
    if (entry.mastered) {
      return { advanced: false, mastered: true, srsLevel: 4, daysAdded: 0, label: '已完全刻印' };
    }
    entry.correctCount = toSafeInt(entry.correctCount, 0, 0) + 1;
    if (opts && opts.requireDue && !isWrongNoteDue(entry)) {
      const lv = clamp(Math.floor(Number(entry.srsLevel) || 0), 0, 3);
      return {
        advanced: false,
        mastered: false,
        early: true,
        srsLevel: lv,
        daysAdded: 0,
        label: `Lv.${lv}（未到期預習）`
      };
    }
    const curLv = clamp(Math.floor(Number(entry.srsLevel) || 0), 0, 3);
    const nextLv = curLv + 1;
    entry.srsLevel = nextLv;

    let daysAdded = 0;
    let label = '';
    if (nextLv >= 4) {
      entry.mastered = true;
      entry.nextReviewAt = null;
      label = '✅ 已完全刻印 (Lv.4)';
    } else {
      daysAdded = SRS_INTERVAL_DAYS[curLv] || 1;
      entry.mastered = false;
      entry.nextReviewAt = Date.now() + daysAdded * DAY_MS;
      label = `Lv.${nextLv}（${daysAdded}天後）`;
    }

    recordDailyTrainingProgress('review', 1);
    updateNavMistakeBadge();
    return { advanced: true, mastered: entry.mastered, srsLevel: nextLv, daysAdded, label };
  }

  function markWrongNoteMastered(questionId) {
    if (!questionId || !state.wrongNotes || !state.wrongNotes[questionId]) return false;
    const entry = state.wrongNotes[questionId];
    const wasUnmastered = !entry.mastered;
    entry.srsLevel = 4;
    entry.nextReviewAt = null;
    entry.mastered = true;
    updateNavMistakeBadge();
    return wasUnmastered;
  }

  // ---- Daily Training Quests (Date-keyed auto-reset) ----
  function ensureDailyTrainingFresh(st = state) {
    const todayKey = new Date().toDateString();
    if (!st.dailyTraining || typeof st.dailyTraining !== 'object' || st.dailyTraining.dateStr !== todayKey) {
      st.dailyTraining = {
        dateStr: todayKey,
        correctCount: 0,
        reviewCount: 0,
        claimedIds: []
      };
    } else {
      st.dailyTraining.correctCount = Math.max(0, Math.floor(Number(st.dailyTraining.correctCount) || 0));
      st.dailyTraining.reviewCount = Math.max(0, Math.floor(Number(st.dailyTraining.reviewCount) || 0));
      st.dailyTraining.claimedIds = Array.isArray(st.dailyTraining.claimedIds)
        ? Array.from(new Set(st.dailyTraining.claimedIds.map(String)))
        : [];
    }
    return st.dailyTraining;
  }

  function recordDailyTrainingProgress(type, amount = 1) {
    const dt = ensureDailyTrainingFresh(state);
    const inc = Math.max(0, Math.floor(Number(amount) || 0));
    if (inc <= 0) return;
    if (type === 'correct') dt.correctCount += inc;
    else if (type === 'review') dt.reviewCount += inc;
  }

  function claimDailyTrainingTask(taskId) {
    const dt = ensureDailyTrainingFresh(state);
    const task = DAILY_TRAINING_DEFS.find((t) => t.id === taskId);
    if (!task) return false;
    if (dt.claimedIds.includes(task.id)) return false;
    const curVal = Number(dt[task.metric] || 0);
    if (curVal < task.target) return false;

    dt.claimedIds.push(task.id);
    gainExp(task.reward.exp);
    gainGold(task.reward.gold);
    Sound.playSFX('levelup');
    showToast(`☀️ 達成每日修練【${task.title}】！獲賜 ⭐ +${task.reward.exp} EXP、🪙 +${task.reward.gold} 金幣`, 'gold');
    checkAchievements();
    autoSave();
    updateHUD();
    renderDailyTrainingPanel();
    return true;
  }

  function renderDailyTrainingPanel() {
    const dt = ensureDailyTrainingFresh(state);
    const targets = [$('town-daily-training'), $('quests-daily-training')].filter(Boolean);
    if (targets.length === 0) return;

    const html = `
      <div class="daily-training-header">
        <div>
          <h3 class="daily-training-title">☀️ 每日言霊特訓</h3>
          <span class="daily-training-sub">跨日刷新・達成即領言靈賞賜</span>
        </div>
        <span class="badge badge-gold">${escapeHtml(dt.dateStr)}</span>
      </div>
      <div class="daily-training-grid">
        ${DAILY_TRAINING_DEFS.map((task) => {
          const cur = Math.min(task.target, Number(dt[task.metric] || 0));
          const pct = Math.round((cur / task.target) * 100);
          const claimed = dt.claimedIds.includes(task.id);
          const ready = !claimed && cur >= task.target;
          return `
            <div class="daily-training-item ${claimed ? 'is-claimed' : ready ? 'is-ready' : ''}">
              <div class="daily-training-item-top">
                <div>
                  <div class="daily-training-item-name">${escapeHtml(task.title)}</div>
                  <div class="daily-training-item-desc">${escapeHtml(task.desc)}</div>
                </div>
                <div class="daily-training-item-action">
                  ${claimed
                    ? '<span class="badge badge-emerald">✅ 已領賞</span>'
                    : ready
                      ? `<button type="button" class="btn btn-gold btn-sm" data-claim-daily-training="${escapeHtml(task.id)}">🎁 領取賞賜</button>`
                      : `<span class="badge">${cur} / ${task.target}</span>`
                  }
                </div>
              </div>
              <div class="progress-track daily-training-bar">
                <div class="progress-fill" style="width: ${pct}%;"></div>
              </div>
              <div class="daily-training-reward">${pxIcon('star')} ${task.reward.exp}　${pxIcon('coin')} ${task.reward.gold}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    targets.forEach((container) => {
      container.innerHTML = html;
      container.querySelectorAll('[data-claim-daily-training]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tid = btn.getAttribute('data-claim-daily-training');
          if (tid) claimDailyTrainingTask(tid);
        });
      });
    });
  }

  function resolveWrongNoteQuestion(noteId) {
    if (!noteId) return null;
    const rawQ = getQuestionById(noteId);
    if (rawQ) {
      return { source: 'battle', rd: null, q: normalizeQuestion(rawQ) };
    }
    const rdMatch = String(noteId).match(/^(rd_[a-zA-Z0-9]+)_q(\d+)$/);
    if (rdMatch) {
      const rd = getReadingById(rdMatch[1]);
      const qIdx = Number(rdMatch[2]);
      if (rd && Array.isArray(rd.questions) && rd.questions[qIdx]) {
        const rq = rd.questions[qIdx];
        const opts = (rq.options || []).map((o) => (typeof o === 'object' ? (o.jp || o.text || '') : String(o)));
        const ansIdx = clamp(Number(rq.answerIndex ?? rq.answer ?? 0), 0, Math.max(0, opts.length - 1));
        const excerpt = rd.paragraphs && rd.paragraphs[0] ? (rd.paragraphs[0].html || '') : '';
        return {
          source: 'reading',
          rd,
          qIdx,
          q: {
            id: noteId,
            regionId: rd.unlockRegionId || 'r1',
            jlpt: rd.jlpt || 'N4',
            difficulty: 1,
            type: 'reading_comp',
            typeLabel: `長文閱讀・${rq.category || '理解'}`,
            promptZh: rq.prompt || rq.promptZh || '閱讀理解測驗',
            promptJp: `<div class="text-cyan" style="font-size:0.88rem;margin-bottom:4px;">📚 出自長文副本《${escapeHtml(rd.title || rd.id)}》（${escapeHtml(rd.jlpt || 'N4')}）</div>${excerpt ? `<div style="font-size:0.86rem;line-height:1.55;">${excerpt}</div>` : ''}`,
            fullRubyJp: `<div>《${escapeHtml(rd.title || rd.id)}》</div>`,
            tts: '',
            options: opts,
            answerIndex: ansIdx,
            kanaReading: '',
            correctDisplay: opts[ansIdx] || '',
            wrongReason: rq.wrongReason || '請對照長文副本內容再仔細確認。',
            explanation: rq.explanation || '請回顧該篇長文關鍵段落。',
            hint: rq.wrongReason || '請回顧長文副本中的關鍵依據句。',
            chunks: []
          }
        };
      }
    }
    return null;
  }

  function getWrongNoteCategory(q) {
    if (!q) return 'conjugation';
    if (q.type === 'reading_comp') return 'reading_comp';
    if (q.type === 'reading') return 'reading';
    if (q.type === 'particle') return 'particle';
    if (q.type === 'reorder' || (q.typeLabel && String(q.typeLabel).includes('句子重組'))) return 'reorder';
    return 'conjugation';
  }

  function getWrongNotesSummary() {
    const notes = ensureWrongNotesMap();
    const nowMs = Date.now();
    const list = Object.values(notes).filter((entry) => entry && resolveWrongNoteQuestion(entry.id));
    const unmastered = list.filter((e) => !e.mastered).length;
    const dueCount = list.filter((e) => isWrongNoteDue(e, nowMs)).length;
    const mastered = list.length - unmastered;
    return { total: list.length, unmastered, dueCount, mastered, entries: list };
  }

  function countClaimableJournalRewards() {
    if (!state) return 0;
    let count = 0;
    const claimedQ = Array.isArray(state.quests && state.quests.claimedIds) ? state.quests.claimedIds : [];
    getQuests().forEach((q) => {
      if (!q || claimedQ.includes(q.id)) return;
      const prog = evaluateGoalProgress(q);
      if (prog && prog.done) count += 1;
    });
    const dt = ensureDailyTrainingFresh(state);
    DAILY_TRAINING_DEFS.forEach((task) => {
      if (!dt.claimedIds.includes(task.id) && Number(dt[task.metric] || 0) >= task.target) {
        count += 1;
      }
    });
    return count;
  }

  function hasSpendableSkillPoint() {
    if (!state || !state.player || Number(state.player.sp || 0) <= 0) return false;
    return getSkills().some((sk) => {
      const lv = (state.skills && state.skills[sk.id]) || 0;
      const maxLv = Number(sk.maxLevel || 3);
      const cost = Number(sk.spCost || 1);
      return lv < maxLv && state.player.sp >= cost;
    });
  }

  function updateNavMistakeBadge() {
    const badge = $('nav-notes-badge');
    const dockBadge = $('dock-notes-badge');
    const journalBadge = $('dock-journal-badge');
    const { dueCount } = getWrongNotesSummary();
    if (badge) {
      badge.textContent = dueCount > 0 ? `(${dueCount})` : '(0)';
      badge.classList.toggle('hidden', dueCount <= 0);
    }
    // Mirror the due count on the 修練 dock slot; if no due notes, show "SP" when a skill can be upgraded
    if (dockBadge) {
      if (dueCount > 0) {
        dockBadge.textContent = dueCount > 99 ? '99+' : String(dueCount);
        dockBadge.classList.remove('hidden');
      } else if (hasActiveSession && hasSpendableSkillPoint()) {
        dockBadge.textContent = 'SP';
        dockBadge.classList.remove('hidden');
      } else {
        dockBadge.textContent = '0';
        dockBadge.classList.add('hidden');
      }
    }
    if (journalBadge) {
      const claimable = hasActiveSession ? countClaimableJournalRewards() : 0;
      journalBadge.textContent = claimable > 99 ? '99+' : String(claimable);
      journalBadge.classList.toggle('hidden', claimable <= 0);
    }
  }
