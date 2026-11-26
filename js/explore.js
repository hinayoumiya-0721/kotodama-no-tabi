/**
 * 《言霊の旅》世界地圖與區域探索（js/explore.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // ============================================================================
  // 12. World Map & Region Exploration
  // ============================================================================
  function getQuestionBankProgressSummary(regionIdOverride) {
    const allRaw = getQuestions();
    const regionId = regionIdOverride || (state && state.progress && state.progress.currentRegionId) || 'r1';
    const byJlpt = {};
    JLPT_LEVELS.forEach((lvl) => {
      byJlpt[lvl] = { total: 0, solved: 0, regionTotal: 0, regionSolved: 0 };
    });

    const solvedSets = {};
    JLPT_LEVELS.forEach((lvl) => {
      const arr = (state && state.progress && state.progress.solvedByJlpt && state.progress.solvedByJlpt[lvl]) || [];
      solvedSets[lvl] = new Set(arr);
    });

    allRaw.forEach((q) => {
      const lvl = normalizeJlptLevel(q.jlpt, q.regionId);
      const bucket = byJlpt[lvl];
      if (!bucket) return;
      bucket.total += 1;
      const isSolved = solvedSets[lvl].has(q.id);
      if (isSolved) bucket.solved += 1;
      if (q.regionId === regionId) {
        bucket.regionTotal += 1;
        if (isSolved) bucket.regionSolved += 1;
      }
    });

    const totalAll = allRaw.length;
    const solvedAll = JLPT_LEVELS.reduce((acc, lvl) => acc + byJlpt[lvl].solved, 0);
    const modeCfg = getDifficultyModeConfig((state && state.settings && state.settings.difficultyMode) || 'adaptive');

    if (modeCfg.targetJlpt && byJlpt[modeCfg.targetJlpt]) {
      const b = byJlpt[modeCfg.targetJlpt];
      const regRem = Math.max(0, b.regionTotal - b.regionSolved);
      const pct = b.total > 0 ? Math.min(100, Math.round((b.solved / b.total) * 100)) : 0;
      const crossNote = regRem === 0 && b.regionTotal > 0 ? '已開啟跨區題庫' : `本區餘 ${regRem} 題`;
      return {
        modeId: modeCfg.id,
        targetJlpt: modeCfg.targetJlpt,
        solved: b.solved,
        total: b.total,
        totalAll,
        pct,
        byJlpt,
        summaryText: `目前難度已破題：<b>${b.solved} / ${b.total}</b> 題（${crossNote}）｜全題庫 ${totalAll} 題`
      };
    }

    const pct = totalAll > 0 ? Math.min(100, Math.round((solvedAll / totalAll) * 100)) : 0;
    const detailChips = JLPT_LEVELS.map((l) => `${l} ${byJlpt[l].solved}/${byJlpt[l].total}`).join('・');
    return {
      modeId: modeCfg.id,
      targetJlpt: null,
      solved: solvedAll,
      total: totalAll,
      totalAll,
      pct,
      byJlpt,
      summaryText: `全題庫已破題：<b>${solvedAll} / ${totalAll}</b> 題（${detailChips}）`
    };
  }

  function renderMapDifficultyBar() {
    const bar = $('map-difficulty-bar');
    if (!bar) return;
    const modeId = (state && state.settings && state.settings.difficultyMode) || 'adaptive';
    const startJlpt = (state && state.settings && state.settings.adaptiveStartJlpt) || 'N4';
    const cfg = getDifficultyModeConfig(modeId);
    const qProgress = getQuestionBankProgressSummary(mapSelectedRegionId || state.progress.currentRegionId);
    bar.classList.toggle('mode-n1-active', modeId === 'fixed_n1');

    bar.innerHTML = `
      <details class="map-diff-details" ${uiMapDiffOpen ? 'open' : ''}>
        <summary class="map-diff-summary">
          <span>🎯 難度：<b>${escapeHtml(cfg.shortLabel)}</b>${modeId === 'fixed_n1' ? ' <span class="badge badge-crimson">EXP・掉落 ×2</span>' : ''}</span>
          <span>📚 已破 <b>${qProgress.solved}/${qProgress.total}</b> 題</span>
          <span class="map-diff-summary-toggle">${uiMapDiffOpen ? '收合 ▴' : '切換 ▾'}</span>
        </summary>
        <div class="map-diff-details-body">
          <div class="map-diff-top-row">
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
          <div class="qbank-progress-box">
            <div class="qbank-progress-label">📚 ${qProgress.summaryText}</div>
            <div class="stat-bar qbank-bar">
              <div class="stat-bar-fill" style="width: ${qProgress.pct}%;"></div>
              <span class="stat-bar-text">${qProgress.pct}% (${qProgress.solved}/${qProgress.total})</span>
            </div>
          </div>
        </div>
      </details>
    `;

    const detailsEl = bar.querySelector('.map-diff-details');
    if (detailsEl) {
      detailsEl.addEventListener('toggle', () => {
        uiMapDiffOpen = detailsEl.open;
        const hint = detailsEl.querySelector('.map-diff-summary-toggle');
        if (hint) hint.textContent = detailsEl.open ? '收合 ▴' : '切換 ▾';
      });
    }

    bar.querySelectorAll('[data-map-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.playSFX('click');
        setDifficultyMode(btn.getAttribute('data-map-diff'));
      });
    });
    bar.querySelectorAll('[data-map-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Sound.playSFX('click');
        setAdaptiveStartJlpt(btn.getAttribute('data-map-start'));
      });
    });
  }

  function renderMap() {
    renderObjectiveBar('map-objective');
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
          Sound.playSFX('click');
          mapSelectedRegionId = rid;
          renderMapDifficultyBar();
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
        Sound.playSFX('confirm');
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
      logEl.innerHTML = '<div class="log-entry log-story">準備好踏入未知的領域了。選擇「小路」或「捷徑」展開冒險。</div>';
      return;
    }
    logEl.innerHTML = exploreLogs
      .map((l) => `<div class="log-entry log-${l.type}"><span class="text-muted">[${l.ts}]</span> ${l.text}</div>`)
      .join('');
  }

  function renderExplore() {
    renderObjectiveBar('explore-objective');
    const region = getRegionById(state.progress.currentRegionId) || getRegions()[0];
    if (!region) return;
    const pct = clamp(state.progress.regionExplore[region.id] || 0, 0, 100);
    const bossDefeated = state.progress.defeatedBosses.includes(region.id);
    const bossReady = pct >= 100 || bossDefeated;
    const boss = getRegionBoss(region.id);

    if ($('explore-region-title')) $('explore-region-title').textContent = region.name;
    if ($('explore-region-jlpt')) $('explore-region-jlpt').textContent = region.jlpt || 'N4';
    if ($('explore-progress-text')) $('explore-progress-text').textContent = `${pct}%`;
    if ($('explore-progress-bar')) $('explore-progress-bar').style.width = `${pct}%`;

    // Question Bank Progress Dashboard inside Region Explore Card
    const progressCard = document.querySelector('#view-explore .explore-progress-card');
    if (progressCard) {
      let qbankEl = $('explore-qbank-meter');
      if (!qbankEl) {
        qbankEl = document.createElement('div');
        qbankEl.id = 'explore-qbank-meter';
        qbankEl.className = 'explore-qbank-meter';
        progressCard.appendChild(qbankEl);
      }
      const qProg = getQuestionBankProgressSummary(region.id);
      qbankEl.innerHTML = `
        <div class="qbank-progress-label">📚 ${qProg.summaryText}</div>
        <div class="stat-bar qbank-bar">
          <div class="stat-bar-fill" style="width: ${qProg.pct}%;"></div>
          <span class="stat-bar-text">${qProg.pct}% (${qProg.solved}/${qProg.total})</span>
        </div>
      `;
    }

    const bossBtn = $('btn-explore-boss');
    if (bossBtn) {
      bossBtn.disabled = !bossReady;
      bossBtn.classList.toggle('aura-pulse', bossReady && !bossDefeated);
      bossBtn.classList.toggle('btn-boss-defeated', bossReady && bossDefeated);
      if (!bossReady) {
        bossBtn.innerHTML = `${pxIcon('lock')} 探索 100% 解鎖首領`;
      } else if (bossDefeated) {
        bossBtn.innerHTML = `${pxIcon('skull')} 再戰首領（已討伐）`;
      } else {
        bossBtn.innerHTML = `${pxIcon('skull')} 挑戰首領：${escapeHtml(boss ? boss.name : '區域首領')}`;
      }
    }

    // Elite is waiting when the player stands at the gate and has not beaten it yet
    const eliteBlocking = pct === EXPLORE_ELITE_AT && !isRegionEliteDefeated(region.id);
    const eliteForUi = eliteBlocking ? createRegionElite(region.id) : null;

    // Route choice only while there is road left and no elite in the way; otherwise the
    // primary button is a single action (patrol / fight the elite) and the risky one hides.
    const routeChoice = pct < 100 && !eliteForUi;
    // Route buttons use a two-line label (name / details) so they stay compact on phones
    const routeLabel = (main, sub) => `<span class="route-main">${main}</span><span class="route-sub">${sub}</span>`;
    const stepBtn = $('btn-explore-step');
    if (stepBtn) {
      stepBtn.disabled = Boolean(explorePendingEvent);
      stepBtn.classList.toggle('route-btn', routeChoice);
      if (routeChoice) {
        stepBtn.innerHTML = routeLabel(`${pxIcon('map')} 安全小路`, `+${EXPLORE_ROUTES.safe.pct}%・少遇敵`);
      } else {
        stepBtn.textContent = pct >= 100 ? '🧭 深入巡邏（遇怪・奇遇）' : `⚔️ 迎戰精英：${eliteForUi ? eliteForUi.name : ''}`;
      }
      stepBtn.title = routeChoice ? '前進較慢、較少遇敵，寶箱・奇遇・營火較多' : '';
    }
    const riskyBtn = $('btn-explore-risky');
    if (riskyBtn) {
      riskyBtn.classList.toggle('hidden', !routeChoice);
      riskyBtn.classList.add('route-btn');
      riskyBtn.disabled = Boolean(explorePendingEvent);
      riskyBtn.innerHTML = routeLabel(`${pxIcon('sword')} 危險捷徑`, `+${EXPLORE_ROUTES.risky.pct}%・獎勵×${EXPLORE_ROUTES.risky.rewardMult}`);
      riskyBtn.title = '前進較快、大多會遇敵，戰鬥與寶箱獎勵提高';
    }

    if (!explorePendingEvent && eliteForUi) {
      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, 'boss');
      if ($('explore-event-title')) $('explore-event-title').textContent = `⚠️ 精英攔路：${eliteForUi.name}`;
      if ($('explore-event-desc')) $('explore-event-desc').textContent = '強大的魔物擋住了去路，擊敗牠才能繼續深入。';
      if ($('explore-event-choices')) $('explore-event-choices').innerHTML = '';
    } else if (!explorePendingEvent) {
      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, pct >= 100 ? 'boss' : 'step');
      if ($('explore-event-title')) {
        $('explore-event-title').textContent = pct >= 100
          ? (bossDefeated
              ? `🏆 ${boss ? boss.name : '區域首領'} 已臣服`
              : `⚠️ ${boss ? boss.name : '區域首領'} 盤踞深處`)
          : `${region.name}・荒野行軍`;
      }
      if ($('explore-event-desc')) {
        $('explore-event-desc').textContent = pct >= 100
          ? (bossDefeated
              ? '此地首領已被你擊退！可點擊「🔄 再戰首領」重溫決戰，或繼續巡邏蕩平殘餘魔物。'
              : '領域踏破率已達 100%，深處傳來震耳欲聾的咆哮！整備妥當後，點擊紅色按鈕迎戰區域首領。')
          : (region.desc || '選擇路線深入荒野：小路較安全，捷徑遇敵多但獎勵高。');
      }
      if ($('explore-event-choices')) $('explore-event-choices').innerHTML = '';
    }

    renderExploreTutorialBanner();
    renderExploreLog();
  }

  // routeKey: 'safe' | 'risky' (route buttons). Click events or anything else → 'normal'.
  // After 100% (patrol) the route no longer matters and 'normal' is always used.
  function handleExploreStep(routeKey) {
    if (explorePendingEvent) return;
    if (getTutorialStep() === 2) {
      setTutorialStep('done');
    }
    const region = getRegionById(state.progress.currentRegionId);
    if (!region) return;

    const prevPct = clamp(state.progress.regionExplore[region.id] || 0, 0, 100);
    const routeId = prevPct < 100 && typeof routeKey === 'string' && EXPLORE_ROUTES[routeKey] ? routeKey : 'normal';
    const route = EXPLORE_ROUTES[routeId];
    const nextPct = Math.min(100, prevPct + route.pct);

    // Mid-region elite gate: progress stops at EXPLORE_ELITE_AT until the elite is beaten
    // (fleeing / losing keeps it there, so the next step re-triggers the fight).
    // Old saves already past the gate (e.g. 75% from the 25%-step era) are not sent back.
    if (prevPct <= EXPLORE_ELITE_AT && nextPct >= EXPLORE_ELITE_AT && !isRegionEliteDefeated(region.id)) {
      const elite = createRegionElite(region.id);
      if (elite) {
        state.progress.regionExplore[region.id] = EXPLORE_ELITE_AT;
        exploreDryStreak = 0;
        autoSave();
        Sound.playSFX('boss_enter');
        addExploreLog(`⚠️ 精英魔物【${elite.name}】擋住了去路！`, 'battle');
        showToast(`⚠️ 精英【${elite.name}】攔路！擊敗牠才能繼續深入`, 'warning');
        startBattle(elite, { returnView: 'explore' });
        return;
      }
    }

    state.progress.regionExplore[region.id] = nextPct;
    autoSave();

    // Reaching 100% for the first time triggers Boss Awakening alert!
    if (prevPct < 100 && nextPct >= 100) {
      const boss = getRegionBoss(region.id);
      Sound.playSFX('boss_enter');
      addExploreLog(`🔥 探索度達到 100%！強大魔氣湧現——區域首領【${boss ? boss.name : 'Boss'}】現身了！`, 'battle');
      renderExplore();
      if ($('explore-visual')) $('explore-visual').innerHTML = Art.exploreVisual(region, 'boss');
      if ($('explore-event-title')) $('explore-event-title').textContent = `💀 區域首領現身：${boss ? boss.name : 'Boss'}`;
      if ($('explore-event-desc')) $('explore-event-desc').textContent = '深處的古老封印已鬆動！請點擊下方紅色「⚔️ 挑戰區域 Boss」按鈕展開首領對決！';
      showToast(`⚠️ 區域探索 100%！【${boss ? boss.name : '區域 Boss'}】已可挑戰！`, 'warning');
      return;
    }

    // Weighted random encounter. Battle chance depends on the route; a "dry streak" guard
    // turns the step after EXPLORE_MAX_DRY_STEPS fight-free steps into a fight. Non-battle
    // steps keep the original 18:15:12 split → chest 40% / event 33% / campfire 27%.
    const roll = Math.random();
    const sub = Math.random();
    if (roll < route.battleChance || exploreDryStreak >= EXPLORE_MAX_DRY_STEPS) {
      exploreDryStreak = 0;
      const normals = getRegionNormalEnemies(region.id);
      const enemy = normals[Math.floor(Math.random() * normals.length)];
      if (enemy) {
        addExploreLog(`⚔️ 遭遇野生魔物【${enemy.name}】！準備進行言霊對決！`, 'battle');
        startBattle(enemy, { returnView: 'explore', rewardMult: route.rewardMult, rewardLabel: routeId === 'risky' ? '危險捷徑' : '' });
      }
    } else if (sub < 0.40) {
      // Ancient Treasure Chest
      exploreDryStreak += 1;
      const diff = Number(region.difficulty || 1);
      const goldFound = Math.round((25 + diff * 18 + Math.floor(Math.random() * 20)) * route.rewardMult);
      const dropPool = ['con_herb', 'con_water', 'con_break_scroll', 'con_fever_charm'];
      const dropId = dropPool[Math.floor(Math.random() * dropPool.length)];
      const dropItem = getItemById(dropId);

      gainGold(goldFound);
      if (dropItem) addItem(dropItem.id, 1);
      Sound.playSFX('chest');
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
    } else if (sub < 0.73) {
      // Roadside Story Event
      exploreDryStreak += 1;
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
      // Campfire Rest
      exploreDryStreak += 1;
      const stats = getTotalStats();
      const healHp = Math.round(stats.maxHp * 0.5);
      const healMp = Math.round(stats.maxMp * 0.5);
      state.player.hp = Math.min(stats.maxHp, state.player.hp + healHp);
      state.player.mp = Math.min(stats.maxMp, state.player.mp + healMp);
      Sound.playSFX('heal');
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
    Sound.playSFX('click');
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

    Sound.playSFX(parts.length > 0 ? 'chest' : 'click');
    const summary = parts.length > 0 ? `（${parts.join('、')}）` : '';
    const outcomeText = `${choice.outcome || choice.resultText || '你做出了決定並繼續前行。'}${summary}`;

    addExploreLog(`🗿 ${ev.title || '奇遇'}：${outcomeText}`, 'story');
    autoSave();
    updateHUD();

    if ($('explore-event-desc')) $('explore-event-desc').textContent = outcomeText;
    if ($('explore-event-choices')) $('explore-event-choices').innerHTML = '';
    const stepBtn = $('btn-explore-step');
    if (stepBtn) stepBtn.disabled = false;
    const riskyBtn = $('btn-explore-risky');
    if (riskyBtn) riskyBtn.disabled = false;

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
