/**
 * 《言霊の旅》存檔視窗、問題回報、開發測試工具（js/save-ui.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // ============================================================================
  // 17. Save / Load Modal
  // ============================================================================
  function clearSaveTransferInputs() {
    const ta = $('save-json-textarea');
    if (ta) ta.value = '';
    const fi = $('input-import-save-file');
    if (fi) fi.value = '';
    const details = $('save-code-details');
    if (details) details.open = false;
  }

  function openSaveModal(loadOnly = false) {
    saveModalLoadOnly = Boolean(loadOnly || !hasActiveSession);
    clearSaveTransferInputs();
    renderSaveModal();
    openModal('modal-save');
  }

  function renderSaveModal() {
    const listEl = $('save-slots-list');
    if (!listEl) return;

    listEl.innerHTML = SAVE_SLOT_LIST.map((slot) => {
      // QA S-1: never render raw localStorage — sanitize first (numbers / ids / names are cleaned)
      const rawSlot = readRawSlot(slot.key);
      let raw = null;
      let corrupted = false;
      if (rawSlot && rawSlot.player && typeof rawSlot.player === 'object') {
        try { raw = sanitizeSaveData(rawSlot); } catch (_) { corrupted = true; }
      }
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
                <div class="text-muted" style="font-size:0.78rem;margin-top:2px;">存檔時間：${escapeHtml(formatTimestamp(raw.savedAt))}</div>`
              : (corrupted
                  ? '<div style="font-size:0.86rem;margin-top:4px;color:var(--crimson-bright);">（存檔已損毀）</div>'
                  : '<div class="text-muted" style="font-size:0.86rem;margin-top:4px;">（空欄位）</div>')
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
        Sound.playSFX('cancel');
        showToast('已刪除該存檔欄位。', 'info');
        renderSaveModal();
        if (currentView === 'title') renderTitle();
      });
    });
  }

  const ALLOWED_SAVE_MIME_TYPES = new Set(['', 'application/json', 'text/json', 'text/plain']);

  function buildExportSavePayload() {
    let payload = null;
    if (hasActiveSession) {
      payload = JSON.parse(JSON.stringify(state));
      payload.version = SAVE_VERSION;
      payload.savedAt = new Date().toISOString();
    } else {
      const latestKey = findLatestSaveKey();
      if (latestKey) {
        const raw = readRawSlot(latestKey);
        if (raw && raw.player && typeof raw.player === 'object') {
          try {
            payload = sanitizeSaveData(raw);
          } catch (_) {
            payload = null;
          }
        }
      }
    }
    return payload && payload.player ? payload : null;
  }

  function buildSafeSaveFilename(payload) {
    const rawName = (payload && payload.player && typeof payload.player.name === 'string')
      ? payload.player.name
      : 'traveler';
    const safeName = rawName
      .replace(/[\\/:*?"<>|\x00-\x1f\x7f\s]+/g, '')
      .slice(0, 12) || 'traveler';
    const lv = Math.max(1, Math.floor(safeNum(payload && payload.player && payload.player.level) || 1));
    const d = new Date();
    const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    return `kotodama-save-${safeName}-Lv${lv}-${ymd}.json`;
  }

  function validateSaveJsonFile(file) {
    if (!file || typeof file !== 'object') {
      return { ok: false, reason: '未選擇存檔檔案。' };
    }
    const name = typeof file.name === 'string' ? file.name.trim() : '';
    if (!name || !/\.json$/i.test(name)) {
      return { ok: false, reason: '僅支援 .json 格式的存檔檔案，已拒絕匯入。' };
    }
    const rawType = typeof file.type === 'string' ? file.type.split(';')[0].trim().toLowerCase() : '';
    if (!ALLOWED_SAVE_MIME_TYPES.has(rawType)) {
      return { ok: false, reason: '檔案類型不是合法 JSON，已拒絕匯入。' };
    }
    const size = Number(file.size);
    if (!Number.isFinite(size) || size <= 0) {
      return { ok: false, reason: '存檔檔案內容為空，未覆蓋現有存檔。' };
    }
    if (size > IMPORT_MAX_CHARS) {
      return { ok: false, reason: '存檔檔案超過 1 MB 上限，未覆蓋現有存檔。' };
    }
    return { ok: true };
  }

  function exportSaveJsonFile() {
    const payload = buildExportSavePayload();
    if (!payload) {
      showToast('尚未開始冒險且本機無可下載的存檔。', 'warning');
      return '';
    }
    const jsonStr = JSON.stringify(payload, null, 2);
    const filename = buildSafeSaveFilename(payload);
    try {
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      }, 1000);
      Sound.playSFX('confirm');
      showToast(`💾 已下載存檔檔案：${filename}`, 'success');
    } catch (_) {
      Sound.playSFX('wrong');
      showToast('❌ 瀏覽器無法觸發檔案下載，請改用下方「進階：手動複製引繼碼」。', 'error');
    }
    return jsonStr;
  }

  function readFileAsUtf8Text(file) {
    if (file && typeof file.text === 'function') {
      return file.text();
    }
    return new Promise((resolve, reject) => {
      if (typeof FileReader !== 'function') {
        reject(new Error('FileReader unavailable'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(reader.error || new Error('File read failed'));
      reader.readAsText(file, 'utf-8');
    });
  }

  async function importSaveJsonFile(file, options = {}) {
    const fi = $('input-import-save-file');
    try {
      const check = validateSaveJsonFile(file);
      if (!check.ok) {
        Sound.playSFX('wrong');
        showToast(`❌ ${check.reason}`, 'error');
        return false;
      }
      let text = '';
      try {
        text = await readFileAsUtf8Text(file);
      } catch (_) {
        Sound.playSFX('wrong');
        showToast('❌ 讀取存檔檔案失敗，未覆蓋現有存檔。', 'error');
        return false;
      }
      return importSaveJsonCode(text, options);
    } finally {
      if (fi) fi.value = '';
    }
  }

  function exportSaveJsonCode() {
    const payload = buildExportSavePayload();
    if (!payload) {
      showToast('尚未開始冒險且本機無可匯出的存檔。', 'warning');
      return '';
    }

    const jsonStr = JSON.stringify(payload);
    const ta = $('save-json-textarea');
    if (ta) {
      ta.value = jsonStr;
    }

    let copied = false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(jsonStr).catch(() => {});
        copied = true;
      }
    } catch (_) {}

    if (!copied && ta) {
      try {
        ta.focus();
        ta.select();
        document.execCommand('copy');
        copied = true;
      } catch (_) {}
    }

    Sound.playSFX('confirm');
    showToast(
      copied ? '📤 已產生 JSON 存檔碼並複製到剪貼簿！' : '📤 已產生 JSON 存檔碼，請手動複製下方文字！',
      'success'
    );
    return jsonStr;
  }

  function importSaveJsonCode(rawJsonOverride = null, { skipConfirm = false } = {}) {
    const ta = $('save-json-textarea');
    const rawText = typeof rawJsonOverride === 'string'
      ? rawJsonOverride
      : (ta ? ta.value : '');
    const stripped = String(rawText || '').replace(/^\uFEFF/, '');
    if (stripped.indexOf('\u0000') !== -1) {
      Sound.playSFX('wrong');
      showToast('❌ 檔案內容包含非法二進位資料（非純文字 JSON），已拒絕匯入。', 'error');
      return false;
    }
    const trimmed = stripped.trim();
    if (!trimmed) {
      showToast('❌ 請先選擇 .json 存檔檔，或於進階區貼上 JSON 存檔碼。', 'error');
      return false;
    }
    // QA S-3: a real save is ~10–200 KB; refuse anything absurdly large before parsing it
    if (trimmed.length > IMPORT_MAX_CHARS) {
      showToast('❌ 存檔資料過大（超過 1 MB），未覆蓋現有存檔。', 'error');
      return false;
    }
    // Must be a JSON object payload (immediately rejects HTML/SVG/JS documents & non-object JSON)
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
      Sound.playSFX('wrong');
      showToast('❌ 僅支援 JSON 物件格式的存檔，未覆蓋現有存檔。', 'error');
      return false;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (_) {
      Sound.playSFX('wrong');
      showToast('❌ 存檔格式錯誤（無效的 JSON），未覆蓋現有存檔。', 'error');
      return false;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !parsed.player || typeof parsed.player !== 'object' || Array.isArray(parsed.player)) {
      Sound.playSFX('wrong');
      showToast('❌ 存檔缺少必要角色資料（player），未覆蓋現有存檔。', 'error');
      return false;
    }

    // Sanitize BEFORE touching any live timers/state, so a throw here leaves the session intact.
    let nextState;
    try {
      nextState = sanitizeSaveData(parsed);
    } catch (err) {
      Sound.playSFX('wrong');
      showToast('❌ 存檔內容損毀，無法解析，未覆蓋現有存檔。', 'error');
      return false;
    }

    // Confirm before replacing the live session / auto slot (autoSave writes SAVE_KEYS.auto).
    const rawExisting = hasActiveSession ? state : readRawSlot(SAVE_KEYS.auto);
    let existing = null;
    if (rawExisting && rawExisting.player && typeof rawExisting.player === 'object') {
      try { existing = sanitizeSaveData(rawExisting); } catch (_) { existing = null; }
    }
    if (!skipConfirm && existing && existing.player && typeof global.confirm === 'function') {
      const describe = (s) => {
        const p = s.player || {};
        const pr = s.progress || {};
        const bosses = Array.isArray(pr.defeatedBosses) ? pr.defeatedBosses.length : 0;
        const region = getRegionById(pr.currentRegionId);
        return `${p.name || '旅人'}（Lv.${Number(p.level) || 1}｜已擊敗 Boss ${bosses}｜位於 ${region ? region.name : '未知區域'}）`;
      };
      const ok = global.confirm(
        `匯入將覆蓋目前的冒險進度：\n現有：${describe(existing)}\n匯入：${describe(nextState)}\n\n確定要覆蓋嗎？`
      );
      if (!ok) {
        showToast('已取消匯入，現有存檔未變更。', 'info');
        return false;
      }
    }

    stopBattleTimers();
    stopShrineTimer();
    stopTypewriter();
    Sound.stopSpeak();

    const prevState = state;
    const prevSession = hasActiveSession;
    state = nextState;
    hasActiveSession = true;
    // QA S-3: if the browser refuses the write (quota), roll back instead of claiming success
    if (!autoSave()) {
      state = prevState;
      hasActiveSession = prevSession;
      showToast('❌ 瀏覽器儲存空間不足，匯入未完成，現有存檔未變更。', 'error');
      return false;
    }
    battle.active = false;
    shrine.active = false;
    reading.active = false;
    crossRegionNotifiedKeys = new Set();

    clearSaveTransferInputs();
    applyFuriganaSetting();
    applyUiScaleSetting();
    updateHUD();
    closeModal('modal-save');
    closeModal('modal-tutorial');
    Sound.playSFX('levelup');
    showToast(`📥 存檔匯入成功！歡迎回來，${state.player.name}（Lv.${state.player.level}）！`, 'gold');

    if (currentView === 'title' || currentView === 'create' || currentView === 'battle') {
      switchView('town');
    } else {
      refreshActiveView();
    }
    return true;
  }

  // ============================================================================
  // 17b. Corner Bug Report & Diagnostics Helper
  // ============================================================================
  function collectBugReportDiagnostics() {
    const st = state || {};
    const pr = st.progress || {};
    const sets = st.settings || {};
    const p = st.player || {};
    const lines = [];
    lines.push(`版本：${APP_VERSION}`);
    lines.push(`畫面：${currentView || 'unknown'}${pr.currentRegionId ? `（區域 ${pr.currentRegionId}）` : ''}`);

    if (battle && battle.active) {
      const q = battle.currentQ;
      const qInfo = q ? `${q.id || '?'} [${q.jlpt || '?'}/${q.type || '?'}]` : '無';
      const eInfo = battle.enemy ? `${battle.enemy.id || battle.enemy.name || '?'}` : '無';
      lines.push(`戰鬥中：題目 ${qInfo}｜敵人 ${eInfo}`);
    } else if (reading && reading.active && reading.doc) {
      lines.push(`閱讀副本中：${reading.doc.id || '?'}`);
    } else if (shrine && shrine.active) {
      const curQ = Array.isArray(shrine.questions) ? shrine.questions[shrine.index] : null;
      lines.push(`試煉神殿中：題目 ${curQ ? (curQ.id || '?') : '?'}`);
    }

    lines.push(`設定：難度=${sets.difficultyMode || 'adaptive'}｜沉浸=${sets.immersionMode || 'standard'}｜縮放=${sets.uiScale || 'normal'}`);
    lines.push(hasActiveSession
      ? `進度：職業=${p.jobId || '?'}｜Lv.${p.level || 1}｜教學=${pr.tutorialStep}`
      : '進度：尚未進入存檔');

    const w = typeof window !== 'undefined' ? window.innerWidth : 0;
    const h = typeof window !== 'undefined' ? window.innerHeight : 0;
    const dpr = typeof window !== 'undefined' && window.devicePixelRatio ? Number(window.devicePixelRatio).toFixed(2) : '1';
    const ua = typeof navigator !== 'undefined' && navigator.userAgent ? String(navigator.userAgent).slice(0, 100) : 'N/A';
    lines.push(`環境：視窗 ${w}x${h} (DPR ${dpr})`);
    lines.push(`UA：${ua}`);

    if (recentRuntimeErrors.length > 0) {
      lines.push('最近錯誤：');
      recentRuntimeErrors.forEach((err) => {
        lines.push(`  - [${err.time}] ${err.message}`);
      });
    } else {
      lines.push('最近錯誤：（無）');
    }
    return lines.join('\n');
  }

  function buildBugReportText({ category = '功能異常 / 卡住', description = '' } = {}) {
    const cleanCat = String(category || '功能異常 / 卡住').trim().slice(0, 40);
    const cleanDesc = String(description || '').trim().slice(0, 1000) || '（未填寫文字描述）';
    const diag = collectBugReportDiagnostics();
    return [
      `【言霊の旅 問題回報】`,
      `類型：${cleanCat}`,
      '',
      '問題說明：',
      cleanDesc,
      '',
      '--- 診斷資訊 ---',
      diag
    ].join('\n');
  }

  function buildGithubIssueUrl({ category = '功能異常 / 卡住', description = '' } = {}) {
    const cleanCat = String(category || '功能異常 / 卡住').trim().slice(0, 40);
    const firstLine = String(description || '').trim().split(/\r?\n/)[0].slice(0, 45);
    const title = `[${cleanCat}] ${firstLine || `${currentView || '遊戲'} 問題回報 (${APP_VERSION})`}`;
    let body = buildBugReportText({ category: cleanCat, description });
    if (body.length > 1600) {
      body = `${body.slice(0, 1590)}\n…(已截斷)`;
    }
    return `${GITHUB_REPO_ISSUES_URL}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  }

  function openBugReportModal() {
    const diagEl = $('bug-report-diag');
    if (diagEl) {
      diagEl.textContent = collectBugReportDiagnostics();
    }
    openModal('modal-bug-report');
  }

  function copyBugReportToClipboard() {
    const cat = $('bug-report-category') ? $('bug-report-category').value : '功能異常 / 卡住';
    const desc = $('bug-report-desc') ? $('bug-report-desc').value : '';
    const text = buildBugReportText({ category: cat, description: desc });

    const done = () => {
      Sound.playSFX('confirm');
      showToast('📋 已複製問題回報內容，可以直接貼給作者或 Discord！', 'success');
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        navigator.clipboard.writeText(text).then(done, () => fallbackCopyText(text, done));
        return text;
      }
    } catch (_) {}

    fallbackCopyText(text, done);
    return text;
  }

  function fallbackCopyText(text, onSuccess) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (typeof onSuccess === 'function') onSuccess();
    } catch (_) {
      showToast('⚠️ 無法自動複製，請手動選取下方診斷資訊複製。', 'warning');
    }
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
    Sound.playSFX('levelup');
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
      case 'notes': renderNotes(); break;
      case 'drill': renderDrill(); break;
      default: break;
    }
  }
