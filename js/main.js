/**
 * 《言霊の旅》事件綁定、啟動、對外 API（window.Game）（js/main.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // ============================================================================
  // 19. Global Event Binding & Bootstrap
  // ============================================================================
  function bindStaticEvents() {
    // Mobile Collapsible HUD toggle & resize handler
    if ($('btn-hud-collapse-toggle')) {
      $('btn-hud-collapse-toggle').addEventListener('click', () => {
        hudCollapsedMobile = !hudCollapsedMobile;
        Sound.playSFX('click');
        applyMobileHudCollapseState();
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        applyMobileHudCollapseState();
      });
    }
    initHudHeightSync();

    // Delegated handler for Immersion Mode Chinese hint peek buttons (.btn-peek-zh)
    document.addEventListener('click', (e) => {
      const peekBtn = e.target && e.target.closest ? e.target.closest('.btn-peek-zh') : null;
      if (!peekBtn) return;
      e.stopPropagation();
      const wrap = peekBtn.closest('.zh-peek-wrap');
      if (!wrap) return;
      setZhPeekState(wrap, !wrap.classList.contains('zh-revealed'));
      Sound.playSFX('click');
    });

    // Top HUD controls
    if ($('btn-toggle-furigana')) {
      $('btn-toggle-furigana').addEventListener('click', () => {
        Sound.playSFX('click');
        cycleImmersionMode(false);
      });
    }
    if ($('btn-toggle-bgm')) {
      $('btn-toggle-bgm').addEventListener('click', () => {
        Sound.toggleBGM();
        syncAudioButtons();
      });
    }
    if ($('btn-toggle-sfx')) {
      $('btn-toggle-sfx').addEventListener('click', () => {
        Sound.toggleSFX();
        syncAudioButtons();
      });
    }
    if ($('btn-open-guide')) {
      $('btn-open-guide').addEventListener('click', () => {
        Sound.playSFX('click');
        setHudSettingsOpen(false);
        openKotohaModal('guide');
      });
    }
    if ($('hud-difficulty-select')) {
      $('hud-difficulty-select').addEventListener('change', (e) => {
        Sound.playSFX('click');
        setDifficultyMode(e.target.value, { refreshCurrentBattleQuestion: true });
      });
    }
    if ($('hud-ui-scale-select')) {
      $('hud-ui-scale-select').addEventListener('change', (e) => {
        Sound.playSFX('click');
        setUiScale(e.target.value);
      });
    }
    if ($('btn-open-save')) {
      $('btn-open-save').addEventListener('click', () => {
        Sound.playSFX('click');
        openSaveModal(false);
      });
    }

    // Bottom dock (5 groups) → delegates to the matching #nav-bar button
    document.querySelectorAll('#nav-dock .dock-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.getAttribute('data-group');
        if (group) openNavGroup(group);
      });
    });

    // HUD ⚙ settings popover: toggle, close on outside click / Escape
    if ($('btn-hud-settings')) {
      $('btn-hud-settings').addEventListener('click', (e) => {
        e.stopPropagation();
        Sound.playSFX('click');
        const hud = $('top-hud');
        setHudSettingsOpen(!(hud && hud.classList.contains('settings-open')));
      });
      document.addEventListener('click', (e) => {
        const menu = $('hud-settings-menu');
        if (menu && !menu.contains(e.target)) setHudSettingsOpen(false);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('top-hud') && $('top-hud').classList.contains('settings-open')) {
          setHudSettingsOpen(false);
          $('btn-hud-settings').focus();
        }
      });
    }

    // Main Navigation Bar (now the group sub-tab strip)
    document.querySelectorAll('#nav-bar .nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (!view) return;
        Sound.playSFX('click');
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
        Sound.init();
        Sound.playSFX('confirm');
        switchView('create');
      });
    }
    if ($('btn-title-load')) {
      $('btn-title-load').addEventListener('click', () => {
        Sound.init();
        Sound.playSFX('click');
        openSaveModal(true);
      });
    }

    // Character Creation buttons
    if ($('btn-create-confirm')) {
      $('btn-create-confirm').addEventListener('click', confirmCharacterCreation);
    }
    if ($('btn-create-back')) {
      $('btn-create-back').addEventListener('click', () => {
        Sound.playSFX('cancel');
        switchView('title');
      });
    }

    // Town Quick Actions & Dialogue Speech Click-to-Complete
    if ($('btn-town-rest')) {
      $('btn-town-rest').addEventListener('click', () => {
        const stats = getTotalStats();
        state.player.hp = stats.maxHp;
        state.player.mp = stats.maxMp;
        Sound.playSFX('heal');
        autoSave();
        updateHUD();
        showToast('🛏️ 於宿屋安穩歇息，體力與言靈魔力已完全充盈！', 'success');
      });
    }
    if ($('btn-town-map')) $('btn-town-map').addEventListener('click', () => { Sound.playSFX('click'); switchView('map'); });
    if ($('btn-town-reading')) $('btn-town-reading').addEventListener('click', () => { Sound.playSFX('click'); reading.active = false; switchView('reading'); });
    if ($('btn-town-shrine')) $('btn-town-shrine').addEventListener('click', () => { Sound.playSFX('click'); shrine.results = []; shrine.tier = null; switchView('shrine'); });

    // Anti-misclick AVG skip: bind click ONLY on #dialogue-text-jp and #dialogue-text-zh
    ['dialogue-text-jp', 'dialogue-text-zh'].forEach((id) => {
      const textEl = $(id);
      if (textEl) {
        textEl.addEventListener('click', (e) => {
          if (townState.typingActive) {
            e.stopPropagation();
            completeTypewriterImmediately();
          }
        });
      }
    });
    if ($('btn-dialogue-tts')) {
      $('btn-dialogue-tts').addEventListener('click', (e) => {
        e.stopPropagation();
        if (townState.currentTts) Sound.speak(townState.currentTts, 1.0);
      });
    }
    if ($('btn-dialogue-tts-slow')) {
      $('btn-dialogue-tts-slow').addEventListener('click', (e) => {
        e.stopPropagation();
        if (townState.currentTts) Sound.speak(townState.currentTts, 0.65);
      });
    }

    // Explore buttons
    if ($('btn-explore-retreat')) $('btn-explore-retreat').addEventListener('click', () => { Sound.playSFX('click'); explorePendingEvent = null; switchView('map'); });
    // Route buttons pass an explicit route (handleExploreStep ignores it after 100% / at the elite gate)
    if ($('btn-explore-step')) $('btn-explore-step').addEventListener('click', () => handleExploreStep('safe'));
    if ($('btn-explore-risky')) $('btn-explore-risky').addEventListener('click', () => handleExploreStep('risky'));
    if ($('btn-explore-boss')) $('btn-explore-boss').addEventListener('click', () => triggerRegionBossBattle(state.progress.currentRegionId));
    if ($('btn-explore-camp')) $('btn-explore-camp').addEventListener('click', () => { Sound.playSFX('click'); switchView('inventory'); });

    // Battle controls
    if ($('btn-battle-tts-normal')) {
      $('btn-battle-tts-normal').addEventListener('click', () => {
        if (battle.currentQ) speakQuestionStem(battle.currentQ, 1.0);
      });
    }
    if ($('btn-battle-tts-slow')) {
      $('btn-battle-tts-slow').addEventListener('click', () => {
        if (battle.currentQ) speakQuestionStem(battle.currentQ, 0.65);
      });
    }
    if ($('btn-skill-vocab')) $('btn-skill-vocab').addEventListener('click', useVocabInsight);
    if ($('btn-skill-listen')) $('btn-skill-listen').addEventListener('click', useClairaudience);
    if ($('btn-battle-flee')) {
      $('btn-battle-flee').addEventListener('click', () => {
        if (!battle.active) return;
        stopBattleTimers();
        battle.active = false;
        Sound.playSFX('cancel');
        showToast('🏃 已收劍脫離戰線，退回安全據點。', 'info');
        switchView(battle.returnView || 'explore');
      });
    }

    // Reading controls
    if ($('btn-reading-skill')) $('btn-reading-skill').addEventListener('click', useSpeedReadingSkill);
    if ($('btn-reading-next')) $('btn-reading-next').addEventListener('click', advanceReadingQuestion);
    if ($('btn-reading-exit')) {
      $('btn-reading-exit').addEventListener('click', () => {
        Sound.playSFX('cancel');
        Sound.stopSpeak();
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
        Sound.stopSpeak();
        shrine.active = false;
        shrine.results = [];
        shrine.tier = null;
        Sound.playSFX('cancel');
        Sound.playBGM('town');
        updateChromeVisibility('shrine');
        renderShrine();
      });
    }
    if ($('btn-shrine-return')) {
      $('btn-shrine-return').addEventListener('click', () => {
        Sound.playSFX('click');
        shrine.results = [];
        shrine.tier = null;
        renderShrine();
      });
    }

    // Tab bars (Inventory, Quests, Codex, Shop)
    document.querySelectorAll('#inv-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.playSFX('click');
        uiTabs.inv = btn.getAttribute('data-tab') || 'all';
        renderInventory();
      });
    });
    document.querySelectorAll('#quest-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.playSFX('click');
        uiTabs.quests = btn.getAttribute('data-tab') || 'main';
        renderQuests();
      });
    });
    document.querySelectorAll('#codex-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.playSFX('click');
        uiTabs.codex = btn.getAttribute('data-tab') || 'bestiary';
        renderCodex();
      });
    });
    document.querySelectorAll('#shop-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.playSFX('click');
        uiTabs.shop = btn.getAttribute('data-tab') || 'buy';
        document.querySelectorAll('#shop-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderShopModal();
      });
    });
    if ($('btn-start-wrong-training')) {
      $('btn-start-wrong-training').addEventListener('click', () => startWrongNoteBattle('due'));
    }
    if ($('btn-start-wrong-training-all')) {
      $('btn-start-wrong-training-all').addEventListener('click', () => startWrongNoteBattle('all'));
    }
    if ($('btn-clear-mastered-notes')) {
      $('btn-clear-mastered-notes').addEventListener('click', clearMasteredWrongNotes);
    }
    if ($('btn-download-save-json')) {
      $('btn-download-save-json').addEventListener('click', () => exportSaveJsonFile());
    }
    if ($('btn-upload-save-json') && $('input-import-save-file')) {
      $('btn-upload-save-json').addEventListener('click', () => {
        Sound.playSFX('click');
        $('input-import-save-file').value = '';
        $('input-import-save-file').click();
      });
      $('input-import-save-file').addEventListener('change', (e) => {
        const file = e.target && e.target.files && e.target.files[0];
        if (!file) return;
        importSaveJsonFile(file);
      });
    }
    if ($('btn-export-save-json')) {
      $('btn-export-save-json').addEventListener('click', () => exportSaveJsonCode());
    }
    if ($('btn-import-save-json')) {
      $('btn-import-save-json').addEventListener('click', () => importSaveJsonCode());
    }

    // Modals
    // IMPORTANT: #modal-explain can ONLY be closed via #btn-explain-confirm!
    if ($('btn-explain-confirm')) {
      $('btn-explain-confirm').addEventListener('click', () => {
        Sound.stopSpeak();
        Sound.playSFX('confirm');
        closeModal('modal-explain');
        const cb = explainCallback;
        explainCallback = null;
        if (cb) cb();
      });
    }

    if ($('btn-shop-close')) $('btn-shop-close').addEventListener('click', () => { Sound.playSFX('click'); closeModal('modal-shop'); });
    if ($('btn-save-close')) $('btn-save-close').addEventListener('click', () => { Sound.playSFX('click'); clearSaveTransferInputs(); closeModal('modal-save'); });
    if ($('btn-bug-report')) {
      $('btn-bug-report').addEventListener('click', () => {
        Sound.playSFX('click');
        openBugReportModal();
      });
    }
    if ($('btn-bug-report-close')) {
      $('btn-bug-report-close').addEventListener('click', () => {
        Sound.playSFX('click');
        closeModal('modal-bug-report');
      });
    }
    if ($('btn-bug-copy')) {
      $('btn-bug-copy').addEventListener('click', () => copyBugReportToClipboard());
    }
    if ($('btn-bug-github')) {
      $('btn-bug-github').addEventListener('click', () => {
        const cat = $('bug-report-category') ? $('bug-report-category').value : '功能異常 / 卡住';
        const desc = $('bug-report-desc') ? $('bug-report-desc').value : '';
        const url = buildGithubIssueUrl({ category: cat, description: desc });
        Sound.playSFX('confirm');
        try {
          window.open(url, '_blank', 'noopener,noreferrer');
        } catch (_) {}
        showToast('🐙 已在新分頁開啟 GitHub Issue，送出前可再補充細節！', 'info');
      });
    }
    document.addEventListener('keydown', handleDrillKeydown);
    initFaqDrawer();
    initPwa();
    if ($('btn-tutorial-close')) {
      $('btn-tutorial-close').addEventListener('click', () => {
        Sound.playSFX('click');
        closeModal('modal-tutorial');
        if (getTutorialStep() === 0) setTutorialStep('done', { silent: true });
      });
    }
    if ($('btn-generic-close')) {
      $('btn-generic-close').addEventListener('click', () => {
        Sound.playSFX('click');
        closeModal('modal-generic');
        const cb = genericModalCallback;
        genericModalCallback = null;
        if (cb) cb();
      });
    }

    // Backdrop click closes ONLY non-mandatory modals (never #modal-explain!)
    ['modal-shop', 'modal-save', 'modal-generic', 'modal-tutorial', 'modal-bug-report'].forEach((mid) => {
      const overlay = $(mid);
      if (!overlay) return;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(mid);
          if (mid === 'modal-save') {
            clearSaveTransferInputs();
          }
          if (mid === 'modal-tutorial' && getTutorialStep() === 0) {
            setTutorialStep('done', { silent: true });
          }
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
        Sound.playSFX('chest');
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
        Sound.playSFX('heal');
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
        Sound.playSFX('levelup');
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
        Sound.playSFX('levelup');
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
        // QA S-4: one click used to wipe all save slots with no confirmation
        if (typeof global.confirm === 'function' && !global.confirm('確定要刪除所有存檔欄位嗎？這個動作無法復原。')) return;
        Object.values(SAVE_KEYS).forEach(deleteSlot);
        stopBattleTimers();
        stopShrineTimer();
        stopTypewriter();
        Sound.stopSpeak();
        state = createDefaultState();
        hasActiveSession = false;
        crossRegionNotifiedKeys = new Set();
        battle.active = false;
        shrine.active = false;
        reading.active = false;
        if (drawer) drawer.classList.add('hidden');
        closeModal('modal-explain');
        closeModal('modal-shop');
        closeModal('modal-save');
        closeModal('modal-generic');
        closeModal('modal-tutorial');
        Sound.playSFX('cancel');
        showToast('🗑️ 已清空所有本機存檔並回到標題畫面。', 'warning');
        switchView('title');
      });
    }
  }

  function init() {
    bindStaticEvents();
    // Show dev/debug corner toggle ONLY when ?debug=1 is explicitly present
    const debugBtn = $('btn-dev-toggle');
    if (debugBtn) {
      const params = new URLSearchParams(window.location.search);
      const isDebug = params.get('debug') === '1';
      debugBtn.classList.toggle('hidden', !isDebug);
      if (!isDebug && $('dev-drawer')) $('dev-drawer').classList.add('hidden');
    }
    applyMobileHudCollapseState();
    applyFuriganaSetting();
    applyUiScaleSetting();
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
    getQuestionBankProgressSummary,
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
    showToast,
    recordWrongNote,
    markWrongNoteMastered,
    advanceWrongNoteSRS,
    isWrongNoteDue,
    getWrongNotesSummary,
    startWrongNoteBattle,
    clearMasteredWrongNotes,
    renderNotes,
    typewriterSpeak,
    cycleImmersionMode,
    exportSaveJsonCode,
    importSaveJsonCode,
    exportSaveJsonFile,
    importSaveJsonFile,
    validateSaveJsonFile,
    buildSafeSaveFilename,
    ensureDailyTrainingFresh,
    claimDailyTrainingTask,
    renderDailyTrainingPanel,
    getBossPhaseInfo,
    getQuestDestination,
    getCurrentObjective,
    getItemById,
    getEnemyById,
    formatBattleSpeedText,
    getQuestionSpeakText,
    openKotohaModal,
    getTutorialStep,
    setTutorialStep,
    setUiScale,
    applyUiScaleSetting,
    collectBugReportDiagnostics,
    buildBugReportText,
    buildGithubIssueUrl,
    openBugReportModal,
    switchPlayerJob,
    applyMobileHudCollapseState,
    buildDrillPool,
    startDrill,
    answerDrill,
    nextDrillQuestion,
    finishDrill,
    getDrillState: () => drill
  };

  global.Game = Game;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => Game.init());
    } else {
      Game.init();
    }
  }
