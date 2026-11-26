/**
 * 《言霊の旅》角色、技能樹、背包、任務、圖鑑（js/menus.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

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
        Sound.playSFX('click');
      };
    }
    if ($('char-identity')) {
      const titleFlavor = getTitleFlavorText(p.activeTitle);
      $('char-identity').innerHTML = `
        <h3 style="margin:0;color:var(--gold-bright);">${escapeHtml(p.name)}</h3>
        <div class="text-cyan" style="font-size:0.9rem;margin:4px 0;">${escapeHtml(job.name)}・Lv.${p.level}</div>
        <div class="text-muted" style="font-size:0.82rem;">EXP ${p.exp} / ${p.nextExp}</div>
        <div class="text-gold" style="font-size:0.78rem;margin-top:6px;line-height:1.45;font-style:italic;">${escapeHtml(titleFlavor)}</div>
      `;
    }

    const jobSwitcherEl = $('char-job-switcher');
    if (jobSwitcherEl) {
      const jobs = getJobs();
      jobSwitcherEl.innerHTML = jobs.map((j) => {
        const active = j.id === p.jobId;
        const preview = getExpectedJobStatsAtLevel(j, p.level);
        return `
          <button type="button" class="char-job-option ${active ? 'active' : ''}" data-switch-job="${escapeHtml(j.id)}" aria-pressed="${active ? 'true' : 'false'}">
            <div class="char-job-option-art">${Art.hero(j.id, active ? 'victory' : 'idle')}</div>
            <div class="char-job-option-meta">
              <div class="char-job-option-name">${escapeHtml(j.name)}</div>
              <div class="char-job-option-focus">${escapeHtml(j.focus || j.title || '')}</div>
              <div class="text-cyan" style="font-size:0.7rem;margin-top:2px;">INT ${preview.baseINT} · WIS ${preview.baseWIS} · CHA ${preview.baseCHA}</div>
            </div>
            <span class="char-job-option-badge">${active ? '✔ 使用中' : '切換'}</span>
          </button>
        `;
      }).join('');

      jobSwitcherEl.querySelectorAll('[data-switch-job]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const jid = btn.getAttribute('data-switch-job');
          if (!jid || jid === state.player.jobId) return;
          switchPlayerJob(jid);
        });
      });
    }

    const titleSelect = $('char-title-select');
    if (titleSelect) {
      titleSelect.innerHTML = p.unlockedTitles.map((t) =>
        `<option value="${escapeHtml(t)}" ${t === p.activeTitle ? 'selected' : ''}>${escapeHtml(t)}</option>`
      ).join('');
      titleSelect.onchange = () => {
        state.player.activeTitle = titleSelect.value;
        Sound.playSFX('click');
        autoSave();
        updateHUD();
        renderCharacter();
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
        // Damage no longer scales with INT (fixed answers per battle); INT drives crit rate
        { label: '暴擊率', val: `${stats.critRate}%`, sub: `每場至少答對 ${Math.ceil(BATTLE_HITS_NORMAL / BATTLE_PERFORMANCE_CAP)} 題（Boss ${Math.ceil(BATTLE_HITS_BOSS / BATTLE_PERFORMANCE_CAP)} 題）` },
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
        Sound.playSFX('levelup');
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
        Sound.playSFX('click');
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
      const enhBtnHtml = lv < 5
        ? `<button type="button" class="btn btn-primary btn-block" id="btn-inv-enhance" style="margin-top:8px;">⚒️ 鍛造強化至 +${lv + 1}（🪙 ${getEnhanceCost(item, lv)}）</button>`
        : `<div class="badge badge-gold" style="margin-top:8px;justify-content:center;width:100%;">✨ 已達最高強化 +5</div>`;
      actionBtns = card.equipped
        ? `<button type="button" class="btn btn-secondary btn-block" id="btn-inv-unequip">卸下裝備</button>${enhBtnHtml}`
        : `<button type="button" class="btn btn-gold btn-block" id="btn-inv-equip">⚔️ 穿戴裝備</button>${enhBtnHtml}
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
    const enhBtn = $('btn-inv-enhance');
    if (enhBtn) {
      enhBtn.onclick = () => {
        const curLv = getItemEnhancementLevel(item.id);
        if (curLv >= 5) return;
        const cost = getEnhanceCost(item, curLv);
        if (state.player.gold < cost) {
          showToast(`金幣不足（需要 ${cost} 金幣）！`, 'error');
          return;
        }
        state.player.gold -= cost;
        state.player.enhancements[item.id] = curLv + 1;
        state.stats.enhanceCount += 1;
        Sound.playSFX('levelup');
        showToast(`⚒️ 鍛造成功！【${item.name}】提升至 +${curLv + 1}！`, 'gold');
        checkAchievements();
        autoSave();
        updateHUD();
        renderInventory();
      };
    }
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
          Sound.playSFX('heal');
          showToast(`💚 使用【${item.name}】，回復 +${val} HP！`, 'success');
        } else {
          const val = eff.healMpPct
            ? Math.max(8, Math.round((stats.maxMp * Number(eff.healMpPct)) / 100))
            : Number(eff.value || Math.round(stats.maxMp * 0.5));
          state.player.mp = Math.min(stats.maxMp, state.player.mp + val);
          Sound.playSFX('skill');
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
        Sound.playSFX('click');
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
    ensureDailyQuestsFresh();
    renderDailyTrainingPanel();
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
      if (finalExp) rewParts.push(`${pxIcon('star')} ${finalExp} EXP`);
      if (finalGold) rewParts.push(`${pxIcon('coin')} ${finalGold} 金幣`);
      if (rew.sp) rewParts.push(`${pxIcon('sparkle')} ${rew.sp} SP`);
      if (rew.itemId) {
        const it = getItemById(rew.itemId);
        rewParts.push(`🎁 ${it ? it.name : rew.itemId}`);
      }
      if (rew.title) rewParts.push(`👑 稱號「${rew.title}」`);

      // 「前往」 only on unfinished quests that map to a place (see getQuestDestination)
      const dest = !claimed && !prog.done ? getQuestDestination(q) : null;
      const goBtn = dest
        ? `<button type="button" class="btn btn-sm ${dest.locked ? 'btn-secondary' : 'btn-primary'} quest-go-btn" data-go-quest="${escapeHtml(q.id)}">${pxIcon(dest.icon)} ${escapeHtml(dest.label)}</button>`
        : '';

      return `
        <div class="quest-card panel-card ${claimed ? 'quest-completed' : ready ? 'quest-ready' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;flex-wrap:wrap;">
            <div>
              <h3 style="margin:0 0 4px;color:var(--gold-bright);">${escapeHtml(q.title || q.name)}</h3>
              <p class="text-muted" style="font-size:0.88rem;margin:0;">${escapeHtml(q.desc || q.description || '')}</p>
            </div>
            <div class="quest-card-actions">
              ${claimed
                ? '<span class="badge badge-emerald">✔ 已領取</span>'
                : ready
                  ? `<button type="button" class="btn btn-gold btn-sm" data-claim-quest="${escapeHtml(q.id)}">🎁 領取報酬</button>`
                  : `<span class="badge">${prog.current} / ${prog.target}</span>${goBtn}`
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
    listEl.querySelectorAll('[data-go-quest]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const q = getQuests().find((x) => x.id === btn.getAttribute('data-go-quest'));
        goToQuestDestination(getQuestDestination(q));
      });
    });
  }

  function claimQuestReward(questId) {
    ensureDailyQuestsFresh();
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
      grantTitle(rew.title, { silent: true });
      parts.push(`👑 ${rew.title}`);
    }

    Sound.playSFX('levelup');
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
    const unlocked = [];
    let totalGold = 0;
    let totalExp = 0;
    let totalSp = 0;
    const newTitles = [];

    list.forEach((ach) => {
      if (state.achievements.includes(ach.id)) return;
      const prog = evaluateGoalProgress(ach);
      if (!prog.done) return;

      state.achievements.push(ach.id);
      unlocked.push(ach);
      const rew = ach.rewards || ach.reward || {};
      if (rew.gold) totalGold += gainGold(rew.gold);
      if (rew.exp) totalExp += Math.max(0, Math.floor(Number(rew.exp) || 0));
      if (rew.sp) {
        const spAdd = Math.max(0, Math.floor(Number(rew.sp) || 0));
        state.player.sp += spAdd;
        totalSp += spAdd;
      }
      if (rew.title && grantTitle(rew.title, { silent: true })) {
        newTitles.push(rew.title);
      }
    });

    if (unlocked.length === 0) return;

    if (totalExp > 0) gainExp(totalExp);
    Sound.playSFX('levelup');

    const notes = [];
    if (totalGold > 0) notes.push(`🪙 +${totalGold}`);
    if (totalExp > 0) notes.push(`⭐ +${totalExp} EXP`);
    if (totalSp > 0) notes.push(`✨ +${totalSp} SP`);
    if (newTitles.length === 1) notes.push(`👑 稱號「${newTitles[0]}」`);
    else if (newTitles.length > 1) notes.push(`👑 稱號 ×${newTitles.length}`);

    const rewardSuffix = notes.length ? `（${notes.join('、')}）` : '';
    if (unlocked.length === 1) {
      const ach = unlocked[0];
      showToast(`🏆 成就解鎖：【${ach.title || ach.name}】${rewardSuffix}`, 'achievement');
    } else {
      const names = unlocked.slice(0, 2).map((a) => `【${a.title || a.name}】`).join('、');
      const more = unlocked.length > 2 ? ` 等 ${unlocked.length} 項` : '';
      showToast(`🏆 連解 ${unlocked.length} 項成就：${names}${more}${rewardSuffix}`, 'achievement');
    }

    autoSave();
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
                  <button type="button" class="btn btn-sm btn-audio" data-mistake-tts="${escapeHtml(q.id)}" data-rate="1.0">${pxIcon('speaker')} 朗讀</button>
                  <button type="button" class="btn btn-sm btn-audio" data-mistake-tts="${escapeHtml(q.id)}" data-rate="0.65">${pxIcon('turtle')} 慢速</button>
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
          Sound.speak(q.tts || stripRubyHtml(q.fullRubyJp), Number(btn.getAttribute('data-rate')) || 1.0);
        });
      });

      contentEl.querySelectorAll('[data-master-q]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qid = btn.getAttribute('data-master-q');
          state.mistakes = state.mistakes.filter((m) => m.questionId !== qid);
          Sound.playSFX('correct');
          showToast('✔ 已從錯題筆記移出！', 'success');
          autoSave();
          renderCodex();
        });
      });
    }
  }

  // ============================================================================
  // 16B. Dedicated Mistake Notebook View & Revenge Training (#view-notes)
  // ============================================================================
  function removeWrongNote(noteId) {
    const notes = ensureWrongNotesMap();
    if (!notes[noteId]) return;
    delete notes[noteId];
    state.mistakes = state.mistakes.filter((m) => m.questionId !== noteId);
    updateNavMistakeBadge();
    autoSave();
    renderNotes();
    showToast('🗑️ 已從錯題筆記移除該題。', 'info');
  }

  function clearMasteredWrongNotes() {
    const notes = ensureWrongNotesMap();
    const masteredIds = Object.keys(notes).filter((id) => notes[id] && notes[id].mastered);
    if (masteredIds.length === 0) {
      showToast('目前沒有可清除的已攻克題目。', 'info');
      return;
    }
    masteredIds.forEach((id) => {
      delete notes[id];
    });
    const removedSet = new Set(masteredIds);
    state.mistakes = state.mistakes.filter((m) => !removedSet.has(m.questionId));
    Sound.playSFX('confirm');
    updateNavMistakeBadge();
    autoSave();
    renderNotes();
    showToast(`🧹 已清除 ${masteredIds.length} 題已攻克的錯題紀錄！`, 'success');
  }

  function startWrongNoteBattle(mode = 'due') {
    const trainMode = mode === 'all' ? 'all' : 'due';
    const notes = ensureWrongNotesMap();
    const nowMs = Date.now();
    const targetIds = Object.values(notes)
      .filter((entry) => {
        if (!entry || entry.mastered || !resolveWrongNoteQuestion(entry.id)) return false;
        return trainMode === 'all' ? true : isWrongNoteDue(entry, nowMs);
      })
      .map((entry) => entry.id);

    if (targetIds.length === 0) {
      if (trainMode === 'due') {
        showToast('🎉 今日到期錯題已全數複習完畢！若想提前預習，可點擊「🔁 提前全量特訓」。', 'info');
      } else {
        showToast('🎉 目前沒有待複習的未攻克錯題！', 'info');
      }
      return;
    }

    const queue = shuffleArray(targetIds);
    const totalHp = Math.max(80, queue.length * 100);
    const phantomEnemy = {
      id: 'memory_phantom',
      name: trainMode === 'due' ? '記憶の幻影・今日到期復習試煉' : '記憶の幻影・全量特訓試煉',
      regionId: state.progress.currentRegionId || 'r1',
      isBoss: false,
      weakness: 'vocab',
      weaknessLabel: trainMode === 'due' ? '今日到期錯題專攻' : '未掌握錯題全量特訓',
      hp: totalHp,
      maxHp: totalHp,
      breakMax: 2,
      atk: 16,
      exp: 20,
      gold: 15,
      introLine: {
        jp: '記憶の迷霧から過去の過ちが具現化した……今こそ克服の時だ！',
        zh: '昔日答錯的記憶殘影凝聚成形……現在正是徹底攻克它的時刻！'
      },
      hitLine: {
        jp: 'ぐっ……その言霊を完全に思い出したというのか！',
        zh: '唔……你竟然已經徹底記起這道言靈的真義了嗎！'
      },
      breakLine: {
        jp: '記憶の鎖が砕け散った！',
        zh: '困擾你的記憶枷鎖徹底粉碎了！'
      }
    };

    Sound.playSFX('confirm');
    startBattle(phantomEnemy, {
      returnView: 'notes',
      isWrongNoteTraining: true,
      trainingMode: trainMode,
      trainingQueue: queue
    });
  }

  function renderNotes() {
    const summary = getWrongNotesSummary();
    updateNavMistakeBadge();

    const trainBtn = $('btn-start-wrong-training');
    if (trainBtn) {
      trainBtn.disabled = summary.dueCount < 1;
      trainBtn.textContent = `⚔️ 今日到期特訓 (${summary.dueCount})`;
    }
    const trainAllBtn = $('btn-start-wrong-training-all');
    if (trainAllBtn) {
      trainAllBtn.disabled = summary.unmastered < 1;
      trainAllBtn.textContent = summary.unmastered > 0
        ? `🔁 全量特訓 (${summary.unmastered})`
        : '🔁 全量特訓';
    }
    const clearBtn = $('btn-clear-mastered-notes');
    if (clearBtn) {
      clearBtn.disabled = summary.mastered < 1;
      clearBtn.textContent = summary.mastered > 0
        ? `🧹 清除已掌握 (${summary.mastered})`
        : '🧹 清除已掌握';
    }

    const summaryEl = $('notes-summary-bar');
    if (summaryEl) {
      summaryEl.innerHTML = `
        <div class="notes-stats-row">
          <span class="notes-stat-pill">📚 累計收錄：<b>${summary.total}</b></span>
          <span class="notes-stat-pill pending">🔥 今日到期：<b>${summary.dueCount}</b></span>
          <span class="notes-stat-pill">📅 排程中：<b>${summary.unmastered}</b></span>
          <span class="notes-stat-pill mastered">✅ 已刻印：<b>${summary.mastered}</b></span>
        </div>
        <div class="text-muted" style="font-size:0.82rem;">依艾賓浩斯曲線排程（+1 → +3 → +7 天 → Lv.4 刻印完成）；答錯即重置回 Lv.0。</div>
      `;
    }

    const filterEl = $('notes-filter-bar');
    if (filterEl) {
      const jlptOpts = [
        { val: 'all', label: '全部難度' },
        { val: 'N4', label: 'N4' },
        { val: 'N3', label: 'N3' },
        { val: 'N2', label: 'N2' },
        { val: 'N1', label: 'N1' }
      ];
      const typeOpts = [
        { val: 'all', label: '全部題型' },
        { val: 'reading', label: '讀音' },
        { val: 'particle', label: '助詞' },
        { val: 'conjugation', label: '活用' },
        { val: 'reorder', label: '重組' },
        { val: 'reading_comp', label: '閱讀' }
      ];
      const statusOpts = [
        { val: 'all', label: '顯示全部' },
        { val: 'unmastered', label: '僅看未攻克' }
      ];

      filterEl.innerHTML = `
        <div class="notes-filter-group">
          <span class="notes-filter-label">難度：</span>
          ${jlptOpts.map((o) => `<button type="button" class="notes-filter-btn ${uiNotesFilter.jlpt === o.val ? 'active' : ''}" data-note-filter="jlpt" data-val="${o.val}">${o.label}</button>`).join('')}
        </div>
        <div class="notes-filter-group">
          <span class="notes-filter-label">題型：</span>
          ${typeOpts.map((o) => `<button type="button" class="notes-filter-btn ${uiNotesFilter.type === o.val ? 'active' : ''}" data-note-filter="type" data-val="${o.val}">${o.label}</button>`).join('')}
        </div>
        <div class="notes-filter-group">
          <span class="notes-filter-label">狀態：</span>
          ${statusOpts.map((o) => `<button type="button" class="notes-filter-btn ${uiNotesFilter.status === o.val ? 'active' : ''}" data-note-filter="status" data-val="${o.val}">${o.label}</button>`).join('')}
        </div>
      `;

      filterEl.querySelectorAll('[data-note-filter]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const group = btn.getAttribute('data-note-filter');
          const val = btn.getAttribute('data-val');
          if (!group || !val) return;
          Sound.playSFX('click');
          uiNotesFilter[group] = val;
          renderNotes();
        });
      });
    }

    const listEl = $('notes-list-container');
    if (!listEl) return;

    if (summary.total === 0) {
      listEl.innerHTML = `
        <div class="panel-card notes-empty-card">
          <div class="notes-empty-icon">📓✨</div>
          <h3 style="margin:0;color:var(--gold-bright);">錯題筆記本目前空空如也！</h3>
          <p class="text-muted" style="max-width:480px;margin:0;">
            你在一般戰鬥、Boss 戰或長文閱讀副本中只要答錯任何題目，系統就會自動將它收錄到這裡，並記錄錯誤選項與完整文法剖析。
          </p>
          <button type="button" class="btn btn-gold" id="btn-notes-go-battle">🗺️ 前往區域戰鬥挑戰</button>
        </div>
      `;
      const goBtn = $('btn-notes-go-battle');
      if (goBtn) goBtn.addEventListener('click', () => { Sound.playSFX('click'); switchView('map'); });
      return;
    }

    const resolvedItems = summary.entries
      .map((entry) => {
        const resolved = resolveWrongNoteQuestion(entry.id);
        return resolved ? { entry, resolved } : null;
      })
      .filter(Boolean)
      .filter(({ entry, resolved }) => {
        const q = resolved.q;
        if (uiNotesFilter.jlpt !== 'all' && q.jlpt !== uiNotesFilter.jlpt) return false;
        if (uiNotesFilter.type !== 'all' && getWrongNoteCategory(q) !== uiNotesFilter.type) return false;
        if (uiNotesFilter.status === 'unmastered' && entry.mastered) return false;
        return true;
      })
      .sort((a, b) => {
        if (Boolean(a.entry.mastered) !== Boolean(b.entry.mastered)) {
          return a.entry.mastered ? 1 : -1;
        }
        const aDue = isWrongNoteDue(a.entry) ? 0 : 1;
        const bDue = isWrongNoteDue(b.entry) ? 0 : 1;
        if (aDue !== bDue) return aDue - bDue;
        return String(b.entry.lastWrongAt || '').localeCompare(String(a.entry.lastWrongAt || ''));
      });

    if (resolvedItems.length === 0) {
      listEl.innerHTML = `
        <div class="panel-card notes-empty-card">
          <div class="notes-empty-icon">🔍</div>
          <h3 style="margin:0;color:var(--gold-bright);">目前篩選條件下沒有符合的錯題</h3>
          <p class="text-muted" style="margin:0;">你可以重設篩選條件檢視全部錯題，或前往區域繼續冒險！</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;">
            <button type="button" class="btn btn-secondary" id="btn-notes-reset-filter">↺ 顯示全部錯題</button>
            <button type="button" class="btn btn-gold" id="btn-notes-go-battle">🗺️ 前往區域戰鬥挑戰</button>
          </div>
        </div>
      `;
      const resetBtn = $('btn-notes-reset-filter');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          Sound.playSFX('click');
          uiNotesFilter = { jlpt: 'all', type: 'all', status: 'all' };
          renderNotes();
        });
      }
      const goBtn = $('btn-notes-go-battle');
      if (goBtn) goBtn.addEventListener('click', () => { Sound.playSFX('click'); switchView('map'); });
      return;
    }

    const typeLabelMap = {
      reading: '讀音',
      particle: '助詞',
      conjugation: '活用',
      reorder: '重組',
      reading_comp: '閱讀'
    };

    listEl.innerHTML = resolvedItems.map(({ entry, resolved }) => {
      const q = resolved.q;
      const cat = getWrongNoteCategory(q);
      const catBadge = q.typeLabel || typeLabelMap[cat] || '綜合';
      const hasTts = Boolean(q.tts || (q.fullRubyJp && resolved.source === 'battle'));
      const chosenIdx = entry.playerLastChoice;
      let wrongChoiceHtml = '<span class="text-muted">（未記錄選項或重組誤排）</span>';
      if (typeof chosenIdx === 'number' && chosenIdx >= 0 && Array.isArray(q.options) && q.options[chosenIdx] !== undefined) {
        wrongChoiceHtml = `<span class="jp-text">${q.options[chosenIdx]}</span>`;
      } else if (typeof chosenIdx === 'string' && chosenIdx) {
        wrongChoiceHtml = `<span class="jp-text">${escapeHtml(chosenIdx)}</span>`;
      }

      const rightOptionHtml = Array.isArray(q.options) && q.options[q.answerIndex] !== undefined
        ? `<span class="jp-text">${q.options[q.answerIndex]}</span>`
        : `<span class="jp-text">${q.correctDisplay || ''}</span>`;

      const timeStr = entry.lastWrongAt ? formatTimestamp(entry.lastWrongAt) : '';
      const nowMs = Date.now();
      let srsBadgeHtml = '';
      if (entry.mastered) {
        srsBadgeHtml = '<span class="badge badge-emerald">✅ 已完全刻印</span>';
      } else if (isWrongNoteDue(entry, nowMs)) {
        srsBadgeHtml = `<span class="badge badge-srs-due">🔥 今日到期・Lv.${entry.srsLevel || 0}</span>`;
      } else {
        const daysLeft = Math.max(1, Math.ceil((Number(entry.nextReviewAt) - nowMs) / DAY_MS));
        srsBadgeHtml = `<span class="badge badge-srs-scheduled">📅 Lv.${entry.srsLevel || 1}・${daysLeft}天後</span>`;
      }

      return `
        <article class="mistake-note-card ${entry.mastered ? 'is-mastered' : ''}" data-note-id="${escapeHtml(entry.id)}">
          <div class="mistake-note-top">
            <div class="mistake-note-badges">
              <span class="jlpt-badge">${escapeHtml(q.jlpt)}</span>
              <span class="badge">${escapeHtml(catBadge)}</span>
              <span class="badge badge-crimson">錯 ${entry.wrongCount} 次</span>
              ${srsBadgeHtml}
              ${timeStr ? `<span class="text-muted" style="font-size:0.74rem;">最近：${escapeHtml(timeStr)}</span>` : ''}
            </div>
            <div class="mistake-note-actions">
              ${hasTts ? `
                <button type="button" class="btn btn-sm btn-audio" data-note-tts="${escapeHtml(entry.id)}" data-rate="1.0">${pxIcon('speaker')} 朗讀</button>
                <button type="button" class="btn btn-sm btn-audio" data-note-tts="${escapeHtml(entry.id)}" data-rate="0.65">${pxIcon('turtle')} 慢速</button>
              ` : ''}
              <button type="button" class="btn btn-sm btn-secondary" data-note-remove="${escapeHtml(entry.id)}">🗑️ 移出</button>
            </div>
          </div>

          <div class="mistake-note-stem">
            <div class="zh-peek-wrap">
              <button type="button" class="btn-peek-zh">${pxIcon('eye')} 偷看中譯</button>
              <div class="text-muted zh-collapsible" style="font-size:0.84rem;margin-bottom:6px;">${q.promptZh || ''}</div>
            </div>
            <div class="jp-text" style="font-size:1.12rem;line-height:1.8;">${q.promptJp || q.fullRubyJp || ''}</div>
          </div>

          <div class="mistake-choice-compare">
            <div class="mistake-choice-box mistake-choice-wrong">
              <div style="font-size:0.76rem;font-weight:700;margin-bottom:2px;">✘ 上次誤選</div>
              <div>${wrongChoiceHtml}</div>
            </div>
            <div class="mistake-choice-box mistake-choice-correct">
              <div style="font-size:0.76rem;font-weight:700;margin-bottom:2px;">✔ 正確言靈</div>
              <div>${rightOptionHtml}${q.kanaReading ? ` <span style="opacity:0.88;">（${escapeHtml(q.kanaReading)}）</span>` : ''}</div>
            </div>
          </div>

          <div class="zh-peek-wrap">
            <button type="button" class="btn-peek-zh">${pxIcon('eye')} 偷看中譯</button>
            <div class="mistake-note-explain zh-collapsible">
              ${q.wrongReason ? `<div style="margin-bottom:4px;"><strong class="text-gold">為什麼錯：</strong>${q.wrongReason}</div>` : ''}
              <div><strong class="text-cyan">重點解說：</strong>${q.explanation || ''}</div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    listEl.querySelectorAll('[data-note-tts]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = resolveWrongNoteQuestion(btn.getAttribute('data-note-tts'));
        if (!res) return;
        const q = res.q;
        const rate = Number(btn.getAttribute('data-rate')) || 1.0;
        const text = q.tts || stripRubyHtml(q.fullRubyJp || q.promptJp);
        if (text) Sound.speak(text, rate);
      });
    });

    listEl.querySelectorAll('[data-note-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nid = btn.getAttribute('data-note-remove');
        Sound.playSFX('click');
        removeWrongNote(nid);
      });
    });
  }
