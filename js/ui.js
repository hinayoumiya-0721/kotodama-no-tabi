/**
 * 《言霊の旅》提示與視窗、HUD、沉浸模式、畫面切換、標題與創角（js/ui.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // ============================================================================
  // 8. Toast & Modal Utilities
  // ============================================================================
  const MAX_VISIBLE_TOASTS = 2;

  function showToast(message, type = 'info') {
    const container = $('toast-container');
    if (!container) return;

    while (container.children && container.children.length >= MAX_VISIBLE_TOASTS) {
      const oldest = container.children[0];
      const prevLen = container.children.length;
      if (oldest && typeof oldest.remove === 'function') oldest.remove();
      else break;
      if (container.children.length >= prevLen) break;
    }

    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.textContent = String(message == null ? '' : message);
    container.appendChild(el);

    let removed = false;
    const removeEl = () => {
      if (removed) return;
      removed = true;
      if (typeof el.remove === 'function') el.remove();
    };
    const timerId = setTimeout(() => {
      if (removed) return;
      el.style.opacity = '0';
      el.style.transform = 'translateX(24px)';
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(removeEl, 260);
    }, 3400);

    if (typeof el.addEventListener === 'function') {
      el.addEventListener('click', () => {
        clearTimeout(timerId);
        removeEl();
      });
    }
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

  // ---- Kotoha (コトハ) Onboarding Tutorial & Quick-Guide ----
  const VALID_TUTORIAL_STEPS = new Set([0, 1, 2, 'done']);
  let uiMapDiffOpen = false;

  function renderGuidePortraitImg(extraClass = '') {
    const src = (PORTRAIT_IMAGES.npc && PORTRAIT_IMAGES.npc.guide) || 'assets/portraits/npc_guide.png';
    return `<img class="guide-portrait-img ${extraClass}" src="${src}" alt="言靈引路使・コトハ" draggable="false">`;
  }

  function getTutorialStep() {
    const step = state && state.progress ? state.progress.tutorialStep : 'done';
    return VALID_TUTORIAL_STEPS.has(step) ? step : 'done';
  }

  function setTutorialStep(step, { silent = false } = {}) {
    if (!state || !state.progress) return;
    const next = VALID_TUTORIAL_STEPS.has(step) ? step : 'done';
    state.progress.tutorialStep = next;
    if (hasActiveSession) autoSave();
    renderBattleTutorialBanner();
    renderExploreTutorialBanner();
    if (!silent && next === 'done') {
      showToast('🦊 コトハ：新手引導完成！隨時可依頂部「目前目標」前進，或在 ⚙ 查看玩法速覽！', 'gold');
    }
  }

  // replay=true (from the ⚙ guide): stay in the player's current region instead of teleporting to r1
  function startFirstTutorialBattle({ replay = false } = {}) {
    closeModal('modal-tutorial');
    if (!replay) state.progress.currentRegionId = 'r1';
    state.progress.tutorialStep = 1;
    autoSave();
    const normals = getRegionNormalEnemies(state.progress.currentRegionId);
    const starterEnemy = replay
      ? (normals[Math.floor(Math.random() * normals.length)] || getEnemyById('en_r1_slime'))
      : (getEnemyById('en_r1_slime') || normals[0]);
    if (starterEnemy) {
      addExploreLog(`🦊 コトハ引領你迎戰第一隻魔物【${starterEnemy.name}】！`, 'battle');
      startBattle(starterEnemy, { returnView: 'explore', isFirstTutorialBattle: true });
    } else {
      switchView('explore');
    }
  }

  function openKotohaModal(mode = 'intro') {
    const titleEl = $('tutorial-modal-title');
    const bodyEl = $('tutorial-modal-body');
    const footerEl = $('tutorial-modal-footer');
    if (!bodyEl || !footerEl) return;

    const isIntro = mode === 'intro';
    if (titleEl) {
      titleEl.textContent = isIntro ? '🦊 言靈引路使・コトハ' : '❓ コトハ的玩法速覽';
    }

    const pName = escapeHtml((state && state.player && state.player.name) || '旅人');
    const jpLine = isIntro
      ? `はじめまして、${pName}さん！<ruby>言葉<rt>ことば</rt></ruby>を<ruby>食<rt>た</rt></ruby>べる<ruby>魔物<rt>まもの</rt></ruby>を、<ruby>正<rt>ただ</rt></ruby>しい<ruby>日本語<rt>にほんご</rt></ruby>で<ruby>撃退<rt>げきたい</rt></ruby>しよう！`
      : `<ruby>旅<rt>たび</rt></ruby>の<ruby>心得<rt>こころえ</rt></ruby>を<ruby>確認<rt>かくにん</rt></ruby>しよう！いつでも<ruby>私<rt>わたし</rt></ruby>が<ruby>案内<rt>あんない</rt></ruby>するよ！`;
    const zhLine = isIntro
      ? `初次見面，${pName}！我是引路精靈「コトハ」。魔物正在吞噬語言——我先帶你打一場實戰，1 分鐘就能上手！`
      : '隨時忘記規則都可以打開這裡！記住下面四個重點就能暢遊言靈大陸：';

    bodyEl.innerHTML = `
      <div class="tutorial-intro-layout">
        <div class="tutorial-guide-portrait-wrap">${renderGuidePortraitImg()}</div>
        <div class="tutorial-speech-col">
          <div class="tutorial-speech-jp jp-text force-furigana">${jpLine}</div>
          <div class="tutorial-speech-zh">${zhLine}</div>
          <ul class="tutorial-cue-list">
            <li>⚔️ <strong>答題即攻擊</strong>：選出正確日文發動言靈；10 秒內答對可削弱魔物護盾，連對 3 題啟動 FEVER！</li>
            <li>🧭 <strong>探索與首領</strong>：選路線前進累積探索度，50% 迎戰精英、100% 挑戰區域首領。</li>
            <li>📓 <strong>錯題與技能</strong>：答錯會自動收入「修練 → 錯題筆記」；想專心練題可用「修練 → 浸式刷題」；升級獲得的 SP 可在技能樹解鎖輔助技。</li>
            ${isIntro ? '' : '<li>🌸 <strong>難度與沉浸</strong>：頂部可切換「假名+中 / 無假名 / 全日文」；⚙ 選單隨時可換 N4～N1 難度。</li>'}
            <li>📖 <strong>有問題先看 FAQ</strong>：畫面右側的「📖 FAQ」標籤可以隨時展開常見問題，看完再收起來。</li>
          </ul>
        </div>
      </div>
    `;

    if (isIntro) {
      footerEl.innerHTML = `
        <button id="btn-tutorial-first-battle" type="button" class="btn btn-gold btn-lg btn-block tutorial-pulse">⚔️ 迎戰第一隻魔物（新手實戰）</button>
        <button id="btn-tutorial-skip" type="button" class="btn btn-secondary btn-block">先自由逛村莊（略過教學）</button>
      `;
      const goBtn = $('btn-tutorial-first-battle');
      if (goBtn) {
        goBtn.onclick = () => {
          Sound.playSFX('confirm');
          startFirstTutorialBattle();
        };
      }
      const skipBtn = $('btn-tutorial-skip');
      if (skipBtn) {
        skipBtn.onclick = () => {
          Sound.playSFX('click');
          closeModal('modal-tutorial');
          setTutorialStep('done', { silent: true });
          showToast('🦊 コトハ：已略過教學！隨時可點右上角 ⚙ →「❓ 玩法」呼喚我喔！', 'info');
        };
      }
    } else {
      footerEl.innerHTML = `
        <button id="btn-tutorial-ok" type="button" class="btn btn-gold btn-block">✔ 我明白了</button>
        <button id="btn-tutorial-replay" type="button" class="btn btn-secondary btn-sm btn-block">🔁 重新進行新手實戰引導</button>
      `;
      const okBtn = $('btn-tutorial-ok');
      if (okBtn) okBtn.onclick = () => { Sound.playSFX('click'); closeModal('modal-tutorial'); };
      const replayBtn = $('btn-tutorial-replay');
      if (replayBtn) {
        replayBtn.onclick = () => {
          Sound.playSFX('confirm');
          startFirstTutorialBattle({ replay: true });
        };
      }
    }

    openModal('modal-tutorial');
  }

  function renderBattleTutorialBanner() {
    const el = $('battle-tutorial-banner');
    if (!el) return;
    if (!battle.active || battle.isWrongNoteTraining || getTutorialStep() !== 1) {
      el.classList.add('hidden');
      el.innerHTML = '';
      return;
    }
    const msg = battle.consecutiveCorrect >= 1
      ? '<strong>【教學 2/3】</strong>漂亮！連續答對 <strong>3 題</strong>會啟動 FEVER，傷害與獎勵都會提升！'
      : '<strong>【教學 1/3】</strong>選出正確日文即可攻擊！上方 <strong>10 秒倒數</strong>內答對還能削弱魔物護盾！';
    el.innerHTML = `
      <div class="tutorial-banner-avatar">${renderGuidePortraitImg()}</div>
      <div class="tutorial-banner-text">${msg}</div>
      <button type="button" class="btn btn-secondary btn-sm tutorial-banner-skip" id="btn-battle-tut-skip">略過</button>
    `;
    el.classList.remove('hidden');
    const skipBtn = $('btn-battle-tut-skip');
    if (skipBtn) {
      skipBtn.onclick = () => {
        Sound.playSFX('click');
        setTutorialStep('done', { silent: true });
      };
    }
  }

  function renderExploreTutorialBanner() {
    const el = $('explore-tutorial-banner');
    const stepBtn = $('btn-explore-step');
    const riskyBtn = $('btn-explore-risky');
    const active = getTutorialStep() === 2;
    if (stepBtn) stepBtn.classList.toggle('tutorial-pulse', active);
    if (riskyBtn) riskyBtn.classList.toggle('tutorial-pulse', active && !riskyBtn.classList.contains('hidden'));
    if (!el) return;
    if (!active) {
      el.classList.add('hidden');
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="tutorial-banner-avatar">${renderGuidePortraitImg()}</div>
      <div class="tutorial-banner-text">
        <strong>【教學 3/3】</strong>首戰告捷！點下方發光的<strong>「安全小路」或「危險捷徑」</strong>繼續探索（50% 精英・100% 首領），也能點底部<strong>「城鎮」</strong>跟居民學日語！
      </div>
      <button type="button" class="btn btn-gold btn-sm tutorial-banner-skip" id="btn-explore-tut-done">知道了</button>
    `;
    el.classList.remove('hidden');
    const doneBtn = $('btn-explore-tut-done');
    if (doneBtn) {
      doneBtn.onclick = () => {
        Sound.playSFX('confirm');
        setTutorialStep('done');
      };
    }
  }

  // First sentence of the explanation (HTML-safe: data HTML is trusted ruby markup and
  // "。" never appears inside a tag). Falls back to the short hint.
  function getExplainKeyPoint(q) {
    const src = String((q && (q.explanation || q.hint)) || '');
    if (!src) return '';
    const cut = src.indexOf('。');
    const first = cut >= 0 ? src.slice(0, cut + 1) : src;
    return `💡 ${first}`;
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
      readEl.textContent = q.kanaReading || stripRubyHtml(q.correctDisplay);
    }
    if (wrongEl) wrongEl.innerHTML = q.wrongReason || '';
    if (detailEl) detailEl.innerHTML = q.explanation || '';

    // Players reported the old modal as "too much text": show ONE key line by default,
    // keep the full analysis folded (and re-folded on every open).
    const keyEl = $('explain-keypoint');
    if (keyEl) keyEl.innerHTML = getExplainKeyPoint(q);
    const moreEl = $('explain-more');
    if (moreEl) moreEl.open = false;

    const ttsBtn = $('btn-explain-tts');
    const ttsSlowBtn = $('btn-explain-tts-slow');
    const speakText = q.tts || stripRubyHtml(q.fullRubyJp || q.correctDisplay);
    if (ttsBtn) ttsBtn.onclick = () => Sound.speak(speakText, 1.0);
    if (ttsSlowBtn) ttsSlowBtn.onclick = () => Sound.speak(speakText, 0.65);

    explainCallback = typeof onConfirm === 'function' ? onConfirm : null;
    openModal('modal-explain');
  }

  // ============================================================================
  // 9. HUD, Three-Tier Immersion Mode, Mobile Collapsible HUD & View Router
  // ============================================================================
  // A peek wrap may mirror its revealed state onto elements outside it, listed by id in
  // data-peek-targets (e.g. the NPC dialogue peek also reveals #dialogue-choices translations).
  function setZhPeekState(wrapEl, revealed) {
    if (!wrapEl) return;
    wrapEl.classList.toggle('zh-revealed', revealed);
    const btn = wrapEl.querySelector('.btn-peek-zh');
    if (btn) btn.innerHTML = `${pxIcon('eye')} ${revealed ? '隱藏中譯' : '偷看中譯'}`;
    const targets = (wrapEl.getAttribute('data-peek-targets') || '').split(/\s+/).filter(Boolean);
    targets.forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle('zh-revealed', revealed);
    });
  }

  function resetZhPeekWrap(wrapEl) {
    setZhPeekState(wrapEl, false);
  }

  function applyFuriganaSetting() {
    const app = $('app');
    const btn = $('btn-toggle-furigana');
    let mode = state && state.settings && state.settings.immersionMode;
    if (!IMMERSION_MODES.includes(mode)) {
      mode = (state && state.settings && state.settings.furigana === false) ? 'advanced' : 'standard';
    }
    if (state && state.settings) {
      state.settings.immersionMode = mode;
      state.settings.furigana = mode === 'standard';
    }

    if (app) {
      // Leaving/entering a mode must not carry over a previously revealed peek state.
      const prevMode = app.classList.contains('immersion-full') ? 'immersion'
        : (app.classList.contains('immersion-advanced') ? 'advanced' : 'standard');
      if (prevMode !== mode) {
        document.querySelectorAll('.zh-peek-wrap').forEach(resetZhPeekWrap);
      }
      app.classList.remove('furigana-on', 'furigana-off', 'immersion-standard', 'immersion-advanced', 'immersion-full');
      if (mode === 'standard') {
        app.classList.add('furigana-on', 'immersion-standard');
      } else if (mode === 'advanced') {
        app.classList.add('furigana-off', 'immersion-advanced');
      } else {
        app.classList.add('furigana-off', 'immersion-full');
      }
    }
    if (btn) {
      if (mode === 'standard') {
        btn.textContent = '標準: 假名+中';
        btn.classList.add('active');
        btn.classList.remove('immersion-active');
      } else if (mode === 'advanced') {
        btn.textContent = '進階: 無假名';
        btn.classList.remove('active');
        btn.classList.remove('immersion-active');
      } else {
        btn.textContent = '沉浸: 全日文';
        btn.classList.add('active');
        btn.classList.add('immersion-active');
      }
      btn.setAttribute('data-immersion-mode', mode);
    }
  }

  function cycleImmersionMode(silent = false) {
    const cur = (state && state.settings && IMMERSION_MODES.includes(state.settings.immersionMode))
      ? state.settings.immersionMode
      : (state && state.settings && state.settings.furigana === false ? 'advanced' : 'standard');
    const nextIdx = (IMMERSION_MODES.indexOf(cur) + 1) % IMMERSION_MODES.length;
    const nextMode = IMMERSION_MODES[nextIdx];
    state.settings.immersionMode = nextMode;
    state.settings.furigana = nextMode === 'standard';
    applyFuriganaSetting();
    if (hasActiveSession) autoSave();
    if (!silent) {
      const labels = {
        standard: '標準模式（振假名＋中譯）',
        advanced: '進階模式（無振假名・保留中譯）',
        immersion: '沉浸模式（全日文・可偷看中譯）'
      };
      showToast(`🌸 視界切換：【${labels[nextMode]}】`, 'info');
    }
    return nextMode;
  }

  function getSavedUiScalePreference() {
    try {
      const v = localStorage.getItem(UI_SCALE_STORAGE_KEY);
      if (v && UI_SCALE_MODES.includes(v)) return v;
    } catch (_) {}
    return 'normal';
  }

  function applyUiScaleSetting(overrideScale = null) {
    let scale = overrideScale;
    if (!UI_SCALE_MODES.includes(scale)) {
      scale = hasActiveSession && state && state.settings && UI_SCALE_MODES.includes(state.settings.uiScale)
        ? state.settings.uiScale
        : getSavedUiScalePreference();
    }
    if (!UI_SCALE_MODES.includes(scale)) scale = 'normal';
    if (state && state.settings) {
      state.settings.uiScale = scale;
    }
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('data-ui-scale', scale);
    }
    const sel = $('hud-ui-scale-select');
    if (sel && sel.value !== scale) {
      sel.value = scale;
    }
    try {
      localStorage.setItem(UI_SCALE_STORAGE_KEY, scale);
    } catch (_) {}
    return scale;
  }

  function setUiScale(scale, options = {}) {
    const next = UI_SCALE_MODES.includes(scale) ? scale : 'normal';
    if (state && state.settings) {
      state.settings.uiScale = next;
    }
    applyUiScaleSetting(next);
    if (hasActiveSession) autoSave();
    if (!options.silent) {
      showToast(`🔍 畫面大小已調整為【${UI_SCALE_LABELS[next] || next}】`, 'info');
    }
    return next;
  }

  function applyMobileHudCollapseState() {
    const hud = $('top-hud');
    const toggleBtn = $('btn-hud-collapse-toggle');
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const shouldCollapse = isMobile && Boolean(hudCollapsedMobile);
    if (hud) {
      hud.classList.toggle('hud-collapsed', shouldCollapse);
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
      toggleBtn.textContent = shouldCollapse ? '▼ 角色狀態' : '▲ 收合狀態';
    }
  }

  // Publishes the live #top-hud height as --hud-h on #app so the mobile battle view can size
  // itself to the remaining viewport (no page scroll + inner scroll = no double scrollbar).
  // Single observer for the app lifetime; guarded against double init.
  let hudResizeObserver = null;
  function initHudHeightSync() {
    const hud = $('top-hud');
    const app = $('app');
    if (!hud || !app || hudResizeObserver) return;
    let lastValue = '';
    let rafId = 0;
    const sync = () => {
      rafId = 0;
      const value = `${Math.ceil(hud.getBoundingClientRect().height)}px`;
      if (value === lastValue) return; // no-op writes would re-trigger layout for nothing
      lastValue = value;
      app.style.setProperty('--hud-h', value);
    };
    if (typeof ResizeObserver === 'function') {
      // Defer the write to the next frame: changing --hud-h inside the RO callback resizes
      // #view-battle in the same frame, which Chrome reports as
      // "ResizeObserver loop completed with undelivered notifications".
      hudResizeObserver = new ResizeObserver(() => {
        if (!rafId) rafId = requestAnimationFrame(sync);
      });
      hudResizeObserver.observe(hud);
    }
    sync();
  }

  function syncAudioButtons() {
    const st = Sound.getState();
    const bgmBtn = $('btn-toggle-bgm');
    const sfxBtn = $('btn-toggle-sfx');
    if (bgmBtn) {
      bgmBtn.innerHTML = `${pxIcon('music')} BGM`;
      bgmBtn.classList.toggle('is-muted', Boolean(st.bgmMuted));
      bgmBtn.classList.toggle('active', !st.bgmMuted);
    }
    if (sfxBtn) {
      sfxBtn.innerHTML = `${pxIcon('speaker')} SFX`;
      sfxBtn.classList.toggle('is-muted', Boolean(st.sfxMuted));
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
    if (currentView === 'explore') {
      renderExplore();
    }
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
    if (currentView === 'explore') {
      renderExplore();
    }
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

    if ($('hud-mini-name')) $('hud-mini-name').textContent = `${p.name} Lv.${p.level}`;
    if ($('hud-mini-hp')) $('hud-mini-hp').textContent = `HP ${p.hp}/${stats.maxHp}`;
    if ($('hud-mini-mp')) $('hud-mini-mp').textContent = `MP ${p.mp}/${stats.maxMp}`;

    applyMobileHudCollapseState();
    applyFuriganaSetting();
    applyUiScaleSetting();
    syncAudioButtons();
    syncDifficultyControls();
    updateNavMistakeBadge();
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
    if (hud && hideHud) setHudSettingsOpen(false);
    applyMobileHudCollapseState();

    document.querySelectorAll('#nav-bar .nav-btn').forEach((btn) => {
      const target = btn.getAttribute('data-view');
      const active =
        target === viewName ||
        (viewName === 'explore' && target === 'map');
      btn.classList.toggle('active', active);
    });

    // Bottom dock + group sub-tabs
    const group = getNavGroupForView(viewName);
    if (group) navLastViewByGroup[group] = viewName === 'explore' ? 'map' : viewName;
    const groupSize = group ? document.querySelectorAll(`#nav-bar .nav-btn[data-group="${group}"]`).length : 0;
    if (nav) {
      nav.setAttribute('data-active-group', group || '');
      // A single-view group (城鎮) needs no sub-tab strip
      nav.classList.toggle('hidden', hideNav || groupSize <= 1);
    }
    const dock = $('nav-dock');
    if (dock) dock.classList.toggle('hidden', hideNav);
    document.querySelectorAll('#nav-dock .dock-btn').forEach((btn) => {
      const isActive = btn.getAttribute('data-group') === group;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    if ($('app')) $('app').classList.toggle('has-dock', !hideNav);
  }

  // ---- Bottom dock: 5 groups over the existing 10 views ----
  const NAV_GROUP_DEFAULT_VIEW = {
    town: 'town',
    adventure: 'map',
    training: 'notes',
    traveler: 'character',
    journal: 'quests'
  };
  const navLastViewByGroup = {};

  function getNavGroupForView(viewName) {
    const key = viewName === 'explore' ? 'map' : viewName;
    const btn = document.querySelector(`#nav-bar .nav-btn[data-view="${key}"]`);
    return btn ? btn.getAttribute('data-group') : null;
  }

  function openNavGroup(group) {
    const view = navLastViewByGroup[group] || NAV_GROUP_DEFAULT_VIEW[group];
    // Route through the original nav button so its per-view setup (reading/shrine reset) still runs
    const btn = view ? document.querySelector(`#nav-bar .nav-btn[data-view="${view}"]`) : null;
    if (btn) btn.click();
  }

  // ---- HUD ⚙ settings menu (desktop popover; inline on mobile via CSS) ----
  function setHudSettingsOpen(open) {
    const hud = $('top-hud');
    const btn = $('btn-hud-settings');
    if (hud) hud.classList.toggle('settings-open', Boolean(open));
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function switchView(viewName) {
    // Support shorthand aliases gracefully
    if (viewName === 'char') viewName = 'character';
    if (viewName === 'inv') viewName = 'inventory';

    if (currentView !== viewName) {
      if (currentView === 'explore' && viewName !== 'battle' && hasActiveSession && getTutorialStep() === 2) {
        setTutorialStep('done');
      }
      stopTypewriter();
      Sound.stopSpeak();
      if (currentView === 'battle' && viewName !== 'battle') {
        stopBattleTimers();
      }
      if (currentView === 'drill' && viewName !== 'drill') {
        clearDrillAutoTimer();
      }
      if (currentView === 'shrine' && viewName !== 'shrine' && shrine.active) {
        stopShrineTimer();
        shrine.active = false;
      }
    }

    if (viewName === 'battle' && typeof window !== 'undefined' && window.innerWidth <= 768) {
      hudCollapsedMobile = true;
    }

    currentView = viewName;
    if ($('app')) {
      $('app').classList.toggle('view-battle-active', viewName === 'battle');
      // Lets the theme pick a scene backdrop per screen (night sky vs. village pattern)
      $('app').setAttribute('data-view', viewName);
    }

    document.querySelectorAll('.game-view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${viewName}`);
    });

    updateChromeVisibility(viewName);

    // BGM routing
    if (viewName === 'title' || viewName === 'create') {
      Sound.playBGM('title');
    } else if (viewName === 'battle') {
      Sound.playBGM(battle.enemy && battle.enemy.isBoss ? 'boss' : 'battle');
    } else if (viewName === 'shrine' && shrine.active) {
      Sound.playBGM('battle');
    } else {
      Sound.playBGM('town');
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
      case 'notes': renderNotes(); break;
      case 'drill': renderDrill(); break;
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
          Sound.playSFX('click');
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
          Sound.playSFX('click');
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
          Sound.playSFX('click');
          renderCreate();
        });
      });
    }

    const summaryLabel = $('create-diff-summary-label');
    if (summaryLabel) {
      const selCfg = getDifficultyModeConfig(createSelectedDifficultyMode);
      summaryLabel.textContent = selCfg.id === 'adaptive'
        ? `動態自適應・${createAdaptiveStartJlpt} 起步`
        : selCfg.label;
    }

    const startRow = $('create-adaptive-start-row');
    if (startRow) {
      startRow.classList.toggle('hidden', createSelectedDifficultyMode !== 'adaptive');
      startRow.querySelectorAll('[data-adaptive-start]').forEach((btn) => {
        const val = btn.getAttribute('data-adaptive-start');
        btn.classList.toggle('active', val === createAdaptiveStartJlpt);
        btn.onclick = () => {
          createAdaptiveStartJlpt = val === 'N3' ? 'N3' : 'N4';
          Sound.playSFX('click');
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
    state.settings.uiScale = getSavedUiScalePreference();
    state.progress.tutorialStep = 0;

    // Ensure full derived HP/MP including starter weapon bonus
    const total = getTotalStats();
    state.player.hp = total.maxHp;
    state.player.mp = total.maxMp;

    hasActiveSession = true;
    townState.selectedNpcId = null;
    exploreLogs = [];

    const modeCfg = getDifficultyModeConfig(state.settings.difficultyMode);
    Sound.init();
    Sound.playSFX('levelup');
    autoSave();
    showToast(`✨ 記憶甦醒！${name}（${job.name}）以【${modeCfg.label}】踏上言霊大陸！`, 'gold');
    switchView('town');
    openKotohaModal('intro');
  }
