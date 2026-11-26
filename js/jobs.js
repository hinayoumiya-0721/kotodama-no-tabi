/**
 * 《言霊の旅》職業切換（js/jobs.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // ============================================================================
  // 16. Character, Skill Tree, Inventory, Quests & Codex
  // ============================================================================
  function getExpectedJobStatsAtLevel(job, level) {
    const base = getJobBaseStats(job);
    const growth = getJobGrowth(job);
    const steps = Math.max(0, Math.floor(safeNum(level) || 1) - 1);
    return {
      maxHp: base.hp + growth.hp * steps,
      maxMp: base.mp + growth.mp * steps,
      baseINT: base.INT + growth.INT * steps,
      baseWIS: base.WIS + growth.WIS * steps,
      baseCHA: base.CHA + growth.CHA * steps
    };
  }

  function switchPlayerJob(targetJobId, options = {}) {
    if (!state || !state.player) return false;
    if (battle && battle.active) {
      if (!options.silent) showToast('⚔️ 戰鬥中無法切換角色，請等戰鬥結束後再切換。', 'warning');
      return false;
    }
    if (shrine && shrine.active) {
      if (!options.silent) showToast('⛩️ 試煉進行中無法切換角色。', 'warning');
      return false;
    }
    const jobs = getJobs();
    const nextJob = jobs.find((j) => j.id === targetJobId);
    if (!nextJob) return false;
    if (state.player.jobId === nextJob.id) return false;

    const p = state.player;
    const prevJob = getJobById(p.jobId);
    const prevTotal = getTotalStats();
    const hpRatio = prevTotal.maxHp > 0 ? clamp(p.hp / prevTotal.maxHp, 0, 1) : 1;
    const mpRatio = prevTotal.maxMp > 0 ? clamp(p.mp / prevTotal.maxMp, 0, 1) : 1;

    const oldExp = getExpectedJobStatsAtLevel(prevJob, p.level);
    const newExp = getExpectedJobStatsAtLevel(nextJob, p.level);

    // Preserve any bonus stats above baseline while recalculating job stats idempotently
    p.jobId = nextJob.id;
    p.maxHp = Math.max(30, newExp.maxHp + Math.max(0, p.maxHp - oldExp.maxHp));
    p.maxMp = Math.max(20, newExp.maxMp + Math.max(0, p.maxMp - oldExp.maxMp));
    p.baseINT = Math.max(1, newExp.baseINT + Math.max(0, p.baseINT - oldExp.baseINT));
    p.baseWIS = Math.max(1, newExp.baseWIS + Math.max(0, p.baseWIS - oldExp.baseWIS));
    p.baseCHA = Math.max(1, newExp.baseCHA + Math.max(0, p.baseCHA - oldExp.baseCHA));

    const nextTotal = getTotalStats();
    p.hp = clamp(Math.round(nextTotal.maxHp * hpRatio), 1, nextTotal.maxHp);
    p.mp = clamp(Math.round(nextTotal.maxMp * mpRatio), 0, nextTotal.maxMp);

    if (hasActiveSession) autoSave();
    updateHUD();
    if (currentView === 'character') renderCharacter();
    if (!options.silent) {
      Sound.playSFX('confirm');
      showToast(`🔄 已切換角色為【${nextJob.name}】！（等級、裝備與學習進度完整保留）`, 'gold');
    }
    return true;
  }
