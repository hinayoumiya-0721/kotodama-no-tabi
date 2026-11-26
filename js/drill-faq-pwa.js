/**
 * 《言霊の旅》浸式刷題、PWA 安裝、FAQ 抽屜（js/drill-faq-pwa.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  /* ==========================================================================
   * 浸式刷題（Immersive Drill）：沒有血量、計時與獎勵，只有連續答題。
   * 答錯 → 收進錯題筆記；答對已在筆記中的題目 → 依遺忘曲線推進（只在到期時升級）。
   * ========================================================================== */
  const DRILL_COUNTS = [10, 20, 50, 0]; // 0 = 無限
  const DRILL_AUTO_NEXT_MS = 900;
  const drill = {
    active: false,
    finished: false,
    config: { source: 'all', jlpt: 'all', type: 'all', count: 20, autoNext: true },
    pool: [],
    queue: [],
    total: 0, // 0 = endless
    idx: 0,
    current: null,
    answered: false,
    lastChoice: null,
    results: [],
    streak: 0,
    bestStreak: 0,
    reorderPool: [],
    reorderSelected: [],
    autoTimer: null
  };

  function clearDrillAutoTimer() {
    if (drill.autoTimer) {
      clearTimeout(drill.autoTimer);
      drill.autoTimer = null;
    }
  }

  function hasPendingWrongNote(qid) {
    const notes = state && state.wrongNotes;
    return Boolean(notes && Object.prototype.hasOwnProperty.call(notes, qid) && notes[qid] && !notes[qid].mastered);
  }

  function buildDrillPool(config = {}) {
    const jlpt = JLPT_LEVELS.includes(config.jlpt) ? config.jlpt : 'all';
    const type = typeof config.type === 'string' && config.type ? config.type : 'all';
    const wrongOnly = config.source === 'wrong';
    return getQuestions()
      .filter((q) => {
        if (!q || !q.id) return false;
        if (jlpt !== 'all' && normalizeJlptLevel(q.jlpt, q.regionId) !== jlpt) return false;
        if (type !== 'all' && q.type !== type) return false;
        if (wrongOnly && !hasPendingWrongNote(q.id)) return false;
        return true;
      })
      .map((q) => q.id);
  }

  function loadDrillQuestion() {
    const raw = getQuestionById(drill.queue[drill.idx]);
    drill.current = raw ? normalizeQuestion(raw) : null;
    drill.answered = false;
    drill.lastChoice = null;
    drill.reorderSelected = [];
    drill.reorderPool = drill.current && drill.current.type === 'reorder'
      ? shuffleArray(drill.current.chunks.map((c) => ({ id: c.id, text: c.text, plain: c.plain, html: c.html })))
      : [];
  }

  // ids: optional fixed list (e.g. "重練本輪錯題"); otherwise the pool comes from config
  function startDrill(config, ids) {
    if (!hasActiveSession) return false;
    const cfg = { ...drill.config, ...(config || {}) };
    cfg.count = DRILL_COUNTS.includes(Number(cfg.count)) ? Number(cfg.count) : 20;
    cfg.autoNext = cfg.autoNext !== false;
    const pool = Array.isArray(ids)
      ? Array.from(new Set(ids)).filter((id) => getQuestionById(id))
      : buildDrillPool(cfg);
    if (pool.length === 0) {
      showToast(cfg.source === 'wrong' ? '📓 這個範圍沒有待複習的錯題。' : '這個範圍沒有題目，換個條件試試。', 'info');
      return false;
    }
    clearDrillAutoTimer();
    drill.config = cfg;
    drill.pool = pool;
    const shuffled = shuffleArray(pool);
    if (Array.isArray(ids)) {
      drill.queue = shuffled;
      drill.total = shuffled.length;
    } else if (cfg.count > 0) {
      drill.queue = shuffled.slice(0, cfg.count);
      drill.total = drill.queue.length;
    } else {
      drill.queue = shuffled;
      drill.total = 0;
    }
    drill.idx = 0;
    drill.results = [];
    drill.streak = 0;
    drill.bestStreak = 0;
    drill.active = true;
    drill.finished = false;
    loadDrillQuestion();
    renderDrill();
    return true;
  }

  // choice: option index, or the joined plain text for reorder questions
  function answerDrill(choice) {
    const q = drill.current;
    if (!drill.active || drill.answered || !q) return null;
    let isCorrect;
    if (q.type === 'reorder') {
      drill.lastChoice = String(choice || '');
      isCorrect = drill.lastChoice === q.correctOrderPlain;
    } else {
      const idx = Math.floor(Number(choice));
      if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return null;
      drill.lastChoice = idx;
      isCorrect = idx === q.answerIndex;
    }
    drill.answered = true;
    drill.results.push({ id: q.id, correct: isCorrect });

    if (isCorrect) {
      drill.streak += 1;
      drill.bestStreak = Math.max(drill.bestStreak, drill.streak);
      state.stats.totalCorrect += 1;
      getDailyProgress().correct_answers += 1;
      recordDailyTrainingProgress('correct', 1);
      if (hasPendingWrongNote(q.id)) advanceWrongNoteSRS(q.id, true, { requireDue: true });
    } else {
      drill.streak = 0;
      state.stats.totalWrong += 1;
      recordWrongNote(q.id, q.type === 'reorder' ? -1 : drill.lastChoice);
    }
    Sound.playSFX(isCorrect ? 'correct' : 'wrong');
    autoSave();
    return isCorrect;
  }

  function nextDrillQuestion() {
    if (!drill.active || !drill.answered) return;
    clearDrillAutoTimer();
    drill.idx += 1;
    if (drill.idx >= drill.queue.length) {
      if (drill.total > 0) {
        finishDrill();
        return;
      }
      // Endless: reshuffle, never repeating the question just answered
      const last = drill.queue[drill.queue.length - 1];
      const next = shuffleArray(drill.pool);
      if (next.length > 1 && next[0] === last) next.push(next.shift());
      drill.queue = next;
      drill.idx = 0;
    }
    loadDrillQuestion();
    renderDrill();
  }

  function finishDrill() {
    clearDrillAutoTimer();
    Sound.stopSpeak();
    drill.active = false;
    drill.finished = drill.results.length > 0;
    checkAchievements();
    autoSave();
    updateHUD();
    renderDrill();
  }

  function renderDrill() {
    const el = $('drill-content');
    if (!el || !hasActiveSession) return;
    if (drill.active) renderDrillQuestion(el);
    else if (drill.finished) renderDrillSummary(el);
    else renderDrillSetup(el);
  }

  function renderDrillSetup(el) {
    const cfg = drill.config;
    const notes = state.wrongNotes || {};
    const pendingWrong = Object.keys(notes).filter((id) => hasPendingWrongNote(id)).length;
    const types = Array.from(new Set(getQuestions().map((q) => q.type).filter(Boolean)));
    const poolSize = buildDrillPool(cfg).length;
    const chip = (group, value, label, active) =>
      `<button type="button" class="drill-chip${active ? ' active' : ''}" data-drill-set="${group}" data-value="${escapeHtml(String(value))}" aria-pressed="${active ? 'true' : 'false'}">${escapeHtml(label)}</button>`;

    el.innerHTML = `
      <div class="drill-setup panel-card">
        <div class="drill-row"><div class="drill-row-label">範圍</div><div class="drill-chips">
          ${chip('source', 'all', '全部題目', cfg.source !== 'wrong')}${chip('source', 'wrong', `只練錯題（${pendingWrong}）`, cfg.source === 'wrong')}
        </div></div>
        <div class="drill-row"><div class="drill-row-label">難度</div><div class="drill-chips">
          ${chip('jlpt', 'all', '全部', cfg.jlpt === 'all')}${JLPT_LEVELS.map((l) => chip('jlpt', l, l, cfg.jlpt === l)).join('')}
        </div></div>
        <div class="drill-row"><div class="drill-row-label">題型</div><div class="drill-chips">
          ${chip('type', 'all', '全部', cfg.type === 'all')}${types.map((t) => chip('type', t, QUESTION_TYPE_LABELS[t] || t, cfg.type === t)).join('')}
        </div></div>
        <div class="drill-row"><div class="drill-row-label">題數</div><div class="drill-chips">
          ${DRILL_COUNTS.map((n) => chip('count', n, n === 0 ? '無限' : `${n} 題`, cfg.count === n)).join('')}
        </div></div>
        <label class="drill-toggle"><input type="checkbox" id="drill-auto-next"${cfg.autoNext ? ' checked' : ''}> 答對自動跳下一題</label>
        <div class="drill-setup-footer">
          <span class="text-muted">符合條件：<strong>${poolSize}</strong> 題</span>
          <button type="button" id="btn-drill-start" class="btn btn-gold"${poolSize === 0 ? ' disabled' : ''}>▶ 開始刷題</button>
        </div>
        <p class="drill-tip text-muted">鍵盤：<kbd>1</kbd>–<kbd>4</kbd> 選答案，<kbd>Enter</kbd> 下一題。</p>
      </div>
    `;

    el.querySelectorAll('[data-drill-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.getAttribute('data-drill-set');
        const value = btn.getAttribute('data-value');
        if (!['source', 'jlpt', 'type', 'count'].includes(group)) return;
        drill.config[group] = group === 'count' ? Number(value) : value;
        Sound.playSFX('click');
        renderDrill();
      });
    });
    const auto = $('drill-auto-next');
    if (auto) auto.addEventListener('change', () => { drill.config.autoNext = auto.checked; });
    const startBtn = $('btn-drill-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        Sound.playSFX('confirm');
        startDrill(drill.config);
      });
    }
  }

  function renderDrillQuestion(el) {
    const q = drill.current;
    if (!q) {
      finishDrill();
      return;
    }
    const done = drill.results.length;
    const correct = drill.results.filter((r) => r.correct).length;
    const acc = done > 0 ? Math.round((correct / done) * 100) : 0;
    const num = drill.answered ? done : done + 1;
    const promptJp = q.type === 'listening' && !drill.answered
      ? getListeningPromptHtml(q, '🎧 聽力題：按「🔊 朗讀」聽完再作答')
      : q.promptJp;

    el.innerHTML = `
      <div class="drill-topbar panel-card">
        <span>第 <strong>${num}</strong>${drill.total > 0 ? ` / ${drill.total}` : ''} 題</span>
        <span>正確率 <strong>${acc}%</strong></span>
        <span>連對 <strong>${drill.streak}</strong></span>
        <button type="button" id="btn-drill-end" class="btn btn-secondary btn-sm">結束</button>
      </div>
      <div class="drill-card panel-card">
        <div class="drill-q-meta">
          <span class="badge badge-gold">${escapeHtml(q.typeLabel)}</span>
          <span class="badge">${escapeHtml(q.jlpt)}</span>
          <button type="button" id="btn-drill-tts" class="btn btn-secondary btn-sm drill-tts-btn">🔊 朗讀</button>
        </div>
        <div class="drill-q-zh">${q.promptZh}</div>
        <div class="drill-q-jp jp-text">${promptJp}</div>
        <div id="drill-options" class="drill-options"></div>
        <div id="drill-feedback" class="drill-feedback${drill.answered ? '' : ' hidden'}" aria-live="polite"></div>
      </div>
    `;

    const endBtn = $('btn-drill-end');
    if (endBtn) {
      endBtn.addEventListener('click', () => {
        Sound.playSFX('click');
        finishDrill();
      });
    }
    const ttsBtn = $('btn-drill-tts');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        if (drill.answered) Sound.speak(q.tts || stripRubyHtml(q.fullRubyJp), 1.0);
        else speakQuestionStem(q, 1.0);
      });
    }

    const container = $('drill-options');
    if (container) {
      if (q.type === 'reorder') {
        container.classList.remove('options-grid');
        if (drill.answered) {
          container.innerHTML = `<div class="drill-reorder-answer">你的排列：<span class="jp-text">${escapeHtml(String(drill.lastChoice || '（未作答）'))}</span></div>`;
        } else {
          renderReorderUI(container, drill.reorderPool, drill.reorderSelected, () => {
            answerDrill(drill.reorderSelected.map((c) => c.plain).join(''));
            afterDrillAnswer();
          });
        }
      } else {
        container.classList.add('options-grid');
        const letters = ['A', 'B', 'C', 'D'];
        container.innerHTML = q.options.map((opt, idx) => {
          let cls = 'option-btn';
          if (drill.answered) {
            if (idx === q.answerIndex) cls += ' correct';
            else if (idx === drill.lastChoice) cls += ' wrong';
          }
          return `
            <button type="button" class="${cls}" data-drill-opt="${idx}"${drill.answered ? ' disabled' : ''}>
              <span class="badge badge-gold" style="margin-right:8px;">${letters[idx] || idx + 1}</span>
              <span class="jp-text">${opt}</span>
            </button>
          `;
        }).join('');
        container.querySelectorAll('[data-drill-opt]').forEach((btn) => {
          btn.addEventListener('click', () => {
            answerDrill(Number(btn.getAttribute('data-drill-opt')));
            afterDrillAnswer();
          });
        });
      }
    }

    if (drill.answered) {
      renderDrillFeedback(q);
    } else if (q.type === 'listening' && q.tts) {
      Sound.speak(q.tts, 1.0);
    }
  }

  function renderDrillFeedback(q) {
    const fb = $('drill-feedback');
    if (!fb) return;
    const last = drill.results[drill.results.length - 1];
    const ok = Boolean(last && last.correct);
    const answerText = q.correctDisplay || escapeHtml(q.type === 'reorder' ? q.correctOrderPlain : (q.options[q.answerIndex] || ''));
    fb.innerHTML = `
      <div class="drill-fb-head ${ok ? 'is-ok' : 'is-ng'}">${ok ? '⭕ 正確！' : '❌ 答錯了（已收進錯題筆記）'}</div>
      <div class="drill-fb-answer">正解：<span class="jp-text">${answerText}</span></div>
      ${q.fullRubyJp ? `<div class="drill-fb-jp jp-text force-furigana">${q.fullRubyJp}</div>` : ''}
      ${!ok && q.wrongReason ? `<div class="drill-fb-why">${q.wrongReason}</div>` : ''}
      ${q.explanation ? `<div class="drill-fb-exp">${q.explanation}</div>` : ''}
      <button type="button" id="btn-drill-next" class="btn btn-gold btn-block">${drill.total > 0 && drill.idx + 1 >= drill.queue.length ? '看結果' : '下一題'} ▶</button>
    `;
    const nextBtn = $('btn-drill-next');
    if (nextBtn) nextBtn.addEventListener('click', () => nextDrillQuestion());
  }

  function afterDrillAnswer() {
    if (!drill.answered) return;
    renderDrill();
    const last = drill.results[drill.results.length - 1];
    if (last && last.correct && drill.config.autoNext) {
      clearDrillAutoTimer();
      drill.autoTimer = setTimeout(() => {
        drill.autoTimer = null;
        if (currentView === 'drill') nextDrillQuestion();
      }, DRILL_AUTO_NEXT_MS);
    } else {
      const nextBtn = $('btn-drill-next');
      if (nextBtn && typeof nextBtn.focus === 'function') nextBtn.focus();
    }
  }

  function renderDrillSummary(el) {
    const total = drill.results.length;
    const correct = drill.results.filter((r) => r.correct).length;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    const wrongIds = Array.from(new Set(drill.results.filter((r) => !r.correct).map((r) => r.id)));
    const wrongList = wrongIds.map((id) => {
      const raw = getQuestionById(id);
      if (!raw) return '';
      const q = normalizeQuestion(raw);
      const sentence = stripRubyHtml(q.tts || q.fullRubyJp || '');
      const short = sentence.length > 42 ? `${sentence.slice(0, 42)}…` : sentence;
      return `<li><span class="jp-text">${escapeHtml(short)}</span><span class="drill-summary-ans">→ ${q.correctDisplay || escapeHtml(q.options[q.answerIndex] || q.correctOrderPlain || '')}</span></li>`;
    }).join('');

    el.innerHTML = `
      <div class="drill-summary panel-card">
        <h3>🎯 本輪結果</h3>
        <div class="drill-summary-stats">
          <div><strong>${total}</strong><span>作答</span></div>
          <div><strong>${acc}%</strong><span>正確率</span></div>
          <div><strong>${drill.bestStreak}</strong><span>最高連對</span></div>
        </div>
        ${wrongIds.length > 0
          ? `<div class="drill-summary-sub">答錯的題目（已收進錯題筆記）</div><ul class="drill-summary-list">${wrongList}</ul>`
          : '<p class="drill-summary-perfect">全部答對，太強了！</p>'}
        <div class="drill-summary-actions">
          ${wrongIds.length > 0 ? `<button type="button" id="btn-drill-retry-wrong" class="btn btn-crimson">🔁 重練本輪錯題（${wrongIds.length}）</button>` : ''}
          <button type="button" id="btn-drill-again" class="btn btn-gold">▶ 同條件再一輪</button>
          <button type="button" id="btn-drill-setup" class="btn btn-secondary">⚙ 換條件</button>
        </div>
      </div>
    `;
    const retry = $('btn-drill-retry-wrong');
    if (retry) retry.addEventListener('click', () => { Sound.playSFX('confirm'); startDrill(drill.config, wrongIds); });
    const again = $('btn-drill-again');
    if (again) again.addEventListener('click', () => { Sound.playSFX('confirm'); startDrill(drill.config); });
    const setup = $('btn-drill-setup');
    if (setup) {
      setup.addEventListener('click', () => {
        Sound.playSFX('click');
        drill.finished = false;
        renderDrill();
      });
    }
  }

  function handleDrillKeydown(e) {
    if (currentView !== 'drill' || !drill.active || !drill.current) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    const tag = t && t.tagName ? t.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (document.querySelector('.modal-overlay.active, .modal-overlay.open, .faq-drawer.open')) return;
    if (!drill.answered && drill.current.type !== 'reorder' && /^[1-4]$/.test(e.key)) {
      const idx = Number(e.key) - 1;
      if (idx < drill.current.options.length) {
        e.preventDefault();
        answerDrill(idx);
        afterDrillAnswer();
      }
      return;
    }
    // Enter on a focused button already clicks it; only handle Enter when focus is elsewhere
    if (drill.answered && e.key === 'Enter' && tag !== 'button') {
      e.preventDefault();
      nextDrillQuestion();
    }
  }

  /* ---- PWA: service worker (offline play) + install button ---- */
  let deferredInstallPrompt = null;

  function isStandaloneApp() {
    try {
      return Boolean(
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (window.navigator && window.navigator.standalone === true)
      );
    } catch (_) {
      return false;
    }
  }

  // The buttons only appear when the browser offers an install prompt (Chrome / Edge / Android)
  function updateInstallButtons() {
    const show = Boolean(deferredInstallPrompt) && !isStandaloneApp();
    document.querySelectorAll('.js-install-app').forEach((btn) => btn.classList.toggle('hidden', !show));
  }

  function initPwa() {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return;
    const canRegister =
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator &&
      typeof location !== 'undefined' &&
      /^https?:$/.test(location.protocol);
    if (canRegister) {
      const register = () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
      };
      if (document.readyState === 'complete') register();
      else window.addEventListener('load', register);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredInstallPrompt = e;
      updateInstallButtons();
    });
    window.addEventListener('appinstalled', () => {
      deferredInstallPrompt = null;
      updateInstallButtons();
      showToast('📲 已安裝！之後可以直接從桌面或主畫面的圖示開啟，沒網路也能玩。', 'gold');
    });

    document.querySelectorAll('.js-install-app').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const promptEvent = deferredInstallPrompt;
        if (!promptEvent) {
          showToast('請用瀏覽器選單的「安裝應用程式」或「加入主畫面」。', 'info');
          return;
        }
        deferredInstallPrompt = null;
        Sound.playSFX('confirm');
        promptEvent.prompt();
        try {
          await promptEvent.userChoice;
        } catch (_) { /* dismissed */ }
        updateInstallButtons();
      });
    });
    updateInstallButtons();
  }

  /* ---- FAQ side drawer (collapsed edge tab → drawer on demand) ---- */
  function isFaqOpen() {
    const drawer = $('faq-drawer');
    return Boolean(drawer && drawer.classList.contains('open'));
  }

  function setFaqOpen(open) {
    const drawer = $('faq-drawer');
    const tab = $('btn-faq-toggle');
    if (!drawer) return;
    drawer.classList.toggle('open', Boolean(open));
    if (tab) tab.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      const closeBtn = $('btn-faq-close');
      if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
    }
  }

  function initFaqDrawer() {
    const tab = $('btn-faq-toggle');
    const closeBtn = $('btn-faq-close');
    if (tab) {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        Sound.playSFX('click');
        setFaqOpen(!isFaqOpen());
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        Sound.playSFX('click');
        setFaqOpen(false);
        if (tab && typeof tab.focus === 'function') tab.focus();
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isFaqOpen()) setFaqOpen(false);
    });
    // Clicking anywhere outside the drawer folds it back
    document.addEventListener('click', (e) => {
      if (!isFaqOpen()) return;
      const drawer = $('faq-drawer');
      if (drawer && !drawer.contains(e.target)) setFaqOpen(false);
    });
  }
