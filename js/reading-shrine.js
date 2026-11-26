/**
 * 《言霊の旅》閱讀副本與試煉神殿（js/reading-shrine.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

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
    const jlptOrder = { N4: 1, N3: 2, N2: 3, N1: 4 };
    const dungeons = getReadingDungeons().slice().sort((a, b) => {
      const aUnl = isReadingUnlocked(a) ? 0 : 1;
      const bUnl = isReadingUnlocked(b) ? 0 : 1;
      if (aUnl !== bUnl) return aUnl - bUnl;
      const aLv = jlptOrder[normalizeJlptLevel(a.jlpt)] || 9;
      const bLv = jlptOrder[normalizeJlptLevel(b.jlpt)] || 9;
      if (aLv !== bLv) return aLv - bLv;
      return String(a.id).localeCompare(String(b.id));
    });

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
        Sound.playSFX('confirm');
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
              <button type="button" class="btn btn-sm btn-audio" data-para-tts="${idx}" data-rate="1.0">${pxIcon('speaker')} 朗讀</button>
              <button type="button" class="btn btn-sm btn-audio" data-para-tts="${idx}" data-rate="0.65">${pxIcon('turtle')} 慢速</button>
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
          Sound.speak(text, rate);
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
          const noteId = `${rd.id}_q${reading.qIdx}`;
          if (isCorrect) {
            reading.correctCount += 1;
            state.stats.totalCorrect += 1;
            getDailyProgress().correct_answers += 1;
            recordDailyTrainingProgress('correct', 1);
            const rdSrs = advanceWrongNoteSRS(noteId, true, { requireDue: true });
            if (rdSrs.advanced) showToast(`📓 閱讀錯題記憶曲線提升：${rdSrs.label}！`, 'success');
            Sound.playSFX('correct');
          } else {
            state.stats.totalWrong += 1;
            recordWrongNote(noteId, chosen);
            Sound.playSFX('wrong');
          }
          autoSave();

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
                <div class="explain-label">${isCorrect ? '✔ 文意洞悉・解讀精準！' : '✘ 解讀偏離・再審文脈'}</div>
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
    Sound.playSFX('skill');

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
      Sound.playSFX('victory');
    } else {
      Sound.playSFX('click');
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
      // Escape even though sanitizeSaveData whitelists these — defense in depth for innerHTML
      const bestText = best
        ? `最佳成績：<b class="rank-${escapeHtml(best.rank)}">${escapeHtml(best.rank)}</b>（${toSafeInt(best.score, 0, 0)}/${toSafeInt(best.total, 0, 0)}）`
        : '尚未挑戰';
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

    Sound.playSFX('boss_enter');
    Sound.playBGM('battle');
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
        ? getListeningPromptHtml(q, '🎧 聽力試題：點擊上方「🔊 朗讀題目」後作答')
        : q.promptJp;
    }

    const ttsBtn = $('btn-shrine-tts');
    if (ttsBtn) {
      ttsBtn.onclick = () => speakQuestionStem(q, 1.0);
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
      Sound.speak(q.tts, 1.0);
    }
  }

  function recordShrineAnswer(q, isCorrect, userDisplay) {
    Sound.playSFX(isCorrect ? 'correct' : 'wrong');
    shrine.results.push({ q, isCorrect, userDisplay });

    if (isCorrect) {
      state.stats.totalCorrect += 1;
      getDailyProgress().correct_answers += 1;
      recordDailyTrainingProgress('correct', 1);
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
    Sound.stopSpeak();
    shrine.active = false;
    updateChromeVisibility('shrine');
    Sound.playBGM('town');

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
    getDailyProgress().complete_shrine += 1;
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

    Sound.playSFX(rank === 'S' || rank === 'A' ? 'victory' : 'confirm');
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
