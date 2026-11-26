/**
 * 《言霊の旅》城鎮、NPC 對話、好感度、商店（js/town.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // ============================================================================
  // 11. Town Hub, Anti-Garble AVG Typewriter Dialogue, Affection & Shop Modal
  // ============================================================================
  function tokenizeHtmlForTypewriter(html) {
    const tokens = [];
    const str = String(html || '');
    let i = 0;
    while (i < str.length) {
      if (str[i] === '<') {
        // Keep entire <ruby>...</ruby> block (including <rt>...</rt>) indivisible
        if (/^<ruby\b/i.test(str.slice(i))) {
          const endRuby = str.toLowerCase().indexOf('</ruby>', i);
          if (endRuby !== -1) {
            tokens.push({ html: str.slice(i, endRuby + 7), visible: true });
            i = endRuby + 7;
            continue;
          }
        }
        const close = str.indexOf('>', i);
        if (close !== -1) {
          tokens.push({ html: str.slice(i, close + 1), visible: false });
          i = close + 1;
          continue;
        }
      }
      if (str[i] === '&') {
        const semi = str.indexOf(';', i);
        if (semi !== -1 && semi - i <= 10 && /^&[a-zA-Z0-9#]+;$/.test(str.slice(i, semi + 1))) {
          tokens.push({ html: str.slice(i, semi + 1), visible: true });
          i = semi + 1;
          continue;
        }
      }
      const cp = str.codePointAt(i);
      const ch = String.fromCodePoint(cp);
      tokens.push({ html: ch, visible: !/\s/.test(ch) });
      i += ch.length;
    }
    return tokens;
  }

  function typewriterSpeak(element, htmlText, speed = 30, onComplete = null) {
    if (element && element._typewriterTimer) {
      clearInterval(element._typewriterTimer);
      element._typewriterTimer = null;
    }
    if (!element) {
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    const fullHtml = String(htmlText || '');
    const tokens = tokenizeHtmlForTypewriter(fullHtml);
    if (tokens.length === 0) {
      element.innerHTML = '';
      if (typeof onComplete === 'function') onComplete();
      return null;
    }

    element.innerHTML = '';
    let acc = '';
    let idx = 0;
    let visibleStep = 0;
    const intervalMs = Math.max(8, Number(speed) || 30);

    const timerId = setInterval(() => {
      let emittedVisible = false;
      while (idx < tokens.length) {
        const tok = tokens[idx++];
        acc += tok.html;
        if (tok.visible) {
          emittedVisible = true;
          break;
        }
      }
      element.innerHTML = acc;

      if (emittedVisible) {
        if (visibleStep % 2 === 0) {
          Sound.playTypeTick();
        }
        visibleStep += 1;
      }

      if (idx >= tokens.length) {
        clearInterval(timerId);
        if (element._typewriterTimer === timerId) {
          element._typewriterTimer = null;
        }
        element.innerHTML = fullHtml;
        if (typeof onComplete === 'function') onComplete();
      }
    }, intervalMs);

    element._typewriterTimer = timerId;
    return timerId;
  }

  function setDialogueInteractiveLock(locked) {
    const isLocked = Boolean(locked);
    const portraitEl = $('dialogue-portrait');
    const speechBox = document.querySelector('#town-dialogue-panel .dialogue-speech-box');
    const choicesEl = $('dialogue-choices');
    const actionsEl = $('dialogue-actions');

    if (portraitEl) portraitEl.classList.toggle('is-talking', isLocked);
    if (speechBox) speechBox.classList.toggle('is-typing', isLocked);

    [choicesEl, actionsEl].forEach((container) => {
      if (!container) return;
      container.classList.toggle('is-locked', isLocked);
      container.querySelectorAll('button').forEach((btn) => {
        btn.disabled = isLocked;
      });
    });
  }

  function stopTypewriter() {
    if (townState.typingTimerId) {
      clearInterval(townState.typingTimerId);
      townState.typingTimerId = null;
    }
    const jpEl = $('dialogue-text-jp');
    const zhEl = $('dialogue-text-zh');
    if (jpEl && jpEl._typewriterTimer) {
      clearInterval(jpEl._typewriterTimer);
      jpEl._typewriterTimer = null;
    }
    if (zhEl && zhEl._typewriterTimer) {
      clearInterval(zhEl._typewriterTimer);
      zhEl._typewriterTimer = null;
    }
    townState.typingActive = false;
    setDialogueInteractiveLock(false);
  }

  function finishTownTypewriter() {
    stopTypewriter();
    const zhEl = $('dialogue-text-zh');
    if (zhEl) zhEl.innerHTML = townState.typingFullZh;
    const cursorEl = $('dialogue-next-cursor');
    if (cursorEl) cursorEl.classList.remove('hidden');
  }

  function completeTypewriterImmediately() {
    if (!townState.typingActive) return;
    stopTypewriter();
    const jpEl = $('dialogue-text-jp');
    const zhEl = $('dialogue-text-zh');
    if (jpEl) jpEl.innerHTML = townState.typingFullJp;
    if (zhEl) zhEl.innerHTML = townState.typingFullZh;
    const cursorEl = $('dialogue-next-cursor');
    if (cursorEl) cursorEl.classList.remove('hidden');
  }

  function runTypewriter(jpHtml, zhText) {
    stopTypewriter();
    resetZhPeekWrap($('dialogue-zh-peek-wrap'));

    const jpEl = $('dialogue-text-jp');
    const zhEl = $('dialogue-text-zh');
    const cursorEl = $('dialogue-next-cursor');

    townState.typingFullJp = jpHtml || '';
    townState.typingFullZh = zhText || '';
    townState.typingActive = true;

    if (jpEl) jpEl.innerHTML = '';
    if (zhEl) zhEl.innerHTML = '';
    if (cursorEl) cursorEl.classList.add('hidden');
    setDialogueInteractiveLock(true);

    if (townState.typingFullJp) {
      townState.typingTimerId = typewriterSpeak(jpEl, townState.typingFullJp, 30, () => {
        townState.typingTimerId = null;
        if (!townState.typingActive) return;
        finishTownTypewriter();
      });
    } else if (townState.typingFullZh) {
      townState.typingTimerId = typewriterSpeak(zhEl, townState.typingFullZh, 22, () => {
        townState.typingTimerId = null;
        if (!townState.typingActive) return;
        finishTownTypewriter();
      });
    } else {
      finishTownTypewriter();
    }
  }

  function renderTown() {
    renderObjectiveBar('town-objective');
    renderDailyTrainingPanel();
    const npcs = getNPCs();
    const grid = $('town-npc-grid');
    if (!grid) return;

    grid.innerHTML = npcs.map((npc) => {
      const nState = state.npc[npc.id] || { affection: 0 };
      const selected = townState.selectedNpcId === npc.id;
      return `
        <button type="button" class="npc-card ${selected ? 'selected' : ''}" data-npc-id="${escapeHtml(npc.id)}">
          <div class="npc-avatar">${Art.npc(npc.id, 'neutral')}</div>
          <div class="npc-card-info">
            <div class="npc-name">${escapeHtml(npc.name)}</div>
            <div class="npc-role">${escapeHtml(npc.title || npc.role || '')}</div>
            <div class="stat-bar affection-bar npc-card-affection">
              <div class="stat-bar-fill" style="width:${clamp(nState.affection, 0, 100)}%;"></div>
              <span class="stat-bar-text">♥ ${nState.affection}/100</span>
            </div>
          </div>
        </button>
      `;
    }).join('');

    grid.querySelectorAll('.npc-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const npcId = btn.getAttribute('data-npc-id');
        Sound.playSFX('click');
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

    const dialogues = getNpcDialoguesWithExpansion(npc);
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
      return '<button type="button" class="btn btn-gold" id="btn-npc-facility">🏪 商會與鍛造爐</button>';
    }
    if (npcId === 'scholar') {
      return '<button type="button" class="btn btn-primary" id="btn-npc-facility">📚 閱讀副本</button>';
    }
    if (npcId === 'priest') {
      return '<button type="button" class="btn btn-gold" id="btn-npc-facility">⛩️ 試煉神殿</button>';
    }
    if (npcId === 'mayor') {
      return '<button type="button" class="btn btn-primary" id="btn-npc-facility">📜 冒險任務</button>';
    }
    return '';
  }

  function bindNpcFacilityButton(npcId) {
    const btn = $('btn-npc-facility');
    if (!btn) return;
    btn.onclick = () => {
      Sound.playSFX('click');
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
    if ($('dialogue-register-tag')) {
      $('dialogue-register-tag').textContent = NPC_REGISTER_LABELS[npc.id] || NPC_REGISTER_LABELS.default;
    }
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

    const choicesEl = $('dialogue-choices');
    const actionsEl = $('dialogue-actions');

    if (choicesEl) {
      if (dlg && !townState.awaitingNext && Array.isArray(dlg.choices) && dlg.choices.length > 0) {
        choicesEl.innerHTML = dlg.choices.map((ch, idx) => `
          <button type="button" class="dialogue-choice-btn" data-choice-idx="${idx}">
            <div class="jp-text">${ch.jp || ch.text || ''}</div>
            ${ch.zh ? `<div class="text-muted zh-collapsible dialogue-choice-zh" style="font-size:0.84rem;margin-top:3px;">${escapeHtml(ch.zh)}</div>` : ''}
          </button>
        `).join('');
        choicesEl.querySelectorAll('.dialogue-choice-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            if (townState.typingActive) return;
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
        ? '<button type="button" class="btn btn-secondary" id="btn-dialogue-next">💬 繼續寒暄</button>'
        : '';
      actionsEl.innerHTML = `${nextBtnHtml}${renderNpcFacilityButton(npc.id)}`;
      const nextBtn = $('btn-dialogue-next');
      if (nextBtn) {
        nextBtn.onclick = () => {
          if (townState.typingActive) return;
          Sound.playSFX('click');
          const dialogues = getNpcDialoguesWithExpansion(npc);
          townState.dialogueIndex = (townState.dialogueIndex + 1) % Math.max(1, dialogues.length);
          townState.currentDialogue = dialogues[townState.dialogueIndex] || null;
          townState.awaitingNext = false;
          renderTownDialoguePanel(true);
        };
      }
      bindNpcFacilityButton(npc.id);
    }

    if (animateText && dlg) {
      const lineJp = dlg.npcLineJp || dlg.jp || dlg.text || npc.greetingJp || '';
      const lineZh = dlg.npcLineZh || dlg.zh || dlg.translation || npc.greeting || '';
      townState.currentTts = dlg.tts || stripRubyHtml(lineJp);
      if ($('dialogue-feedback')) $('dialogue-feedback').innerHTML = '';
      runTypewriter(lineJp, lineZh);
    } else {
      setDialogueInteractiveLock(townState.typingActive);
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
    getDailyProgress().npc_talk += 1;

    const emotion = choice.replyEmotion || (baseDelta >= 10 ? 'happy' : baseDelta <= 0 ? 'surprised' : 'serious');
    townState.awaitingNext = true;

    const replyJp = choice.replyJp || choice.reply || '';
    const replyZh = choice.replyZh || choice.replyTranslation || '';
    townState.currentTts = choice.replyTts || stripRubyHtml(replyJp);

    if (baseDelta > 0) Sound.playSFX('correct');
    else Sound.playSFX('click');

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
        Sound.playSFX('levelup');
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

  let lastPurchasedGearId = null;

  function renderShopModal() {
    const stats = getTotalStats();
    const banner = $('shop-discount-banner');
    if (banner) {
      const quickGear = lastPurchasedGearId ? getItemById(lastPurchasedGearId) : null;
      const showQuickEquip = quickGear && ['weapon', 'armor', 'accessory'].includes(quickGear.type) && getItemQty(quickGear.id) > 0 && !isItemEquipped(quickGear.id);
      banner.innerHTML = `
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;">
          <span>🪙 持有金幣：<strong class="text-gold">${state.player.gold}</strong></span>
          <span>
            ✨ 商會折扣：<strong class="text-emerald">-${stats.totalShopDiscount}%</strong>
            <span class="text-muted" style="font-size:0.84rem;">（魅力 CHA -${stats.chaShopDiscount}% + 言靈交涉 -${stats.skillShopDiscount}%）</span>
          </span>
        </div>
        ${showQuickEquip ? `
          <div class="shop-quick-equip-bar">
            <span>🆕 剛購入裝備：<strong>${escapeHtml(quickGear.name)}</strong></span>
            <button type="button" class="btn btn-sm btn-gold" id="btn-shop-quick-equip">⚔️ 立即裝備</button>
          </div>
        ` : ''}
      `;
      const qBtn = $('btn-shop-quick-equip');
      if (qBtn && showQuickEquip) {
        qBtn.addEventListener('click', () => {
          equipItem(quickGear.id);
          lastPurchasedGearId = null;
          renderShopModal();
        });
      }
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
          const isGear = ['weapon', 'armor', 'accessory'].includes(item.type);
          const invQty = getItemQty(item.id);
          const equipped = isItemEquipped(item.id);
          const owned = invQty + (equipped ? 1 : 0);
          const statBadges = renderItemStatTags(item, 0);
          const canAfford = state.player.gold >= finalPrice;
          return `
            <div class="panel-card" style="padding:14px;display:flex;flex-direction:column;gap:8px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;flex-shrink:0;">${Art.itemIcon(item)}</div>
                <div style="flex:1;">
                  <div style="font-weight:700;">${escapeHtml(item.name)}</div>
                  <div style="display:flex;gap:6px;align-items:center;margin-top:2px;flex-wrap:wrap;">
                    <span class="rarity-badge rarity-${item.rarity || 'common'}">${RARITY_LABELS[item.rarity] || '普通'}</span>
                    <span class="text-muted" style="font-size:0.78rem;">持有：${owned}</span>
                    ${equipped ? '<span class="badge badge-gold">裝備中</span>' : ''}
                  </div>
                </div>
              </div>
              <div style="font-size:0.84rem;" class="text-muted">${escapeHtml(item.desc || item.description || '')}</div>
              ${statBadges ? `<div style="display:flex;flex-wrap:wrap;gap:6px;">${statBadges}</div>` : ''}
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:auto;padding-top:6px;flex-wrap:wrap;">
                <div>
                  ${finalPrice < basePrice ? `<span class="text-muted" style="text-decoration:line-through;font-size:0.8rem;margin-right:6px;">${basePrice}</span>` : ''}
                  <strong class="text-gold">🪙 ${finalPrice}</strong>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                  ${isGear && invQty > 0 && !equipped ? `<button type="button" class="btn btn-sm btn-primary" data-quick-equip-id="${escapeHtml(item.id)}">⚔️ 立即裝備</button>` : ''}
                  <button type="button" class="btn btn-sm ${canAfford ? 'btn-gold' : 'btn-secondary'}" data-buy-id="${escapeHtml(item.id)}" ${canAfford ? '' : 'disabled'}>購買</button>
                </div>
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
            showToast('🪙 盤纏不足，無法結算！', 'error');
            return;
          }
          state.player.gold -= cost;
          addItem(item.id, 1);
          if (['weapon', 'armor', 'accessory'].includes(item.type)) {
            lastPurchasedGearId = item.id;
          }
          Sound.playSFX('chest');
          showToast(`🛒 購得武具【${item.name}】（-${cost} 金幣）`, 'success');
          autoSave();
          updateHUD();
          renderShopModal();
        });
      });

      content.querySelectorAll('[data-quick-equip-id]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-quick-equip-id');
          if (!id) return;
          equipItem(id);
          if (lastPurchasedGearId === id) lastPurchasedGearId = null;
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
            showToast('🪙 金幣不足，鍛造爐無法開火！', 'error');
            return;
          }
          state.player.gold -= cost;
          state.player.enhancements[id] = lv + 1;
          state.stats.enhanceCount += 1;
          Sound.playSFX('levelup');
          showToast(`⚒️ 言靈淬鍊成功！【${item.name}】提升至 +${lv + 1}！`, 'gold');
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
          Sound.playSFX('click');
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
