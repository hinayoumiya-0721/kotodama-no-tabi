/**
 * 《言霊の旅》戰鬥、動態難度、教學解說視窗（js/battle.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

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
      jp: '<ruby>盾<rt>たて</rt></ruby>は<ruby>砕<rt>くだ</rt></ruby>けた！<ruby>今<rt>いま</rt></ruby>が<ruby>決<rt>き</rt></ruby>め<ruby>時<rt>どき</rt></ruby>だ！',
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
      jp: '<ruby>発動<rt>はつどう</rt></ruby>——【<ruby>単語洞察<rt>たんごどうさつ</rt></ruby>】！<ruby>偽<rt>いつわ</rt></ruby>りの<ruby>選択肢<rt>せんたくし</rt></ruby>を<ruby>見抜<rt>みぬ</rt></ruby>け！',
      zh: '發動——【單字洞察】！看破錯誤的選項吧！'
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

  function getBossPhaseInfo(hp, maxHp) {
    const ratio = maxHp > 0 ? Number(hp) / Number(maxHp) : 1;
    if (ratio > 0.65) {
      return { phase: 1, label: '【第一幕】詞彙識讀', css: 'boss-phase-1' };
    }
    if (ratio > 0.30) {
      return { phase: 2, label: '【第二幕】文法奔流', css: 'boss-phase-2' };
    }
    return { phase: 3, label: '【終幕】語序重組決戰', css: 'boss-phase-3' };
  }

  function matchesBossPhaseQuestion(q, phase) {
    if (!q) return false;
    const typeLabel = q.typeLabel ? String(q.typeLabel) : '';
    if (phase === 1) {
      return q.type === 'reading' || typeLabel.includes('文字語彙');
    }
    if (phase === 2) {
      return q.type === 'particle' || (q.type === 'conjugation' && !typeLabel.includes('句子重組'));
    }
    if (phase === 3) {
      return q.type === 'reorder' || typeLabel.includes('句子重組');
    }
    return true;
  }

  function checkBossPhaseTransition() {
    if (!battle.active || !battle.enemy || !battle.enemy.isBoss || battle.isWrongNoteTraining || battle.enemyHp <= 0) {
      return false;
    }
    const info = getBossPhaseInfo(battle.enemyHp, battle.enemyMaxHp);
    if (info.phase > (battle.bossPhase || 1)) {
      battle.bossPhase = info.phase;
      Sound.playSFX('boss_enter');
      triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
      if (info.phase === 2) {
        showEnemySpeech(
          'ふっ……<ruby>断片<rt>だんぺん</rt></ruby>の<ruby>語彙<rt>ごい</rt></ruby>など<ruby>無力<rt>むりょく</rt></ruby>！<ruby>荒<rt>あ</rt></ruby>れ<ruby>狂<rt>くる</rt></ruby>う<ruby>文法<rt>ぶんぽう</rt></ruby>の<ruby>奔流<rt>ほんりゅう</rt></ruby>に<ruby>呑<rt>の</rt></ruby>まれるがいい！',
          '哼……零碎的詞彙毫無意義！在狂暴的文法奔流中沉沒吧！'
        );
        showHeroSpeech(
          '<ruby>魔気<rt>まき</rt></ruby>が<ruby>変質<rt>へんしつ</rt></ruby>した……！<ruby>助詞<rt>じょし</rt></ruby>と<ruby>活用<rt>かつよう</rt></ruby>の<ruby>型<rt>かた</rt></ruby>を<ruby>見極<rt>みきわ</rt></ruby>める！',
          '魔氣變質了……！看清助詞與活用的脈絡！',
          'speech-skill'
        );
      } else if (info.phase === 3) {
        showEnemySpeech(
          'おのれ……ならば<ruby>言葉<rt>ことば</rt></ruby>そのものを<ruby>砕<rt>くだ</rt></ruby>く！<ruby>散<rt>ち</rt></ruby>りゆく<ruby>語順<rt>ごじゅん</rt></ruby>の<ruby>深淵<rt>しんえん</rt></ruby>で<ruby>果<rt>は</rt></ruby>てよ！',
          '可惡……那就把語言本身徹底碾碎！在崩解的語序深淵中化為虛無吧！'
        );
        showHeroSpeech(
          'どれほど<ruby>砕<rt>くだ</rt></ruby>かれようと、<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>絆<rt>きずな</rt></ruby>は<ruby>必<rt>かなら</rt></ruby>ず<ruby>繋<rt>つな</rt></ruby>ぎ<ruby>直<rt>なお</rt></ruby>す！',
          '無論被擊碎多少次，言靈的羈絆都由我重新串連！',
          'speech-victory'
        );
      }
      showToast(`🔥 【${battle.enemy.name}】解放魔力——進入${info.label}！`, 'warning');
      return true;
    }
    return false;
  }

  // ---- Fixed answers-per-battle balance ----
  // Correct answers needed to defeat an enemy at base damage (no combo / crit / stun).
  // An enemy may override this with `hitsToDefeat` in data.js.
  const BATTLE_HITS_NORMAL = 4;
  const BATTLE_HITS_BOSS = 8;
  const BATTLE_HITS_ELITE = 6;     // mid-region elite: at least 4 correct answers
  // Max per-hit multiplier from in-battle performance. With 1.5 a fight still needs at least
  // ceil(hits / 1.5) correct answers: 3 for normal enemies, 6 for bosses.
  const BATTLE_PERFORMANCE_CAP = 1.5;

  function getRequiredHits(enemy) {
    const override = enemy ? Math.floor(Number(enemy.hitsToDefeat)) : NaN;
    if (Number.isFinite(override) && override >= 1) return override;
    if (enemy && enemy.isBoss) return BATTLE_HITS_BOSS;
    if (enemy && enemy.isElite) return BATTLE_HITS_ELITE;
    return BATTLE_HITS_NORMAL;
  }

  function getMinAnswersToDefeat(enemy) {
    return Math.ceil(getRequiredHits(enemy) / BATTLE_PERFORMANCE_CAP);
  }

  function startBattle(enemyOrId, options = {}) {
    const enemy = typeof enemyOrId === 'string' ? getEnemyById(enemyOrId) : enemyOrId;
    if (!enemy) {
      showToast('魔物資料遺失，無法進入戰鬥。', 'error');
      return;
    }

    const isTraining = Boolean(options.isWrongNoteTraining);
    if (!isTraining && !state.stats.encounteredEnemies.includes(enemy.id)) {
      state.stats.encounteredEnemies.push(enemy.id);
    }

    const breakMax = Math.max(1, Number(enemy.breakMax || (enemy.isBoss ? 3 : 2)));
    const enemyMaxHp = Math.max(40, Number(enemy.hp || enemy.maxHp || 100));
    const battleRegionId = enemy.regionId || state.progress.currentRegionId || 'r1';
    const startAdaptiveIdx = Math.max(
      getAdaptiveRegionFloorIdx(battleRegionId),
      state.settings.adaptiveStartJlpt === 'N3' ? 1 : 0
    );
    const trainingQueue = isTraining && Array.isArray(options.trainingQueue)
      ? options.trainingQueue.slice()
      : [];

    battle = {
      active: true,
      enemy,
      regionId: battleRegionId,
      bossPhase: enemy.isBoss && !isTraining ? 1 : 0,
      isWrongNoteTraining: isTraining,
      trainingMode: options.trainingMode || 'due',
      trainingQueue,
      trainingTotal: trainingQueue.length,
      masteredIdsInRun: [],
      trainingFullyMasteredCount: 0,
      trainingExpEarned: 0,
      trainingGoldEarned: 0,
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
      returnView: options.returnView || 'explore',
      // Explore route bonus (危險捷徑 ×1.3); 1 for every other battle
      rewardMult: Number(options.rewardMult) > 0 ? Number(options.rewardMult) : 1,
      rewardLabel: typeof options.rewardLabel === 'string' ? options.rewardLabel : '',
      scrollUsed: false,
      isFirstTutorialBattle: Boolean(options.isFirstTutorialBattle)
    };

    const viewEl = $('view-battle');
    if (viewEl) viewEl.classList.remove('fever-active');

    ensureBattleStageDecor();
    switchView('battle');

    const introHero = HERO_BATTLE_LINES.intro[state.player.jobId] || HERO_BATTLE_LINES.intro.swordsman;
    showHeroSpeech(introHero.jp, introHero.zh);
    setBattlePoses('idle', 'idle');

    if (enemy.isBoss) {
      Sound.playSFX('boss_enter');
      const intro = formatSpeechLine(enemy.introLine);
      showEnemySpeech(intro.jp || `${enemy.name} 釋放出壓倒性的言霊威壓！`, intro.zh);
      if (intro.tts) Sound.speak(intro.tts, 1.0);
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
      $('battle-region-label').textContent = battle.isWrongNoteTraining
        ? `📓 錯題特訓・記憶試煉（進度 ${battle.masteredIdsInRun.length}/${battle.trainingTotal}）`
        : `${region ? region.name : '戰場'}｜${enemy.isBoss ? '💀 BOSS 戰' : (enemy.isElite ? '⚠️ 精英戰' : '⚔️ 遭遇戰')}`;
    }
    const bossPhaseBadge = $('battle-boss-phase-badge');
    if (bossPhaseBadge) {
      if (enemy.isBoss && !battle.isWrongNoteTraining) {
        const phaseInfo = getBossPhaseInfo(battle.enemyHp, battle.enemyMaxHp);
        battle.bossPhase = Math.max(battle.bossPhase || 1, phaseInfo.phase);
        bossPhaseBadge.textContent = phaseInfo.label;
        bossPhaseBadge.className = `battle-badge boss-phase-badge ${phaseInfo.css}`;
      } else {
        bossPhaseBadge.classList.add('hidden');
      }
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
    const isDemonRealm = activeMode.id === 'fixed_n1' && !battle.isWrongNoteTraining;
    if ($('battle-difficulty-badge')) {
      const diffText = battle.isWrongNoteTraining
        ? `專攻未攻克錯題（剩餘 ${Math.max(0, battle.trainingTotal - battle.masteredIdsInRun.length)} 題）`
        : activeMode.id === 'adaptive'
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
    if (arenaEl) {
      arenaEl.classList.toggle('boss-battle-stage', Boolean(enemy.isBoss));
      arenaEl.classList.toggle('revenge-battle-stage', Boolean(battle.isWrongNoteTraining));
    }
    const enemyCard = document.querySelector('#view-battle .combatant-card.enemy-side');
    if (enemyCard) enemyCard.classList.toggle('boss-card', Boolean(enemy.isBoss || enemy.isElite));
    if (enemyCard) enemyCard.classList.toggle('elite-card', Boolean(enemy.isElite));

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
      stunEl.textContent = battle.enemyStunned ? '💫 BREAK! 暈眩（受傷 ×1.6）' : `護盾 ${battle.enemyBreak}/${battle.enemyBreakMax}`;
    }

    // Skill buttons
    const vocabLv = state.skills.vocab_insight || 0;
    const listenLv = state.skills.clairaudience || 0;
    const btnVocab = $('btn-skill-vocab');
    if (btnVocab) {
      btnVocab.textContent = vocabLv > 0 ? `👁️ 單字洞察 Lv.${vocabLv} (10 MP)` : '🔒 單字洞察';
      btnVocab.disabled = vocabLv <= 0 || p.mp < 10 || battle.insightActive || battle.locked;
    }
    const btnListen = $('btn-skill-listen');
    if (btnListen) {
      btnListen.textContent = listenLv > 0 ? `🎐 順風耳 Lv.${listenLv} (10 MP)` : '🔒 順風耳';
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

  function ensureShuffleBagForJlpt(targetJlpt) {
    const allRaw = getQuestions();
    const allForJlpt = allRaw.filter((q) => normalizeJlptLevel(q.jlpt, q.regionId) === targetJlpt);
    if (allForJlpt.length === 0) return [];

    if (!state.progress.solvedByJlpt) state.progress.solvedByJlpt = { N4: [], N3: [], N2: [], N1: [] };
    if (!state.progress.bagByJlpt) state.progress.bagByJlpt = { N4: [], N3: [], N2: [], N1: [] };
    if (!state.progress.cycleCountsByJlpt) state.progress.cycleCountsByJlpt = { N4: 0, N3: 0, N2: 0, N1: 0 };

    const qMap = new Map(allForJlpt.map((q) => [q.id, q]));
    let solved = Array.isArray(state.progress.solvedByJlpt[targetJlpt])
      ? state.progress.solvedByJlpt[targetJlpt].filter((id) => qMap.has(id))
      : [];
    let solvedSet = new Set(solved);

    let unsolvedIds = allForJlpt.map((q) => q.id).filter((id) => !solvedSet.has(id));
    if (unsolvedIds.length === 0) {
      // Player conquered EVERY question in this JLPT tier! Reset and reshuffle for next round
      solved = [];
      solvedSet = new Set();
      state.progress.solvedByJlpt[targetJlpt] = [];
      state.progress.cycleCountsByJlpt[targetJlpt] = (state.progress.cycleCountsByJlpt[targetJlpt] || 0) + 1;
      unsolvedIds = allForJlpt.map((q) => q.id);
      const freshBag = shuffleArray(unsolvedIds);
      state.progress.bagByJlpt[targetJlpt] = freshBag;
      showToast(`🎉 【${targetJlpt}】全境 ${allForJlpt.length} 道言靈已悉數破除一輪！記憶星盤重新洗牌！`, 'gold');
      return freshBag.map((id) => qMap.get(id)).filter(Boolean);
    }

    const unsolvedSet = new Set(unsolvedIds);
    const existingBag = Array.isArray(state.progress.bagByJlpt[targetJlpt])
      ? state.progress.bagByJlpt[targetJlpt].filter((id) => unsolvedSet.has(id))
      : [];
    const inBagSet = new Set(existingBag);
    const missing = shuffleArray(unsolvedIds.filter((id) => !inBagSet.has(id)));
    const mergedBag = existingBag.concat(missing);
    state.progress.solvedByJlpt[targetJlpt] = solved;
    state.progress.bagByJlpt[targetJlpt] = mergedBag;

    return mergedBag.map((id) => qMap.get(id)).filter(Boolean);
  }

  function recordQuestionOutcomeInShuffleBag(q, isCorrect) {
    if (!q || !q.id) return;
    const lvl = normalizeJlptLevel(q.jlpt, q.regionId);
    if (!state.progress.solvedByJlpt) state.progress.solvedByJlpt = { N4: [], N3: [], N2: [], N1: [] };
    if (!state.progress.bagByJlpt) state.progress.bagByJlpt = { N4: [], N3: [], N2: [], N1: [] };

    const solved = Array.isArray(state.progress.solvedByJlpt[lvl]) ? state.progress.solvedByJlpt[lvl] : [];
    const bag = Array.isArray(state.progress.bagByJlpt[lvl]) ? state.progress.bagByJlpt[lvl] : [];

    if (isCorrect) {
      if (!solved.includes(q.id)) solved.push(q.id);
      state.progress.solvedByJlpt[lvl] = solved;
      state.progress.bagByJlpt[lvl] = bag.filter((id) => id !== q.id);
    } else {
      // Keep unsolved and rotate to the back of the shuffle bag so it won't repeat immediately
      const rotated = bag.filter((id) => id !== q.id);
      rotated.push(q.id);
      state.progress.bagByJlpt[lvl] = rotated;
    }
  }

  function pickBattleQuestion() {
    if (battle.isWrongNoteTraining) {
      const notes = ensureWrongNotesMap();
      const lastId = battle.currentQ ? battle.currentQ.id : null;
      const doneInRun = new Set(battle.masteredIdsInRun || []);
      // Draw strictly from trainingQueue (never leak non-due items during due-only training)
      const pendingIds = (battle.trainingQueue || []).filter((id) => {
        if (doneInRun.has(id)) return false;
        const e = notes[id];
        return e && !e.mastered && resolveWrongNoteQuestion(id);
      });
      if (pendingIds.length === 0) return null;
      let nextId = pendingIds.find((id) => id !== lastId);
      if (!nextId) nextId = pendingIds[0];
      const resolved = resolveWrongNoteQuestion(nextId);
      return resolved ? resolved.q : null;
    }

    const allRaw = getQuestions();
    if (allRaw.length === 0) return null;

    const targetJlpt = getEffectiveBattleJlpt();
    const bagQuestions = ensureShuffleBagForJlpt(targetJlpt);
    const lastId = battle.currentQ ? battle.currentQ.id : null;
    const usedSet = new Set(battle.usedQuestionIds);

    // Filter out questions already asked in this battle unless only those remain in unseen pool
    let candidates = bagQuestions.filter((q) => !usedSet.has(q.id));
    if (candidates.length === 0) {
      candidates = bagQuestions.filter((q) => q.id !== lastId);
      if (candidates.length === 0) candidates = bagQuestions;
    }

    if (candidates.length === 0) {
      // Safety fallback if targetJlpt somehow had 0 items
      const fallback = allRaw.filter((q) => q.id !== lastId);
      const chosen = (fallback.length ? fallback : allRaw)[0];
      return normalizeQuestion(chosen);
    }

    // Priority 1: Current region unseen questions in the shuffle bag
    const regionCandidates = candidates.filter((q) => q.regionId === battle.regionId);
    let activeTier = regionCandidates;

    // Priority 2: Current region target JLPT unseen pool exhausted -> seamless cross-region draw!
    if (activeTier.length === 0) {
      activeTier = candidates;
      const notifyKey = `${battle.regionId}_${targetJlpt}`;
      if (!crossRegionNotifiedKeys.has(notifyKey)) {
        crossRegionNotifiedKeys.add(notifyKey);
        showToast(`🌐 本區 ${targetJlpt} 題目已答完，改從其他區域出題`, 'info');
      }
    }

    // Region Boss 3-Phase Subject Evolution filter (with seamless fallback so Boss fights never stall)
    if (battle.enemy && battle.enemy.isBoss && !battle.isWrongNoteTraining) {
      const phaseInfo = getBossPhaseInfo(battle.enemyHp, battle.enemyMaxHp);
      let phaseMatches = activeTier.filter((q) => matchesBossPhaseQuestion(q, phaseInfo.phase));
      if (phaseMatches.length === 0) {
        phaseMatches = candidates.filter((q) => matchesBossPhaseQuestion(q, phaseInfo.phase));
      }
      if (phaseMatches.length > 0) {
        activeTier = phaseMatches;
      }
    }

    // Gentle onboarding first question: avoid 'unnatural' or 'reorder' on the very first battle question
    if ((battle.isFirstTutorialBattle || getTutorialStep() === 1) && battle.usedQuestionIds.length === 0) {
      const gentle = activeTier.find((q) => q.type === 'reading' || q.type === 'particle');
      if (gentle) return normalizeQuestion(gentle);
    }

    // Draw deterministically from shuffled bag order, lightly favoring enemy weakness within top shuffled window
    let chosen = activeTier[0];
    if (activeTier.length > 1 && battle.enemy && battle.enemy.weakness && Math.random() < 0.42) {
      const weakMatch = activeTier.slice(0, 6).find((q) => q.type === battle.enemy.weakness);
      if (weakMatch) chosen = weakMatch;
    }

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
    resetZhPeekWrap($('battle-zh-peek-wrap'));

    const isWeak = q.type === battle.enemy.weakness;
    const typeLabel = q.typeLabel || QUESTION_TYPE_LABELS[q.type] || q.type;
    if ($('battle-q-type')) {
      $('battle-q-type').innerHTML = `${typeLabel}（${escapeHtml(q.jlpt)}）${isWeak ? ' <b class="text-gold">⚡弱點</b>' : ''}`;
    }

    if ($('battle-q-prompt-zh')) $('battle-q-prompt-zh').innerHTML = q.promptZh;
    if ($('battle-q-prompt-jp')) {
      $('battle-q-prompt-jp').innerHTML = q.type === 'listening'
        ? getListeningPromptHtml(q, '🎧 請點擊上方「🔊 朗讀」聆聽日文語音並選出正確答案')
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
    renderBattleTutorialBanner();
    updateBattleUI();
    startBattleSpeedTimer();

    if (q.type === 'listening' && q.tts) {
      Sound.speak(q.tts, 1.0);
    }
  }

  function formatBattleSpeedText(leftSec) {
    const isNarrow = typeof window !== 'undefined' && Number(window.innerWidth) > 0 && window.innerWidth <= 360;
    if (leftSec <= 0) {
      return isNarrow ? '🧘 無加成' : '🧘 無速答加成';
    }
    return isNarrow ? `⚡ ${leftSec.toFixed(1)}s` : `⚡ ${leftSec.toFixed(1)}s 速答`;
  }

  function startBattleSpeedTimer() {
    stopBattleTimers();
    battle.qStartTime = performance.now();
    const bar = $('battle-speed-bar');
    const txt = $('battle-speed-text');
    if (bar) bar.style.width = '100%';
    if (txt) txt.textContent = formatBattleSpeedText(10);

    battle.speedTimerId = setInterval(() => {
      const elapsed = (performance.now() - battle.qStartTime) / 1000;
      const left = Math.max(0, 10 - elapsed);
      if (bar) bar.style.width = `${(left / 10) * 100}%`;
      if (left <= 0) {
        if (txt) txt.textContent = formatBattleSpeedText(0);
        stopBattleTimers();
      } else {
        if (txt) txt.textContent = formatBattleSpeedText(left);
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
        Sound.playSFX('click');
        selected.push(chip);
        renderReorderUI(container, pool, selected, onSubmit);
      });
    });

    container.querySelectorAll('[data-remove-pos]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pos = Number(btn.getAttribute('data-remove-pos'));
        Sound.playSFX('click');
        selected.splice(pos, 1);
        renderReorderUI(container, pool, selected, onSubmit);
      });
    });

    const clearBtn = container.querySelector('#btn-reorder-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        Sound.playSFX('click');
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
      recordQuestionOutcomeInShuffleBag(q, true);
      // Early (not-yet-due) correct answers never raise SRS level — in any mode, so the
      // forgetting curve cannot be skipped from normal battles either (QA v1.4 BUG-5).
      const srsRes = advanceWrongNoteSRS(q.id, true, { requireDue: true });
      recordDailyTrainingProgress('correct', 1);
      battle.consecutiveCorrect += 1;
      battle.consecutiveWrong = 0;
      battle.combo += 1;
      state.stats.totalCorrect += 1;
      getDailyProgress().correct_answers += 1;
      state.stats.maxCombo = Math.max(state.stats.maxCombo, battle.combo);

      if (battle.isWrongNoteTraining) {
        if (!battle.masteredIdsInRun.includes(q.id)) {
          battle.masteredIdsInRun.push(q.id);
        }
        if (srsRes.mastered) {
          battle.trainingFullyMasteredCount = (battle.trainingFullyMasteredCount || 0) + 1;
        }
        battle.trainingQueue = (battle.trainingQueue || []).filter((id) => id !== q.id);
        const bonusExp = 15;
        const bonusGold = 12;
        gainGold(bonusGold);
        gainExp(bonusExp);
        battle.trainingExpEarned += bonusExp;
        battle.trainingGoldEarned += bonusGold;
        showToast(
          srsRes.advanced
            ? `✔ 錯題推進至 ${srsRes.label}！獲得 +${bonusExp} EXP、+${bonusGold} 金幣`
            : (srsRes.early
                ? `✔ 提前複習答對（${srsRes.label}）！+${bonusExp} EXP、+${bonusGold} 金幣`
                : `✔ 複習答對！+${bonusExp} EXP、+${bonusGold} 金幣`),
          'success'
        );
      } else if (srsRes.advanced) {
        showToast(`📓 錯題筆記記憶曲線提升：${srsRes.label}！`, 'success');
      }

      if (battle.consecutiveCorrect >= 3 && !battle.feverActive) {
        battle.feverActive = true;
        battle.difficultyOffset = 1;
        state.stats.feverCount += 1;
        getDailyProgress().reach_fever = (getDailyProgress().reach_fever || 0) + 1;
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
      const insightMult = battle.insightActive ? [1, 1, 1.20, 1.35][insightLv] : 1;
      const wasAlreadyStunned = battle.enemyStunned;

      // Fixed "answers per battle" damage model (player feedback: better gear used to mean
      // fewer questions per fight). Each correct answer deals maxHp / requiredHits; in-battle
      // performance (combo, FEVER, stun, crit, insight) can speed it up, but only up to
      // BATTLE_PERFORMANCE_CAP, so a fight always needs >= ceil(requiredHits / cap) answers
      // no matter how strong the gear is.
      const requiredHits = getRequiredHits(enemy);
      const perHit = battle.enemyMaxHp / requiredHits;
      const performanceMult = Math.min(
        BATTLE_PERFORMANCE_CAP,
        (1 + Math.min(battle.combo, 10) * 0.08) *
        (battle.feverActive ? 1.25 : 1.0) *
        (wasAlreadyStunned ? 1.6 : 1.0) *
        (isCrit ? 1.5 : 1.0) *
        insightMult
      );
      let dmg = Math.max(1, Math.round(perHit * performanceMult));

      if (battle.isWrongNoteTraining) {
        const remainingToMaster = Math.max(0, battle.trainingTotal - battle.masteredIdsInRun.length);
        if (remainingToMaster <= 0) {
          dmg = battle.enemyHp;
        } else {
          const slice = Math.max(10, Math.round(battle.enemyMaxHp / Math.max(1, battle.trainingTotal)));
          dmg = Math.min(Math.max(1, battle.enemyHp - remainingToMaster), slice);
        }
      }

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
        Sound.playSFX('break');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-shake');
        spawnFloatingNumber('enemy', 'BREAK! 破防暈眩!', 'num-break');
        setTimeout(() => spawnFloatingNumber('enemy', `-${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'num-crit' : 'num-dmg'), 140);
        const brkLine = formatSpeechLine(enemy.breakLine);
        showEnemySpeech(
          brkLine.jp || 'ぐわぁっ……！<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>障壁<rt>しょうへき</rt></ruby>が……！',
          brkLine.zh || '言靈障壁被徹底擊碎了！'
        );
      } else {
        Sound.playSFX(isCrit ? 'crit' : 'correct');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-shake');
        spawnFloatingNumber('enemy', `-${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'num-crit' : 'num-dmg');
        if (enemy.hitLine && Math.random() < 0.5) {
          const hit = formatSpeechLine(enemy.hitLine);
          showEnemySpeech(hit.jp, hit.zh);
        }
      }

      battle.insightActive = false;
      checkBossPhaseTransition();
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
            showEnemySpeech(`${enemy.name} 重聚魔氣，修復了言靈障壁！`);
          }
          battle.stunJustTriggered = false;
          nextBattleQuestion();
        }, 900);
      }
    } else {
      // Wrong Answer -> Friendly Capped Damage + MANDATORY Teaching Explanation Modal
      recordQuestionOutcomeInShuffleBag(q, false);
      battle.consecutiveWrong += 1;
      battle.consecutiveCorrect = 0;
      battle.combo = 0;
      battle.feverActive = false;
      if (battle.consecutiveWrong >= 2) {
        battle.difficultyOffset = -1;
        if (state.settings.difficultyMode === 'adaptive' && battle.adaptiveLevelIdx > 0) {
          battle.adaptiveLevelIdx = Math.max(0, battle.adaptiveLevelIdx - 1);
          showToast(`🌿 言靈共鳴調降為 ${JLPT_LEVELS[battle.adaptiveLevelIdx]}（保底 N4）`, 'info');
        }
      }

      state.stats.totalWrong += 1;
      recordWrongNote(q.id, chosenIdx !== null && chosenIdx !== undefined ? chosenIdx : -1);
      if (battle.isWrongNoteTraining) {
        battle.trainingQueue = (battle.trainingQueue || []).filter((id) => id !== q.id);
        battle.trainingQueue.push(q.id);
      }

      const stats = getTotalStats();
      let dmg = 0;
      let damageNotice = '';

      if (battle.enemyStunned) {
        dmg = 0;
        damageNotice = '💫 魔物破防失衡，未能反擊';
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
        dmg = Math.max(1, Math.min(reduced, cap));

        state.player.hp = Math.max(0, state.player.hp - dmg);

        if (shieldLv >= 3) {
          state.player.mp = Math.min(stats.maxMp, state.player.mp + 5);
        }

        // Short line only — the WIS / shield breakdown lives in the character screen
        damageNotice = `💥 承受魔氣反噬 <strong>-${dmg} HP</strong>${shieldLv >= 3 ? "（護盾回流 +5 MP）" : ""}`;
        spawnFloatingNumber('player', `-${dmg}`, 'num-enemy-dmg');
      }

      Sound.playSFX('wrong');
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
    const routeMult = battle.rewardMult || 1;
    const finalExp = Math.round(baseExp * feverMult * n1ExpMult * routeMult);
    const finalGold = Math.round(baseGold * feverMult * routeMult);

    state.stats.battlesWon += 1;
    getDailyProgress().win_battles += 1;
    if (!battle.isWrongNoteTraining && !state.stats.defeatedEnemies.includes(enemy.id)) {
      state.stats.defeatedEnemies.push(enemy.id);
    }

    if (battle.isWrongNoteTraining) {
      const masteredCount = battle.masteredIdsInRun.length;
      const bonusExp = 20;
      const bonusGold = 15;
      gainGold(bonusGold);
      const lvRes = gainExp(bonusExp);
      const totalExpShown = battle.trainingExpEarned + bonusExp;
      const totalGoldShown = battle.trainingGoldEarned + bonusGold;

      Sound.playSFX('victory');
      setBattlePoses('victory', 'defeat');
      battle.active = false;
      checkAchievements();
      autoSave();
      updateHUD();

      const trainingHeroHtml = `<div class="victory-portrait-banner">
        <div class="victory-portrait-art">${Art.hero(state.player.jobId, 'victory')}</div>
        <div class="victory-portrait-quote">
          <div class="jp-text">「忘却の霧を斬り払い、己の弱点を乗り越えた！」</div>
          <div class="text-muted" style="font-size:0.84rem;margin-top:4px;">已斬斷遺忘迷霧，徹底克服過往的言靈弱點！</div>
        </div>
      </div>`;

      const trainingLines = [
        `<div class="panel-card" style="padding:10px 14px;border-left:3px solid var(--emerald);background:rgba(6,78,59,0.22);font-size:1.05rem;font-weight:700;color:#a7f3d0;">🎉 本次成功攻克 ${masteredCount} 題錯題！</div>`,
        `🧠 SRS 記憶曲線已自動排程下次複習${battle.trainingFullyMasteredCount > 0 ? `（其中 <strong>${battle.trainingFullyMasteredCount} 題</strong> 已達 Lv.4 完全掌握！）` : '（答對 1/3/7 天後再次複習，連破 4 階即完全掌握）'}`,
        `⭐ 特訓累計獲得經驗：<strong>+${totalExpShown} EXP</strong>（含通關獎勵 +${bonusExp}）`,
        `🪙 特訓累計獲得金幣：<strong>+${totalGoldShown} 金幣</strong>（含通關獎勵 +${bonusGold}）`
      ];
      if (lvRes.leveledUp) {
        trainingLines.push(`🎊 升級至 <strong>Lv.${state.player.level}</strong>（SP +${lvRes.levelsGained}）！`);
      }

      showGenericModal(
        '📓 記憶試煉完成・錯題特訓勝利！',
        `${trainingHeroHtml}<div style="display:flex;flex-direction:column;gap:8px;font-size:0.96rem;">${trainingLines.map((l) => `<div>${l}</div>`).join('')}</div>`,
        '📓',
        () => switchView('notes')
      );
      return;
    }

    const rewardLines = [
      `⭐ 獲得經驗值：<strong>+${finalExp} EXP</strong>${battle.feverActive ? ' <span class="badge badge-gold">FEVER ×1.5</span>' : ''}${isDemonRealm ? ' <span class="badge badge-crimson">🔥 N1 魔境 EXP ×2</span>' : ''}`,
      `🪙 獲得金幣：<strong>+${finalGold} 金幣</strong>${routeMult > 1 ? ` <span class="badge badge-gold">${escapeHtml(battle.rewardLabel || "路線")} ×${routeMult}</span>` : ""}`
    ];
    if (isDemonRealm) {
      rewardLines.push('🔥 <strong>N1 魔境挑戰加成生效：</strong>經驗值雙倍、戰利品掉落率 ×2！');
    }

    gainGold(finalGold);
    const lvRes = gainExp(finalExp);
    if (lvRes.leveledUp) {
      rewardLines.push(`🎉 升級至 <strong>Lv.${state.player.level}</strong>（SP +${lvRes.levelsGained}）！`);
    }

    // Elite first-clear: opens the road past EXPLORE_ELITE_AT in this region
    if (enemy.isElite && !state.progress.defeatedElites.includes(regionId)) {
      state.progress.defeatedElites.push(regionId);
      rewardLines.push(`⚔️ 擊敗精英！<strong>前方的道路已開啟</strong>，可以繼續探索。`);
      addExploreLog(`⚔️ 擊敗精英【${enemy.name}】，道路已開啟！`, 'battle');
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

    Sound.playSFX('victory');
    setBattlePoses('victory', 'defeat');
    battle.active = false;
    if (getTutorialStep() === 1) {
      state.progress.tutorialStep = 2;
    }
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
      showToast('尚未習得【單字洞察】，可至技能樹以 1 SP 解鎖！', 'warning');
      return;
    }
    if (state.player.mp < 10) {
      showToast('💧 言靈魔力不足（需 10 MP）！', 'warning');
      return;
    }
    if (battle.insightActive) return;

    state.player.mp -= 10;
    battle.insightActive = true;
    const q = battle.currentQ;
    const qCard = $('battle-question-card');
    if (qCard) qCard.classList.add('force-furigana');

    const hintEl = $('battle-q-hint');
    let effectSummary = '';

    if (q.type === 'reorder' && Array.isArray(q.chunks) && q.chunks.length > 0) {
      const hintCount = lv >= 2 ? Math.min(2, q.chunks.length) : 1;
      const firstChunks = q.chunks.slice(0, hintCount);
      const firstIds = new Set(firstChunks.map((c) => c.id));
      const orderPreview = firstChunks.map((c, idx) => `第${idx + 1}塊「${c.plain || c.text}」`).join(' → ');
      document.querySelectorAll('#battle-options-container [data-add-id]').forEach((chipBtn) => {
        const cid = Number(chipBtn.getAttribute('data-add-id'));
        if (firstIds.has(cid)) {
          chipBtn.classList.add('chip-insight-hint');
        }
      });
      if (hintEl) {
        hintEl.textContent = `👁️ 洞察提示：${orderPreview}${q.hint ? `｜${q.hint}` : ''}`;
        hintEl.classList.remove('hidden');
      }
      effectSummary = `已標示前 ${hintCount} 個語塊順序`;
    } else {
      // 4-choice question: eliminate 1 wrong option at Lv.1, 2 wrong options at Lv.2/Lv.3
      const elimCount = lv >= 2 ? 2 : 1;
      const optionBtns = Array.from(document.querySelectorAll('#battle-options-container .option-btn'));
      const wrongBtns = optionBtns.filter((btn) => {
        const idx = Number(btn.getAttribute('data-opt-idx'));
        return idx !== q.answerIndex && !btn.disabled;
      });
      const toEliminate = shuffleArray(wrongBtns).slice(0, elimCount);
      toEliminate.forEach((btn) => {
        btn.disabled = true;
        btn.classList.add('eliminated');
        if (!btn.querySelector('.eliminated-tag')) {
          const tag = document.createElement('span');
          tag.className = 'eliminated-tag';
          tag.textContent = '✕ 已排除';
          btn.appendChild(tag);
        }
      });
      if (hintEl && q.hint) {
        hintEl.textContent = `👁️ 洞察提示：${q.hint}`;
        hintEl.classList.remove('hidden');
      }
      effectSummary = `已劃除 ${toEliminate.length} 個錯誤選項`;
    }

    Sound.playSFX('skill');
    showHeroSpeech(HERO_BATTLE_LINES.skillVocab.jp, HERO_BATTLE_LINES.skillVocab.zh, 'speech-skill');
    setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 1100);
    const extra = lv === 3 ? '（本題傷害 +35%、破防 +1）' : lv === 2 ? '（本題傷害 +20%）' : '';
    showToast(`👁️ 發動【單字洞察 Lv.${lv}】！${effectSummary}並顯示提示${extra}`, 'info');
    updateBattleUI();
    updateHUD();
  }

  // QA P1-1: q.tts is the *answered* sentence, so speaking it during a battle / shrine question
  // gives the answer away. While a question is open we speak only the stem: blanks and the
  // reading-target word become 「なになに」. Stems with no Japanese (e.g. Chinese reorder
  // prompts) return '' (nothing to read). Full q.tts stays for the explanation modal / notes.
  // Listening prompt: a "press 🔊" cue when the device has a Japanese voice; otherwise the
  // transcript is shown as text so the question stays answerable.
  function getListeningPromptHtml(q, hearCue) {
    const canHear = typeof Sound.canSpeakJapanese === 'function' ? Sound.canSpeakJapanese() : true;
    if (canHear) return `<span class="text-cyan">${escapeHtml(hearCue)}</span>`;
    const transcript = q.promptJp || q.fullRubyJp || escapeHtml(q.tts || '');
    return `<span class="text-muted" style="font-size:0.8rem;">（這台裝置沒有日文語音，改為閱讀文字）</span><br>${transcript}`;
  }

  function getQuestionSpeakText(q) {
    if (!q) return '';
    if (q.type === 'listening') return q.tts || stripRubyHtml(q.fullRubyJp || '');
    const masked = String(q.promptJp || '')
      .replace(/<span class="q-(?:blank|target)"[^>]*>[\s\S]*?<\/span>/g, 'なになに')
      .replace(/<br\s*\/?>/gi, '。');
    const text = stripRubyHtml(masked).replace(/\s+/g, ' ').trim();
    return /[぀-ヿ]/.test(text) ? text : '';
  }

  function speakQuestionStem(q, rate) {
    const text = getQuestionSpeakText(q);
    if (!text) {
      showToast('這一題沒有可以朗讀的日文題幹。', 'info');
      return false;
    }
    Sound.speak(text, rate);
    return true;
  }

  function useClairaudience() {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    const lv = state.skills.clairaudience || 0;
    if (lv <= 0) {
      showToast('尚未習得【順風耳】，可至技能樹以 1 SP 解鎖！', 'warning');
      return;
    }
    if (state.player.mp < 10) {
      showToast('💧 言靈魔力不足（需 10 MP）！', 'warning');
      return;
    }

    state.player.mp -= 10;
    const stats = getTotalStats();
    const ratio = [0, 0.15, 0.22, 0.30][lv];
    const heal = Math.max(10, Math.round(stats.maxHp * ratio));
    state.player.hp = Math.min(stats.maxHp, state.player.hp + heal);

    Sound.playSFX('heal');
    speakQuestionStem(battle.currentQ, 0.65);
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
    if (!item) return;
    const isBreakScroll = itemId === 'con_break_scroll' || (item.effect && (item.effect.type === 'break' || item.effect.breakDamage));
    // QA L-1: break scrolls bypassed "fixed answers per battle" (25 dmg each, unlimited).
    // Now: at most one per battle, checked before the item is consumed.
    if (isBreakScroll && battle.scrollUsed) {
      showToast('每場戰鬥只能使用一張破防卷軸。', 'warning');
      return;
    }
    if (!removeItem(itemId, 1)) return;

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
      Sound.playSFX('heal');
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-skill');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 900);
      spawnFloatingNumber('player', `+${val} HP`, 'num-heal');
      showToast(`🧪 使用【${item.name}】，回復 +${val} HP！`, 'success');
    } else if (itemId === 'con_water' || effType === 'heal_mp' || eff.healMpPct || eff.mp) {
      const val = eff.healMpPct
        ? Math.max(8, Math.round((stats.maxMp * Number(eff.healMpPct)) / 100))
        : Number(eff.value || eff.mp || Math.round(stats.maxMp * 0.5));
      state.player.mp = Math.min(stats.maxMp, state.player.mp + val);
      Sound.playSFX('skill');
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-skill');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 900);
      spawnFloatingNumber('player', `+${val} MP`, 'num-shield');
      showToast(`🧪 使用【${item.name}】，回復 +${val} MP！`, 'info');
    } else if (itemId === 'con_break_scroll' || effType === 'break' || eff.breakDamage) {
      const bVal = Number(eff.breakDamage || eff.value || 2);
      // One correct answer's worth of damage (enemyMaxHp / requiredHits), and it can never
      // bring the enemy below 1 HP — the finishing blow must come from answering (also fixes L-3).
      battle.scrollUsed = true;
      const bonusDmg = Math.min(battle.enemyHp - 1, Math.max(1, Math.round(battle.enemyMaxHp / getRequiredHits(battle.enemy))));
      battle.enemyHp = Math.max(1, battle.enemyHp - Math.max(0, bonusDmg));
      if (!battle.enemyStunned) {
        battle.enemyBreak = Math.max(0, battle.enemyBreak - bVal);
        if (battle.enemyBreak <= 0) {
          battle.enemyStunned = true;
          battle.stunJustTriggered = true;
          state.stats.breaksTriggered += 1;
          Sound.playSFX('break');
          triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
          spawnFloatingNumber('enemy', 'BREAK! 破防暈眩!', 'num-break');
        } else {
          Sound.playSFX('skill');
          spawnFloatingNumber('enemy', `護盾 -${bVal}`, 'num-break');
        }
      }
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-attack');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'hit', 950);
      if (bonusDmg > 0) {
        setTimeout(() => spawnFloatingNumber('enemy', `-${bonusDmg}`, 'num-dmg'), 120);
      }
      showToast(`📜 使用【${item.name}】，造成 ${bVal} 點破防與 ${Math.max(0, bonusDmg)} 點傷害！`, 'gold');
      checkBossPhaseTransition();
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
      getDailyProgress().reach_fever = (getDailyProgress().reach_fever || 0) + 1;
      if (eff.healHpPct) {
        const healVal = Math.max(10, Math.round((stats.maxHp * Number(eff.healHpPct)) / 100));
        state.player.hp = Math.min(stats.maxHp, state.player.hp + healVal);
        spawnFloatingNumber('player', `+${healVal} HP`, 'num-heal');
      }
      Sound.playSFX('levelup');
      spawnFloatingNumber('player', 'FEVER!', 'num-crit');
      showToast(`⚡ 使用【${item.name}】，立即進入 FEVER TIME！`, 'gold');
    } else {
      // Generic heal fallback
      const val = Math.round(stats.maxHp * 0.35);
      state.player.hp = Math.min(stats.maxHp, state.player.hp + val);
      Sound.playSFX('heal');
      spawnFloatingNumber('player', `+${val} HP`, 'num-heal');
    }

    autoSave();
    updateBattleUI();
    updateHUD();
  }
