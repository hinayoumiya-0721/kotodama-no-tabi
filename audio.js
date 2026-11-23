/**
 * 《言霊の旅（ことだまのたび）》 — Audio & Pronunciation Engine
 * Zero-dependency Web Audio API 8-bit Chiptune BGM/SFX Synthesizer + Web Speech API (ja-JP) TTS
 * Exposes global `window.AudioEngine` (no ES module import/export; safe for file:// usage).
 */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'kotodama_audio_settings';
  var BGM_NORMAL_GAIN = 0.10;
  var BGM_DUCKED_GAIN = 0.03;
  var SFX_NORMAL_GAIN = 0.28;
  var SCHEDULER_INTERVAL_MS = 25;
  var SCHEDULE_AHEAD_SEC = 0.14;

  // Semitone lookup for equal-temperament note parsing
  var NOTE_SEMITONES = {
    C: 0, 'C#': 1, Db: 1,
    D: 2, 'D#': 3, Eb: 3,
    E: 4, Fb: 4, 'E#': 5,
    F: 5, 'F#': 6, Gb: 6,
    G: 7, 'G#': 8, Ab: 8,
    A: 9, 'A#': 10, Bb: 10,
    B: 11, Cb: 11, 'B#': 0
  };

  var freqCache = Object.create(null);

  function noteToFreq(note) {
    if (typeof note === 'number') return note;
    if (!note || typeof note !== 'string') return 0;
    if (freqCache[note]) return freqCache[note];
    var match = /^([A-G][#b]?)(-?\d)$/.exec(note.trim());
    if (!match) return 0;
    var semi = NOTE_SEMITONES[match[1]];
    if (semi === undefined) return 0;
    var octave = parseInt(match[2], 10);
    var midi = (octave + 1) * 12 + semi;
    var hz = 440 * Math.pow(2, (midi - 69) / 12);
    freqCache[note] = hz;
    return hz;
  }

  // ============================================================================
  // 4 Retro 8-bit Chiptune BGM Tracks (each 32 eighth-note steps = 4 bars of 4/4)
  // ============================================================================
  var TRACKS = {
    // 1. Mystical Japanese Pentatonic (A Kumoi / In-Yo flavor), ~96 BPM, 32 steps
    title: {
      bpm: 96,
      stepsPerBeat: 2,
      steps: 32,
      leadWave: 'triangle',
      leadGain: 0.44,
      leadAttack: 0.025,
      leadRelease: 0.24,
      arpWave: 'triangle',
      arpGain: 0.23,
      arpAttack: 0.008,
      arpRelease: 0.14,
      bassWave: 'triangle',
      bassGain: 0.34,
      bassAttack: 0.02,
      bassRelease: 0.22,
      lead: [
        { n: 'E5', d: 3 }, null, null, { n: 'C5', d: 1 }, { n: 'B4', d: 2 }, null, { n: 'A4', d: 2 }, null,
        { n: 'C5', d: 3 }, null, null, { n: 'B4', d: 1 }, { n: 'E5', d: 2 }, null, { n: 'F5', d: 2 }, null,
        { n: 'E5', d: 2 }, null, { n: 'C5', d: 2 }, null, { n: 'B4', d: 2 }, null, { n: 'A4', d: 2 }, null,
        { n: 'B4', d: 4 }, null, null, null, { n: 'C5', d: 2 }, null, { n: 'B4', d: 2 }, null
      ],
      arp: [
        'A3', 'E4', 'A4', 'B4', 'C5', 'B4', 'A4', 'E4',
        'F3', 'C4', 'F4', 'A4', 'C5', 'A4', 'F4', 'C4',
        'D3', 'A3', 'D4', 'E4', 'F4', 'E4', 'D4', 'A3',
        'E3', 'B3', 'E4', 'G4', 'B4', 'G4', 'E4', 'B3'
      ],
      bass: [
        { n: 'A2', d: 4 }, null, null, null, { n: 'E2', d: 4 }, null, null, null,
        { n: 'F2', d: 4 }, null, null, null, { n: 'C3', d: 4 }, null, null, null,
        { n: 'D2', d: 4 }, null, null, null, { n: 'A2', d: 4 }, null, null, null,
        { n: 'E2', d: 4 }, null, null, null, { n: 'B2', d: 4 }, null, null, null
      ],
      perc: null
    },

    // 2. Warm Nostalgic JRPG Village Melody in C Major Pentatonic, ~112 BPM, 32 steps
    town: {
      bpm: 112,
      stepsPerBeat: 2,
      steps: 32,
      leadWave: 'triangle',
      leadGain: 0.46,
      leadAttack: 0.012,
      leadRelease: 0.14,
      arpWave: 'triangle',
      arpGain: 0.21,
      arpAttack: 0.006,
      arpRelease: 0.09,
      bassWave: 'triangle',
      bassGain: 0.36,
      bassAttack: 0.01,
      bassRelease: 0.12,
      lead: [
        { n: 'E5', d: 2 }, null, 'G5', 'A5', { n: 'G5', d: 2 }, null, 'E5', 'D5',
        { n: 'C5', d: 2 }, null, 'D5', 'E5', { n: 'A4', d: 2 }, null, 'C5', 'D5',
        { n: 'E5', d: 2 }, null, 'G5', 'C6', { n: 'A5', d: 2 }, null, 'G5', 'F5',
        'E5', 'D5', 'C5', 'D5', { n: 'C5', d: 3 }, null, null, 'D5'
      ],
      arp: [
        'C4', 'G4', 'E4', 'G4', 'B3', 'G4', 'D4', 'G4',
        'A3', 'E4', 'C4', 'E4', 'F3', 'C4', 'A3', 'C4',
        'C4', 'G4', 'E4', 'G4', 'F3', 'C4', 'A3', 'C4',
        'G3', 'D4', 'B3', 'D4', 'C4', 'G4', 'E4', 'G4'
      ],
      bass: [
        { n: 'C3', d: 2 }, null, { n: 'G2', d: 2 }, null, { n: 'B2', d: 2 }, null, { n: 'G2', d: 2 }, null,
        { n: 'A2', d: 2 }, null, { n: 'E2', d: 2 }, null, { n: 'F2', d: 2 }, null, { n: 'G2', d: 2 }, null,
        { n: 'C3', d: 2 }, null, { n: 'E3', d: 2 }, null, { n: 'F2', d: 2 }, null, { n: 'A2', d: 2 }, null,
        { n: 'G2', d: 2 }, null, { n: 'B2', d: 2 }, null, { n: 'C3', d: 2 }, null, { n: 'G2', d: 2 }, null
      ],
      perc: null
    },

    // 3. Energetic Classic JRPG Battle Theme in E Minor, ~148 BPM, 32 steps
    battle: {
      bpm: 148,
      stepsPerBeat: 2,
      steps: 32,
      leadWave: 'square',
      leadGain: 0.25,
      leadAttack: 0.006,
      leadRelease: 0.06,
      arpWave: 'triangle',
      arpGain: 0.24,
      arpAttack: 0.005,
      arpRelease: 0.05,
      bassWave: 'sawtooth',
      bassGain: 0.22,
      bassAttack: 0.006,
      bassRelease: 0.06,
      lead: [
        { n: 'E5', d: 1.6 }, null, 'E5', 'G5', { n: 'B5', d: 1.6 }, null, 'A5', 'G5',
        { n: 'E5', d: 1.6 }, null, 'C5', 'E5', { n: 'G5', d: 1.6 }, null, 'F#5', 'E5',
        { n: 'F#5', d: 1.6 }, null, 'D5', 'F#5', { n: 'A5', d: 1.6 }, null, 'B5', 'A5',
        { n: 'F#5', d: 1.6 }, null, 'B4', 'D#5', 'F#5', 'A5', 'G5', 'F#5'
      ],
      arp: [
        'E4', 'G4', 'B4', 'E5', 'B4', 'G4', 'E4', 'G4',
        'C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'E4',
        'D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'D4', 'F#4',
        'B3', 'D#4', 'F#4', 'B4', 'A4', 'F#4', 'D#4', 'F#4'
      ],
      bass: [
        'E2', 'E3', 'E2', 'E2', 'G2', 'E2', 'B2', 'E2',
        'C2', 'C3', 'C2', 'C2', 'E2', 'C2', 'G2', 'C2',
        'D2', 'D3', 'D2', 'D2', 'F#2', 'D2', 'A2', 'D2',
        'B1', 'B2', 'B1', 'B1', 'D#2', 'B1', 'F#2', 'B1'
      ],
      perc: [
        'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
        'K', 'H', 'S', 'H', 'K', 'K', 'S', 'H',
        'K', 'H', 'S', 'H', 'K', 'H', 'S', 'H',
        'K', 'H', 'S', 'K', 'S', 'H', 'S', 'S'
      ]
    },

    // 4. Dramatic Dark Fantasy Boss Theme in D Harmonic Minor / Chromatic, ~164 BPM, 32 steps
    boss: {
      bpm: 164,
      stepsPerBeat: 2,
      steps: 32,
      leadWave: 'square',
      leadGain: 0.26,
      leadAttack: 0.005,
      leadRelease: 0.055,
      arpWave: 'triangle',
      arpGain: 0.23,
      arpAttack: 0.004,
      arpRelease: 0.04,
      bassWave: 'sawtooth',
      bassGain: 0.26,
      bassAttack: 0.005,
      bassRelease: 0.05,
      lead: [
        'D5', 'F5', { n: 'A5', d: 1.8 }, null, 'Ab5', 'G5', 'F5', 'E5',
        'Eb5', 'G5', { n: 'Bb5', d: 1.8 }, null, 'A5', 'G5', 'F5', 'Eb5',
        { n: 'G5', d: 1.6 }, null, 'Bb5', 'D6', { n: 'C#6', d: 1.8 }, null, 'Bb5', 'A5',
        'A5', 'G5', 'F5', 'E5', 'C#5', 'E5', 'G5', 'C#6'
      ],
      // Paired arrays subdivide each 8th step into blistering 16th-note chiptune arpeggios
      arp: [
        ['D4', 'A4'], ['F4', 'D5'], ['A4', 'F5'], ['D5', 'A4'], ['F4', 'D5'], ['A4', 'F4'], ['D4', 'A4'], ['F4', 'A4'],
        ['Eb4', 'Bb4'], ['G4', 'Eb5'], ['Bb4', 'G5'], ['Eb5', 'Bb4'], ['G4', 'Eb5'], ['Bb4', 'G4'], ['Eb4', 'Bb4'], ['G4', 'Bb4'],
        ['G4', 'D5'], ['Bb4', 'G5'], ['D5', 'Bb5'], ['G5', 'D5'], ['C#5', 'Bb4'], ['G4', 'E4'], ['C#5', 'G4'], ['E5', 'C#5'],
        ['A4', 'E5'], ['C#5', 'A5'], ['E5', 'C#5'], ['G5', 'E5'], ['C#5', 'G4'], ['E5', 'C#5'], ['G5', 'E5'], ['A5', 'E5']
      ],
      bass: [
        'D2', 'D2', 'D3', 'D2', 'D2', 'F2', 'E2', 'D2',
        'Eb2', 'Eb2', 'Eb3', 'Eb2', 'Eb2', 'G2', 'F2', 'Eb2',
        'G2', 'G2', 'G3', 'G2', 'Bb2', 'A2', 'G2', 'E2',
        'A1', 'A2', 'A1', 'C#2', 'E2', 'G2', 'E2', 'A2'
      ],
      perc: [
        'K', 'H', 'S', 'K', 'K', 'H', 'S', 'H',
        'K', 'H', 'S', 'K', 'K', 'K', 'S', 'H',
        'K', 'H', 'S', 'K', 'K', 'H', 'S', 'K',
        'K', 'S', 'K', 'S', 'K', 'S', 'S', 'S'
      ]
    }
  };

  // ============================================================================
  // Internal State
  // ============================================================================
  var ctx = null;
  var masterGain = null;
  var bgmFilter = null;
  var bgmGain = null;
  var sfxGain = null;
  var noiseBuffer = null;

  var bgmMuted = false;
  var sfxMuted = false;
  var currentTrack = null;
  var isDucked = false;

  // Sequencer state
  var schedulerId = null;
  var currentStep = 0;
  var nextNoteTime = 0;

  // Auto-unlock state
  var unlockAttached = false;
  var unlockHandler = null;

  // Web Speech API state
  var speechAvailable = typeof global.speechSynthesis !== 'undefined' &&
                        typeof global.SpeechSynthesisUtterance !== 'undefined';
  var selectedVoice = null;
  var jpVoiceReady = false;
  var speechToken = 0;
  var currentUtterance = null;
  var speechWatchdogId = null;

  // ============================================================================
  // Settings Persistence (localStorage)
  // ============================================================================
  function loadSettings() {
    try {
      if (!global.localStorage) return;
      var raw = global.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.bgmMuted === 'boolean') bgmMuted = parsed.bgmMuted;
        if (typeof parsed.sfxMuted === 'boolean') sfxMuted = parsed.sfxMuted;
      }
    } catch (_) {
      // Ignore storage failures (private mode / quota / security restrictions)
    }
  }

  function saveSettings() {
    try {
      if (!global.localStorage) return;
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bgmMuted: bgmMuted,
        sfxMuted: sfxMuted
      }));
    } catch (_) {
      // Ignore storage failures
    }
  }

  // ============================================================================
  // Web Audio Context & Graph Initialization
  // ============================================================================
  function createNoiseBuffer(audioCtx) {
    var length = Math.floor(audioCtx.sampleRate * 1.0);
    var buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function ensureContext() {
    if (ctx) return ctx;
    var AudioCtx = global.AudioContext || global.webkitAudioContext;
    if (!AudioCtx) return null;
    try {
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 1.0;
      masterGain.connect(ctx.destination);

      // Gentle low-pass filter keeps square/sawtooth chiptune crisp without harsh aliasing
      bgmFilter = ctx.createBiquadFilter();
      bgmFilter.type = 'lowpass';
      bgmFilter.frequency.value = 6800;
      bgmFilter.Q.value = 0.6;

      bgmGain = ctx.createGain();
      bgmGain.gain.value = getTargetBGMGain();
      bgmFilter.connect(bgmGain);
      bgmGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = sfxMuted ? 0 : SFX_NORMAL_GAIN;
      sfxGain.connect(masterGain);

      noiseBuffer = createNoiseBuffer(ctx);
      return ctx;
    } catch (_) {
      ctx = null;
      return null;
    }
  }

  function getTargetBGMGain() {
    if (bgmMuted) return 0;
    return isDucked ? BGM_DUCKED_GAIN : BGM_NORMAL_GAIN;
  }

  function applyBGMGain(rampSec) {
    if (!ctx || !bgmGain) return;
    var now = ctx.currentTime;
    var target = getTargetBGMGain();
    var dur = typeof rampSec === 'number' ? rampSec : 0.08;
    try {
      bgmGain.gain.cancelScheduledValues(now);
      bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
      if (dur <= 0.005) {
        bgmGain.gain.setValueAtTime(target, now);
      } else {
        bgmGain.gain.linearRampToValueAtTime(target, now + dur);
      }
    } catch (_) {
      bgmGain.gain.value = target;
    }
  }

  function applySFXGain() {
    if (!ctx || !sfxGain) return;
    var now = ctx.currentTime;
    var target = sfxMuted ? 0 : SFX_NORMAL_GAIN;
    try {
      sfxGain.gain.cancelScheduledValues(now);
      sfxGain.gain.setValueAtTime(target, now);
    } catch (_) {
      sfxGain.gain.value = target;
    }
  }

  function setDucking(duck) {
    var next = Boolean(duck);
    if (isDucked === next) return;
    isDucked = next;
    applyBGMGain(next ? 0.12 : 0.32);
  }

  function detachAutoUnlock() {
    if (!unlockAttached || !unlockHandler || typeof global.removeEventListener !== 'function') return;
    global.removeEventListener('pointerdown', unlockHandler, true);
    global.removeEventListener('keydown', unlockHandler, true);
    global.removeEventListener('touchstart', unlockHandler, true);
    global.removeEventListener('click', unlockHandler, true);
    unlockAttached = false;
    unlockHandler = null;
  }

  function resumeContext() {
    var audioCtx = ensureContext();
    if (!audioCtx) return false;
    if (audioCtx.state === 'suspended' && typeof audioCtx.resume === 'function') {
      try {
        var promise = audioCtx.resume();
        if (promise && typeof promise.then === 'function') {
          promise.then(function () {
            if (ctx && ctx.state === 'running') {
              detachAutoUnlock();
              if (currentTrack && !bgmMuted) {
                startScheduler();
              }
            }
          }).catch(function () {});
        }
      } catch (_) {
        // Ignore resume rejection prior to gesture
      }
    } else if (audioCtx.state === 'running') {
      detachAutoUnlock();
    }
    return true;
  }

  function attachAutoUnlock() {
    if (unlockAttached || typeof global.addEventListener !== 'function') return;
    unlockAttached = true;

    unlockHandler = function () {
      init();
      if (ctx && ctx.state === 'running') {
        detachAutoUnlock();
      }
    };

    global.addEventListener('pointerdown', unlockHandler, true);
    global.addEventListener('keydown', unlockHandler, true);
    global.addEventListener('touchstart', unlockHandler, true);
    global.addEventListener('click', unlockHandler, true);
  }

  // ============================================================================
  // Click-Free Synthesis Primitives
  // ============================================================================
  function scheduleTone(dest, opts) {
    if (!ctx || !dest) return;
    var freq = typeof opts.freq === 'number' ? opts.freq : noteToFreq(opts.note);
    if (!freq || freq <= 0) return;

    var start = opts.time;
    var dur = Math.max(0.02, opts.duration || 0.15);
    var peak = Math.max(0.0005, opts.gain || 0.25);
    var attack = Math.min(opts.attack !== undefined ? opts.attack : 0.008, dur * 0.35);
    var release = Math.min(opts.release !== undefined ? opts.release : 0.05, dur * 0.55);
    var sustainLevel = Math.max(0.0005, peak * (opts.sustain !== undefined ? opts.sustain : 0.72));
    var releaseStart = start + dur - release;
    var decayEnd = Math.min(start + attack + 0.04, releaseStart);

    var osc = ctx.createOscillator();
    var env = ctx.createGain();
    var filter = null;

    osc.type = opts.wave || 'square';
    osc.frequency.setValueAtTime(freq, start);

    if (opts.detune) {
      osc.detune.setValueAtTime(opts.detune, start);
    }
    if (opts.freqEnd && opts.freqEnd > 0) {
      var sweepDur = opts.sweepDuration || dur;
      osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, start + sweepDur);
    }

    // Smooth ADSR envelope prevents any audio clicks or pops
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(peak, start + attack);
    if (decayEnd > start + attack) {
      env.gain.linearRampToValueAtTime(sustainLevel, decayEnd);
    }
    env.gain.setValueAtTime(sustainLevel, releaseStart);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    if (opts.filterFreq) {
      filter = ctx.createBiquadFilter();
      filter.type = opts.filterType || 'lowpass';
      filter.frequency.setValueAtTime(opts.filterFreq, start);
      if (opts.filterEndFreq) {
        filter.frequency.exponentialRampToValueAtTime(opts.filterEndFreq, start + dur);
      }
      osc.connect(filter);
      filter.connect(env);
    } else {
      osc.connect(env);
    }

    env.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.015);
    osc.onended = function () {
      try {
        osc.disconnect();
        if (filter) filter.disconnect();
        env.disconnect();
      } catch (_) {}
    };
  }

  function scheduleNoise(dest, opts) {
    if (!ctx || !dest || !noiseBuffer) return;
    var start = opts.time;
    var dur = Math.max(0.02, opts.duration || 0.08);
    var peak = Math.max(0.0005, opts.gain || 0.15);
    var attack = Math.min(opts.attack !== undefined ? opts.attack : 0.003, dur * 0.3);

    var src = ctx.createBufferSource();
    src.buffer = noiseBuffer;

    var filter = ctx.createBiquadFilter();
    filter.type = opts.filterType || 'highpass';
    filter.frequency.setValueAtTime(opts.filterFreq || 2200, start);
    if (opts.filterEndFreq) {
      filter.frequency.exponentialRampToValueAtTime(opts.filterEndFreq, start + dur);
    }
    if (opts.q) filter.Q.value = opts.q;

    var env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.linearRampToValueAtTime(peak, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    src.connect(filter);
    filter.connect(env);
    env.connect(dest);

    src.start(start, Math.random() * 0.4, dur + 0.02);
    src.stop(start + dur + 0.015);
    src.onended = function () {
      try {
        src.disconnect();
        filter.disconnect();
        env.disconnect();
      } catch (_) {}
    };
  }

  function schedulePercussion(type, time) {
    if (!bgmFilter) return;
    if (type === 'K') {
      // Punchy 8-bit pitch-drop triangle kick
      scheduleTone(bgmFilter, {
        wave: 'triangle',
        freq: 155,
        freqEnd: 42,
        sweepDuration: 0.075,
        time: time,
        duration: 0.095,
        gain: 0.42,
        attack: 0.003,
        release: 0.06,
        sustain: 0.5
      });
    } else if (type === 'S') {
      // Crisp chiptune noise snare + subtle body tone
      scheduleNoise(bgmFilter, {
        time: time,
        duration: 0.085,
        gain: 0.20,
        filterType: 'bandpass',
        filterFreq: 1900,
        q: 0.9
      });
      scheduleTone(bgmFilter, {
        wave: 'triangle',
        freq: 210,
        freqEnd: 110,
        sweepDuration: 0.04,
        time: time,
        duration: 0.05,
        gain: 0.14,
        attack: 0.002,
        release: 0.035
      });
    } else if (type === 'H') {
      // Crisp tight 8-bit hi-hat tick
      scheduleNoise(bgmFilter, {
        time: time,
        duration: 0.032,
        gain: 0.095,
        filterType: 'highpass',
        filterFreq: 6200
      });
    }
  }

  // ============================================================================
  // BGM Lookahead Sequencer
  // ============================================================================
  function scheduleStep(track, stepIndex, time, stepDur) {
    if (!bgmFilter) return;

    // 1. Lead channel
    var leadEntry = track.lead[stepIndex];
    if (leadEntry) {
      var leadNote = typeof leadEntry === 'string' ? leadEntry : leadEntry.n;
      var leadSteps = typeof leadEntry === 'string' ? 1 : (leadEntry.d || 1);
      scheduleTone(bgmFilter, {
        wave: track.leadWave,
        note: leadNote,
        time: time,
        duration: Math.max(0.05, stepDur * leadSteps * 0.92),
        gain: track.leadGain,
        attack: track.leadAttack,
        release: track.leadRelease,
        sustain: track.leadWave === 'triangle' ? 0.8 : 0.65
      });
    }

    // 2. Harmony / Arpeggio channel (supports single notes or paired 16th subdivisions)
    var arpEntry = track.arp[stepIndex];
    if (arpEntry) {
      if (Array.isArray(arpEntry)) {
        var subDur = stepDur / arpEntry.length;
        for (var i = 0; i < arpEntry.length; i++) {
          if (arpEntry[i]) {
            scheduleTone(bgmFilter, {
              wave: track.arpWave,
              note: arpEntry[i],
              time: time + i * subDur,
              duration: Math.max(0.035, subDur * 0.86),
              gain: track.arpGain,
              attack: track.arpAttack,
              release: track.arpRelease,
              sustain: 0.55
            });
          }
        }
      } else {
        var arpNote = typeof arpEntry === 'string' ? arpEntry : arpEntry.n;
        var arpSteps = typeof arpEntry === 'string' ? 1 : (arpEntry.d || 1);
        scheduleTone(bgmFilter, {
          wave: track.arpWave,
          note: arpNote,
          time: time,
          duration: Math.max(0.04, stepDur * arpSteps * 0.84),
          gain: track.arpGain,
          attack: track.arpAttack,
          release: track.arpRelease,
          sustain: 0.55
        });
      }
    }

    // 3. Bass channel
    var bassEntry = track.bass[stepIndex];
    if (bassEntry) {
      var bassNote = typeof bassEntry === 'string' ? bassEntry : bassEntry.n;
      var bassSteps = typeof bassEntry === 'string' ? 1 : (bassEntry.d || 1);
      scheduleTone(bgmFilter, {
        wave: track.bassWave,
        note: bassNote,
        time: time,
        duration: Math.max(0.05, stepDur * bassSteps * 0.88),
        gain: track.bassGain,
        attack: track.bassAttack,
        release: track.bassRelease,
        sustain: 0.72,
        filterFreq: track.bassWave === 'sawtooth' ? 950 : undefined
      });
    }

    // 4. Optional Percussion channel (battle / boss)
    if (track.perc && track.perc[stepIndex]) {
      schedulePercussion(track.perc[stepIndex], time);
    }
  }

  function runScheduler() {
    if (!ctx || ctx.state !== 'running' || bgmMuted || !currentTrack) return;
    var track = TRACKS[currentTrack];
    if (!track) return;

    var stepDur = 60 / track.bpm / (track.stepsPerBeat || 2);
    var now = ctx.currentTime;

    // Guard against tab-switch clock jump so notes never bunch up
    if (nextNoteTime < now - 0.35) {
      nextNoteTime = now + 0.04;
    }

    while (nextNoteTime < now + SCHEDULE_AHEAD_SEC) {
      scheduleStep(track, currentStep, nextNoteTime, stepDur);
      nextNoteTime += stepDur;
      currentStep = (currentStep + 1) % track.steps;
    }
  }

  function startScheduler() {
    if (bgmMuted || !currentTrack || !TRACKS[currentTrack]) return;
    if (!ctx) return;

    applyBGMGain(0.18);
    if (schedulerId !== null) return;

    nextNoteTime = ctx.currentTime + 0.05;
    schedulerId = global.setInterval(runScheduler, SCHEDULER_INTERVAL_MS);
    runScheduler();
  }

  function stopScheduler() {
    if (schedulerId !== null) {
      global.clearInterval(schedulerId);
      schedulerId = null;
    }
  }

  // ============================================================================
  // 8-bit Sound Effects Suite
  // ============================================================================
  function playSFX(type) {
    if (sfxMuted) return;
    var audioCtx = ensureContext();
    if (!audioCtx || !sfxGain) return;
    if (audioCtx.state === 'suspended') {
      resumeContext();
    }

    var t = audioCtx.currentTime + 0.005;
    var key = String(type || '').toLowerCase();

    switch (key) {
      case 'click':
      case 'confirm': {
        scheduleTone(sfxGain, {
          wave: 'square',
          freq: 920,
          freqEnd: 1380,
          sweepDuration: 0.032,
          time: t,
          duration: 0.045,
          gain: 0.30,
          attack: 0.003,
          release: 0.025,
          sustain: 0.5
        });
        break;
      }

      case 'cancel': {
        scheduleTone(sfxGain, {
          wave: 'triangle',
          freq: 620,
          freqEnd: 380,
          sweepDuration: 0.05,
          time: t,
          duration: 0.065,
          gain: 0.34,
          attack: 0.003,
          release: 0.03
        });
        break;
      }

      case 'correct': {
        // Bright ascending major triad chime: C5 - E5 - G5 - C6
        var correctNotes = ['C5', 'E5', 'G5', 'C6'];
        for (var c = 0; c < correctNotes.length; c++) {
          var isLast = c === correctNotes.length - 1;
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: correctNotes[c],
            time: t + c * 0.062,
            duration: isLast ? 0.28 : 0.11,
            gain: isLast ? 0.50 : 0.42,
            attack: 0.005,
            release: isLast ? 0.16 : 0.05,
            sustain: 0.72
          });
          scheduleTone(sfxGain, {
            wave: 'square',
            note: correctNotes[c],
            time: t + c * 0.062,
            duration: isLast ? 0.22 : 0.08,
            gain: 0.16,
            attack: 0.005,
            release: isLast ? 0.12 : 0.04,
            sustain: 0.5
          });
        }
        break;
      }

      case 'break':
      case 'crit': {
        // Dramatic impact noise burst + low punch + shimmering golden power chord arpeggio
        scheduleNoise(sfxGain, {
          time: t,
          duration: 0.15,
          gain: 0.48,
          filterType: 'bandpass',
          filterFreq: 1600,
          filterEndFreq: 340,
          q: 0.8
        });
        scheduleTone(sfxGain, {
          wave: 'triangle',
          freq: 200,
          freqEnd: 44,
          sweepDuration: 0.12,
          time: t,
          duration: 0.15,
          gain: 0.58,
          attack: 0.003,
          release: 0.08
        });
        var goldenArp = ['C5', 'G5', 'C6', 'E6', 'G6', 'C7'];
        for (var g = 0; g < goldenArp.length; g++) {
          var isPeak = g === goldenArp.length - 1;
          scheduleTone(sfxGain, {
            wave: 'square',
            note: goldenArp[g],
            time: t + 0.03 + g * 0.038,
            duration: isPeak ? 0.34 : 0.13,
            gain: isPeak ? 0.28 : 0.22,
            attack: 0.004,
            release: isPeak ? 0.22 : 0.06
          });
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: goldenArp[g],
            time: t + 0.03 + g * 0.038,
            duration: isPeak ? 0.40 : 0.15,
            gain: isPeak ? 0.42 : 0.30,
            attack: 0.004,
            release: isPeak ? 0.26 : 0.07
          });
        }
        break;
      }

      case 'wrong':
      case 'damage': {
        // Dissonant low descending square/saw buzz: Eb3 -> B2
        var wrongSteps = [
          { note: 'Eb3', offset: 0, dur: 0.14 },
          { note: 'B2', offset: 0.13, dur: 0.24 }
        ];
        for (var w = 0; w < wrongSteps.length; w++) {
          scheduleTone(sfxGain, {
            wave: 'square',
            note: wrongSteps[w].note,
            time: t + wrongSteps[w].offset,
            duration: wrongSteps[w].dur,
            gain: 0.30,
            attack: 0.006,
            release: 0.06,
            filterFreq: 1350
          });
          scheduleTone(sfxGain, {
            wave: 'sawtooth',
            note: wrongSteps[w].note,
            detune: -18,
            time: t + wrongSteps[w].offset,
            duration: wrongSteps[w].dur,
            gain: 0.24,
            attack: 0.006,
            release: 0.06,
            filterFreq: 1150
          });
        }
        break;
      }

      case 'levelup': {
        // Classic heroic JRPG fanfare: G4-G4-G4-C5-D5-E5-G5
        var fanfare = [
          { n: 'G4', o: 0.00, d: 0.085 },
          { n: 'G4', o: 0.095, d: 0.085 },
          { n: 'G4', o: 0.19, d: 0.085 },
          { n: 'C5', o: 0.30, d: 0.15 },
          { n: 'D5', o: 0.46, d: 0.15 },
          { n: 'E5', o: 0.62, d: 0.15 },
          { n: 'G5', o: 0.78, d: 0.48 }
        ];
        for (var l = 0; l < fanfare.length; l++) {
          var fItem = fanfare[l];
          scheduleTone(sfxGain, {
            wave: 'square',
            note: fItem.n,
            time: t + fItem.o,
            duration: fItem.d,
            gain: 0.27,
            attack: 0.006,
            release: l === fanfare.length - 1 ? 0.24 : 0.04,
            sustain: 0.72
          });
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: fItem.n,
            time: t + fItem.o,
            duration: fItem.d + 0.03,
            gain: 0.34,
            attack: 0.006,
            release: l === fanfare.length - 1 ? 0.28 : 0.05
          });
        }
        // Final triumphant harmony chord underneath G5
        scheduleTone(sfxGain, {
          wave: 'triangle',
          note: 'C5',
          time: t + 0.78,
          duration: 0.48,
          gain: 0.28,
          attack: 0.01,
          release: 0.24
        });
        scheduleTone(sfxGain, {
          wave: 'triangle',
          note: 'E5',
          time: t + 0.78,
          duration: 0.48,
          gain: 0.26,
          attack: 0.01,
          release: 0.24
        });
        break;
      }

      case 'chest': {
        // Sparkling treasure discovery chime: E5 - G#5 - B5 - E6
        var chestNotes = ['E5', 'G#5', 'B5', 'E6'];
        for (var ch = 0; ch < chestNotes.length; ch++) {
          var chestEnd = ch === chestNotes.length - 1;
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: chestNotes[ch],
            time: t + ch * 0.082,
            duration: chestEnd ? 0.42 : 0.14,
            gain: chestEnd ? 0.48 : 0.40,
            attack: 0.005,
            release: chestEnd ? 0.26 : 0.06
          });
          scheduleTone(sfxGain, {
            wave: 'square',
            note: chestNotes[ch],
            time: t + ch * 0.082,
            duration: chestEnd ? 0.30 : 0.10,
            gain: 0.16,
            attack: 0.005,
            release: chestEnd ? 0.18 : 0.05
          });
        }
        // High crystalline sparkle
        scheduleTone(sfxGain, {
          wave: 'sine',
          note: 'B6',
          time: t + 0.27,
          duration: 0.34,
          gain: 0.18,
          attack: 0.008,
          release: 0.25
        });
        break;
      }

      case 'skill': {
        // Mystical spirit-cyan frequency sweep + shimmer bell
        scheduleTone(sfxGain, {
          wave: 'sine',
          freq: 320,
          freqEnd: 1520,
          sweepDuration: 0.22,
          time: t,
          duration: 0.26,
          gain: 0.38,
          attack: 0.012,
          release: 0.10
        });
        scheduleTone(sfxGain, {
          wave: 'triangle',
          freq: 480,
          freqEnd: 1960,
          sweepDuration: 0.20,
          time: t + 0.02,
          duration: 0.24,
          gain: 0.24,
          attack: 0.01,
          release: 0.10
        });
        var bellNotes = ['A5', 'E6', 'B6'];
        for (var b = 0; b < bellNotes.length; b++) {
          scheduleTone(sfxGain, {
            wave: 'sine',
            note: bellNotes[b],
            time: t + 0.14 + b * 0.045,
            duration: 0.34,
            gain: 0.26 - b * 0.04,
            attack: 0.005,
            release: 0.24
          });
        }
        break;
      }

      case 'heal': {
        // Soft rising crystalline chime: C5 - F5 - A5 - C6
        var healNotes = ['C5', 'F5', 'A5', 'C6'];
        for (var h = 0; h < healNotes.length; h++) {
          var healEnd = h === healNotes.length - 1;
          scheduleTone(sfxGain, {
            wave: 'sine',
            note: healNotes[h],
            time: t + h * 0.08,
            duration: healEnd ? 0.42 : 0.18,
            gain: 0.36,
            attack: 0.012,
            release: healEnd ? 0.28 : 0.10,
            sustain: 0.65
          });
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: healNotes[h],
            time: t + h * 0.08,
            duration: healEnd ? 0.36 : 0.14,
            gain: 0.18,
            attack: 0.01,
            release: healEnd ? 0.22 : 0.08
          });
        }
        scheduleTone(sfxGain, {
          wave: 'sine',
          note: 'F6',
          time: t + 0.27,
          duration: 0.35,
          gain: 0.14,
          attack: 0.015,
          release: 0.26
        });
        break;
      }

      case 'boss_enter': {
        // Ominous low rumbling brass chord with dark filter swell
        var brassChord = [
          { note: 'D2', detune: -6, gain: 0.34 },
          { note: 'A2', detune: 5, gain: 0.28 },
          { note: 'Eb3', detune: -8, gain: 0.24 },
          { note: 'F3', detune: 7, gain: 0.22 }
        ];
        for (var br = 0; br < brassChord.length; br++) {
          scheduleTone(sfxGain, {
            wave: 'sawtooth',
            note: brassChord[br].note,
            detune: brassChord[br].detune,
            time: t,
            duration: 0.95,
            gain: brassChord[br].gain,
            attack: 0.10,
            release: 0.40,
            sustain: 0.78,
            filterType: 'lowpass',
            filterFreq: 240,
            filterEndFreq: 980
          });
        }
        scheduleNoise(sfxGain, {
          time: t,
          duration: 0.75,
          gain: 0.26,
          attack: 0.08,
          filterType: 'lowpass',
          filterFreq: 260,
          filterEndFreq: 110
        });
        break;
      }

      case 'victory': {
        // Triumphant classic JRPG victory motif
        var motif = [
          { n: 'C5', o: 0.00, d: 0.095 },
          { n: 'C5', o: 0.105, d: 0.095 },
          { n: 'C5', o: 0.21, d: 0.095 },
          { n: 'C5', o: 0.32, d: 0.26 },
          { n: 'Ab4', o: 0.60, d: 0.24 },
          { n: 'Bb4', o: 0.86, d: 0.24 },
          { n: 'C5', o: 1.12, d: 0.14 },
          { n: 'Bb4', o: 1.28, d: 0.10 },
          { n: 'C5', o: 1.40, d: 0.56 }
        ];
        for (var v = 0; v < motif.length; v++) {
          var m = motif[v];
          var isFinal = v === motif.length - 1;
          scheduleTone(sfxGain, {
            wave: 'square',
            note: m.n,
            time: t + m.o,
            duration: m.d,
            gain: 0.27,
            attack: 0.006,
            release: isFinal ? 0.28 : 0.04,
            sustain: 0.72
          });
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: m.n,
            time: t + m.o,
            duration: m.d + 0.02,
            gain: 0.34,
            attack: 0.006,
            release: isFinal ? 0.30 : 0.05
          });
        }
        // Grand C-major chord swell on the final sustained victory note
        var vicChord = ['E5', 'G5', 'C6'];
        for (var vc = 0; vc < vicChord.length; vc++) {
          scheduleTone(sfxGain, {
            wave: 'triangle',
            note: vicChord[vc],
            time: t + 1.40,
            duration: 0.58,
            gain: 0.24,
            attack: 0.015,
            release: 0.30
          });
        }
        break;
      }

      default: {
        // Safe fallback crisp blip for any unrecognized SFX name
        scheduleTone(sfxGain, {
          wave: 'triangle',
          freq: 760,
          time: t,
          duration: 0.05,
          gain: 0.25,
          attack: 0.004,
          release: 0.025
        });
        break;
      }
    }
  }

  // ============================================================================
  // Web Speech API (ja-JP) Pronunciation Engine
  // ============================================================================
  function scoreJapaneseVoice(voice) {
    if (!voice || !voice.lang) return -1;
    var lang = String(voice.lang).toLowerCase();
    if (lang !== 'ja-jp' && lang.indexOf('ja') !== 0) return -1;

    var score = lang === 'ja-jp' ? 100 : 60;
    var name = String(voice.name || '');

    // Prefer high-quality natural Japanese voices when available
    if (/nanami|keita|natural|neural/i.test(name)) score += 50;
    if (/google\s*日本語|google.*japanese/i.test(name)) score += 45;
    if (/kyoko|otoya|hattori|o-ren/i.test(name)) score += 40;
    if (/haruka|ayumi|ichiro|sayaka|microsoft/i.test(name)) score += 32;
    if (voice.localService) score += 6;
    if (voice.default) score += 4;
    return score;
  }

  function loadVoices() {
    if (!speechAvailable) return null;
    try {
      var voices = global.speechSynthesis.getVoices();
      if (!voices || !voices.length) return selectedVoice;

      var bestVoice = null;
      var bestScore = -1;
      for (var i = 0; i < voices.length; i++) {
        var score = scoreJapaneseVoice(voices[i]);
        if (score > bestScore) {
          bestScore = score;
          bestVoice = voices[i];
        }
      }
      if (bestVoice) {
        selectedVoice = bestVoice;
        jpVoiceReady = true;
      }
      return selectedVoice;
    } catch (_) {
      return null;
    }
  }

  function initSpeechVoices() {
    if (!speechAvailable) return;
    loadVoices();
    try {
      global.speechSynthesis.onvoiceschanged = loadVoices;
    } catch (_) {}
    // Safe fallback retries for browsers that populate voice lists lazily
    global.setTimeout(function () {
      if (!jpVoiceReady) loadVoices();
    }, 250);
    global.setTimeout(function () {
      if (!jpVoiceReady) loadVoices();
    }, 1000);
  }

  function sanitizeSpeechText(raw) {
    if (raw === null || raw === undefined) return '';
    return String(raw)
      .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
      .replace(/<rp\b[^>]*>[\s\S]*?<\/rp>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function clearSpeechWatchdog() {
    if (speechWatchdogId !== null) {
      global.clearTimeout(speechWatchdogId);
      speechWatchdogId = null;
    }
  }

  function safeInvoke(fn) {
    if (typeof fn === 'function') {
      try {
        fn();
      } catch (_) {}
    }
  }

  function stopSpeak() {
    speechToken += 1;
    clearSpeechWatchdog();
    currentUtterance = null;
    if (speechAvailable) {
      try {
        global.speechSynthesis.cancel();
      } catch (_) {}
    }
    setDucking(false);
  }

  function speak(text, rate, onEnd) {
    var cleanText = sanitizeSpeechText(text);
    if (!cleanText || !speechAvailable) {
      setDucking(false);
      safeInvoke(onEnd);
      return false;
    }

    // Attempt lazy voice discovery if voices weren't ready on first boot
    if (!selectedVoice) {
      loadVoices();
    }

    var parsedRate = Number(rate);
    var clampedRate = Number.isFinite(parsedRate)
      ? Math.max(0.5, Math.min(1.5, parsedRate))
      : 1.0;

    // Cancel any active utterance cleanly and advance token
    speechToken += 1;
    var myToken = speechToken;
    clearSpeechWatchdog();
    currentUtterance = null;

    try {
      global.speechSynthesis.cancel();
      if (global.speechSynthesis.paused) {
        global.speechSynthesis.resume();
      }
    } catch (_) {}

    var finished = false;
    var finalize = function () {
      if (finished || myToken !== speechToken) return;
      finished = true;
      clearSpeechWatchdog();
      currentUtterance = null;
      setDucking(false);
      safeInvoke(onEnd);
    };

    try {
      var utterance = new global.SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'ja-JP';
      utterance.rate = clampedRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onend = finalize;
      utterance.onerror = finalize;

      // Hold strong reference to prevent Chromium GC from dropping onend
      currentUtterance = utterance;
      setDucking(true);

      // Watchdog guarantees BGM restores even if a browser drops onend
      var maxWaitMs = Math.max(8000, Math.ceil((cleanText.length * 650) / clampedRate) + 2500);
      speechWatchdogId = global.setTimeout(finalize, maxWaitMs);

      global.speechSynthesis.speak(utterance);
      return true;
    } catch (_) {
      finalize();
      return false;
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================
  function init() {
    initSpeechVoices();
    var audioCtx = ensureContext();
    if (!audioCtx) return false;
    resumeContext();
    applyBGMGain(0.05);
    applySFXGain();
    if (currentTrack && !bgmMuted && audioCtx.state === 'running') {
      startScheduler();
    }
    return true;
  }

  function playBGM(trackName) {
    if (!trackName || !TRACKS[trackName]) return;
    var trackChanged = currentTrack !== trackName;
    currentTrack = trackName;

    if (trackChanged) {
      currentStep = 0;
    }

    ensureContext();
    if (ctx && ctx.state === 'suspended') {
      resumeContext();
    }

    if (bgmMuted) {
      stopScheduler();
      return;
    }

    if (ctx && ctx.state === 'running') {
      if (trackChanged) {
        nextNoteTime = ctx.currentTime + 0.04;
      }
      startScheduler();
    }
  }

  function stopBGM() {
    currentTrack = null;
    currentStep = 0;
    stopScheduler();
    if (ctx && bgmGain) {
      var now = ctx.currentTime;
      try {
        bgmGain.gain.cancelScheduledValues(now);
        bgmGain.gain.setValueAtTime(bgmGain.gain.value, now);
        bgmGain.gain.linearRampToValueAtTime(0, now + 0.06);
      } catch (_) {
        bgmGain.gain.value = 0;
      }
    }
  }

  function setBGMMuted(muted) {
    bgmMuted = Boolean(muted);
    saveSettings();
    if (bgmMuted) {
      applyBGMGain(0.05);
      stopScheduler();
    } else {
      ensureContext();
      resumeContext();
      applyBGMGain(0.15);
      if (currentTrack && ctx && ctx.state === 'running') {
        startScheduler();
      }
    }
  }

  function setSFXMuted(muted) {
    sfxMuted = Boolean(muted);
    saveSettings();
    applySFXGain();
  }

  function toggleBGM() {
    setBGMMuted(!bgmMuted);
    return bgmMuted;
  }

  function toggleSFX() {
    setSFXMuted(!sfxMuted);
    return sfxMuted;
  }

  function getState() {
    return {
      bgmMuted: bgmMuted,
      sfxMuted: sfxMuted,
      currentTrack: currentTrack,
      speechAvailable: speechAvailable,
      jpVoiceReady: jpVoiceReady
    };
  }

  // Bootstrap persisted settings, auto-unlock listeners, and Japanese TTS voices
  loadSettings();
  attachAutoUnlock();
  initSpeechVoices();

  global.AudioEngine = {
    init: init,
    playBGM: playBGM,
    stopBGM: stopBGM,
    toggleBGM: toggleBGM,
    toggleSFX: toggleSFX,
    setBGMMuted: setBGMMuted,
    setSFXMuted: setSFXMuted,
    getState: getState,
    playSFX: playSFX,
    speak: speak,
    stopSpeak: stopSpeak
  };
})(typeof window !== 'undefined' ? window : globalThis);
