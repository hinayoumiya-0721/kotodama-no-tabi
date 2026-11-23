/* ==========================================================================
   言霊の旅 (Kotodama no Tabi) — Procedural Dark-Fantasy JRPG SVG Art Engine
   Unified Cel-Shaded Japanese Anime Rig + Multi-Layered Dark-Fantasy Art
   Zero-dependency Vanilla ES6+ | Global: window.SVGArt
   Every SVG uses unique uid() <defs> IDs so zero DOM ID collisions occur.
   ========================================================================== */
(function (global) {
  'use strict';

  var _uidSeq = 0;

  function uid(prefix) {
    _uidSeq += 1;
    return 'sa_' + (prefix || 'id') + '_' + _uidSeq;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toSet(listOrSet) {
    var s = new Set();
    if (!listOrSet) return s;
    if (listOrSet instanceof Set) return listOrSet;
    if (Array.isArray(listOrSet)) {
      for (var i = 0; i < listOrSet.length; i++) s.add(listOrSet[i]);
    }
    return s;
  }

  var FONT_SERIF = "'Yu Mincho','Hiragino Mincho ProN','Noto Serif JP','MS PMincho',serif";
  var FONT_SANS = "'Yu Gothic','Hiragino Sans','Meiryo',sans-serif";
  var ORIGIN_CENTER = 'style="transform-box:fill-box;transform-origin:center;"';

  /* ------------------------------------------------------------------------
     Shared SVG Primitives & Reusable Arcane Components
     ------------------------------------------------------------------------ */

  function defsGlow(id, stdDev) {
    var sd = stdDev || 3;
    return (
      '<filter id="' + id + '" x="-40%" y="-40%" width="180%" height="180%">' +
        '<feGaussianBlur stdDeviation="' + sd + '" result="blur"/>' +
        '<feMerge>' +
          '<feMergeNode in="blur"/>' +
          '<feMergeNode in="SourceGraphic"/>' +
        '</feMerge>' +
      '</filter>'
    );
  }

  function defsSoftShadow(id) {
    return (
      '<filter id="' + id + '" x="-30%" y="-30%" width="160%" height="160%">' +
        '<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#03050c" flood-opacity="0.72"/>' +
      '</filter>'
    );
  }

  function sparkle(x, y, r, color, opacity) {
    var op = opacity == null ? 0.9 : opacity;
    var ir = (r * 0.26).toFixed(2);
    var d =
      'M' + x + ',' + (y - r) +
      ' Q' + (x + +ir) + ',' + (y - +ir) + ' ' + (x + r) + ',' + y +
      ' Q' + (x + +ir) + ',' + (y + +ir) + ' ' + x + ',' + (y + r) +
      ' Q' + (x - +ir) + ',' + (y + +ir) + ' ' + (x - r) + ',' + y +
      ' Q' + (x - +ir) + ',' + (y - +ir) + ' ' + x + ',' + (y - r) + 'Z';
    return '<path d="' + d + '" fill="' + (color || '#fde68a') + '" opacity="' + op + '"/>';
  }

  function polygonStar(cx, cy, rOuter, rInner, points) {
    var pts = [];
    for (var i = 0; i < points * 2; i++) {
      var a = (Math.PI * i) / points - Math.PI / 2;
      var rad = i % 2 === 0 ? rOuter : rInner;
      pts.push((cx + Math.cos(a) * rad).toFixed(1) + ',' + (cy + Math.sin(a) * rad).toFixed(1));
    }
    return pts.join(' ');
  }

  function regularPolygon(cx, cy, r, sides, rotDeg) {
    var pts = [];
    var rot = ((rotDeg || 0) * Math.PI) / 180;
    for (var i = 0; i < sides; i++) {
      var a = (Math.PI * 2 * i) / sides + rot;
      pts.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1));
    }
    return pts.join(' ');
  }

  function sakuraPetal(cx, cy, scale, rotDeg, color, opacity) {
    var s = scale || 1;
    var op = opacity == null ? 0.88 : opacity;
    return (
      '<g transform="translate(' + cx + ',' + cy + ') rotate(' + (rotDeg || 0) + ') scale(' + s + ')" opacity="' + op + '">' +
        '<path d="M0,-10 C5,-8 8,-2 5,5 C3,8 1,10 0,11 C-1,10 -3,8 -5,5 C-8,-2 -5,-8 0,-10 L-1.4,-6.2 L0,-4.4 L1.4,-6.2 Z" fill="' + (color || '#fbcfe8') + '" stroke="#ffffff" stroke-width="0.6"/>' +
      '</g>'
    );
  }

  function magicCircle(cx, cy, r, opts) {
    opts = opts || {};
    var primary = opts.primary || '#d4af37';
    var secondary = opts.secondary || '#38e8ff';
    var bgGlowId = opts.bgGlowId || '';
    var kanji = opts.kanji || '';
    var kanjiSize = opts.kanjiSize || Math.round(r * 0.92);
    var kanjiOpacity = opts.kanjiOpacity != null ? opts.kanjiOpacity : 0.14;
    var opacity = opts.opacity != null ? opts.opacity : 0.85;
    var ringRunes = opts.runes || ['言', '霊', '魂', '光', '闇', '韻', '知', '道'];

    var ticks = '';
    var nTicks = 16;
    for (var i = 0; i < nTicks; i++) {
      var ang = (Math.PI * 2 * i) / nTicks;
      var r1 = i % 2 === 0 ? r * 0.89 : r * 0.93;
      var r2 = r * 1.0;
      ticks +=
        '<line x1="' + (cx + Math.cos(ang) * r1).toFixed(1) +
        '" y1="' + (cy + Math.sin(ang) * r1).toFixed(1) +
        '" x2="' + (cx + Math.cos(ang) * r2).toFixed(1) +
        '" y2="' + (cy + Math.sin(ang) * r2).toFixed(1) +
        '" stroke="' + primary + '" stroke-width="' + (i % 4 === 0 ? 1.8 : 0.9) + '" opacity="0.72"/>';
    }

    var runeRing = '';
    for (var j = 0; j < 8; j++) {
      var a2 = (Math.PI * 2 * j) / 8 - Math.PI / 2;
      var rx = cx + Math.cos(a2) * (r * 0.77);
      var ry = cy + Math.sin(a2) * (r * 0.77);
      runeRing +=
        '<text x="' + rx.toFixed(1) + '" y="' + (ry + 3.5).toFixed(1) +
        '" text-anchor="middle" font-size="' + Math.max(7, Math.round(r * 0.12)) +
        '" font-family="' + FONT_SERIF + '" fill="' + secondary + '" opacity="0.62">' +
        ringRunes[j % ringRunes.length] + '</text>';
    }

    var out = '<g opacity="' + opacity + '">';
    if (bgGlowId) {
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 1.12).toFixed(1) + '" fill="url(#' + bgGlowId + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>';
    }

    out +=
      '<g class="svg-magic-ring" ' + ORIGIN_CENTER + '>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + primary + '" stroke-width="1.6" opacity="0.82"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.91).toFixed(1) + '" fill="none" stroke="' + primary + '" stroke-width="0.9" stroke-dasharray="5 3" opacity="0.65"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.67).toFixed(1) + '" fill="none" stroke="' + secondary + '" stroke-width="1.1" opacity="0.58"/>' +
        ticks +
        '<polygon points="' + regularPolygon(cx, cy, r * 0.88, 6, -90) + '" fill="none" stroke="' + primary + '" stroke-width="0.95" opacity="0.45"/>' +
        '<polygon points="' + regularPolygon(cx, cy, r * 0.88, 6, -60) + '" fill="none" stroke="' + secondary + '" stroke-width="0.8" opacity="0.38"/>' +
        runeRing +
      '</g>';

    out +=
      '<g class="svg-magic-ring-rev" ' + ORIGIN_CENTER + '>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.56).toFixed(1) + '" fill="none" stroke="' + primary + '" stroke-width="1" stroke-dasharray="2 4" opacity="0.68"/>' +
        '<polygon points="' + polygonStar(cx, cy, r * 0.55, r * 0.28, 8) + '" fill="none" stroke="' + secondary + '" stroke-width="0.9" opacity="0.46"/>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + (r * 0.34).toFixed(1) + '" fill="none" stroke="' + primary + '" stroke-width="0.8" opacity="0.5"/>' +
      '</g>';

    if (kanji) {
      out +=
        '<text x="' + cx + '" y="' + (cy + kanjiSize * 0.34).toFixed(1) +
        '" text-anchor="middle" font-size="' + kanjiSize + '" font-weight="700" font-family="' + FONT_SERIF +
        '" fill="' + secondary + '" opacity="' + kanjiOpacity + '">' + esc(kanji) + '</text>' +
        '<text x="' + cx + '" y="' + (cy + kanjiSize * 0.34).toFixed(1) +
        '" text-anchor="middle" font-size="' + kanjiSize + '" font-weight="700" font-family="' + FONT_SERIF +
        '" fill="none" stroke="' + primary + '" stroke-width="0.9" opacity="' + Math.min(0.45, kanjiOpacity + 0.14).toFixed(2) + '">' + esc(kanji) + '</text>';
    }

    out += '</g>';
    return out;
  }

  function floatingMotes(points, color1, color2) {
    var out = '<g class="svg-float" ' + ORIGIN_CENTER + '>';
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var col = i % 2 === 0 ? (color1 || '#5de6ff') : (color2 || '#f7df8b');
      if (p[2] >= 3) {
        out += sparkle(p[0], p[1], p[2] * 1.4, col, p[3] || 0.85);
      } else {
        out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + col + '" opacity="' + (p[3] || 0.75) + '"/>';
      }
    }
    out += '</g>';
    return out;
  }

  function shatteredKanji(items, glowId) {
    var out = '<g class="svg-float" ' + (glowId ? 'filter="url(#' + glowId + ')" ' : '') + ORIGIN_CENTER + '>';
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var x = it[0], y = it[1], ch = it[2], rot = it[3] || 0, col = it[4] || '#fde68a', sz = it[5] || 16;
      out +=
        '<g transform="translate(' + x + ',' + y + ') rotate(' + rot + ')">' +
          '<polygon points="0,-' + (sz * 0.85).toFixed(1) + ' ' + (sz * 0.72).toFixed(1) + ',0 0,' + (sz * 0.85).toFixed(1) + ' -' + (sz * 0.72).toFixed(1) + ',0" fill="#090d1f" fill-opacity="0.72" stroke="' + col + '" stroke-width="1.1"/>' +
          '<text x="0" y="' + (sz * 0.34).toFixed(1) + '" text-anchor="middle" font-size="' + sz + '" font-weight="700" font-family="' + FONT_SERIF + '" fill="' + col + '">' + esc(ch) + '</text>' +
        '</g>';
    }
    out += '</g>';
    return out;
  }

  /* ========================================================================
     PART 1: UNIFIED SHARED ANIME CHARACTER RIG & CEL-SHADING PIPELINE
     window.SVGArt.renderAnimeCharacter(config)
     Used by ALL 3 Hero Classes, ALL 4 Town NPCs, and ALL Humanoid Bosses!
     ======================================================================== */

  function normalizeAnimeMood(mood) {
    var m = String(mood || 'idle').toLowerCase();
    if (
      m === 'idle' || m === 'neutral' ||
      m === 'attack' || m === 'happy' ||
      m === 'hurt' || m === 'serious' ||
      m === 'victory' || m === 'surprised'
    ) {
      return m;
    }
    if (m === 'hit' || m === 'break' || m === 'defeat') return 'hurt';
    return 'idle';
  }

  function renderBackHair(style, ctx) {
    var hFill = 'url(#' + ctx.gHair + ')';
    var hDark = ctx.hairShadow;
    var hLine = ctx.hairLine;
    switch (style) {
      case 'spikyShort':
        return (
          '<g>' +
            '<path d="M98,118 C82,138 78,162 88,184 L106,174 L94,198 C108,194 118,186 124,176 L196,176 C202,186 212,194 226,198 L214,174 L232,184 C242,162 238,138 222,118 C216,76 194,52 160,52 C126,52 104,76 98,118 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.8" stroke-linejoin="round"/>' +
            '<path d="M90,148 L74,160 L92,166 L82,180 L104,178 M230,148 L246,160 L228,166 L238,180 L216,178" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.5" stroke-linejoin="round"/>' +
          '</g>'
        );
      case 'midLongViolet':
        return (
          '<g>' +
            '<path d="M96,104 C82,144 76,204 82,262 C94,256 102,246 108,236 C112,254 118,268 128,278 L192,278 C202,268 208,254 212,236 C218,246 226,256 238,262 C244,204 238,144 224,104 C214,66 190,48 160,48 C130,48 106,66 96,104 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.8"/>' +
            '<path d="M92,162 C84,196 86,230 96,254 C102,238 106,214 108,194 Z" fill="' + hFill + '" opacity="0.65"/>' +
            '<path d="M228,162 C236,196 234,230 224,254 C218,238 214,214 212,194 Z" fill="' + hFill + '" opacity="0.65"/>' +
          '</g>'
        );
      case 'wavyShoulder':
        return (
          '<g>' +
            '<path d="M98,108 C84,136 86,166 78,196 C74,212 82,226 98,232 C104,218 112,210 120,214 L200,214 C208,210 216,218 222,232 C238,226 246,212 242,196 C234,166 236,136 222,108 C212,68 190,50 160,50 C130,50 108,68 98,108 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.8"/>' +
            '<path d="M88,164 C78,184 82,208 94,224 C96,206 100,192 108,180 Z" fill="' + hFill + '" opacity="0.6"/>' +
            '<path d="M232,164 C242,184 238,208 226,224 C224,206 220,192 212,180 Z" fill="' + hFill + '" opacity="0.6"/>' +
          '</g>'
        );
      case 'elderSwept':
        return (
          '<g>' +
            '<path d="M98,106 C86,134 86,174 96,206 C106,214 118,216 128,210 L192,210 C202,216 214,214 224,206 C234,174 234,134 222,106 C214,66 190,50 160,50 C130,50 106,66 98,106 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.8"/>' +
            '<path d="M92,150 C88,174 92,194 102,204 M228,150 C232,174 228,194 218,204" fill="none" stroke="' + hLine + '" stroke-width="1.2" opacity="0.5"/>' +
          '</g>'
        );
      case 'highPonytail':
        return (
          '<g>' +
            // Sweeping dynamic high ponytail cascading behind right shoulder
            '<path d="M188,68 C222,52 252,72 258,114 C264,156 246,196 264,230 C244,224 232,210 226,192 C222,210 218,224 206,236 C212,198 208,154 200,118 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.8" stroke-linejoin="round"/>' +
            '<path d="M196,78 C222,74 242,96 244,132 C246,162 234,186 242,208 C230,194 224,172 224,148 C220,120 210,96 196,78 Z" fill="' + hDark + '" opacity="0.52"/>' +
            // Hair tie band
            '<path d="M184,62 C196,56 208,64 206,78 C196,82 186,78 182,70 Z" fill="#d4af37" stroke="#5c3a0e" stroke-width="1.3"/>' +
            // Back skull crown
            '<path d="M100,112 C94,146 98,176 112,192 L208,192 C222,176 226,146 220,112 C214,68 190,50 160,50 C130,50 106,68 100,112 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.7"/>' +
          '</g>'
        );
      case 'longStraight':
        return (
          '<g>' +
            '<path d="M96,102 C84,152 80,224 84,296 L112,286 L120,302 L200,302 L208,286 L236,296 C240,224 236,152 224,102 C214,64 190,46 160,46 C130,46 106,64 96,102 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.8"/>' +
            '<path d="M94,148 L92,278 M226,148 L228,278" stroke="' + hFill + '" stroke-width="4" opacity="0.38" stroke-linecap="round"/>' +
          '</g>'
        );
      case 'sacredFlowing':
        return (
          '<g>' +
            '<path d="M92,102 C74,156 64,228 74,306 C92,298 106,288 118,274 L126,304 L194,304 L202,274 C214,288 228,298 246,306 C256,228 246,156 228,102 C216,60 192,44 160,44 C128,44 104,60 92,102 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.8"/>' +
            '<path d="M100,126 C88,176 84,234 94,288 L120,274 L124,294 L196,294 L200,274 L226,288 C236,234 232,176 220,126 Z" fill="' + hDark + '" opacity="0.58"/>' +
            '<path d="M84,200 C74,234 76,268 86,292 M236,200 C246,234 244,268 234,292" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.48"/>' +
          '</g>'
        );
      case 'bossLongWild':
        return (
          '<g>' +
            '<path d="M88,106 C64,148 52,208 62,278 L86,256 L78,294 L112,270 L122,296 L198,296 L208,270 L242,294 L234,256 L258,278 C268,208 256,148 232,106 C218,62 192,44 160,44 C128,44 102,62 88,106 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.9" stroke-linejoin="round"/>' +
            '<path d="M78,154 L56,178 L78,192 L64,226 L94,218 M242,154 L264,178 L242,192 L256,226 L226,218" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.6" stroke-linejoin="round"/>' +
          '</g>'
        );
      case 'none':
        return '';
      default:
        return (
          '<path d="M96,112 C86,154 88,202 104,234 L216,234 C232,202 234,154 224,112 C214,68 190,50 160,50 C130,50 106,68 96,112 Z" fill="' + hDark + '" stroke="' + hLine + '" stroke-width="1.8"/>'
        );
    }
  }

  function renderFrontHair(style, ctx) {
    var hFill = 'url(#' + ctx.gHair + ')';
    var hDark = ctx.hairShadow;
    var hLine = ctx.hairLine;
    var hHi = 'url(#' + ctx.gHairHi + ')';
    if (style === 'none') return '';

    // Side-framing locks (側鬢角) hugging cheeks & jaw gracefully
    var sideLocks = '';
    if (style === 'spikyShort' || style === 'elderSwept') {
      sideLocks =
        '<path d="M108,104 C98,128 96,156 106,184 C112,172 114,150 116,126 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M212,104 C222,128 224,156 214,184 C208,172 206,150 204,126 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.5" stroke-linejoin="round"/>';
    } else if (style === 'highPonytail') {
      sideLocks =
        '<path d="M106,102 C94,132 94,168 110,198 C114,182 114,156 116,126 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.5"/>' +
        '<path d="M214,102 C226,132 226,168 210,198 C206,182 206,156 204,126 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.5"/>' +
        // Cute stray swept wisps
        '<path d="M102,162 C92,174 92,188 102,196" fill="none" stroke="' + hLine + '" stroke-width="1.4" stroke-linecap="round"/>';
    } else {
      // Long graceful face-framing locks cascading past jaw to collarbone
      sideLocks =
        '<path d="M108,102 C94,136 92,186 108,236 C116,216 116,182 118,144 L120,118 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M108,146 C103,174 104,204 110,224 C113,200 114,174 115,152 Z" fill="' + hDark + '" opacity="0.42"/>' +
        '<path d="M212,102 C226,136 228,186 212,236 C204,216 204,182 202,144 L200,118 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M212,146 C217,174 216,204 210,224 C207,200 206,174 205,152 Z" fill="' + hDark + '" opacity="0.42"/>';
    }

    // Layered Forehead Bangs (前額瀏海碎髮) + cast shadow on skin
    var bangs = '';
    var bangShadow = '';
    if (style === 'spikyShort') {
      bangShadow =
        '<path d="M110,116 L124,130 L138,118 L156,136 L172,118 L188,132 L210,114 L206,104 L114,104 Z" fill="' + ctx.skinShadow + '" opacity="0.42"/>';
      bangs =
        '<path d="M100,114 C96,74 122,46 160,46 C198,46 224,74 220,114 L206,106 L194,126 L186,104 L170,130 L162,102 L148,134 L138,104 L124,126 L114,106 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.7" stroke-linejoin="round"/>' +
        // Dynamic spiky top cowlicks
        '<path d="M148,50 C142,34 156,28 164,46 C172,30 186,36 176,52" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.6" stroke-linejoin="round"/>' +
        // Cel shadow underside of bangs
        '<path d="M114,104 L124,122 L138,100 L148,128 L162,98 L170,124 L186,100 L194,122 L206,102 L214,96 C194,90 126,90 106,96 Z" fill="' + hDark + '" opacity="0.34"/>';
    } else if (style === 'elderSwept') {
      bangShadow =
        '<path d="M112,110 Q136,118 156,106 Q180,116 208,110 L206,100 L114,100 Z" fill="' + ctx.skinShadow + '" opacity="0.32"/>';
      bangs =
        '<path d="M100,114 C98,70 124,46 160,46 C196,46 222,70 220,114 C208,102 192,98 176,108 C170,96 162,92 152,106 C138,94 116,100 100,114 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.7"/>' +
        '<path d="M118,80 C138,66 174,64 202,78" fill="none" stroke="' + hDark + '" stroke-width="1.4" opacity="0.5"/>';
    } else if (style === 'highPonytail') {
      bangShadow =
        '<path d="M110,114 L128,128 L146,114 L166,130 L186,114 L210,122 L208,104 L112,104 Z" fill="' + ctx.skinShadow + '" opacity="0.38"/>';
      bangs =
        '<path d="M100,112 C98,70 124,48 160,48 C196,48 222,70 220,112 L204,108 L194,124 L180,104 L164,128 L152,102 L134,126 L124,104 L108,120 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M126,96 L134,120 L150,96 L164,122 L180,98 L194,118 L204,98" fill="none" stroke="' + hDark + '" stroke-width="1.3" opacity="0.45"/>';
    } else if (style === 'bossLongWild') {
      bangShadow =
        '<path d="M108,118 L128,142 L144,120 L160,148 L176,120 L194,140 L212,118 L208,102 L112,102 Z" fill="' + ctx.skinShadow + '" opacity="0.55"/>';
      bangs =
        '<path d="M96,118 C92,68 120,42 160,42 C200,42 228,68 224,118 L206,108 L196,138 L182,106 L160,146 L142,106 L126,138 L114,108 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M114,104 L126,132 L142,100 L160,140 L182,100 L196,132 L206,102" fill="none" stroke="' + hDark + '" stroke-width="1.8" opacity="0.6"/>';
    } else {
      // Elegant parted / layered anime bangs (Scholar, Bard, Scholar NPC, Priest)
      bangShadow =
        '<path d="M110,116 L126,132 L144,118 L160,134 L176,118 L194,130 L210,116 L208,102 L112,102 Z" fill="' + ctx.skinShadow + '" opacity="0.38"/>';
      bangs =
        '<path d="M98,114 C96,68 122,46 160,46 C198,46 224,68 222,114 L208,108 C202,122 194,130 188,134 L182,106 C174,124 166,132 160,136 C154,126 150,114 148,104 C138,122 130,130 124,134 L118,106 L104,122 Z" fill="' + hFill + '" stroke="' + hLine + '" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M116,102 L124,128 L146,100 L160,130 L180,102 L190,128 L206,102 C188,92 132,92 116,102 Z" fill="' + hDark + '" opacity="0.3"/>';
    }

    // Anime Angel-Ring Hair Highlight (頭頂天使光環) + secondary cel shadow band
    var angelRing =
      '<g>' +
        '<path d="M112,84 C128,70 192,70 208,84 L202,92 L192,84 L182,91 L170,82 L160,90 L148,82 L138,91 L128,84 L118,92 Z" fill="' + hHi + '" opacity="0.72"/>' +
        '<path d="M126,76 C146,68 174,68 194,76" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.58"/>' +
        '<path d="M108,94 C132,84 188,84 212,94" fill="none" stroke="' + hDark + '" stroke-width="2" opacity="0.34"/>' +
      '</g>';

    return sideLocks + bangShadow + bangs + angelRing;
  }

  function renderSingleAnimeEye(cx, cy, side, mood, ctx) {
    // side: -1 for left eye (viewer's left), +1 for right eye (viewer's right)
    var irisId = side < 0 ? ctx.gIrisL : ctx.gIrisR;
    var irisGlow = side < 0 ? ctx.irisGlowL : ctx.irisGlowR;
    var lashCol = ctx.lashColor || '#131124';
    var bossMenace = !!ctx.bossMenace;

    // 1) HURT wincing '> <' eyes
    if (mood === 'hurt') {
      if (side < 0) {
        return (
          '<g>' +
            '<path d="M' + (cx - 12) + ',' + (cy - 5) + ' L' + (cx + 9) + ',' + (cy + 1) + ' L' + (cx - 11) + ',' + (cy + 7) + '" fill="none" stroke="' + lashCol + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path d="M' + (cx - 9) + ',' + (cy - 9) + ' Q' + cx + ',' + (cy - 11) + ' ' + (cx + 8) + ',' + (cy - 6) + '" fill="none" stroke="' + lashCol + '" stroke-width="1" opacity="0.65"/>' +
          '</g>'
        );
      }
      return (
        '<g>' +
          '<path d="M' + (cx + 12) + ',' + (cy - 5) + ' L' + (cx - 9) + ',' + (cy + 1) + ' L' + (cx + 11) + ',' + (cy + 7) + '" fill="none" stroke="' + lashCol + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="M' + (cx + 9) + ',' + (cy - 9) + ' Q' + cx + ',' + (cy - 11) + ' ' + (cx - 8) + ',' + (cy - 6) + '" fill="none" stroke="' + lashCol + '" stroke-width="1" opacity="0.65"/>' +
        '</g>'
      );
    }

    // 2) Reverent Closed Eyes (e.g. Priest in 'serious' prayer state)
    if (mood === 'serious' && ctx.reverentClosed) {
      return (
        '<g>' +
          '<path d="M' + (cx - 13) + ',' + (cy + 1) + ' Q' + cx + ',' + (cy + 8) + ' ' + (cx + 13) + ',' + (cy + 1) + '" fill="none" stroke="' + lashCol + '" stroke-width="2.8" stroke-linecap="round"/>' +
          '<path d="M' + (cx - 11) + ',' + (cy - 5) + ' Q' + cx + ',' + (cy - 10) + ' ' + (cx + 11) + ',' + (cy - 5) + '" fill="none" stroke="' + lashCol + '" stroke-width="1.1" opacity="0.68"/>' +
          '<path d="M' + (cx + side * 12) + ',' + (cy + 2) + ' L' + (cx + side * 15) + ',' + (cy + 4) + '" stroke="' + lashCol + '" stroke-width="1.6" stroke-linecap="round"/>' +
        '</g>'
      );
    }

    // 3) Full Multi-Layer Detailed Anime Open Eye
    var eyeH = mood === 'surprised' ? 11.5 : (mood === 'serious' || mood === 'attack' || bossMenace ? 7.8 : 9.8);
    var irisR = mood === 'surprised' ? 6.2 : (mood === 'serious' || bossMenace ? 6.8 : 7.4);
    var irisY = cy + (mood === 'surprised' ? 0.5 : 1.0);
    var pupilR = mood === 'surprised' ? 2.5 : (bossMenace ? 2.2 : 3.3);
    var outerX = cx + side * 14;
    var innerX = cx - side * 12;
    var upperLift = mood === 'happy' ? -2.2 : (mood === 'serious' || mood === 'attack' || bossMenace ? 1.8 : 0);

    // Sclera & cool upper-sclera cel shadow band
    var scleraD =
      'M' + innerX + ',' + (cy + 1.5) +
      ' Q' + cx + ',' + (cy - eyeH + upperLift) + ' ' + outerX + ',' + (cy + 0.5) +
      ' Q' + cx + ',' + (cy + eyeH * 0.92) + ' ' + innerX + ',' + (cy + 1.5) + ' Z';
    var scleraShadowD =
      'M' + innerX + ',' + (cy + 0.5) +
      ' Q' + cx + ',' + (cy - eyeH + upperLift) + ' ' + outerX + ',' + (cy + 0.2) +
      ' L' + outerX + ',' + (cy - eyeH * 0.18 + upperLift * 0.5) +
      ' Q' + cx + ',' + (cy - eyeH * 0.42 + upperLift) + ' ' + innerX + ',' + (cy - 1) + ' Z';

    // Double-eyelid crease line (雙眼皮摺線)
    var creaseY = cy - eyeH - 2.6 + upperLift * 0.7;
    var creaseD =
      'M' + (cx - side * 10) + ',' + (creaseY + 2.2) +
      ' Q' + cx + ',' + (creaseY - 2.5) + ' ' + (cx + side * 12) + ',' + (creaseY + 1.8);

    // Thick dark tapered upper eyelash + outer wing
    var upperLashD =
      'M' + (innerX - side * 1) + ',' + (cy + 1.2) +
      ' Q' + cx + ',' + (cy - eyeH - 2.4 + upperLift) + ' ' + (outerX + side * 3.2) + ',' + (cy - 1.2 + upperLift * 0.3) +
      ' L' + (outerX + side * 0.6) + ',' + (cy + 1.8) +
      ' Q' + cx + ',' + (cy - eyeH + 2.2 + upperLift) + ' ' + innerX + ',' + (cy + 2.0) + ' Z';

    // Happy joyful upturned lower lid hint
    var lowerLashD =
      'M' + (cx - side * 7) + ',' + (cy + eyeH * 0.85) +
      ' Q' + cx + ',' + (cy + eyeH * (mood === 'happy' ? 0.55 : 0.98)) + ' ' + (cx + side * 10) + ',' + (cy + eyeH * 0.74);

    // Extra glowing glare trail for Bosses / intense Attack
    var glareTrail = bossMenace
      ? '<path d="M' + cx + ',' + irisY + ' L' + (cx + side * 36) + ',' + (irisY - 8) + '" stroke="' + irisGlow + '" stroke-width="2.4" stroke-linecap="round" opacity="0.72" filter="url(#' + ctx.fGlow + ')"/>'
      : '';

    var victoryStar = (mood === 'victory' || mood === 'happy')
      ? sparkle(cx + side * 2.2, irisY + 3.4, 2.8, '#ffffff', 0.92)
      : '';

    return (
      '<g>' +
        // Sclera base + cool upper-sclera cel shadow band
        '<path d="' + scleraD + '" fill="' + (bossMenace ? '#1a152e' : '#f8fafc') + '"/>' +
        '<path d="' + scleraShadowD + '" fill="' + (bossMenace ? '#0b0816' : '#cbd5e1') + '" opacity="0.78"/>' +
        // Multi-stop vertical gradient iris + dark rim
        '<ellipse cx="' + cx + '" cy="' + irisY.toFixed(1) + '" rx="' + (irisR * 0.92).toFixed(1) + '" ry="' + irisR.toFixed(1) + '" fill="url(#' + irisId + ')" stroke="' + lashCol + '" stroke-width="1.2"/>' +
        // Upper iris dark shadow arc
        '<path d="M' + (cx - irisR * 0.85).toFixed(1) + ',' + (irisY - irisR * 0.1).toFixed(1) + ' A' + (irisR * 0.88).toFixed(1) + ',' + (irisR * 0.88).toFixed(1) + ' 0 0,1 ' + (cx + irisR * 0.85).toFixed(1) + ',' + (irisY - irisR * 0.1).toFixed(1) + ' Q' + cx + ',' + (irisY - irisR * 0.32).toFixed(1) + ' ' + (cx - irisR * 0.85).toFixed(1) + ',' + (irisY - irisR * 0.1).toFixed(1) + ' Z" fill="#090717" opacity="0.45"/>' +
        // Lower crescent iris catchlight glow
        '<path d="M' + (cx - irisR * 0.62).toFixed(1) + ',' + (irisY + irisR * 0.25).toFixed(1) + ' Q' + cx + ',' + (irisY + irisR * 0.92).toFixed(1) + ' ' + (cx + irisR * 0.62).toFixed(1) + ',' + (irisY + irisR * 0.25).toFixed(1) + ' Q' + cx + ',' + (irisY + irisR * 0.62).toFixed(1) + ' ' + (cx - irisR * 0.62).toFixed(1) + ',' + (irisY + irisR * 0.25).toFixed(1) + ' Z" fill="' + irisGlow + '" opacity="0.82"/>' +
        // Deep dark pupil
        '<ellipse cx="' + cx + '" cy="' + (irisY + 0.3).toFixed(1) + '" rx="' + (pupilR * (bossMenace ? 0.55 : 0.92)).toFixed(1) + '" ry="' + (pupilR * (bossMenace ? 1.35 : 1.0)).toFixed(1) + '" fill="#090717"/>' +
        // At least 2 crisp white specular highlight dots/ovals
        '<ellipse cx="' + (cx - 2.6).toFixed(1) + '" cy="' + (irisY - 2.8).toFixed(1) + '" rx="2.5" ry="1.9" transform="rotate(-18 ' + (cx - 2.6).toFixed(1) + ' ' + (irisY - 2.8).toFixed(1) + ')" fill="#ffffff" opacity="0.96"/>' +
        '<circle cx="' + (cx + 2.8).toFixed(1) + '" cy="' + (irisY + 2.6).toFixed(1) + '" r="1.35" fill="#ffffff" opacity="0.92"/>' +
        victoryStar +
        // Thick dark tapered upper eyelash + wing
        '<path d="' + upperLashD + '" fill="' + lashCol + '"/>' +
        // Distinct double-eyelid crease line (雙眼皮摺線)
        '<path d="' + creaseD + '" fill="none" stroke="' + lashCol + '" stroke-width="1.15" stroke-linecap="round" opacity="0.72"/>' +
        // Soft lower lash hint
        '<path d="' + lowerLashD + '" fill="none" stroke="' + lashCol + '" stroke-width="1.05" stroke-linecap="round" opacity="0.62"/>' +
        glareTrail +
      '</g>'
    );
  }

  function renderAnimeFace(mood, ctx) {
    var browCol = ctx.browColor || ctx.hairLine || '#231b35';
    var skinSh = ctx.skinShadow;
    var lashCol = ctx.lashColor || '#131124';

    // Eyebrows driven dynamically by mood
    var brows = '';
    if (mood === 'attack' || mood === 'serious' || ctx.bossMenace) {
      brows =
        '<path d="M120,122 Q135,120 149,127" fill="none" stroke="' + browCol + '" stroke-width="2.5" stroke-linecap="round"/>' +
        '<path d="M200,122 Q185,120 171,127" fill="none" stroke="' + browCol + '" stroke-width="2.5" stroke-linecap="round"/>';
    } else if (mood === 'hurt') {
      brows =
        '<path d="M121,128 Q135,123 148,119" fill="none" stroke="' + browCol + '" stroke-width="2.4" stroke-linecap="round"/>' +
        '<path d="M199,128 Q185,123 172,119" fill="none" stroke="' + browCol + '" stroke-width="2.4" stroke-linecap="round"/>';
    } else if (mood === 'surprised') {
      brows =
        '<path d="M120,119 Q135,110 148,116" fill="none" stroke="' + browCol + '" stroke-width="2.3" stroke-linecap="round"/>' +
        '<path d="M200,119 Q185,110 172,116" fill="none" stroke="' + browCol + '" stroke-width="2.3" stroke-linecap="round"/>';
    } else if (mood === 'happy' || mood === 'victory') {
      brows =
        '<path d="M121,123 Q135,116 148,121" fill="none" stroke="' + browCol + '" stroke-width="2.3" stroke-linecap="round"/>' +
        '<path d="M199,123 Q185,116 172,121" fill="none" stroke="' + browCol + '" stroke-width="2.3" stroke-linecap="round"/>';
    } else {
      brows =
        '<path d="M121,124 Q135,119 148,123" fill="none" stroke="' + browCol + '" stroke-width="2.3" stroke-linecap="round"/>' +
        '<path d="M199,124 Q185,119 172,123" fill="none" stroke="' + browCol + '" stroke-width="2.3" stroke-linecap="round"/>';
    }

    // Subtle anime nose shadow + bridge highlight
    var nose =
      '<path d="M159,147 L157.5,157.5 L161.2,159" fill="none" stroke="' + skinSh + '" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M161,150 L160.5,155" stroke="#ffffff" stroke-width="1" opacity="0.52" stroke-linecap="round"/>';

    // Expressive anime mouth (unobstructed even when hasBeard is true!)
    var mouth = '';
    if (mood === 'attack') {
      mouth =
        '<path d="M148,174 Q160,169 172,174 Q168,185 160,185 Q152,185 148,174 Z" fill="#8f2438" stroke="' + lashCol + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M151,175 Q160,173 169,175 L168,177.5 Q160,176 152,177.5 Z" fill="#ffffff"/>' +
        '<path d="M154,183 Q160,181 166,183" fill="none" stroke="#e11d48" stroke-width="1.3" opacity="0.7"/>';
    } else if (mood === 'happy' || mood === 'victory') {
      mouth =
        '<path d="M148,173 Q160,176 172,173 Q169,185 160,185 Q151,185 148,173 Z" fill="#a8334a" stroke="' + lashCol + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M151,174.5 Q160,176.5 169,174.5 L168,177 Q160,178.5 152,177 Z" fill="#ffffff"/>' +
        '<path d="M155,182.5 Q160,180.5 165,182.5" fill="none" stroke="#fb7185" stroke-width="1.4"/>';
    } else if (mood === 'hurt') {
      mouth =
        '<path d="M149,179 Q154,174 160,177 Q166,174 171,179 Q166,184 160,182 Q154,184 149,179 Z" fill="#881337" stroke="' + lashCol + '" stroke-width="1.5" stroke-linejoin="round"/>' +
        '<path d="M152,179 L168,179" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>';
    } else if (mood === 'surprised') {
      mouth =
        '<ellipse cx="160" cy="178" rx="5.5" ry="6.8" fill="#9f2b42" stroke="' + lashCol + '" stroke-width="1.5"/>' +
        '<ellipse cx="160" cy="181.5" rx="3.2" ry="2.2" fill="#f472b6" opacity="0.72"/>';
    } else if (mood === 'serious') {
      mouth =
        '<path d="M150,177 Q160,175.5 170,177" fill="none" stroke="' + lashCol + '" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M156,181.5 Q160,182.5 164,181.5" fill="none" stroke="' + skinSh + '" stroke-width="1.1" opacity="0.75"/>';
    } else if (ctx.bossMenace) {
      mouth =
        '<path d="M148,177 Q160,180 173,174" fill="none" stroke="' + lashCol + '" stroke-width="1.9" stroke-linecap="round"/>';
    } else {
      // Serene anime gentle smile ('idle' / 'neutral')
      mouth =
        '<path d="M150,175 Q160,181 170,175" fill="none" stroke="' + lashCol + '" stroke-width="1.75" stroke-linecap="round"/>' +
        '<path d="M156,181.5 Q160,183 164,181.5" fill="none" stroke="' + skinSh + '" stroke-width="1.15" opacity="0.7"/>';
    }

    // Optional dignified elder wrinkles (Mayor NPC)
    var wrinkles = '';
    if (ctx.hasWrinkles) {
      wrinkles =
        '<g stroke="' + skinSh + '" fill="none" stroke-linecap="round" opacity="0.58">' +
          '<path d="M140,108 Q160,105 180,108" stroke-width="1.1"/>' +
          '<path d="M144,113 Q160,111 176,113" stroke-width="0.9"/>' +
          '<path d="M116,143 Q120,147 117,151 M204,143 Q200,147 203,151" stroke-width="1.05"/>' +
          '<path d="M132,164 Q136,170 138,176 M188,164 Q184,170 182,176" stroke-width="1.05"/>' +
        '</g>';
    }

    // Optional sculpted silver-white flowing beard & mustache (framing mouth cleanly!)
    var beard = '';
    if (ctx.hasBeard) {
      var bFill = 'url(#' + ctx.gHair + ')';
      var bDark = ctx.hairShadow;
      var bLine = ctx.hairLine;
      beard =
        '<g>' +
          // Majestic layered chin & chest beard below mouth (starts at y=187 so mouth at y=173..185 is 100% clear!)
          '<path d="M126,176 C122,198 128,224 140,248 C148,262 155,270 160,274 C165,270 172,262 180,248 C192,224 198,198 194,176 C188,186 176,192 160,192 C144,192 132,186 126,176 Z" fill="' + bFill + '" stroke="' + bLine + '" stroke-width="1.6" stroke-linejoin="round"/>' +
          // Sculpted beard cel-shadow folds & strand tufts
          '<path d="M134,192 C136,216 144,238 154,256 C152,232 146,210 144,194 Z" fill="' + bDark + '" opacity="0.45"/>' +
          '<path d="M186,192 C184,216 176,238 166,256 C168,232 174,210 176,194 Z" fill="' + bDark + '" opacity="0.45"/>' +
          '<path d="M150,196 L156,258 M160,196 L160,268 M170,196 L164,258" stroke="' + bLine + '" stroke-width="1" opacity="0.38" stroke-linecap="round"/>' +
          // Parted curved mustache wings above upper lip (y=164..173)
          '<path d="M160,165 C150,162 134,164 124,174 C132,178 144,176 154,171 L160,169 L166,171 C176,176 188,178 196,174 C186,164 170,162 160,165 Z" fill="' + bFill + '" stroke="' + bLine + '" stroke-width="1.4" stroke-linejoin="round"/>' +
          '<path d="M134,172 Q146,171 156,167 M186,172 Q174,171 164,167" fill="none" stroke="' + bDark + '" stroke-width="1.1" opacity="0.5"/>' +
        '</g>';
    }

    // Cheek blush intensity by mood
    var blushOp = (mood === 'happy' || mood === 'victory') ? 0.65 : (mood === 'surprised' || mood === 'hurt' ? 0.52 : (ctx.bossMenace ? 0.08 : 0.34));

    return (
      '<g>' +
        '<ellipse cx="127" cy="160" rx="13" ry="7.2" fill="url(#' + ctx.gBlush + ')" opacity="' + blushOp + '"/>' +
        '<ellipse cx="193" cy="160" rx="13" ry="7.2" fill="url(#' + ctx.gBlush + ')" opacity="' + blushOp + '"/>' +
        wrinkles +
        renderSingleAnimeEye(136, 140, -1, mood, ctx) +
        renderSingleAnimeEye(184, 140, 1, mood, ctx) +
        brows +
        nose +
        beard +
        mouth +
      '</g>'
    );
  }

  function renderMoodOverlay(mood, ctx) {
    if (mood === 'hurt') {
      return (
        '<g>' +
          // Anime sweat drop on temple
          '<path d="M208,112 C214,122 215,130 208,132 C201,130 202,122 208,112 Z" fill="#bae6fd" stroke="#0284c7" stroke-width="1.3"/>' +
          '<circle cx="206" cy="123" r="1.6" fill="#ffffff"/>' +
          // Impact crimson flash marks
          '<path d="M52,72 L78,94 M44,96 L74,104 M268,72 L242,94 M276,96 L246,104" stroke="#fb7185" stroke-width="2.4" stroke-linecap="round" opacity="0.82" filter="url(#' + ctx.fGlow + ')"/>' +
        '</g>'
      );
    }
    if (mood === 'surprised') {
      return (
        '<g stroke="#fde047" stroke-width="2.4" stroke-linecap="round" filter="url(#' + ctx.fGlow + ')">' +
          '<line x1="234" y1="74" x2="250" y2="58"/>' +
          '<line x1="242" y1="88" x2="262" y2="82"/>' +
          '<line x1="238" y1="102" x2="254" y2="106"/>' +
        '</g>'
      );
    }
    if (mood === 'victory' || mood === 'happy') {
      return (
        '<g class="svg-float" filter="url(#' + ctx.fGlow + ')" ' + ORIGIN_CENTER + '>' +
          sparkle(68, 86, 7.5, '#fef08a', 0.95) +
          sparkle(254, 78, 8.5, '#7dd3fc', 0.95) +
          sparkle(242, 136, 5.5, '#fde68a', 0.88) +
          sparkle(76, 148, 5, '#fbcfe8', 0.85) +
        '</g>'
      );
    }
    if (mood === 'attack') {
      return (
        '<g stroke="' + (ctx.accentColor || '#38e8ff') + '" stroke-linecap="round" opacity="0.72" filter="url(#' + ctx.fGlow + ')">' +
          '<line x1="22" y1="54" x2="64" y2="74" stroke-width="2.2"/>' +
          '<line x1="16" y1="92" x2="54" y2="102" stroke-width="1.6"/>' +
          '<line x1="298" y1="48" x2="256" y2="70" stroke-width="2.2"/>' +
          '<line x1="304" y1="86" x2="264" y2="98" stroke-width="1.6"/>' +
        '</g>'
      );
    }
    return '';
  }

  function renderAnimeCharacter(config) {
    config = config || {};
    var mood = normalizeAnimeMood(config.mood || config.pose || config.emotion || 'idle');
    var viewBox = config.viewBox || '0 0 320 340';
    var svgClass = config.svgClass || 'svg-art svg-anime-character';
    var dataAttrs = config.dataAttrs || '';

    // Unique <defs> IDs via uid()
    var ctx = {
      mood: mood,
      gAura: uid('ac_au'),
      gSkin: uid('ac_sk'),
      gBlush: uid('ac_bl'),
      gHair: uid('ac_hr'),
      gHairHi: uid('ac_hh'),
      gIrisL: uid('ac_il'),
      gIrisR: uid('ac_ir'),
      gGold: uid('ac_gd'),
      gSteel: uid('ac_st'),
      gCloth1: uid('ac_c1'),
      gCloth2: uid('ac_c2'),
      fGlow: uid('ac_gl'),
      fShadow: uid('ac_sh'),
      skinLight: config.skinLight || '#fff3e8',
      skinMid: config.skinMid || '#fbdcc6',
      skinShadow: config.skinShadow || '#d8a28c',
      skinLine: config.skinLine || '#5e3b34',
      hairTop: config.hairTop || '#e0f2fe',
      hairMid: config.hairMid || '#60a5fa',
      hairBot: config.hairBot || '#1e3a8a',
      hairShadow: config.hairShadow || '#172554',
      hairLine: config.hairLine || '#0f172a',
      hairHiColor: config.hairHiColor || '#ffffff',
      irisTopL: config.irisTopL || config.irisTop || '#1e3a8a',
      irisMidL: config.irisMidL || config.irisMid || '#38bdf8',
      irisBotL: config.irisBotL || config.irisBot || '#bae6fd',
      irisGlowL: config.irisGlowL || config.irisGlow || '#e0f2fe',
      irisTopR: config.irisTopR || config.irisTop || '#1e3a8a',
      irisMidR: config.irisMidR || config.irisMid || '#38bdf8',
      irisBotR: config.irisBotR || config.irisBot || '#bae6fd',
      irisGlowR: config.irisGlowR || config.irisGlow || '#e0f2fe',
      cloth1Top: config.cloth1Top || '#253564',
      cloth1Bot: config.cloth1Bot || '#0f172a',
      cloth2Top: config.cloth2Top || '#b91c1c',
      cloth2Bot: config.cloth2Bot || '#450a0a',
      auraColor: config.auraColor || '#38bdf8',
      auraColor2: config.auraColor2 || '#d4af37',
      accentColor: config.accentColor || '#38e8ff',
      browColor: config.browColor || config.hairLine || '#1e1b4b',
      lashColor: config.lashColor || '#131124',
      hasWrinkles: !!config.hasWrinkles,
      hasBeard: !!config.hasBeard,
      reverentClosed: !!config.reverentClosed,
      bossMenace: !!config.bossMenace,
      hideFace: !!config.hideFace,
      extraData: config.extraData || {}
    };

    var extraDefs = typeof config.extraDefs === 'function' ? config.extraDefs(ctx) : '';

    // Subtle expressive body transform per mood (keeps character centered & dynamic)
    var bodyTransform = '';
    if (mood === 'attack') bodyTransform = 'translate(4,-4) rotate(1.6 160 220)';
    else if (mood === 'hurt') bodyTransform = 'translate(-5,5) rotate(-2.4 160 220)';
    else if (mood === 'victory') bodyTransform = 'translate(0,-5)';
    else if (mood === 'happy') bodyTransform = 'translate(0,-3) rotate(0.8 160 220)';
    else if (mood === 'surprised') bodyTransform = 'translate(0,-2)';

    // Seamless radial-vignette aura (NO dark square box!)
    var auraLayer =
      '<ellipse cx="160" cy="168" rx="146" ry="148" fill="url(#' + ctx.gAura + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>';

    var backdropLayer = typeof config.backdropFn === 'function' ? config.backdropFn(ctx) : '';
    var backPropsLayer = typeof config.backPropsFn === 'function' ? config.backPropsFn(ctx) : '';
    var backHairLayer = renderBackHair(config.backHairStyle || 'spikyShort', ctx);

    // Proportional Anime Shoulders, Neck, Cast Shadow & Delicate Clavicle (鎖骨)
    var neckAndShoulders =
      '<g>' +
        // Realistic sloped shoulders & upper torso base
        '<path d="M62,340 C66,276 82,232 114,218 L142,210 L178,210 L206,218 C238,232 254,276 258,340 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="' + ctx.hairLine + '" stroke-width="1.8"/>' +
        // Slender graceful anime neck
        '<path d="M145,180 L145,222 Q160,236 175,222 L175,180 Z" fill="url(#' + ctx.gSkin + ')" stroke="' + ctx.skinLine + '" stroke-width="1.4"/>' +
        // Exposed upper chest / collar skin triangle for clavicle
        '<path d="M130,214 Q160,248 190,214 L175,208 L145,208 Z" fill="url(#' + ctx.gSkin + ')"/>' +
        // Hard cel-shaded chin cast shadow onto neck
        '<path d="M145,191 Q160,208 175,191 L175,205 Q160,218 145,205 Z" fill="' + ctx.skinShadow + '" opacity="0.78"/>' +
        // Neck tendon + delicate clavicle/collarbone (鎖骨) strokes
        '<path d="M150,206 L149,218 M170,206 L171,218" stroke="' + ctx.skinShadow + '" stroke-width="1" opacity="0.55" stroke-linecap="round"/>' +
        '<path d="M138,224 Q149,227 157,223 M182,224 Q171,227 163,223" fill="none" stroke="' + ctx.skinShadow + '" stroke-width="1.35" stroke-linecap="round"/>' +
        '<path d="M156,227 Q160,230 164,227" fill="none" stroke="' + ctx.skinShadow + '" stroke-width="1" opacity="0.65" stroke-linecap="round"/>' +
      '</g>';

    var outfitLayer = typeof config.outfitFn === 'function' ? config.outfitFn(ctx) : '';

    // Organic Bezier Anime Head Contour (smooth jawline tapering to delicate V-chin + ears)
    var headBase =
      '<g>' +
        // Left & Right Ears with inner ear shadow
        '<path d="M108,132 C97,132 95,154 106,162 C109,164 112,162 113,157 Z" fill="url(#' + ctx.gSkin + ')" stroke="' + ctx.skinLine + '" stroke-width="1.4"/>' +
        '<path d="M106,139 C101,142 101,152 106,156" fill="none" stroke="' + ctx.skinShadow + '" stroke-width="1.3" stroke-linecap="round"/>' +
        '<path d="M212,132 C223,132 225,154 214,162 C211,164 208,162 207,157 Z" fill="url(#' + ctx.gSkin + ')" stroke="' + ctx.skinLine + '" stroke-width="1.4"/>' +
        '<path d="M214,139 C219,142 219,152 214,156" fill="none" stroke="' + ctx.skinShadow + '" stroke-width="1.3" stroke-linecap="round"/>' +
        // Sculpted Anime Face Silhouette
        '<path d="M108,114 C106,144 114,174 134,190 Q148,200 160,203 Q172,200 186,190 C206,174 214,144 212,114 C210,74 190,56 160,56 C130,56 110,74 108,114 Z" fill="url(#' + ctx.gSkin + ')" stroke="' + ctx.skinLine + '" stroke-width="1.65"/>' +
        // Crisp cel-shading shadow crescent along right jawline & temple
        '<path d="M206,116 C206,146 198,172 182,186 Q170,196 160,200 Q173,198 187,188 C206,173 213,144 211,114 Z" fill="' + ctx.skinShadow + '" opacity="0.46"/>' +
        '<path d="M111,134 C112,158 122,178 138,190 Q146,196 152,199 Q138,192 126,179 C116,166 112,150 111,134 Z" fill="' + ctx.skinShadow + '" opacity="0.22"/>' +
      '</g>';

    var faceLayer = ctx.hideFace ? '' : renderAnimeFace(mood, ctx);
    var frontHairLayer = renderFrontHair(config.frontHairStyle || config.backHairStyle || 'spikyShort', ctx);
    var headgearLayer = typeof config.headgearFn === 'function' ? config.headgearFn(ctx) : '';
    var foregroundLayer = typeof config.foregroundFn === 'function' ? config.foregroundFn(ctx) : '';
    var moodOverlay = config.disableMoodOverlay ? '' : renderMoodOverlay(mood, ctx);
    var postOverlay = typeof config.postOverlayFn === 'function' ? config.postOverlayFn(ctx) : '';

    var bodyOpacity = config.bodyOpacity != null ? config.bodyOpacity : 1;

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="' + esc(svgClass) + '"' + (dataAttrs ? ' ' + dataAttrs : '') + '>' +
        '<defs>' +
          '<radialGradient id="' + ctx.gAura + '" cx="50%" cy="46%" r="52%">' +
            '<stop offset="0%" stop-color="' + ctx.auraColor + '" stop-opacity="0.34"/>' +
            '<stop offset="52%" stop-color="' + ctx.auraColor2 + '" stop-opacity="0.14"/>' +
            '<stop offset="100%" stop-color="#050814" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + ctx.gSkin + '" x1="20%" y1="0%" x2="85%" y2="100%">' +
            '<stop offset="0%" stop-color="' + ctx.skinLight + '"/>' +
            '<stop offset="58%" stop-color="' + ctx.skinMid + '"/>' +
            '<stop offset="100%" stop-color="' + ctx.skinShadow + '"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + ctx.gBlush + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#fb7185" stop-opacity="0.72"/>' +
            '<stop offset="100%" stop-color="#fb7185" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + ctx.gHair + '" x1="25%" y1="0%" x2="75%" y2="100%">' +
            '<stop offset="0%" stop-color="' + ctx.hairTop + '"/>' +
            '<stop offset="52%" stop-color="' + ctx.hairMid + '"/>' +
            '<stop offset="100%" stop-color="' + ctx.hairBot + '"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gHairHi + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="' + ctx.hairHiColor + '" stop-opacity="0.08"/>' +
            '<stop offset="28%" stop-color="' + ctx.hairHiColor + '" stop-opacity="0.88"/>' +
            '<stop offset="50%" stop-color="' + ctx.hairHiColor + '" stop-opacity="0.96"/>' +
            '<stop offset="72%" stop-color="' + ctx.hairHiColor + '" stop-opacity="0.88"/>' +
            '<stop offset="100%" stop-color="' + ctx.hairHiColor + '" stop-opacity="0.08"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gIrisL + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="' + ctx.irisTopL + '"/>' +
            '<stop offset="55%" stop-color="' + ctx.irisMidL + '"/>' +
            '<stop offset="100%" stop-color="' + ctx.irisBotL + '"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gIrisR + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="' + ctx.irisTopR + '"/>' +
            '<stop offset="55%" stop-color="' + ctx.irisMidR + '"/>' +
            '<stop offset="100%" stop-color="' + ctx.irisBotR + '"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gGold + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fff4b8"/>' +
            '<stop offset="48%" stop-color="#d4af37"/>' +
            '<stop offset="100%" stop-color="#6b4c0e"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gSteel + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#dbeafe"/>' +
            '<stop offset="45%" stop-color="#475569"/>' +
            '<stop offset="100%" stop-color="#0f172a"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gCloth1 + '" x1="15%" y1="0%" x2="85%" y2="100%">' +
            '<stop offset="0%" stop-color="' + ctx.cloth1Top + '"/>' +
            '<stop offset="100%" stop-color="' + ctx.cloth1Bot + '"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + ctx.gCloth2 + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="' + ctx.cloth2Top + '"/>' +
            '<stop offset="100%" stop-color="' + ctx.cloth2Bot + '"/>' +
          '</linearGradient>' +
          defsGlow(ctx.fGlow, 2.8) +
          defsSoftShadow(ctx.fShadow) +
          extraDefs +
        '</defs>' +

        auraLayer +
        backdropLayer +
        '<g opacity="' + bodyOpacity + '"' + (bodyTransform ? ' transform="' + bodyTransform + '"' : '') + ' filter="url(#' + ctx.fShadow + ')">' +
          backPropsLayer +
          backHairLayer +
          neckAndShoulders +
          outfitLayer +
          headBase +
          faceLayer +
          frontHairLayer +
          headgearLayer +
          foregroundLayer +
        '</g>' +
        moodOverlay +
        postOverlay +
      '</svg>'
    );
  }

  /* ========================================================================
     PART 2A: THREE HERO CLASSES — window.SVGArt.hero(jobId, poseOrOpts)
     All 3 classes built on renderAnimeCharacter() [viewBox="0 0 320 340"]
     ======================================================================== */

  function normalizeHeroArgs(poseOrOpts) {
    var raw = 'idle';
    var className = '';
    if (typeof poseOrOpts === 'string') {
      raw = poseOrOpts;
    } else if (poseOrOpts && typeof poseOrOpts === 'object') {
      if (poseOrOpts.pose) raw = String(poseOrOpts.pose);
      if (poseOrOpts.className) className = String(poseOrOpts.className);
    }
    raw = raw.toLowerCase();
    var pose = 'idle';
    if (raw === 'idle' || raw === 'neutral' || raw === 'serious') pose = 'idle';
    else if (raw === 'attack') pose = 'attack';
    else if (raw === 'hurt' || raw === 'surprised') pose = 'hurt';
    else if (raw === 'victory' || raw === 'happy') pose = 'victory';
    return { pose: pose, className: className };
  }

  function heroSwordsman(pose, extraCls) {
    var gBlade = uid('sw_bl');
    var gSlash = uid('sw_sl');
    return renderAnimeCharacter({
      mood: pose,
      svgClass: 'svg-art svg-hero hero-swordsman hero-pose-' + pose + (extraCls ? ' ' + extraCls : ''),
      dataAttrs: 'data-job="swordsman" data-pose="' + esc(pose) + '"',
      skinLight: '#fff4ea',
      skinMid: '#fad8c2',
      skinShadow: '#d39a85',
      skinLine: '#5a3832',
      hairTop: '#e8f5ff',
      hairMid: '#7dd3fc',
      hairBot: '#3b6ca8',
      hairShadow: '#1e3a6d',
      hairLine: '#0f2042',
      hairHiColor: '#ffffff',
      irisTop: '#0c2d6b',
      irisMid: '#0284c7',
      irisBot: '#7dd3fc',
      irisGlow: '#e0fbff',
      cloth1Top: '#1e3564',
      cloth1Bot: '#0c1630',
      cloth2Top: '#b91c1c',
      cloth2Bot: '#4c0b16',
      auraColor: '#38e8ff',
      auraColor2: '#d4af37',
      accentColor: '#38e8ff',
      backHairStyle: 'spikyShort',
      frontHairStyle: 'spikyShort',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gBlade + '" x1="0%" y1="100%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#0ea5e9"/>' +
            '<stop offset="48%" stop-color="#a5f3fc"/>' +
            '<stop offset="100%" stop-color="#ffffff"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gSlash + '" x1="0%" y1="100%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>' +
            '<stop offset="50%" stop-color="#7dd3fc" stop-opacity="0.88"/>' +
            '<stop offset="100%" stop-color="#ffffff" stop-opacity="0.98"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          magicCircle(160, 152, 114, {
            primary: '#d4af37',
            secondary: '#38e8ff',
            kanji: pose === 'attack' ? '斬' : '剣',
            kanjiSize: 92,
            kanjiOpacity: pose === 'attack' ? 0.22 : 0.12,
            opacity: pose === 'hurt' ? 0.45 : 0.85,
            runes: ['言', '霊', '剣', '斬', '光', '道', '義', '蒼']
          }) +
          floatingMotes([[46, 86, 3.2, 0.85], [274, 92, 3.6, 0.9], [52, 244, 2.4, 0.72], [270, 232, 2.8, 0.78]], '#7dd3fc', '#fde68a')
        );
      },
      backPropsFn: function (ctx) {
        // Fluttering indigo-and-gold headband rear tails
        var tailShift = pose === 'attack' ? ' translate(-6,-8) rotate(-8 212 96)' : (pose === 'victory' ? ' translate(4,-6)' : '');
        return (
          '<g' + (tailShift ? ' transform="' + tailShift + '"' : '') + '>' +
            '<path d="M206,94 C236,88 264,102 288,92 C276,110 256,118 228,116 L206,106 Z" fill="#172554" stroke="url(#' + ctx.gGold + ')" stroke-width="1.3"/>' +
            '<path d="M208,104 C236,110 260,126 280,124 C264,136 240,136 214,122 Z" fill="#1e3a8a" stroke="url(#' + ctx.gGold + ')" stroke-width="1.1"/>' +
          '</g>'
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // High gilded dark-navy stand collar with inner crimson lining
            '<path d="M126,204 L142,226 L160,236 L178,226 L194,204 L204,218 L184,244 L160,254 L136,244 L116,218 Z" fill="#172554" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8" stroke-linejoin="round"/>' +
            '<path d="M132,208 L145,224 L160,232 L175,224 L188,208" fill="none" stroke="#dc2626" stroke-width="2.2"/>' +
            // Layered Navy & Gilded Light Armor Breastplate
            '<path d="M104,228 C124,246 196,246 216,228 L224,336 L96,336 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
            // Cel-shaded breastplate bevels & fold shadows
            '<path d="M114,248 L158,266 L158,336 L104,336 Z" fill="#090f24" opacity="0.45"/>' +
            '<path d="M160,254 L160,336" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M114,268 Q160,282 206,268 M112,292 Q160,306 208,292" fill="none" stroke="url(#' + ctx.gGold + ')" stroke-width="1.4" opacity="0.82"/>' +
            // Crimson diagonal samurai sash & gold knot clasp
            '<path d="M102,294 L218,248 L222,268 L100,316 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.3"/>' +
            '<polygon points="160,264 170,275 160,286 150,275" fill="#38e8ff" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8" filter="url(#' + ctx.fGlow + ')"/>' +
            // Sculpted 3D Layered Steel & Gold Pauldrons (Left & Right)
            '<path d="M62,256 C66,222 92,206 126,214 L132,238 C108,242 84,254 66,274 Z" fill="url(#' + ctx.gSteel + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.9" stroke-linejoin="round"/>' +
            '<path d="M72,248 C88,232 108,224 126,224" fill="none" stroke="#e0f2fe" stroke-width="1.6" opacity="0.7"/>' +
            '<path d="M58,274 C76,258 102,248 124,248 L118,270 C96,272 76,282 62,294 Z" fill="#172554" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
            '<path d="M258,256 C254,222 228,206 194,214 L188,238 C212,242 236,254 254,274 Z" fill="url(#' + ctx.gSteel + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.9" stroke-linejoin="round"/>' +
            '<path d="M248,248 C232,232 212,224 194,224" fill="none" stroke="#e0f2fe" stroke-width="1.6" opacity="0.7"/>' +
            '<path d="M262,274 C244,258 218,248 196,248 L202,270 C224,272 244,282 258,294 Z" fill="#172554" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Dark-indigo & gold warrior headband (頭帶) across forehead
        return (
          '<g>' +
            '<path d="M104,96 Q160,78 216,96 L218,108 Q160,90 102,108 Z" fill="#172554" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
            '<path d="M104,99 Q160,82 216,99" fill="none" stroke="#fde68a" stroke-width="0.9" opacity="0.7"/>' +
            // Central gilded spirit crest plate
            '<polygon points="160,80 174,90 160,100 146,90" fill="url(#' + ctx.gGold + ')" stroke="#5c3a0e" stroke-width="1.2"/>' +
            '<polygon points="160,84 166,90 160,96 154,90" fill="#38e8ff" filter="url(#' + ctx.fGlow + ')"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Glowing Ice-Blue 言靈之劍 positioned dynamically by pose
        var swTf = 'translate(238,242) rotate(18)';
        var extraFx = '';
        if (pose === 'attack') {
          swTf = 'translate(210,206) rotate(-42)';
          extraFx =
            '<path d="M22,258 C78,128 198,62 304,108 C214,98 112,158 52,276 Z" fill="url(#' + gSlash + ')" filter="url(#' + ctx.fGlow + ')" opacity="0.92"/>' +
            '<path d="M38,266 C94,148 202,86 296,120" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" filter="url(#' + ctx.fGlow + ')"/>' +
            sparkle(256, 118, 10, '#ffffff', 0.96) +
            sparkle(112, 184, 7.5, '#7dd3fc', 0.92);
        } else if (pose === 'victory') {
          swTf = 'translate(248,184) rotate(-8)';
          extraFx =
            '<g filter="url(#' + ctx.fGlow + ')">' +
              sparkle(262, 54, 11, '#fef08a', 0.96) +
              sparkle(240, 88, 7, '#7dd3fc', 0.92) +
            '</g>';
        } else if (pose === 'hurt') {
          swTf = 'translate(224,258) rotate(36)';
        }
        return (
          '<g>' +
            '<g transform="' + swTf + '">' +
              // Crystalline Ice-Blue Spirit Blade
              '<g filter="url(#' + ctx.fGlow + ')">' +
                '<path d="M-8,-14 L-6,-132 L0,-158 L9,-128 L8,-14 Z" fill="url(#' + gBlade + ')" stroke="#ffffff" stroke-width="1"/>' +
                '<path d="M0,-152 L0,-18" stroke="#ffffff" stroke-width="1.6" opacity="0.9"/>' +
                '<path d="M-5,-86 L5,-86 M-4,-62 L4,-62 M-4,-38 L4,-38" stroke="#0284c7" stroke-width="1.2" opacity="0.72"/>' +
              '</g>' +
              // Gilded winged crossguard + rune crystal
              '<path d="M-24,-10 L-10,-18 L10,-18 L24,-10 L14,-2 L-14,-2 Z" fill="url(#' + ctx.gGold + ')" stroke="#5c3a0e" stroke-width="1.3"/>' +
              '<polygon points="0,-16 6,-10 0,-4 -6,-10" fill="#38e8ff" stroke="#ffffff" stroke-width="0.8"/>' +
              // Wrapped hilt & gloved gauntlet gripping sword
              '<path d="M-5,-2 L5,-2 L4,38 L-4,38 Z" fill="#1e293b" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
              '<circle cx="0" cy="42" r="6" fill="url(#' + ctx.gGold + ')" stroke="#5c3a0e" stroke-width="1.2"/>' +
              '<path d="M-13,4 C-15,-2 -8,-6 10,-4 C16,-2 16,18 10,22 C-8,24 -15,18 -13,4 Z" fill="#1e293b" stroke="url(#' + ctx.gGold + ')" stroke-width="1.4"/>' +
              '<path d="M-11,4 L11,4 M-11,11 L11,11 M-10,17 L10,17" stroke="#64748b" stroke-width="1.1"/>' +
            '</g>' +
            extraFx +
          '</g>'
        );
      }
    });
  }

  function heroScholar(pose, extraCls) {
    var gPage = uid('sc_pg');
    var gQuill = uid('sc_ql');
    return renderAnimeCharacter({
      mood: pose,
      svgClass: 'svg-art svg-hero hero-scholar hero-pose-' + pose + (extraCls ? ' ' + extraCls : ''),
      dataAttrs: 'data-job="scholar" data-pose="' + esc(pose) + '"',
      skinLight: '#fff6f0',
      skinMid: '#fce0ce',
      skinShadow: '#d7a495',
      skinLine: '#5c3c42',
      hairTop: '#a78bfa',
      hairMid: '#5b21b6',
      hairBot: '#2e1065',
      hairShadow: '#1a093b',
      hairLine: '#120628',
      hairHiColor: '#ede9fe',
      irisTop: '#312e81',
      irisMid: '#8b5cf6',
      irisBot: '#c4b5fd',
      irisGlow: '#a5f3fc',
      cloth1Top: '#3b1d70',
      cloth1Bot: '#140a2c',
      cloth2Top: '#1e3a8a',
      cloth2Bot: '#0b1536',
      auraColor: '#38e8ff',
      auraColor2: '#a855f7',
      accentColor: '#38e8ff',
      backHairStyle: 'midLongViolet',
      frontHairStyle: 'midLongViolet',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gPage + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fffbeb"/>' +
            '<stop offset="100%" stop-color="#e2d1a8"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gQuill + '" x1="0%" y1="100%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#38e8ff"/>' +
            '<stop offset="55%" stop-color="#e0f2fe"/>' +
            '<stop offset="100%" stop-color="#ffffff"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        // Rotating cyan-blue geometric astrolabe (青藍幾何星盤)
        return (
          '<g opacity="' + (pose === 'hurt' ? '0.45' : '0.88') + '">' +
            '<g class="svg-magic-ring" ' + ORIGIN_CENTER + '>' +
              '<circle cx="160" cy="154" r="118" fill="none" stroke="#38e8ff" stroke-width="1.5" stroke-dasharray="14 6 4 6"/>' +
              '<circle cx="160" cy="154" r="98" fill="none" stroke="#d4af37" stroke-width="1.2" opacity="0.8"/>' +
              '<ellipse cx="160" cy="154" rx="116" ry="44" transform="rotate(-24 160 154)" fill="none" stroke="#7dd3fc" stroke-width="1.1" opacity="0.65"/>' +
              '<ellipse cx="160" cy="154" rx="116" ry="44" transform="rotate(24 160 154)" fill="none" stroke="#c084fc" stroke-width="1.1" opacity="0.58"/>' +
              '<polygon points="' + regularPolygon(160, 154, 96, 8, 22.5) + '" fill="none" stroke="#38e8ff" stroke-width="0.95" opacity="0.5"/>' +
            '</g>' +
            '<g class="svg-magic-ring-rev" ' + ORIGIN_CENTER + '>' +
              '<circle cx="160" cy="154" r="74" fill="none" stroke="#fde68a" stroke-width="1" stroke-dasharray="3 5"/>' +
              '<polygon points="' + polygonStar(160, 154, 72, 34, 6) + '" fill="none" stroke="#38e8ff" stroke-width="0.9" opacity="0.45"/>' +
            '</g>' +
            '<text x="160" y="182" text-anchor="middle" font-size="88" font-weight="700" font-family="' + FONT_SERIF + '" fill="#38e8ff" opacity="' + (pose === 'attack' ? '0.2' : '0.11') + '">知</text>' +
          '</g>' +
          floatingMotes([[44, 96, 3.4, 0.9], [276, 86, 3.2, 0.88], [268, 212, 2.5, 0.8], [52, 216, 2.8, 0.82]], '#38e8ff', '#fde68a')
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Academy White Layered Collar & Cravat
            '<path d="M128,214 L160,256 L192,214 L182,208 L160,236 L138,208 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.2"/>' +
            '<path d="M148,242 L160,294 L172,242 Z" fill="#e2e8f0" stroke="url(#' + ctx.gGold + ')" stroke-width="1.1"/>' +
            // Astrological Robe Body with cel-shaded folds
            '<path d="M88,248 L128,224 L160,278 L192,224 L232,248 L244,340 L76,340 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.7"/>' +
            '<path d="M104,268 L116,340 M216,268 L204,340" stroke="#0c051c" stroke-width="3" opacity="0.5"/>' +
            // Starry Draped Academy Shawl / Mantle over shoulders
            '<path d="M68,266 C76,226 106,210 134,216 L160,256 L186,216 C214,210 244,226 252,266 C228,284 196,294 160,292 C124,294 92,284 68,266 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.9" stroke-linejoin="round"/>' +
            // Cel fold shadows & gilded constellation pattern on shawl
            '<path d="M86,258 C102,270 124,278 144,282 C122,286 98,280 76,268 Z" fill="#060c20" opacity="0.55"/>' +
            '<path d="M234,258 C218,270 196,278 176,282 C198,286 222,280 244,268 Z" fill="#060c20" opacity="0.55"/>' +
            '<path d="M90,250 L108,242 L124,256 M230,250 L212,242 L196,256" fill="none" stroke="#fde68a" stroke-width="0.9" opacity="0.72"/>' +
            sparkle(108, 242, 3.2, '#fde68a', 0.9) +
            sparkle(212, 242, 3.2, '#38e8ff', 0.9) +
            sparkle(96, 266, 2.5, '#7dd3fc', 0.85) +
            sparkle(224, 266, 2.5, '#fde68a', 0.85) +
            // Sapphire & Gold Brooch Clasp at Throat
            '<polygon points="160,242 170,254 160,266 150,254" fill="#38e8ff" stroke="url(#' + ctx.gGold + ')" stroke-width="2" filter="url(#' + ctx.fGlow + ')"/>' +
            '<circle cx="160" cy="254" r="3" fill="#ffffff" opacity="0.85"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Gilded Monocle (單邊眼鏡) over right eye + delicate dangling gold chain
        return (
          '<g>' +
            '<circle cx="184" cy="141" r="16.5" fill="#7dd3fc" fill-opacity="0.16" stroke="url(#' + ctx.gGold + ')" stroke-width="2.1"/>' +
            '<path d="M174,132 L182,128 M173,138 L188,129" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" opacity="0.78"/>' +
            '<circle cx="201" cy="141" r="2.2" fill="url(#' + ctx.gGold + ')"/>' +
            // Dangling fine gold monocle chain curving down past ear to collar
            '<path d="M201,143 C214,162 216,192 204,224" fill="none" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2" stroke-dasharray="2.5 2"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        var bookY = pose === 'attack' ? 236 : (pose === 'victory' ? 232 : 254);
        var quillTf = pose === 'attack' ? 'translate(234,218) rotate(-28)' : (pose === 'victory' ? 'translate(242,196) rotate(-14)' : 'translate(236,246) rotate(8)');
        var spellFx = '';
        if (pose === 'attack') {
          spellFx =
            '<g filter="url(#' + ctx.fGlow + ')">' +
              '<circle cx="80" cy="202" r="34" fill="none" stroke="#38e8ff" stroke-width="1.8" stroke-dasharray="8 4"/>' +
              '<polygon points="' + polygonStar(80, 202, 30, 14, 6) + '" fill="none" stroke="#fde047" stroke-width="1.2"/>' +
              '<path d="M108,218 Q174,164 252,188" fill="none" stroke="#7dd3fc" stroke-width="2.6" stroke-linecap="round"/>' +
              sparkle(80, 202, 9, '#ffffff', 0.96) +
              sparkle(258, 174, 8, '#fde047', 0.95) +
            '</g>';
        }
        return (
          '<g>' +
            // Floating Open Ancient Grimoire (懸浮古籍) on left
            '<g class="svg-float" transform="translate(82,' + bookY + ') rotate(-10)" ' + ORIGIN_CENTER + '>' +
              '<ellipse cx="0" cy="34" rx="44" ry="8" fill="#38e8ff" opacity="0.28" filter="url(#' + ctx.fGlow + ')"/>' +
              '<path d="M-46,16 Q-24,6 0,16 Q24,6 46,16 L50,24 Q24,14 0,24 Q-24,14 -50,24 Z" fill="#2e1065" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
              '<path d="M-44,-14 Q-22,-22 0,-12 L0,16 Q-22,6 -44,14 Z" fill="url(#' + gPage + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
              '<path d="M44,-14 Q22,-22 0,-12 L0,16 Q22,6 44,14 Z" fill="url(#' + gPage + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
              '<text x="-22" y="4" text-anchor="middle" font-size="14" font-weight="700" font-family="' + FONT_SERIF + '" fill="#0284c7" filter="url(#' + ctx.fGlow + ')">言</text>' +
              '<text x="22" y="4" text-anchor="middle" font-size="14" font-weight="700" font-family="' + FONT_SERIF + '" fill="#7c3aed" filter="url(#' + ctx.fGlow + ')">星</text>' +
              // Floating glowing runes rising from pages
              '<text x="-12" y="-26" text-anchor="middle" font-size="11" font-family="' + FONT_SERIF + '" fill="#7dd3fc" filter="url(#' + ctx.fGlow + ')">韻</text>' +
              '<text x="16" y="-32" text-anchor="middle" font-size="12" font-family="' + FONT_SERIF + '" fill="#fde68a" filter="url(#' + ctx.fGlow + ')">理</text>' +
            '</g>' +
            // Luminous Feather Quill (羽毛筆) held gracefully on right
            '<g transform="' + quillTf + '">' +
              '<path d="M0,46 L6,-22 C18,-48 34,-74 28,-94 C10,-80 -6,-52 -6,-20 Z" fill="url(#' + gQuill + ')" stroke="#38bdf8" stroke-width="1.1" filter="url(#' + ctx.fGlow + ')"/>' +
              '<path d="M0,48 L22,-84" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>' +
              '<polygon points="-2,44 3,44 0,58" fill="url(#' + ctx.gGold + ')"/>' +
              sparkle(0, 58, 5, '#38e8ff', 0.92) +
            '</g>' +
            spellFx +
          '</g>'
        );
      }
    });
  }

  function heroBard(pose, extraCls) {
    var gHarp = uid('bd_hp');
    return renderAnimeCharacter({
      mood: pose,
      svgClass: 'svg-art svg-hero hero-bard hero-pose-' + pose + (extraCls ? ' ' + extraCls : ''),
      dataAttrs: 'data-job="bard" data-pose="' + esc(pose) + '"',
      skinLight: '#fff5eb',
      skinMid: '#fbdac4',
      skinShadow: '#d69c84',
      skinLine: '#5c3930',
      hairTop: '#fde68a',
      hairMid: '#d97706',
      hairBot: '#78350f',
      hairShadow: '#451a03',
      hairLine: '#2c1104',
      hairHiColor: '#fef9c3',
      irisTop: '#065f46',
      irisMid: '#10b981',
      irisBot: '#a7f3d0',
      irisGlow: '#fef08a',
      cloth1Top: '#9f1239',
      cloth1Bot: '#4c0519',
      cloth2Top: '#fef3c7',
      cloth2Bot: '#d6c3a5',
      auraColor: '#f472b6',
      auraColor2: '#fbbf24',
      accentColor: '#fde047',
      backHairStyle: 'wavyShoulder',
      frontHairStyle: 'wavyShoulder',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gHarp + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fef08a"/>' +
            '<stop offset="50%" stop-color="#d4af37"/>' +
            '<stop offset="100%" stop-color="#854d0e"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        // Drifting glowing musical notes (♪ ♫) & sakura light petals
        return (
          '<g class="svg-float" opacity="' + (pose === 'hurt' ? '0.45' : '0.92') + '" ' + ORIGIN_CENTER + '>' +
            '<path d="M24,196 Q96,134 160,168 T296,118" fill="none" stroke="#fde68a" stroke-width="1.3" stroke-dasharray="6 5" opacity="0.58"/>' +
            '<path d="M20,214 Q96,154 160,186 T298,136" fill="none" stroke="#f9a8d4" stroke-width="1.1" opacity="0.48"/>' +
            '<text x="54" y="114" font-size="24" font-weight="700" fill="#fef08a" filter="url(#' + ctx.fGlow + ')">♪</text>' +
            '<text x="262" y="102" font-size="26" font-weight="700" fill="#fbcfe8" filter="url(#' + ctx.fGlow + ')">♫</text>' +
            '<text x="44" y="226" font-size="20" font-weight="700" fill="#7dd3fc" opacity="0.88">♫</text>' +
            '<text x="274" y="218" font-size="22" font-weight="700" fill="#fef08a" opacity="0.9">♪</text>' +
            sakuraPetal(74, 72, 1.05, -24, '#fbcfe8', 0.9) +
            sakuraPetal(246, 152, 0.95, 32, '#f9a8d4', 0.88) +
            sakuraPetal(84, 178, 0.85, 48, '#fde68a', 0.84) +
            sakuraPetal(236, 68, 0.9, -40, '#fbcfe8', 0.88) +
            sakuraPetal(52, 146, 0.78, 18, '#f472b6', 0.82) +
            sakuraPetal(278, 174, 0.82, -16, '#fbcfe8', 0.84) +
          '</g>'
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Tailored Ivory Poet Shirt & Ruffled Jabot Collar
            '<path d="M126,214 L160,250 L194,214 L208,336 L112,336 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="#854d0e" stroke-width="1.4"/>' +
            '<path d="M148,238 C144,252 154,264 160,276 C166,264 176,252 172,238 Z" fill="#ffffff" stroke="#d4af37" stroke-width="1.2"/>' +
            // Tailored Crimson Vest with braided gold cords (飾緒)
            '<path d="M114,226 L142,256 L144,336 L104,336 Z M206,226 L178,256 L176,336 L216,336 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            '<path d="M116,246 Q142,262 168,252 M114,264 Q146,280 176,266" fill="none" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8" stroke-linecap="round"/>' +
            // Ornate Crimson & Ivory Asymmetric Cape draped dynamically across left shoulder
            '<path d="M62,258 C70,218 106,204 140,214 L158,242 C132,264 102,286 70,336 L56,336 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M74,254 C96,244 118,236 142,236 C122,256 98,274 74,312 Z" fill="#fffbeb" opacity="0.22"/>' +
            '<path d="M84,256 L72,328" stroke="#3b0413" stroke-width="3" opacity="0.52"/>' +
            // Right sculpted shoulder puff & gold trim
            '<path d="M202,216 C230,214 252,234 258,266 C242,272 222,268 206,256 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            // Ruby Clasp at collar
            '<circle cx="152" cy="236" r="8.5" fill="url(#' + ctx.gGold + ')" stroke="#5c3a0e" stroke-width="1.2"/>' +
            '<circle cx="152" cy="236" r="4.8" fill="#fb7185" filter="url(#' + ctx.fGlow + ')"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Tilted Dark-Crimson Feathered Bard Hat (羽飾帽) with sweeping ivory-gold plume
        return (
          '<g transform="translate(158,64) rotate(-11)">' +
            // Sweeping ivory-gold feather plume
            '<path d="M36,-10 C68,-44 104,-42 118,-18 C96,-14 72,-8 44,4 Z" fill="#fffbeb" stroke="url(#' + ctx.gGold + ')" stroke-width="1.4"/>' +
            '<path d="M40,-4 C72,-28 96,-28 112,-18" fill="none" stroke="#d4af37" stroke-width="1.2"/>' +
            // Hat crown & upturned dramatic brim
            '<path d="M-46,6 C-44,-26 -14,-36 16,-34 C42,-32 54,-14 52,8 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.7"/>' +
            '<path d="M-74,14 C-44,-6 44,-6 74,12 C48,24 -46,24 -74,14 Z" fill="#6b0f2a" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
            '<path d="M-46,2 Q0,-8 50,2" fill="none" stroke="url(#' + ctx.gGold + ')" stroke-width="3"/>' +
            '<polygon points="34,-2 42,4 34,10 26,4" fill="#38e8ff" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        var harpTf = pose === 'attack' ? 'translate(226,232) rotate(-14)' : (pose === 'victory' ? 'translate(236,204) rotate(-6)' : 'translate(232,256) rotate(4)');
        var waveFx = '';
        if (pose === 'attack') {
          waveFx =
            '<g filter="url(#' + ctx.fGlow + ')">' +
              '<path d="M188,214 Q124,186 48,222" fill="none" stroke="#fde047" stroke-width="2.6" stroke-linecap="round"/>' +
              '<path d="M196,232 Q122,208 42,248" fill="none" stroke="#f472b6" stroke-width="2.2" stroke-linecap="round"/>' +
              '<text x="96" y="198" font-size="22" font-weight="700" fill="#fef08a">♫</text>' +
              '<text x="64" y="232" font-size="18" font-weight="700" fill="#7dd3fc">♪</text>' +
            '</g>';
        }
        return (
          '<g>' +
            // Ornate Gilded Rune Harp (符文豎琴)
            '<g transform="' + harpTf + '">' +
              '<path d="M-24,-46 C-12,-60 16,-56 26,-36 C38,-12 34,26 12,48 L-16,48 C-28,24 -32,-18 -24,-46 Z" fill="none" stroke="url(#' + gHarp + ')" stroke-width="6.5" stroke-linejoin="round"/>' +
              '<path d="M-24,-46 C-12,-60 16,-56 26,-36" fill="none" stroke="#fffbeb" stroke-width="1.4" opacity="0.8"/>' +
              '<line x1="-14" y1="-44" x2="-10" y2="44" stroke="#7dd3fc" stroke-width="1.2" filter="url(#' + ctx.fGlow + ')"/>' +
              '<line x1="-5" y1="-48" x2="-3" y2="44" stroke="#fde68a" stroke-width="1.2"/>' +
              '<line x1="4" y1="-46" x2="4" y2="44" stroke="#f9a8d4" stroke-width="1.2"/>' +
              '<line x1="13" y1="-40" x2="10" y2="44" stroke="#7dd3fc" stroke-width="1.2"/>' +
              '<line x1="21" y1="-26" x2="15" y2="40" stroke="#fde68a" stroke-width="1.1"/>' +
              sparkle(0, -48, 5, '#38e8ff', 0.94) +
            '</g>' +
            waveFx +
          '</g>'
        );
      }
    });
  }

  function hero(jobId, poseOrOpts) {
    var args = normalizeHeroArgs(poseOrOpts);
    var jid = String(jobId || 'swordsman').toLowerCase();
    if (jid === 'scholar') return heroScholar(args.pose, args.className);
    if (jid === 'bard') return heroBard(args.pose, args.className);
    return heroSwordsman(args.pose, args.className);
  }

  /* ========================================================================
     PART 2B: FOUR TOWN NPCs — window.SVGArt.npc(npcId, emotion)
     FULL High-Detail Cel-Shaded Anime Half-Body Portraits [viewBox="0 0 320 340"]
     All 4 NPCs built on renderAnimeCharacter()!
     ======================================================================== */

  function normalizeNpcEmotion(emotion) {
    var raw = String(emotion || 'neutral').toLowerCase();
    if (raw === 'neutral' || raw === 'idle') return 'neutral';
    if (raw === 'happy' || raw === 'attack') return 'happy';
    if (raw === 'serious' || raw === 'hurt') return 'serious';
    if (raw === 'surprised' || raw === 'victory') return 'surprised';
    return 'neutral';
  }

  function npcMayor(emo) {
    var gFur = uid('my_fr');
    var gWood = uid('my_wd');
    return renderAnimeCharacter({
      mood: emo,
      svgClass: 'svg-art svg-npc npc-mayor emo-' + emo,
      dataAttrs: 'data-npc="mayor" data-mood="' + esc(emo) + '"',
      skinLight: '#fceee2',
      skinMid: '#ecc7ae',
      skinShadow: '#c28c74',
      skinLine: '#52342c',
      hairTop: '#ffffff',
      hairMid: '#e2e8f0',
      hairBot: '#94a3b8',
      hairShadow: '#64748b',
      hairLine: '#334155',
      hairHiColor: '#ffffff',
      browColor: '#64748b',
      irisTop: '#064e3b',
      irisMid: '#10b981',
      irisBot: '#6ee7b7',
      irisGlow: '#fef08a',
      cloth1Top: '#166534',
      cloth1Bot: '#052e16',
      cloth2Top: '#92400e',
      cloth2Bot: '#451a03',
      auraColor: '#34d399',
      auraColor2: '#d4af37',
      accentColor: '#fde68a',
      hasWrinkles: true,
      hasBeard: true,
      backHairStyle: 'elderSwept',
      frontHairStyle: 'elderSwept',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gFur + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#fffdf5"/>' +
            '<stop offset="70%" stop-color="#e7dec8"/>' +
            '<stop offset="100%" stop-color="#bfb293"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gWood + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#92400e"/>' +
            '<stop offset="50%" stop-color="#5c2d0e"/>' +
            '<stop offset="100%" stop-color="#2e1505"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          '<g opacity="0.72">' +
            '<circle cx="160" cy="148" r="106" fill="none" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="10 6" opacity="0.55"/>' +
            '<circle cx="160" cy="148" r="88" fill="none" stroke="#34d399" stroke-width="0.9" opacity="0.45"/>' +
            '<text x="160" y="172" text-anchor="middle" font-size="82" font-weight="700" font-family="' + FONT_SERIF + '" fill="#34d399" opacity="0.11">村</text>' +
          '</g>' +
          floatingMotes([[54, 112, 3, 0.8], [268, 108, 3.2, 0.85], [64, 212, 2.2, 0.7]], '#6ee7b7', '#fde68a')
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Heavy Deep-Forest-Green Elder Robe with gold brocade trim & cel folds
            '<path d="M58,340 C64,264 84,226 122,212 L160,224 L198,212 C236,226 256,264 262,340 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M98,256 L88,340 M222,256 L232,340" stroke="#021f0e" stroke-width="3.5" opacity="0.55"/>' +
            '<path d="M132,254 L132,340 M188,254 L188,340" stroke="url(#' + ctx.gGold + ')" stroke-width="2.4"/>' +
            '<path d="M138,274 L182,274 M138,296 L182,296 M138,318 L182,318" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2" opacity="0.65"/>' +
            // Plush Cream-White Fur Collar (毛領) wrapping warmly across shoulders
            '<path d="M84,234 C94,212 114,204 136,210 C148,218 172,218 184,210 C206,204 226,212 236,234 C244,252 228,266 206,262 C192,272 174,274 160,268 C146,274 128,272 114,262 C92,266 76,252 84,234 Z" fill="url(#' + gFur + ')" stroke="#8c7d5e" stroke-width="1.6" stroke-linejoin="round"/>' +
            '<path d="M94,244 Q112,254 126,246 M226,244 Q208,254 194,246 M142,254 Q160,262 178,254" fill="none" stroke="#b5a687" stroke-width="1.4" stroke-linecap="round"/>' +
            // Elder Emerald Clasp
            '<circle cx="160" cy="242" r="9" fill="url(#' + ctx.gGold + ')" stroke="#5c3a0e" stroke-width="1.2"/>' +
            '<circle cx="160" cy="242" r="4.8" fill="#10b981"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Gnarled Ancient Wooden Staff (古木權杖) crowned with glowing emerald-gold spirit gem
        var staffShift = emo === 'surprised' ? ' translate(6,-6) rotate(4 252 220)' : (emo === 'serious' ? ' translate(-4,0)' : '');
        return (
          '<g' + (staffShift ? ' transform="' + staffShift + '"' : '') + '>' +
            '<path d="M242,340 L248,176 C248,162 236,144 246,128 C258,112 280,118 278,138 C276,154 260,158 258,148" fill="none" stroke="url(#' + gWood + ')" stroke-width="9" stroke-linecap="round"/>' +
            '<path d="M244,338 L250,178" stroke="#d4af37" stroke-width="1.4" stroke-dasharray="10 8" opacity="0.8"/>' +
            '<path d="M236,162 C226,150 228,130 242,122" fill="none" stroke="url(#' + gWood + ')" stroke-width="4.5" stroke-linecap="round"/>' +
            // Glowing emerald-gold spirit gem suspended in staff crook
            '<circle cx="258" cy="138" r="11" fill="#34d399" filter="url(#' + ctx.fGlow + ')"/>' +
            '<circle cx="255" cy="135" r="4" fill="#ffffff" opacity="0.85"/>' +
            sparkle(258, 114, 5.5, '#fef08a', 0.92) +
          '</g>'
        );
      }
    });
  }

  function npcMerchant(emo) {
    var gApron = uid('mc_ap');
    var gForge = uid('mc_fg');
    return renderAnimeCharacter({
      mood: emo,
      svgClass: 'svg-art svg-npc npc-merchant emo-' + emo,
      dataAttrs: 'data-npc="merchant" data-mood="' + esc(emo) + '"',
      skinLight: '#fff0e2',
      skinMid: '#f6cca9',
      skinShadow: '#cc8f6e',
      skinLine: '#5c3424',
      hairTop: '#fb923c',
      hairMid: '#c2410c',
      hairBot: '#7c2d12',
      hairShadow: '#431407',
      hairLine: '#2b0d05',
      hairHiColor: '#ffedd5',
      irisTop: '#78350f',
      irisMid: '#f59e0b',
      irisBot: '#fef08a',
      irisGlow: '#fffbeb',
      cloth1Top: '#991b1b',
      cloth1Bot: '#450a0a',
      cloth2Top: '#78350f',
      cloth2Bot: '#2e1305',
      auraColor: '#f97316',
      auraColor2: '#fbbf24',
      accentColor: '#fbbf24',
      backHairStyle: 'highPonytail',
      frontHairStyle: 'highPonytail',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gApron + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#92400e"/>' +
            '<stop offset="55%" stop-color="#5c280a"/>' +
            '<stop offset="100%" stop-color="#2c1204"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + gForge + '" cx="50%" cy="72%" r="55%">' +
            '<stop offset="0%" stop-color="#f97316" stop-opacity="0.34"/>' +
            '<stop offset="100%" stop-color="#050814" stop-opacity="0"/>' +
          '</radialGradient>'
        );
      },
      backdropFn: function (ctx) {
        // Warm forge glow + mounted fine weapon rack (背後掛有精良武器架)
        return (
          '<ellipse cx="160" cy="240" rx="140" ry="96" fill="url(#' + gForge + ')"/>' +
          '<g opacity="0.62">' +
            // Timber weapon rack crossbars behind shoulders
            '<path d="M22,124 L298,124 M22,188 L298,188" stroke="#5c2d0e" stroke-width="5" stroke-linecap="round"/>' +
            '<path d="M48,74 L48,234 M272,74 L272,234" stroke="#451a03" stroke-width="5.5" stroke-linecap="round"/>' +
            // Mounted Fine Katana on left
            '<path d="M36,76 L72,186 L66,188 L30,78 Z" fill="url(#' + ctx.gSteel + ')" stroke="#cbd5e1" stroke-width="0.8"/>' +
            '<line x1="60" y1="188" x2="78" y2="182" stroke="url(#' + ctx.gGold + ')" stroke-width="3.2"/>' +
            // Mounted Heater Shield & Spear on right
            '<path d="M242,84 L278,84 L278,118 C278,136 260,148 260,148 C260,148 242,136 242,118 Z" fill="#1e293b" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            '<path d="M260,92 L260,138 M248,110 L272,110" stroke="url(#' + ctx.gGold + ')" stroke-width="1.3"/>' +
            '<line x1="286" y1="64" x2="286" y2="226" stroke="#78350f" stroke-width="3.2"/>' +
            '<polygon points="286,44 294,72 286,66 278,72" fill="url(#' + ctx.gSteel + ')" stroke="#e2e8f0" stroke-width="0.9"/>' +
          '</g>' +
          floatingMotes([[46, 212, 2.5, 0.85], [274, 216, 2.8, 0.88], [88, 92, 2.2, 0.78]], '#fb923c', '#fde047')
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Dark-crimson smith shirt sleeves & open collar
            '<path d="M64,340 C68,266 86,230 120,218 L160,236 L200,218 C234,230 252,266 256,340 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="#2b0d05" stroke-width="1.8"/>' +
            // Sturdy Leather Forging Apron (皮製鍛造圍裙) with brass shoulder straps & rivets
            '<path d="M116,222 L134,222 L132,264 L188,264 L186,222 L204,222 L212,340 L108,340 Z" fill="url(#' + gApron + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
            '<path d="M122,268 L198,268 M116,304 L204,304" stroke="#2c1204" stroke-width="2" opacity="0.65"/>' +
            // Brass rivets & tool belt pocket
            '<circle cx="126" cy="260" r="3" fill="url(#' + ctx.gGold + ')"/>' +
            '<circle cx="194" cy="260" r="3" fill="url(#' + ctx.gGold + ')"/>' +
            '<path d="M108,298 L212,298 L214,316 L106,316 Z" fill="#3c1a08" stroke="url(#' + ctx.gGold + ')" stroke-width="1.4"/>' +
            '<rect x="150" y="295" width="20" height="24" rx="3" fill="url(#' + ctx.gGold + ')" stroke="#5c3a0e" stroke-width="1.2"/>' +
            // Reinforced Steel Bracer (臂甲) on left forearm
            '<path d="M66,282 L106,274 L112,336 L62,336 Z" fill="url(#' + ctx.gSteel + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.7"/>' +
            '<path d="M72,296 L104,290 M70,314 L106,308" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Brass Forehead Forging Goggles (護目鏡) with glowing amber lenses
        return (
          '<g transform="translate(160,92)">' +
            '<path d="M-56,4 Q0,-10 56,4" fill="none" stroke="#451a03" stroke-width="7" stroke-linecap="round"/>' +
            '<circle cx="-23" cy="0" r="15.5" fill="#1c1917" stroke="url(#' + ctx.gGold + ')" stroke-width="3.2"/>' +
            '<circle cx="23" cy="0" r="15.5" fill="#1c1917" stroke="url(#' + ctx.gGold + ')" stroke-width="3.2"/>' +
            '<circle cx="-23" cy="0" r="11.2" fill="#f59e0b" fill-opacity="0.72"/>' +
            '<circle cx="23" cy="0" r="11.2" fill="#f59e0b" fill-opacity="0.72"/>' +
            '<path d="M-30,-4 L-20,-9 M16,-4 L26,-9" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.88"/>' +
            '<rect x="-8" y="-3" width="16" height="6" rx="2" fill="url(#' + ctx.gGold + ')"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Forging Hammer held confidently on right shoulder
        var hTf = emo === 'happy' ? 'translate(248,224) rotate(12)' : (emo === 'surprised' ? 'translate(254,236) rotate(24)' : 'translate(248,236) rotate(18)');
        return (
          '<g transform="' + hTf + '">' +
            '<rect x="-5" y="4" width="10" height="106" rx="3" fill="#5c280a" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
            '<path d="M-28,-22 L28,-22 L32,-4 L26,10 L-26,10 L-32,-4 Z" fill="url(#' + ctx.gSteel + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8" stroke-linejoin="round"/>' +
            '<path d="M-22,-16 L22,-16" stroke="#e2e8f0" stroke-width="2" opacity="0.7"/>' +
            sparkle(-26, -18, 4.5, '#fbbf24', 0.92) +
          '</g>'
        );
      }
    });
  }

  function npcScholar(emo) {
    var gShelf = uid('ns_sh');
    var gScroll = uid('ns_sc');
    return renderAnimeCharacter({
      mood: emo,
      svgClass: 'svg-art svg-npc npc-scholar emo-' + emo,
      dataAttrs: 'data-npc="scholar" data-mood="' + esc(emo) + '"',
      skinLight: '#fff6f0',
      skinMid: '#fce2d2',
      skinShadow: '#d4a397',
      skinLine: '#543844',
      hairTop: '#818cf8',
      hairMid: '#3730a3',
      hairBot: '#1e1b4b',
      hairShadow: '#0f0d2b',
      hairLine: '#09071d',
      hairHiColor: '#e0e7ff',
      irisTop: '#1e3a8a',
      irisMid: '#38bdf8',
      irisBot: '#bae6fd',
      irisGlow: '#e0f2fe',
      cloth1Top: '#312e81',
      cloth1Bot: '#121036',
      cloth2Top: '#7f1d1d',
      cloth2Bot: '#3b0a12',
      auraColor: '#6366f1',
      auraColor2: '#f59e0b',
      accentColor: '#7dd3fc',
      backHairStyle: 'longStraight',
      frontHairStyle: 'longStraight',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gShelf + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#451a03" stop-opacity="0.72"/>' +
            '<stop offset="100%" stop-color="#1c0d04" stop-opacity="0.22"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gScroll + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#fef3c7"/>' +
            '<stop offset="65%" stop-color="#e7d2a4"/>' +
            '<stop offset="100%" stop-color="#bfa36f"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        // Scholar's Study stacked with ancient books & scrolls (堆滿古書捲軸的書齋背景)
        return (
          '<g opacity="0.64">' +
            // Left stacked bookshelves
            '<path d="M18,128 L108,128 M18,196 L108,196" stroke="#78350f" stroke-width="4.5" stroke-linecap="round"/>' +
            '<rect x="26" y="84" width="12" height="42" rx="1.5" fill="#7f1d1d" stroke="#d4af37" stroke-width="0.9"/>' +
            '<rect x="40" y="92" width="10" height="34" rx="1.5" fill="#1e3a8a" stroke="#d4af37" stroke-width="0.9"/>' +
            '<rect x="52" y="80" width="14" height="46" rx="1.5" fill="#065f46" stroke="#d4af37" stroke-width="0.9"/>' +
            '<rect x="68" y="96" width="11" height="30" rx="1.5" fill="#581c87" stroke="#d4af37" stroke-width="0.9"/>' +
            // Stacked scrolls on left lower shelf
            '<ellipse cx="42" cy="186" rx="16" ry="6" fill="url(#' + gScroll + ')" stroke="#92400e" stroke-width="1"/>' +
            '<ellipse cx="52" cy="175" rx="16" ry="6" fill="url(#' + gScroll + ')" stroke="#92400e" stroke-width="1"/>' +
            // Right stacked bookshelves & glowing study lantern
            '<path d="M212,128 L302,128 M212,196 L302,196" stroke="#78350f" stroke-width="4.5" stroke-linecap="round"/>' +
            '<rect x="226" y="88" width="12" height="38" rx="1.5" fill="#312e81" stroke="#d4af37" stroke-width="0.9"/>' +
            '<rect x="240" y="78" width="13" height="48" rx="1.5" fill="#92400e" stroke="#d4af37" stroke-width="0.9"/>' +
            '<rect x="256" y="94" width="11" height="32" rx="1.5" fill="#7f1d1d" stroke="#d4af37" stroke-width="0.9"/>' +
            '<rect x="270" y="84" width="12" height="42" rx="1.5" fill="#1e3a8a" stroke="#d4af37" stroke-width="0.9"/>' +
            // Hanging study lantern glow on top-right
            '<circle cx="274" cy="166" r="14" fill="#fbbf24" opacity="0.28" filter="url(#' + ctx.fGlow + ')"/>' +
            '<rect x="268" y="156" width="12" height="20" rx="3" fill="#fef3c7" stroke="url(#' + ctx.gGold + ')" stroke-width="1.3"/>' +
          '</g>' +
          floatingMotes([[62, 64, 2.5, 0.8], [256, 62, 2.8, 0.85]], '#fde68a', '#7dd3fc')
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Layered Ivory Scholar Shirt + Velvet Cravat
            '<path d="M126,214 L160,256 L194,214 L204,336 L116,336 Z" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.3"/>' +
            '<path d="M148,236 L160,288 L172,236 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
            // Tailored Indigo Scholar Vest & Draped Academic Shawl
            '<path d="M74,264 C84,224 114,212 136,216 L158,266 L142,340 L68,340 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.7"/>' +
            '<path d="M246,264 C236,224 206,212 184,216 L162,266 L178,340 L252,340 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.7"/>' +
            '<path d="M100,264 L92,340 M220,264 L228,340" stroke="#090720" stroke-width="2.6" opacity="0.52"/>' +
            '<circle cx="160" cy="242" r="6" fill="url(#' + ctx.gGold + ')"/>' +
            '<circle cx="160" cy="242" r="2.6" fill="#38e8ff"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Refined Gold Round-Framed Glasses (圓框眼鏡) with diagonal lens reflection
        return (
          '<g>' +
            '<circle cx="136" cy="141" r="16.5" fill="#e0f2fe" fill-opacity="0.16" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<circle cx="184" cy="141" r="16.5" fill="#e0f2fe" fill-opacity="0.16" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M152.5,140 Q160,136 167.5,140" fill="none" stroke="url(#' + ctx.gGold + ')" stroke-width="1.9"/>' +
            '<line x1="112" y1="138" x2="119.5" y2="140" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
            '<line x1="200.5" y1="140" x2="208" y2="138" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
            // Crisp diagonal anime glasses glint
            '<path d="M126,133 L135,127 M174,133 L183,127" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" opacity="0.82"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Holding Gilded Magnifying Glass (放大鏡) & Rolled Ancient Manuscript (古文書)
        var magTf = emo === 'surprised' ? 'translate(238,228) rotate(-18)' : 'translate(242,248) rotate(-10)';
        return (
          '<g>' +
            // Rolled Ancient Manuscript on left
            '<g transform="translate(82,276) rotate(-16)">' +
              '<rect x="-24" y="-34" width="48" height="62" rx="4" fill="url(#' + gScroll + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
              '<rect x="-28" y="-38" width="56" height="8" rx="3" fill="#4c1d95" stroke="url(#' + ctx.gGold + ')" stroke-width="1.1"/>' +
              '<rect x="-28" y="24" width="56" height="8" rx="3" fill="#4c1d95" stroke="url(#' + ctx.gGold + ')" stroke-width="1.1"/>' +
              '<text x="0" y="-6" text-anchor="middle" font-size="13" font-weight="700" font-family="' + FONT_SERIF + '" fill="#1e1b4b">古文</text>' +
              '<line x1="-14" y1="6" x2="14" y2="6" stroke="#475569" stroke-width="1.4"/>' +
              '<line x1="-14" y1="14" x2="10" y2="14" stroke="#475569" stroke-width="1.4"/>' +
            '</g>' +
            // Gilded Magnifying Glass on right
            '<g transform="' + magTf + '">' +
              '<rect x="-4" y="18" width="8" height="54" rx="3" fill="#5c2d0e" stroke="url(#' + ctx.gGold + ')" stroke-width="1.3"/>' +
              '<circle cx="0" cy="0" r="22" fill="#7dd3fc" fill-opacity="0.24" stroke="url(#' + ctx.gGold + ')" stroke-width="4.2"/>' +
              '<path d="M-12,-10 Q-4,-16 6,-12" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" opacity="0.85"/>' +
              '<text x="0" y="6" text-anchor="middle" font-size="15" font-weight="700" font-family="' + FONT_SERIF + '" fill="#38e8ff" opacity="0.88" filter="url(#' + ctx.fGlow + ')">解</text>' +
            '</g>' +
          '</g>'
        );
      }
    });
  }

  function npcPriest(emo) {
    var gRobe = uid('pr_rb');
    var gHoly = uid('pr_hl');
    return renderAnimeCharacter({
      mood: emo,
      reverentClosed: true,
      svgClass: 'svg-art svg-npc npc-priest emo-' + emo,
      dataAttrs: 'data-npc="priest" data-mood="' + esc(emo) + '"',
      skinLight: '#fff8f2',
      skinMid: '#fde4d6',
      skinShadow: '#d8a69a',
      skinLine: '#5c3c40',
      hairTop: '#ffffff',
      hairMid: '#e2e8f0',
      hairBot: '#cbd5e1',
      hairShadow: '#94a3b8',
      hairLine: '#475569',
      hairHiColor: '#ffffff',
      browColor: '#64748b',
      irisTop: '#0369a1',
      irisMid: '#38bdf8',
      irisBot: '#bae6fd',
      irisGlow: '#fef08a',
      cloth1Top: '#ffffff',
      cloth1Bot: '#cbd5e1',
      cloth2Top: '#1e3a8a',
      cloth2Bot: '#0f172a',
      auraColor: '#fef08a',
      auraColor2: '#38e8ff',
      accentColor: '#fef08a',
      backHairStyle: 'sacredFlowing',
      frontHairStyle: 'sacredFlowing',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gRobe + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#ffffff"/>' +
            '<stop offset="65%" stop-color="#f1f5f9"/>' +
            '<stop offset="100%" stop-color="#cbd5e1"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + gHoly + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.98"/>' +
            '<stop offset="45%" stop-color="#fef08a" stop-opacity="0.62"/>' +
            '<stop offset="100%" stop-color="#38e8ff" stop-opacity="0"/>' +
          '</radialGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          magicCircle(160, 140, 108, {
            primary: '#fde047',
            secondary: '#7dd3fc',
            kanji: '聖',
            kanjiSize: 84,
            kanjiOpacity: 0.13,
            opacity: 0.86,
            runes: ['聖', '祈', '光', '癒', '言', '霊', '清', '護']
          }) +
          floatingMotes([[52, 92, 3.4, 0.92], [268, 96, 3.6, 0.92], [62, 224, 2.8, 0.85], [258, 224, 2.8, 0.85]], '#fef08a', '#7dd3fc')
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Pure White & Gold-Trimmed Priestly Robe (純白金邊祭司長袍)
            '<path d="M58,340 C66,262 88,224 128,214 L160,232 L192,214 C232,224 254,262 262,340 Z" fill="url(#' + gRobe + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            // Soft cel-shaded robe fold shadows
            '<path d="M98,254 L88,340 M222,254 L232,340" stroke="#94a3b8" stroke-width="3" opacity="0.48"/>' +
            // Sacred Indigo & Gold Priestly Stole draped over shoulders
            '<path d="M112,218 L138,216 L146,340 L114,340 Z M208,218 L182,216 L174,340 L206,340 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            '<path d="M126,250 L132,262 L126,274 L120,262 Z M194,250 L200,262 L194,274 L188,262 Z" fill="url(#' + ctx.gGold + ')"/>' +
            // White high sacred collar with crimson shimenawa-style knot
            '<path d="M132,210 Q160,238 188,210 L182,224 Q160,248 138,224 Z" fill="#ffffff" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
            '<path d="M148,236 Q160,244 172,236" fill="none" stroke="#dc2626" stroke-width="2.6" stroke-linecap="round"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Ornate Golden Filigree Saint Crown (金絲聖冠) with cyan crystal
        return (
          '<g transform="translate(160,64)">' +
            '<path d="M-46,24 C-38,2 -22,-8 0,-22 C22,-8 38,2 46,24 C30,14 14,10 0,10 C-14,10 -30,14 -46,24 Z" fill="none" stroke="url(#' + ctx.gGold + ')" stroke-width="2.8" stroke-linejoin="round"/>' +
            '<path d="M-32,16 L-24,-6 L-12,10 L0,-24 L12,10 L24,-6 L32,16 Z" fill="url(#' + ctx.gGold + ')" stroke="#6b4c0e" stroke-width="1.2" stroke-linejoin="round"/>' +
            '<polygon points="0,-14 6,-4 0,6 -6,-4" fill="#38e8ff" stroke="#ffffff" stroke-width="0.9" filter="url(#' + ctx.fGlow + ')"/>' +
            '<circle cx="-24" cy="4" r="2.8" fill="#fef08a"/>' +
            '<circle cx="24" cy="4" r="2.8" fill="#fef08a"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Clasped Hands in Prayer (雙手合十) cradling radiant Holy Kotodama Light (神聖言靈光輝)
        return (
          '<g>' +
            // Radiant Holy Light Orb behind clasped hands
            '<circle cx="160" cy="272" r="46" fill="url(#' + gHoly + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +
            // White flowing prayer sleeves coming together
            '<path d="M88,340 C98,298 122,282 146,282 L148,324 L108,340 Z" fill="url(#' + gRobe + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            '<path d="M232,340 C222,298 198,282 174,282 L172,324 L212,340 Z" fill="url(#' + gRobe + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            // Sculpted Clasped Hands (雙手合十)
            '<path d="M160,248 C151,260 144,276 146,294 C150,302 156,304 160,304 C164,304 170,302 174,294 C176,276 169,260 160,248 Z" fill="url(#' + ctx.gSkin + ')" stroke="' + ctx.skinLine + '" stroke-width="1.5" stroke-linejoin="round"/>' +
            '<line x1="160" y1="250" x2="160" y2="303" stroke="' + ctx.skinShadow + '" stroke-width="1.4"/>' +
            // Orbiting Holy Kanji Sparkles ('聖・祈・光')
            '<g class="svg-float" filter="url(#' + ctx.fGlow + ')" ' + ORIGIN_CENTER + '>' +
              '<text x="116" y="254" text-anchor="middle" font-size="14" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fef08a">祈</text>' +
              '<text x="204" y="254" text-anchor="middle" font-size="14" font-weight="700" font-family="' + FONT_SERIF + '" fill="#7dd3fc">光</text>' +
              sparkle(160, 232, 7, '#ffffff', 0.96) +
              sparkle(132, 274, 4.5, '#fef08a', 0.92) +
              sparkle(188, 274, 4.5, '#7dd3fc', 0.92) +
            '</g>' +
          '</g>'
        );
      }
    });
  }

  function npc(npcId, emotion) {
    var emo = normalizeNpcEmotion(emotion);
    var id = String(npcId || 'mayor').toLowerCase();
    if (id === 'merchant') return npcMerchant(emo);
    if (id === 'scholar') return npcScholar(emo);
    if (id === 'priest') return npcPriest(emo);
    return npcMayor(emo);
  }

  /* ========================================================================
     PART 3: ENEMIES & 6 KINGDOM BOSSES — window.SVGArt.enemy(enemyId, isBoss, pose)
     [viewBox="0 0 320 320"] | 5 Combat Reaction Poses: idle, hit, break, attack, defeat
     4 Humanoid Bosses built on renderAnimeCharacter() + 2 Sculpted Bosses + 12 Monsters
     ======================================================================== */

  function normalizeEnemyPose(pose) {
    var p = String(pose || 'idle').toLowerCase();
    if (p === 'hit' || p === 'break' || p === 'attack' || p === 'defeat') return p;
    return 'idle';
  }

  function enemyPoseToAnimeMood(pose) {
    if (pose === 'attack') return 'attack';
    if (pose === 'hit' || pose === 'defeat') return 'hurt';
    if (pose === 'break') return 'surprised';
    return 'serious';
  }

  function renderEnemyPoseOverlay(pose, glowId, isBoss) {
    if (pose === 'hit') {
      return (
        '<g filter="url(#' + glowId + ')">' +
          '<path d="M56,246 Q152,148 272,62 Q168,162 72,262 Z" fill="#ffffff" opacity="0.92"/>' +
          '<path d="M44,234 Q146,136 284,54" fill="none" stroke="#38e8ff" stroke-width="5" stroke-linecap="round"/>' +
          '<path d="M88,268 Q174,186 266,112" fill="none" stroke="#fde047" stroke-width="2.6" stroke-linecap="round" opacity="0.85"/>' +
          sparkle(166, 152, 16, '#ffffff', 0.96) +
          sparkle(224, 102, 9, '#7dd3fc', 0.92) +
          sparkle(104, 214, 8, '#fde047', 0.9) +
        '</g>'
      );
    }
    if (pose === 'break') {
      return (
        '<g filter="url(#' + glowId + ')">' +
          // Shattered golden barrier diamond shards exploding outward
          '<polygon points="62,92 84,78 76,108 54,114" fill="#fde047" stroke="#fffbeb" stroke-width="1.2" opacity="0.9"/>' +
          '<polygon points="244,82 268,94 256,118 234,104" fill="#38e8ff" stroke="#ffffff" stroke-width="1.2" opacity="0.9"/>' +
          '<polygon points="56,214 78,204 82,232 58,238" fill="#fbbf24" stroke="#ffffff" stroke-width="1.1" opacity="0.86"/>' +
          '<polygon points="236,208 264,218 252,242 228,228" fill="#fde047" stroke="#ffffff" stroke-width="1.1" opacity="0.86"/>' +
          // Cracked shockwave arcs & spinning dizzy stars above head
          '<path d="M72,158 Q160,118 248,158" fill="none" stroke="#fde047" stroke-width="2.2" stroke-dasharray="10 6"/>' +
          '<ellipse cx="160" cy="48" rx="46" ry="12" fill="none" stroke="#fde047" stroke-width="1.8" stroke-dasharray="6 5"/>' +
          '<polygon points="' + polygonStar(116, 48, 9, 3.8, 5) + '" fill="#fef08a"/>' +
          '<polygon points="' + polygonStar(160, 38, 11, 4.5, 5) + '" fill="#ffffff"/>' +
          '<polygon points="' + polygonStar(204, 48, 9, 3.8, 5) + '" fill="#fde047"/>' +
        '</g>'
      );
    }
    if (pose === 'attack') {
      return (
        '<g filter="url(#' + glowId + ')">' +
          // Crimson battle surge & triple sweeping claw/slash arcs
          '<path d="M36,76 C116,108 198,162 286,244" fill="none" stroke="#ff2a55" stroke-width="' + (isBoss ? '6.5' : '5') + '" stroke-linecap="round"/>' +
          '<path d="M52,58 C134,94 214,148 296,222" fill="none" stroke="#fda4af" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M24,104 C104,134 184,186 268,268" fill="none" stroke="#fb7185" stroke-width="3.4" stroke-linecap="round"/>' +
          '<path d="M28,154 L66,144 M292,154 L254,144 M38,214 L74,196 M282,214 L246,196" stroke="#ff3b5c" stroke-width="2.4" stroke-linecap="round" opacity="0.82"/>' +
          sparkle(256, 214, 11, '#fff1f2', 0.94) +
        '</g>'
      );
    }
    if (pose === 'defeat') {
      return (
        '<g opacity="0.85">' +
          '<path d="M48,266 Q104,234 160,256 T272,248 L272,320 L48,320 Z" fill="#090d1e" opacity="0.65"/>' +
          '<g class="svg-float" filter="url(#' + glowId + ')" ' + ORIGIN_CENTER + '>' +
            '<circle cx="96" cy="184" r="5" fill="#94a3b8" opacity="0.72"/>' +
            '<circle cx="136" cy="126" r="4" fill="#cbd5e1" opacity="0.68"/>' +
            '<circle cx="186" cy="108" r="5.5" fill="#94a3b8" opacity="0.72"/>' +
            '<circle cx="224" cy="166" r="4.2" fill="#e2e8f0" opacity="0.65"/>' +
            '<path d="M112,248 Q116,196 108,148 M164,258 Q156,194 168,128 M212,244 Q218,192 206,144" fill="none" stroke="#94a3b8" stroke-width="2.4" stroke-dasharray="6 8" opacity="0.62"/>' +
          '</g>' +
        '</g>'
      );
    }
    return '';
  }

  function wrapEnemySvg(enemyId, isBoss, pose, extraDefs, bodySvg, opts) {
    opts = opts || {};
    var p = normalizeEnemyPose(pose);
    var bossFlag = !!isBoss;
    var gAura = uid('en_au');
    var gFloor = uid('en_fl');
    var fGlow = uid('en_gl');
    var fShadow = uid('en_sh');

    var bg1 = opts.bg1 || (bossFlag ? '#991b1b' : '#312e81');
    var primary = opts.primary || (bossFlag ? '#f59e0b' : '#d4af37');
    var secondary = opts.secondary || '#38e8ff';
    var kanji = opts.kanji || '妖';
    var runes = opts.runes || ['闇', '妖', '言', '霊', '封', '影', '魂', '崩'];

    var poseTf = '';
    var poseOpacity = '1';
    if (p === 'hit') poseTf = 'translate(10,-6) rotate(4 160 160)';
    else if (p === 'break') poseTf = 'translate(-6,8) rotate(-5 160 160)';
    else if (p === 'attack') poseTf = 'translate(-8,-6) scale(1.06)';
    else if (p === 'defeat') {
      poseTf = 'translate(0,18) scale(0.92)';
      poseOpacity = '0.52';
    }

    var resolvedBody = bodySvg
      .replace(/__GLOW__/g, fGlow)
      .replace(/__SHADOW__/g, fShadow);

    var bossAuraRing = bossFlag
      ? magicCircle(160, 154, 128, {
          primary: primary,
          secondary: secondary,
          kanji: kanji,
          kanjiSize: 102,
          kanjiOpacity: 0.16,
          opacity: p === 'defeat' ? 0.25 : 0.88,
          runes: runes
        })
      : '<g opacity="' + (p === 'defeat' ? '0.2' : '0.68') + '">' +
          '<circle cx="160" cy="158" r="106" fill="none" stroke="' + primary + '" stroke-width="1.2" stroke-dasharray="9 6" opacity="0.52"/>' +
          '<text x="160" y="186" text-anchor="middle" font-size="94" font-weight="700" font-family="' + FONT_SERIF + '" fill="' + secondary + '" opacity="0.1">' + esc(kanji) + '</text>' +
        '</g>';

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="svg-art svg-enemy enemy-' + esc(enemyId) + ' enemy-pose-' + esc(p) + (bossFlag ? ' is-boss' : '') + '" data-enemy="' + esc(enemyId) + '" data-pose="' + esc(p) + '">' +
        '<defs>' +
          '<radialGradient id="' + gAura + '" cx="50%" cy="48%" r="52%">' +
            '<stop offset="0%" stop-color="' + bg1 + '" stop-opacity="' + (bossFlag ? '0.46' : '0.32') + '"/>' +
            '<stop offset="58%" stop-color="' + secondary + '" stop-opacity="0.1"/>' +
            '<stop offset="100%" stop-color="#050814" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<radialGradient id="' + gFloor + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#02040b" stop-opacity="0.72"/>' +
            '<stop offset="100%" stop-color="#02040b" stop-opacity="0"/>' +
          '</radialGradient>' +
          defsGlow(fGlow, bossFlag ? 3.4 : 2.6) +
          defsSoftShadow(fShadow) +
          (extraDefs || '') +
        '</defs>' +

        '<ellipse cx="160" cy="156" rx="146" ry="144" fill="url(#' + gAura + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +
        bossAuraRing +
        '<ellipse cx="160" cy="288" rx="' + (bossFlag ? '106' : '82') + '" ry="16" fill="url(#' + gFloor + ')"/>' +
        '<g opacity="' + poseOpacity + '"' + (poseTf ? ' transform="' + poseTf + '"' : '') + ' filter="url(#' + fShadow + ')">' +
          resolvedBody +
        '</g>' +
        renderEnemyPoseOverlay(p, fGlow, bossFlag) +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------------
     4 HUMANOID BOSSES (Built on Unified renderAnimeCharacter Rig!)
     ------------------------------------------------------------------------ */

  function bossR2Knight(pose) {
    var gArmor = uid('bk_ar');
    var gBlade = uid('bk_bl');
    return renderAnimeCharacter({
      mood: enemyPoseToAnimeMood(pose),
      bossMenace: true,
      disableMoodOverlay: true,
      bodyOpacity: pose === 'defeat' ? 0.56 : 1,
      viewBox: '0 0 320 320',
      svgClass: 'svg-art svg-enemy enemy-boss_r2_knight enemy-pose-' + pose + ' is-boss',
      dataAttrs: 'data-enemy="boss_r2_knight" data-pose="' + esc(pose) + '"',
      skinLight: '#d8d4e0',
      skinMid: '#aba4ba',
      skinShadow: '#645c7a',
      skinLine: '#1c182c',
      hairTop: '#94a3b8',
      hairMid: '#334155',
      hairBot: '#0f172a',
      hairShadow: '#060a16',
      hairLine: '#02040a',
      hairHiColor: '#cbd5e1',
      irisTopL: '#7f1d1d',
      irisMidL: '#ef4444',
      irisBotL: '#fde047',
      irisGlowL: '#ff3b5c',
      irisTopR: '#7f1d1d',
      irisMidR: '#ef4444',
      irisBotR: '#fde047',
      irisGlowR: '#ff3b5c',
      cloth1Top: '#262b3d',
      cloth1Bot: '#080b14',
      cloth2Top: '#991b1b',
      cloth2Bot: '#3b0712',
      auraColor: '#dc2626',
      auraColor2: '#f59e0b',
      accentColor: '#ff3b5c',
      backHairStyle: 'spikyShort',
      frontHairStyle: 'spikyShort',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gArmor + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#475569"/>' +
            '<stop offset="48%" stop-color="#1e2436"/>' +
            '<stop offset="100%" stop-color="#070912"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gBlade + '" x1="0%" y1="100%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#7f1d1d"/>' +
            '<stop offset="55%" stop-color="#ef4444"/>' +
            '<stop offset="100%" stop-color="#fef08a"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          magicCircle(160, 152, 128, {
            primary: '#ef4444',
            secondary: '#fbbf24',
            kanji: '崩',
            kanjiSize: 102,
            kanjiOpacity: 0.18,
            opacity: pose === 'defeat' ? 0.28 : 0.9,
            runes: ['崩', '壊', '鉄', '斬', '呪', '闇', '剣', '覇']
          }) +
          shatteredKanji([[46, 98, '崩', -16, '#ff3b5c', 16], [274, 94, '斬', 14, '#fde047', 16], [42, 224, '呪', 10, '#f87171', 14]], ctx.fGlow)
        );
      },
      backPropsFn: function (ctx) {
        // Torn crimson dark-knight war cape billowing behind shoulders
        return (
          '<path d="M88,204 C44,220 26,266 30,320 L74,304 L88,320 L232,320 L246,304 L290,320 C294,266 276,220 232,204 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="#450a0a" stroke-width="1.8"/>'
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // High Spiked Obsidian Gorget Collar
            '<path d="M116,196 L142,226 L160,236 L178,226 L204,196 L218,224 L188,252 L160,262 L132,252 L102,224 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.9"/>' +
            // Fractured Obsidian Plate Cuirass with blazing crimson rune core
            '<path d="M96,232 L224,232 L232,320 L88,320 Z" fill="url(#' + gArmor + ')" stroke="#475569" stroke-width="1.8"/>' +
            '<polygon points="160,248 182,276 160,304 138,276" fill="#09050e" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<text x="160" y="284" text-anchor="middle" font-size="22" font-weight="700" font-family="' + FONT_SERIF + '" fill="#ff3b5c" filter="url(#' + ctx.fGlow + ')">崩</text>' +
            // Massive Jagged Spiked Boss Pauldrons
            '<path d="M36,248 L62,196 L94,206 L128,214 L124,254 C96,256 68,266 44,284 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M284,248 L258,196 L226,206 L192,214 L196,254 C224,256 252,266 276,284 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2" stroke-linejoin="round"/>' +
            '<path d="M56,244 L118,234 M264,244 L202,234" stroke="#ef4444" stroke-width="2" opacity="0.82" filter="url(#' + ctx.fGlow + ')"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Shattered Horned Obsidian Knight Half-Helm revealing glowing crimson anime eyes beneath!
        return (
          '<g>' +
            // Sweeping curved demon-knight steel horns
            '<path d="M106,94 C72,72 62,36 82,12 C86,40 98,58 122,74 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            '<path d="M214,94 C248,72 258,36 238,12 C234,40 222,58 198,74 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            // Cracked Dark Visor Brow-Crown & Half-Jaw Plate (leaves anime eyes blazing fiercely!)
            '<path d="M98,122 C96,68 124,42 160,42 C196,42 224,68 222,122 L206,128 L194,114 L160,126 L126,114 L114,128 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.9" stroke-linejoin="round"/>' +
            '<path d="M160,42 L160,124" stroke="url(#' + ctx.gGold + ')" stroke-width="2.2"/>' +
            // Glowing fracture line on left side of visor
            '<path d="M118,74 L134,92 L124,108 L142,118" fill="none" stroke="#ff3b5c" stroke-width="2.2" filter="url(#' + ctx.fGlow + ')"/>' +
            // Iron jaw-guard framing chin
            '<path d="M112,162 L138,194 L160,204 L182,194 L208,162 L212,178 L184,206 L160,214 L136,206 L108,178 Z" fill="url(#' + gArmor + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.5"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Shattered Crimson Rune Greatsword & dark iron chains
        var swTf = pose === 'attack' ? 'translate(222,192) rotate(-32)' : 'translate(246,214) rotate(14)';
        return (
          '<g transform="' + swTf + '">' +
            '<path d="M-12,-8 L-14,-146 L0,-172 L14,-142 L12,-8 Z" fill="url(#' + gArmor + ')" stroke="url(#' + gBlade + ')" stroke-width="2" filter="url(#' + ctx.fGlow + ')"/>' +
            '<path d="M0,-160 L0,-14" stroke="#ff3b5c" stroke-width="3" filter="url(#' + ctx.fGlow + ')"/>' +
            '<path d="M-32,-4 L-12,-14 L12,-14 L32,-4 L16,6 L-16,6 Z" fill="url(#' + ctx.gGold + ')" stroke="#450a0a" stroke-width="1.4"/>' +
            '<rect x="-6" y="6" width="12" height="42" rx="2" fill="#1e2436" stroke="url(#' + ctx.gGold + ')" stroke-width="1.2"/>' +
          '</g>'
        );
      },
      postOverlayFn: function (ctx) {
        return renderEnemyPoseOverlay(pose, ctx.fGlow, true);
      }
    });
  }

  function bossR3Kabuki(pose) {
    var gFan = uid('kb_fn');
    return renderAnimeCharacter({
      mood: enemyPoseToAnimeMood(pose),
      bossMenace: true,
      disableMoodOverlay: true,
      bodyOpacity: pose === 'defeat' ? 0.56 : 1,
      viewBox: '0 0 320 320',
      svgClass: 'svg-art svg-enemy enemy-boss_r3_kabuki enemy-pose-' + pose + ' is-boss',
      dataAttrs: 'data-enemy="boss_r3_kabuki" data-pose="' + esc(pose) + '"',
      skinLight: '#ffffff',
      skinMid: '#f3eef5',
      skinShadow: '#cbbad6',
      skinLine: '#3b1530',
      hairTop: '#f8fafc',
      hairMid: '#e2e8f0',
      hairBot: '#94a3b8',
      hairShadow: '#475569',
      hairLine: '#1e1030',
      hairHiColor: '#ffffff',
      irisTopL: '#991b1b',
      irisMidL: '#f59e0b',
      irisBotL: '#fef08a',
      irisGlowL: '#fde047',
      irisTopR: '#581c87',
      irisMidR: '#c084fc',
      irisBotR: '#f0abfc',
      irisGlowR: '#e879f9',
      cloth1Top: '#be123c',
      cloth1Bot: '#4c0519',
      cloth2Top: '#581c87',
      cloth2Bot: '#1e0936',
      auraColor: '#e11d48',
      auraColor2: '#a855f7',
      accentColor: '#fde047',
      backHairStyle: 'bossLongWild',
      frontHairStyle: 'bossLongWild',
      extraDefs: function () {
        return (
          '<linearGradient id="' + gFan + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fef08a"/>' +
            '<stop offset="52%" stop-color="#e11d48"/>' +
            '<stop offset="100%" stop-color="#4c0519"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          magicCircle(160, 152, 128, {
            primary: '#fde047',
            secondary: '#f43f5e',
            kanji: '幻',
            kanjiSize: 102,
            kanjiOpacity: 0.17,
            opacity: pose === 'defeat' ? 0.28 : 0.9,
            runes: ['幻', '面', '舞', '喜', '怒', '哀', '楽', '妖']
          }) +
          // Twin Floating Noh Illusion Masks ('喜' & '怒') orbiting in crimson mist
          '<g class="svg-float" filter="url(#' + ctx.fGlow + ')" ' + ORIGIN_CENTER + '>' +
            '<g transform="translate(52,118) rotate(-14)">' +
              '<path d="M-20,-24 C-22,6 -12,26 0,30 C12,26 22,6 20,-24 C10,-32 -10,-32 -20,-24 Z" fill="#fffbeb" stroke="#be123c" stroke-width="2"/>' +
              '<path d="M-12,-6 Q-7,-12 -2,-6 M2,-6 Q7,-12 12,-6" fill="none" stroke="#1e1030" stroke-width="2.2"/>' +
              '<path d="M-9,10 Q0,20 9,10" fill="none" stroke="#be123c" stroke-width="2.2"/>' +
              '<text x="0" y="-14" text-anchor="middle" font-size="10" font-weight="700" font-family="' + FONT_SERIF + '" fill="#be123c">喜</text>' +
            '</g>' +
            '<g transform="translate(268,118) rotate(14)">' +
              '<path d="M-20,-24 C-22,6 -12,26 0,30 C12,26 22,6 20,-24 C10,-32 -10,-32 -20,-24 Z" fill="#1e1030" stroke="#fde047" stroke-width="2"/>' +
              '<polygon points="-13,-6 -3,-2 -11,2" fill="#ff3b5c"/>' +
              '<polygon points="13,-6 3,-2 11,2" fill="#ff3b5c"/>' +
              '<path d="M-10,16 Q0,8 10,16" fill="none" stroke="#fde047" stroke-width="2.2"/>' +
              '<text x="0" y="-14" text-anchor="middle" font-size="10" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fde047">怒</text>' +
            '</g>' +
          '</g>'
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Lavish Scarlet, Violet & Gold Layered Kabuki Kimono
            '<path d="M52,320 C62,248 88,218 128,210 L160,248 L192,210 C232,218 258,248 268,320 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M114,216 L160,278 L206,216 L192,210 L160,256 L128,210 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
            '<path d="M126,214 L160,264 L194,214" fill="none" stroke="#fffbeb" stroke-width="4.5"/>' +
            // Ornate Gold Obi & Crimson Kumihimo Cord
            '<path d="M98,274 L222,274 L226,320 L94,320 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M108,286 Q160,298 212,286" fill="none" stroke="#fde047" stroke-width="2.4"/>' +
            '<circle cx="160" cy="292" r="9" fill="#be123c" stroke="url(#' + ctx.gGold + ')" stroke-width="1.8"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Dramatic Crimson Kumadori Kabuki Face Markings + Golden Fan Crest Headdress
        return (
          '<g>' +
            // Crimson Kumadori eye-corner & cheek streaks
            '<path d="M112,136 C118,128 128,128 134,132 M208,136 C202,128 192,128 186,132" fill="none" stroke="#e11d48" stroke-width="2.6" stroke-linecap="round" opacity="0.88"/>' +
            '<path d="M118,158 Q128,166 138,162 M202,158 Q192,166 182,162" fill="none" stroke="#e11d48" stroke-width="2.2" stroke-linecap="round" opacity="0.78"/>' +
            // Ornate Golden Kabuki Fan-Crest Crown
            '<g transform="translate(160,54)">' +
              '<path d="M-46,24 L-26,-24 L0,-6 L26,-24 L46,24 Q0,10 -46,24 Z" fill="url(#' + ctx.gGold + ')" stroke="#4c0519" stroke-width="1.5"/>' +
              '<circle cx="0" cy="4" r="7.5" fill="#e11d48" stroke="#fef08a" stroke-width="1.6"/>' +
            '</g>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Blazing Open Kabuki War-Fan ('幻') held dramatically in foreground
        var fanTf = pose === 'attack' ? 'translate(220,224) rotate(-24)' : 'translate(232,248) rotate(-8)';
        return (
          '<g transform="' + fanTf + '">' +
            '<path d="M0,40 L-58,-22 A76,76 0 0,1 58,-22 Z" fill="url(#' + gFan + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2.2"/>' +
            '<path d="M0,40 L-36,-32 M0,40 L-12,-42 M0,40 L12,-42 M0,40 L36,-32" stroke="#4c0519" stroke-width="1.2" opacity="0.65"/>' +
            '<text x="0" y="-4" text-anchor="middle" font-size="24" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fffbeb" filter="url(#' + ctx.fGlow + ')">幻</text>' +
          '</g>'
        );
      },
      postOverlayFn: function (ctx) {
        return renderEnemyPoseOverlay(pose, ctx.fGlow, true);
      }
    });
  }

  function bossR5Chancellor(pose) {
    var gVoid = uid('ch_vd');
    return renderAnimeCharacter({
      mood: enemyPoseToAnimeMood(pose),
      bossMenace: true,
      disableMoodOverlay: true,
      bodyOpacity: pose === 'defeat' ? 0.56 : 1,
      viewBox: '0 0 320 320',
      svgClass: 'svg-art svg-enemy enemy-boss_r5_chancellor enemy-pose-' + pose + ' is-boss',
      dataAttrs: 'data-enemy="boss_r5_chancellor" data-pose="' + esc(pose) + '"',
      skinLight: '#f1f5f9',
      skinMid: '#cbd5e1',
      skinShadow: '#7c8ba6',
      skinLine: '#1e1b4b',
      hairTop: '#e0e7ff',
      hairMid: '#818cf8',
      hairBot: '#312e81',
      hairShadow: '#130f38',
      hairLine: '#09071f',
      hairHiColor: '#ffffff',
      irisTopL: '#3b0764',
      irisMidL: '#a855f7',
      irisBotL: '#38e8ff',
      irisGlowL: '#38e8ff',
      irisTopR: '#3b0764',
      irisMidR: '#a855f7',
      irisBotR: '#38e8ff',
      irisGlowR: '#c084fc',
      cloth1Top: '#1e1b4b',
      cloth1Bot: '#060516',
      cloth2Top: '#581c87',
      cloth2Bot: '#160729',
      auraColor: '#7c3aed',
      auraColor2: '#38e8ff',
      accentColor: '#c084fc',
      backHairStyle: 'longStraight',
      frontHairStyle: 'longStraight',
      extraDefs: function () {
        return (
          '<radialGradient id="' + gVoid + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#02010a"/>' +
            '<stop offset="58%" stop-color="#581c87"/>' +
            '<stop offset="100%" stop-color="#38e8ff" stop-opacity="0"/>' +
          '</radialGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          magicCircle(160, 152, 128, {
            primary: '#c084fc',
            secondary: '#38e8ff',
            kanji: '虛',
            kanjiSize: 102,
            kanjiOpacity: 0.18,
            opacity: pose === 'defeat' ? 0.28 : 0.9,
            runes: ['虛', '論', '無', '星', '知', '滅', '理', '淵']
          }) +
          shatteredKanji([[48, 92, '論', -14, '#c084fc', 16], [272, 92, '虛', 16, '#38e8ff', 16]], ctx.fGlow)
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Dramatic Towering Archmage Collar framing head
            '<path d="M84,186 C96,214 126,232 160,240 C194,232 224,214 236,186 L248,246 C214,264 106,264 72,246 Z" fill="url(#' + ctx.gCloth2 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            // Royal Midnight-Indigo Void Chancellor Mantle with glowing constellation lines
            '<path d="M52,320 C62,250 90,224 132,218 L160,264 L188,218 C230,224 258,250 268,320 Z" fill="url(#' + ctx.gCloth1 + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M90,268 L118,256 L136,282 M230,268 L202,256 L184,282" fill="none" stroke="#38e8ff" stroke-width="1.2" opacity="0.72"/>' +
            // Sovereign Void Star Medallion
            '<polygon points="160,244 176,264 160,284 144,264" fill="#090418" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<circle cx="160" cy="264" r="6" fill="#c084fc" filter="url(#' + ctx.fGlow + ')"/>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Floating Obsidian & Silver-Gold Grand Mage Circlet Halo
        return (
          '<g transform="translate(160,64)">' +
            '<ellipse cx="0" cy="-16" rx="52" ry="12" fill="none" stroke="#38e8ff" stroke-width="1.8" stroke-dasharray="10 5" filter="url(#' + ctx.fGlow + ')"/>' +
            '<path d="M-44,18 L-28,-8 L-10,8 L0,-24 L10,8 L28,-8 L44,18 L24,14 L0,10 L-24,14 Z" fill="#1e1b4b" stroke="url(#' + ctx.gGold + ')" stroke-width="1.6"/>' +
            '<polygon points="0,-16 6,-4 0,6 -6,-4" fill="#38e8ff" filter="url(#' + ctx.fGlow + ')"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Levitating Singularity Void-Orb & Open Abyssal Grimoire
        var orbY = pose === 'attack' ? 216 : 244;
        return (
          '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
            '<circle cx="242" cy="' + orbY + '" r="36" fill="url(#' + gVoid + ')" filter="url(#' + ctx.fGlow + ')"/>' +
            '<circle cx="242" cy="' + orbY + '" r="16" fill="#03010a" stroke="#c084fc" stroke-width="2"/>' +
            '<ellipse cx="242" cy="' + orbY + '" rx="34" ry="10" transform="rotate(-22 242 ' + orbY + ')" fill="none" stroke="#38e8ff" stroke-width="1.8"/>' +
            '<text x="242" y="' + (orbY + 5) + '" text-anchor="middle" font-size="14" font-weight="700" font-family="' + FONT_SERIF + '" fill="#ffffff">虛</text>' +
          '</g>'
        );
      },
      postOverlayFn: function (ctx) {
        return renderEnemyPoseOverlay(pose, ctx.fGlow, true);
      }
    });
  }

  function bossR6Overlord(pose) {
    var gEclipse = uid('ov_ec');
    var gObs = uid('ov_ob');
    return renderAnimeCharacter({
      mood: enemyPoseToAnimeMood(pose),
      bossMenace: true,
      disableMoodOverlay: true,
      bodyOpacity: pose === 'defeat' ? 0.56 : 1,
      viewBox: '0 0 320 320',
      svgClass: 'svg-art svg-enemy enemy-boss_r6_overlord enemy-pose-' + pose + ' is-boss',
      dataAttrs: 'data-enemy="boss_r6_overlord" data-pose="' + esc(pose) + '"',
      skinLight: '#e2e8f0',
      skinMid: '#b8c0d4',
      skinShadow: '#5b6380',
      skinLine: '#140c24',
      hairTop: '#f8fafc',
      hairMid: '#64748b',
      hairBot: '#0f172a',
      hairShadow: '#05060f',
      hairLine: '#020208',
      hairHiColor: '#ffffff',
      // Piercing Heterochromatic Crimson + Electric-Cyan Sovereign Anime Eyes!
      irisTopL: '#7f1d1d',
      irisMidL: '#ff2a55',
      irisBotL: '#fda4af',
      irisGlowL: '#ff3b5c',
      irisTopR: '#0c4a6e',
      irisMidR: '#06b6d4',
      irisBotR: '#a5f3fc',
      irisGlowR: '#38e8ff',
      cloth1Top: '#1e1633',
      cloth1Bot: '#05040c',
      cloth2Top: '#991b1b',
      cloth2Bot: '#1c0410',
      auraColor: '#dc2626',
      auraColor2: '#38e8ff',
      accentColor: '#fde047',
      backHairStyle: 'bossLongWild',
      frontHairStyle: 'bossLongWild',
      extraDefs: function () {
        return (
          '<radialGradient id="' + gEclipse + '" cx="50%" cy="46%" r="52%">' +
            '<stop offset="0%" stop-color="#020108" stop-opacity="0.92"/>' +
            '<stop offset="54%" stop-color="#991b1b" stop-opacity="0.46"/>' +
            '<stop offset="78%" stop-color="#38e8ff" stop-opacity="0.28"/>' +
            '<stop offset="100%" stop-color="#040610" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + gObs + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#334155"/>' +
            '<stop offset="48%" stop-color="#111326"/>' +
            '<stop offset="100%" stop-color="#03040a"/>' +
          '</linearGradient>'
        );
      },
      backdropFn: function (ctx) {
        return (
          '<circle cx="160" cy="144" r="126" fill="url(#' + gEclipse + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +
          magicCircle(160, 146, 132, {
            primary: '#fbbf24',
            secondary: '#38e8ff',
            kanji: '無',
            kanjiSize: 108,
            kanjiOpacity: 0.19,
            opacity: pose === 'defeat' ? 0.28 : 0.94,
            runes: ['無', '言', '崩', '覇', '闇', '光', '聖', '終']
          }) +
          shatteredKanji([[42, 84, '無', -18, '#ff3b5c', 17], [278, 84, '終', 18, '#38e8ff', 17], [38, 224, '言', 12, '#fde047', 15], [282, 224, '滅', -12, '#fde047', 15]], ctx.fGlow)
        );
      },
      backPropsFn: function (ctx) {
        // Six-Winged Abyssal Eclipse Mantle Blades fanning out dramatically
        return (
          '<g opacity="0.92">' +
            '<path d="M128,184 L22,102 L48,162 L18,196 L64,218 L28,266 L106,258 Z" fill="url(#' + gObs + ')" stroke="#ff3b5c" stroke-width="1.6"/>' +
            '<path d="M192,184 L298,102 L272,162 L302,196 L256,218 L292,266 L214,258 Z" fill="url(#' + gObs + ')" stroke="#38e8ff" stroke-width="1.6"/>' +
          '</g>'
        );
      },
      outfitFn: function (ctx) {
        return (
          '<g>' +
            // Obsidian-Gilded Sovereign Overlord Armor
            '<path d="M62,320 C70,248 92,216 130,210 L160,236 L190,210 C228,216 250,248 258,320 Z" fill="url(#' + gObs + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2.2"/>' +
            // Sweeping Armored Sovereign Pauldrons
            '<path d="M44,234 L82,196 L128,212 L116,252 L54,268 Z" fill="url(#' + gObs + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            '<path d="M276,234 L238,196 L192,212 L204,252 L266,268 Z" fill="url(#' + gObs + ')" stroke="url(#' + ctx.gGold + ')" stroke-width="2"/>' +
            // Shattered Crimson/Cyan Duality Core on Chest ('覇')
            '<polygon points="160,224 194,262 160,302 126,262" fill="#06040d" stroke="url(#' + ctx.gGold + ')" stroke-width="2.6"/>' +
            '<path d="M160,230 L160,296 L132,262 Z" fill="#ff3b5c" opacity="0.72" filter="url(#' + ctx.fGlow + ')"/>' +
            '<path d="M160,230 L160,296 L188,262 Z" fill="#38e8ff" opacity="0.72" filter="url(#' + ctx.fGlow + ')"/>' +
            '<text x="160" y="272" text-anchor="middle" font-size="26" font-weight="700" font-family="' + FONT_SERIF + '" fill="#ffffff" filter="url(#' + ctx.fGlow + ')">覇</text>' +
          '</g>'
        );
      },
      headgearFn: function (ctx) {
        // Towering Spiked Golden Deity Crown hovering above Sovereign brow
        return (
          '<g transform="translate(160,52)">' +
            '<path d="M-54,28 L-42,-20 L-20,10 L0,-38 L20,10 L42,-20 L54,28 L26,20 L0,14 L-26,20 Z" fill="url(#' + ctx.gGold + ')" stroke="#4a3106" stroke-width="1.6" stroke-linejoin="round"/>' +
            '<circle cx="0" cy="-6" r="7" fill="#030208" stroke="#fde68a" stroke-width="2"/>' +
            '<circle cx="0" cy="-6" r="3" fill="#ff3b5c" filter="url(#' + ctx.fGlow + ')"/>' +
          '</g>'
        );
      },
      foregroundFn: function (ctx) {
        // Crackling Duality Crimson + Cyan Lightning Arcs
        return (
          '<g fill="none" stroke-linecap="round" filter="url(#' + ctx.fGlow + ')">' +
            '<path d="M98,214 L64,244 L88,268 L52,298" stroke="#ff3b5c" stroke-width="2.4" opacity="0.88"/>' +
            '<path d="M222,214 L256,244 L232,268 L268,298" stroke="#38e8ff" stroke-width="2.4" opacity="0.88"/>' +
          '</g>'
        );
      },
      postOverlayFn: function (ctx) {
        return renderEnemyPoseOverlay(pose, ctx.fGlow, true);
      }
    });
  }

  /* ------------------------------------------------------------------------
     2 SCULPTED NON-HUMANOID BOSSES (Organic Multi-Layer Art, ZERO Blocks!)
     ------------------------------------------------------------------------ */

  function bossR1Golem(isBoss, pose) {
    var gStone = uid('gl_st');
    var gMoss = uid('gl_ms');
    var gCore = uid('gl_cr');
    var defs =
      '<linearGradient id="' + gStone + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#475569"/>' +
        '<stop offset="52%" stop-color="#1e293b"/>' +
        '<stop offset="100%" stop-color="#090e1a"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gMoss + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#34d399"/>' +
        '<stop offset="100%" stop-color="#065f46"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + gCore + '" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="42%" stop-color="#38e8ff"/>' +
        '<stop offset="100%" stop-color="#059669" stop-opacity="0"/>' +
      '</radialGradient>';

    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Orbiting jagged ancient basalt monolith shards behind colossus
        '<polygon points="44,96 66,68 78,104 54,126" fill="url(#' + gStone + ')" stroke="#34d399" stroke-width="1.5"/>' +
        '<polygon points="276,96 254,68 242,104 266,126" fill="url(#' + gStone + ')" stroke="#38e8ff" stroke-width="1.5"/>' +
        '<polygon points="104,44 126,24 136,54 112,62" fill="url(#' + gStone + ')" stroke="#fde68a" stroke-width="1.2"/>' +
        '<polygon points="216,44 194,24 184,54 208,62" fill="url(#' + gStone + ')" stroke="#fde68a" stroke-width="1.2"/>' +
        // Sculpted Asymmetric Basalt Colossus Torso & Craggy Shoulders (NO plain rectangles!)
        '<path d="M74,142 L106,94 L160,112 L214,94 L246,142 L222,232 L182,276 L138,276 L98,232 Z" fill="url(#' + gStone + ')" stroke="#64748b" stroke-width="2.2" stroke-linejoin="round"/>' +
        // Cel-shaded stone facets & emerald moss drapes
        '<path d="M160,112 L214,94 L246,142 L222,232 L182,276 L160,250 Z" fill="#050812" opacity="0.46"/>' +
        '<path d="M98,108 C112,118 122,126 136,122 L124,144 C108,140 94,132 88,122 Z" fill="url(#' + gMoss + ')" opacity="0.88"/>' +
        '<path d="M212,106 C202,120 194,128 184,126 L194,148 C210,142 224,134 232,122 Z" fill="url(#' + gMoss + ')" opacity="0.85"/>' +
        // Glowing Emerald-Cyan Energy Fissures webbing stone torso
        '<path d="M104,136 L134,162 L124,198 L148,224 M216,136 L186,162 L196,198 L172,224 M160,126 L160,256" fill="none" stroke="#38e8ff" stroke-width="2.6" stroke-linecap="round" filter="url(#__GLOW__)"/>' +
        // Carved Horned Rune Head Monolith hovering above collar
        '<path d="M126,96 L138,54 L160,42 L182,54 L194,96 L176,118 L144,118 Z" fill="url(#' + gStone + ')" stroke="#34d399" stroke-width="2"/>' +
        '<polygon points="138,76 156,84 142,92" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<polygon points="182,76 164,84 178,92" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<path d="M160,46 L160,68" stroke="#fde047" stroke-width="2.2" filter="url(#__GLOW__)"/>' +
        // Blazing '始' Crystal Spirit Core embedded in carved chest cavity
        '<circle cx="160" cy="186" r="44" fill="url(#' + gCore + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +
        '<polygon points="160,148 192,186 160,224 128,186" fill="#06202b" stroke="#fde047" stroke-width="2.4"/>' +
        '<text x="160" y="198" text-anchor="middle" font-size="30" font-weight="700" font-family="' + FONT_SERIF + '" fill="#ffffff" filter="url(#__GLOW__)">始</text>' +
        // Detached Floating Basalt Rune Gauntlets (Left & Right)
        '<path d="M26,204 L46,162 L84,174 L90,226 L62,256 L30,242 Z" fill="url(#' + gStone + ')" stroke="#38e8ff" stroke-width="2"/>' +
        '<path d="M44,196 L72,208 L60,236" fill="none" stroke="#34d399" stroke-width="2.2" filter="url(#__GLOW__)"/>' +
        '<path d="M294,204 L274,162 L236,174 L230,226 L258,256 L290,242 Z" fill="url(#' + gStone + ')" stroke="#38e8ff" stroke-width="2"/>' +
        '<path d="M276,196 L248,208 L260,236" fill="none" stroke="#34d399" stroke-width="2.2" filter="url(#__GLOW__)"/>' +
      '</g>' +
      shatteredKanji([[42, 64, '石', -14, '#6ee7b7', 14], [278, 64, '守', 14, '#fde68a', 14]], '__GLOW__');

    return wrapEnemySvg('boss_r1_golem', true, pose, defs, body, {
      bg1: '#065f46',
      primary: '#34d399',
      secondary: '#38e8ff',
      kanji: '始',
      runes: ['始', '音', '石', '守', '森', '碑', '古', '霊']
    });
  }

  function bossR4Serpent(isBoss, pose) {
    var gScale = uid('dr_sc');
    var gBelly = uid('dr_bl');
    var gGold = uid('dr_gd');
    var gOrb = uid('dr_ob');
    var defs =
      '<linearGradient id="' + gScale + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#38bdf8"/>' +
        '<stop offset="48%" stop-color="#1d4ed8"/>' +
        '<stop offset="100%" stop-color="#0f172a"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gBelly + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
        '<stop offset="0%" stop-color="#fef9c3"/>' +
        '<stop offset="100%" stop-color="#d4af37"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gGold + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#fff4b8"/>' +
        '<stop offset="50%" stop-color="#f59e0b"/>' +
        '<stop offset="100%" stop-color="#78350f"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + gOrb + '" cx="45%" cy="40%" r="55%">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="48%" stop-color="#38e8ff"/>' +
        '<stop offset="100%" stop-color="#0284c7"/>' +
      '</radialGradient>';

    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Swirling Storm Clouds behind Eastern Kotodama Dragon Emperor
        '<path d="M24,234 C44,208 84,212 106,228 C126,204 188,202 214,226 C244,212 284,218 298,244 C264,258 58,262 24,234 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" opacity="0.65"/>' +
        // Grand Coiled Eastern Dragon S-Curve Body (layered azure scales + golden belly plates)
        '<path d="M62,256 C24,222 36,154 96,152 C148,150 226,184 256,144 C284,108 250,52 198,64 C166,72 150,96 154,116" fill="none" stroke="url(#' + gScale + ')" stroke-width="34" stroke-linecap="round"/>' +
        '<path d="M62,256 C24,222 36,154 96,152 C148,150 226,184 256,144 C284,108 250,52 198,64" fill="none" stroke="url(#' + gBelly + ')" stroke-width="11" stroke-dasharray="8 6" stroke-linecap="round" opacity="0.9"/>' +
        // Golden Dorsal Fin Spines along coiled back
        '<path d="M44,212 L24,204 L42,190 L28,172 L52,164 M262,154 L286,152 L272,132 L292,118 L272,102" fill="none" stroke="url(#' + gGold + ')" stroke-width="3" stroke-linejoin="round"/>' +
        // Sweeping Tail Fin Tip
        '<path d="M60,256 C38,264 24,284 42,296 C60,288 76,282 88,268 Z" fill="url(#' + gGold + ')" stroke="#0f172a" stroke-width="1.4"/>' +
        // Billowing White-Cyan Cloud Mane framing Dragon Head
        '<path d="M126,108 C102,84 114,50 148,54 C166,34 204,42 208,68 C236,74 236,112 208,126 C188,144 142,138 126,108 Z" fill="#e0f2fe" stroke="#38bdf8" stroke-width="1.6"/>' +
        // Branching Golden Dragon Antlers
        '<path d="M148,68 L126,28 L108,34 M126,28 L134,12 M186,68 L208,28 L226,34 M208,28 L200,12" fill="none" stroke="url(#' + gGold + ')" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        // Fierce Sculpted Eastern Dragon Head
        '<path d="M124,116 C120,82 146,66 168,66 C192,66 216,82 212,116 L194,142 L168,154 L142,142 Z" fill="url(#' + gScale + ')" stroke="url(#' + gGold + ')" stroke-width="2.2" stroke-linejoin="round"/>' +
        // Blazing Amber-Gold Dragon Eyes
        '<polygon points="136,96 158,104 140,110" fill="#fde047" filter="url(#__GLOW__)"/>' +
        '<polygon points="200,96 178,104 196,110" fill="#fde047" filter="url(#__GLOW__)"/>' +
        // Snout, Fangs & Flowing Golden Dragon Whiskers
        '<path d="M148,132 L156,144 L164,134 L172,144 L180,132" fill="#ffffff" stroke="#0f172a" stroke-width="1"/>' +
        '<path d="M142,126 C104,124 84,146 66,132 M194,126 C232,124 252,146 270,132" fill="none" stroke="url(#' + gGold + ')" stroke-width="2.6" stroke-linecap="round"/>' +
        // Dragon Claw clutching Blazing Kotodama Spirit Pearl ('龍') in foreground
        '<circle cx="160" cy="218" r="28" fill="url(#' + gOrb + ')" stroke="#fde047" stroke-width="2.2" filter="url(#__GLOW__)"/>' +
        '<text x="160" y="228" text-anchor="middle" font-size="24" font-weight="700" font-family="' + FONT_SERIF + '" fill="#0c2d6b">龍</text>' +
        '<path d="M126,204 L142,216 L132,232 M194,204 L178,216 L188,232 M150,244 L160,234 L170,244" fill="none" stroke="url(#' + gGold + ')" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</g>' +
      shatteredKanji([[46, 76, '脈', -14, '#7dd3fc', 16], [274, 76, '嵐', 14, '#fde047', 16]], '__GLOW__');

    return wrapEnemySvg('boss_r4_serpent', true, pose, defs, body, {
      bg1: '#0c4a6e',
      primary: '#fbbf24',
      secondary: '#38e8ff',
      kanji: '龍',
      runes: ['龍', '脈', '文', '嵐', '雲', '雷', '聖', '皇']
    });
  }

  /* ------------------------------------------------------------------------
     12 MULTI-LAYERED DARK-FANTASY REGULAR MONSTERS (ZERO Flat Blobs/Blocks!)
     ------------------------------------------------------------------------ */

  function enR1Slime(isBoss, pose) {
    var gBody = uid('sl_bd');
    var gCore = uid('sl_cr');
    var defs =
      '<linearGradient id="' + gBody + '" x1="25%" y1="0%" x2="80%" y2="100%">' +
        '<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.92"/>' +
        '<stop offset="52%" stop-color="#1e3a8a" stop-opacity="0.95"/>' +
        '<stop offset="100%" stop-color="#090d24" stop-opacity="0.98"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + gCore + '" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>' +
        '<stop offset="45%" stop-color="#38e8ff" stop-opacity="0.72"/>' +
        '<stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>' +
      '</radialGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Orbiting ink-spirit droplets
        '<path d="M56,162 C62,148 70,152 68,166 C66,174 54,174 56,162 Z" fill="#38bdf8" stroke="#bae6fd" stroke-width="1"/>' +
        '<path d="M254,142 C262,126 272,134 268,148 C264,158 250,154 254,142 Z" fill="#7dd3fc" stroke="#ffffff" stroke-width="1"/>' +
        // Organic fluid gelatinous body silhouette with wavy ink tendrils
        '<path d="M74,238 C62,216 74,162 104,132 C122,114 142,96 158,86 C168,104 186,108 206,126 C242,158 256,214 244,238 C230,264 90,266 74,238 Z" fill="url(#' + gBody + ')" stroke="#7dd3fc" stroke-width="2.2"/>' +
        // Cel-shaded internal liquid shadow crescent
        '<path d="M188,128 C222,158 236,204 228,234 C210,254 146,258 106,248 C164,244 204,220 206,178 C206,156 198,140 188,128 Z" fill="#060a1e" opacity="0.52"/>' +
        // Luminous suspended 'あ' spirit core inside translucent belly
        '<circle cx="158" cy="194" r="46" fill="url(#' + gCore + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +
        '<text x="158" y="206" text-anchor="middle" font-size="36" font-weight="700" font-family="' + FONT_SERIF + '" fill="#e0f2fe" opacity="0.88" filter="url(#__GLOW__)">あ</text>' +
        // Expressive mischievous glowing spirit eyes + gelatin highlight arcs
        '<ellipse cx="132" cy="176" rx="11" ry="13" fill="#070a1c" stroke="#38e8ff" stroke-width="1.5"/>' +
        '<ellipse cx="186" cy="176" rx="11" ry="13" fill="#070a1c" stroke="#38e8ff" stroke-width="1.5"/>' +
        '<circle cx="130" cy="172" r="4.2" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<circle cx="184" cy="172" r="4.2" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<circle cx="128" cy="170" r="1.8" fill="#ffffff"/>' +
        '<circle cx="182" cy="170" r="1.8" fill="#ffffff"/>' +
        '<path d="M104,156 C114,136 132,124 148,118" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.72"/>' +
        '<circle cx="118" cy="138" r="3" fill="#ffffff" opacity="0.85"/>' +
      '</g>' +
      shatteredKanji([[64, 96, '墨', -14, '#7dd3fc', 14], [254, 94, '音', 14, '#fde68a', 14]], '__GLOW__');
    return wrapEnemySvg('en_r1_slime', isBoss, pose, defs, body, { bg1: '#0284c7', primary: '#7dd3fc', secondary: '#38e8ff', kanji: '墨' });
  }

  function enR1Crow(isBoss, pose) {
    var gWing = uid('cr_wg');
    var gGold = uid('cr_gd');
    var defs =
      '<linearGradient id="' + gWing + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#334155"/>' +
        '<stop offset="45%" stop-color="#111827"/>' +
        '<stop offset="100%" stop-color="#030712"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gGold + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#fef08a"/><stop offset="100%" stop-color="#b45309"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Sweeping Layered Obsidian Yatagarasu Wings (Left & Right)
        '<path d="M138,162 C98,118 52,88 18,96 C32,120 48,136 28,154 C54,162 72,166 56,188 C86,186 114,182 142,178 Z" fill="url(#' + gWing + ')" stroke="#38bdf8" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M182,162 C222,118 268,88 302,96 C288,120 272,136 292,154 C266,162 248,166 264,188 C234,186 206,182 178,178 Z" fill="url(#' + gWing + ')" stroke="#38bdf8" stroke-width="1.6" stroke-linejoin="round"/>' +
        // Tail feathers + Three Golden Talons
        '<path d="M136,214 L112,272 L144,254 L160,282 L176,254 L208,272 L184,214 Z" fill="url(#' + gWing + ')" stroke="#475569" stroke-width="1.4"/>' +
        // Sleek Torso & Plumed Neck
        '<path d="M126,154 C124,116 140,86 162,84 C188,84 202,114 196,158 C192,202 178,236 160,242 C142,236 128,202 126,154 Z" fill="url(#' + gWing + ')" stroke="#64748b" stroke-width="1.8"/>' +
        // Sharp Gilded Beak & Piercing Crimson-Gold Eyes
        '<path d="M148,118 L110,126 L146,136 Z" fill="url(#' + gGold + ')" stroke="#5c3a0e" stroke-width="1.3"/>' +
        '<polygon points="150,104 170,112 152,118" fill="#ff3b5c" filter="url(#__GLOW__)"/>' +
        '<circle cx="158" cy="111" r="2.2" fill="#fef08a"/>' +
        // Floating Spirit Talisman Ribbon wrapped around torso ('鴉')
        '<path d="M108,184 Q160,164 212,188 Q228,214 210,236" fill="none" stroke="#fef3c7" stroke-width="8" stroke-linecap="round" opacity="0.88"/>' +
        '<path d="M108,184 Q160,164 212,188" fill="none" stroke="#dc2626" stroke-width="1.6"/>' +
        '<circle cx="160" cy="176" r="15" fill="#140c24" stroke="url(#' + gGold + ')" stroke-width="1.8"/>' +
        '<text x="160" y="182" text-anchor="middle" font-size="16" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fde047" filter="url(#__GLOW__)">鴉</text>' +
      '</g>' +
      shatteredKanji([[64, 72, '羽', -12, '#7dd3fc', 14], [258, 72, '墨', 14, '#fde68a', 14]], '__GLOW__');
    return wrapEnemySvg('en_r1_crow', isBoss, pose, defs, body, { bg1: '#1e3a8a', primary: '#fbbf24', secondary: '#38e8ff', kanji: '鴉' });
  }

  function enR2Wisp(isBoss, pose) {
    var gFl1 = uid('ws_f1');
    var gFl2 = uid('ws_f2');
    var defs =
      '<linearGradient id="' + gFl1 + '" x1="50%" y1="100%" x2="50%" y2="0%">' +
        '<stop offset="0%" stop-color="#312e81"/>' +
        '<stop offset="52%" stop-color="#38bdf8"/>' +
        '<stop offset="100%" stop-color="#e0f2fe"/>' +
      '</linearGradient>' +
      '<radialGradient id="' + gFl2 + '" cx="50%" cy="55%" r="50%">' +
        '<stop offset="0%" stop-color="#ffffff"/>' +
        '<stop offset="48%" stop-color="#c084fc"/>' +
        '<stop offset="100%" stop-color="#3b0764" stop-opacity="0"/>' +
      '</radialGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Swirling Twin-Layer Ethereal Azure-Violet Spirit Flame Aura
        '<path d="M160,34 C194,82 238,118 230,186 C222,238 188,266 160,276 C132,266 98,238 90,186 C82,118 126,82 160,34 Z" fill="url(#' + gFl1 + ')" opacity="0.88" filter="url(#__GLOW__)"/>' +
        '<path d="M160,64 C186,104 206,136 202,188 C198,224 176,246 160,254 C144,246 122,224 118,188 C114,136 134,104 160,64 Z" fill="url(#' + gFl2 + ')"/>' +
        // Antique Cracked Bronze Paper Lantern floating inside flame
        '<path d="M126,134 Q160,118 194,134 L198,214 Q160,232 122,214 Z" fill="#171429" fill-opacity="0.86" stroke="#d4af37" stroke-width="2.2"/>' +
        '<path d="M118,132 L202,132 L194,120 L126,120 Z M120,214 L200,214 L190,226 L130,226 Z" fill="#451a03" stroke="#fde68a" stroke-width="1.4"/>' +
        '<path d="M124,158 Q160,168 196,158 M124,188 Q160,198 196,188" fill="none" stroke="#d4af37" stroke-width="1.1" opacity="0.6"/>' +
        // Glowing Spirit Eyes & '炎' Kanji Seal blazing through lantern
        '<polygon points="134,152 154,160 138,166" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<polygon points="186,152 166,160 182,166" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<text x="160" y="206" text-anchor="middle" font-size="28" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fde047" filter="url(#__GLOW__)">炎</text>' +
      '</g>' +
      shatteredKanji([[54, 118, '語', -14, '#c084fc', 15], [266, 118, '火', 14, '#7dd3fc', 15]], '__GLOW__');
    return wrapEnemySvg('en_r2_wisp', isBoss, pose, defs, body, { bg1: '#4c1d95', primary: '#c084fc', secondary: '#38e8ff', kanji: '炎' });
  }

  function enR2Wolf(isBoss, pose) {
    var gFur = uid('wf_fr');
    var defs =
      '<linearGradient id="' + gFur + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#94a3b8"/>' +
        '<stop offset="48%" stop-color="#334155"/>' +
        '<stop offset="100%" stop-color="#090d1a"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Swirling Silver-Shadow Tail rising behind wolf
        '<path d="M214,226 C268,208 286,156 264,116 C250,144 238,158 214,174 C228,192 222,210 214,226 Z" fill="url(#' + gFur + ')" stroke="#38bdf8" stroke-width="1.6"/>' +
        // Dynamic Crouched Predatory Wolf Body & Jagged Cel-Shaded Fur Ruff
        '<path d="M74,256 L84,186 L62,162 L92,144 L82,102 L114,124 L132,96 L152,126 C188,136 226,162 246,214 L224,256 L192,256 L186,218 L138,218 L124,256 Z" fill="url(#' + gFur + ')" stroke="#cbd5e1" stroke-width="1.9" stroke-linejoin="round"/>' +
        // Deep cel shadow along underbelly & hind leg
        '<path d="M138,218 L186,218 L192,256 L224,256 L216,192 C192,178 158,184 138,218 Z" fill="#060a16" opacity="0.58"/>' +
        // Glowing Crimson-Amber Wolf Eyes & Snarling Fangs
        '<polygon points="94,154 114,160 98,168" fill="#ff3b5c" filter="url(#__GLOW__)"/>' +
        '<polygon points="134,154 118,160 130,168" fill="#ff3b5c" filter="url(#__GLOW__)"/>' +
        '<path d="M76,184 L86,196 L94,184 L104,196 L114,184" fill="#ffffff" stroke="#0f172a" stroke-width="1.2"/>' +
        // Glowing Scarred Spirit Rune ('狼') on wolf flank
        '<path d="M160,156 L186,174 L170,196" fill="none" stroke="#38e8ff" stroke-width="2.2" filter="url(#__GLOW__)"/>' +
        '<text x="174" y="190" text-anchor="middle" font-size="22" font-weight="700" font-family="' + FONT_SERIF + '" fill="#7dd3fc" filter="url(#__GLOW__)">狼</text>' +
      '</g>' +
      shatteredKanji([[52, 88, '牙', -14, '#ff3b5c', 14], [268, 92, '影', 14, '#7dd3fc', 14]], '__GLOW__');
    return wrapEnemySvg('en_r2_wolf', isBoss, pose, defs, body, { bg1: '#1e293b', primary: '#94a3b8', secondary: '#ff3b5c', kanji: '狼' });
  }

  function enR3Tanuki(isBoss, pose) {
    var gFur = uid('tn_fr');
    var gHat = uid('tn_ht');
    var defs =
      '<linearGradient id="' + gFur + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#d97706"/>' +
        '<stop offset="55%" stop-color="#78350f"/>' +
        '<stop offset="100%" stop-color="#3b1606"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gHat + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
        '<stop offset="0%" stop-color="#fde68a"/><stop offset="100%" stop-color="#92400e"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Striped Fluffy Bake-Danuki Tail
        '<path d="M206,238 C258,236 286,192 268,154 C248,148 228,166 214,196 Z" fill="url(#' + gFur + ')" stroke="#2c1104" stroke-width="2"/>' +
        '<path d="M236,174 L264,186 M226,196 L256,210" stroke="#1c0d04" stroke-width="6" stroke-linecap="round"/>' +
        // Expressive Layered Yokai Body & Cream Belly
        '<path d="M98,256 C84,218 92,158 116,136 C132,120 188,120 204,136 C228,158 236,218 222,256 C194,274 126,274 98,256 Z" fill="url(#' + gFur + ')" stroke="#2c1104" stroke-width="2"/>' +
        '<ellipse cx="160" cy="212" rx="46" ry="42" fill="#fef3c7" stroke="#92400e" stroke-width="1.4"/>' +
        // Crimson Shrine Bib & Gold Bell
        '<path d="M122,168 Q160,194 198,168 L192,196 Q160,214 128,196 Z" fill="#b91c1c" stroke="#fde047" stroke-width="1.6"/>' +
        '<circle cx="160" cy="196" r="8" fill="#fde047" stroke="#78350f" stroke-width="1.4"/>' +
        // Mischievous Tanuki Face Mask & Glowing Amber Eyes
        '<ellipse cx="136" cy="146" rx="18" ry="13" fill="#2c1104"/>' +
        '<ellipse cx="184" cy="146" rx="18" ry="13" fill="#2c1104"/>' +
        '<polygon points="128,144 146,148 132,153" fill="#fde047" filter="url(#__GLOW__)"/>' +
        '<polygon points="192,144 174,148 188,153" fill="#fde047" filter="url(#__GLOW__)"/>' +
        '<path d="M148,162 Q160,170 172,162" fill="none" stroke="#2c1104" stroke-width="2.2" stroke-linecap="round"/>' +
        // Conical Straw Kasa Hat + Glowing Emerald Illusion Leaf ('化')
        '<path d="M74,122 Q160,64 246,122 Q160,104 74,122 Z" fill="url(#' + gHat + ')" stroke="#5c3a0e" stroke-width="2"/>' +
        '<path d="M144,96 C152,72 174,72 180,96 C168,104 152,104 144,96 Z" fill="#10b981" stroke="#6ee7b7" stroke-width="1.4" filter="url(#__GLOW__)"/>' +
        // Spirit Sake Gourd ('化')
        '<path d="M78,196 C64,196 62,216 74,224 C60,236 62,262 84,264 C106,262 108,236 94,224 C106,216 104,196 90,196 Z" fill="#b45309" stroke="#fde047" stroke-width="1.6"/>' +
        '<text x="84" y="246" text-anchor="middle" font-size="16" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fef08a">化</text>' +
      '</g>' +
      shatteredKanji([[52, 86, '化', -12, '#6ee7b7', 14], [268, 86, '狸', 12, '#fde047', 14]], '__GLOW__');
    return wrapEnemySvg('en_r3_tanuki', isBoss, pose, defs, body, { bg1: '#92400e', primary: '#fbbf24', secondary: '#34d399', kanji: '化' });
  }

  function enR3Puppet(isBoss, pose) {
    var gSilk = uid('pp_sk');
    var defs =
      '<linearGradient id="' + gSilk + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#9f1239"/>' +
        '<stop offset="55%" stop-color="#4c1d95"/>' +
        '<stop offset="100%" stop-color="#140724"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Floating Wooden Puppet Control Cross & Glowing Violet Marionette Strings
        '<path d="M108,44 L212,56 M142,26 L178,74" stroke="#78350f" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M116,46 L86,184 M156,50 L160,104 M204,54 L234,184 M144,32 L132,248 M176,68 L188,248" stroke="#c084fc" stroke-width="1.3" stroke-dasharray="4 3" opacity="0.82" filter="url(#__GLOW__)"/>' +
        // Tattered Crimson-Violet Silk Kimono Sleeves & Hanging Doll Frame
        '<path d="M74,174 L132,148 L188,148 L246,174 L232,242 L198,224 L206,274 L114,274 L122,224 L88,242 Z" fill="url(#' + gSilk + ')" stroke="#d4af37" stroke-width="1.8" stroke-linejoin="round"/>' +
        // Cracked Porcelain Noh-Doll Head with Weeping Violet Eyes
        '<path d="M126,104 C126,74 194,74 194,104 C194,136 178,154 160,158 C142,154 126,136 126,104 Z" fill="#f8fafc" stroke="#475569" stroke-width="1.8"/>' +
        '<path d="M174,80 L164,104 L178,118 L168,146" fill="none" stroke="#1e1b4b" stroke-width="1.8"/>' +
        '<ellipse cx="144" cy="116" rx="8" ry="6" fill="#090418"/>' +
        '<ellipse cx="176" cy="116" rx="8" ry="6" fill="#090418"/>' +
        '<circle cx="144" cy="116" r="3" fill="#c084fc" filter="url(#__GLOW__)"/>' +
        '<circle cx="176" cy="116" r="3" fill="#c084fc" filter="url(#__GLOW__)"/>' +
        '<path d="M148,140 Q160,134 172,140" fill="none" stroke="#be123c" stroke-width="2.2"/>' +
        // Glowing Curse Talisman Seal on Chest ('傀')
        '<rect x="142" y="172" width="36" height="58" rx="3" fill="#fef3c7" stroke="#d4af37" stroke-width="1.6"/>' +
        '<text x="160" y="210" text-anchor="middle" font-size="24" font-weight="700" font-family="' + FONT_SERIF + '" fill="#7f1d1d">傀</text>' +
      '</g>' +
      shatteredKanji([[46, 108, '糸', -14, '#c084fc', 14], [274, 108, '咒', 14, '#fb7185', 14]], '__GLOW__');
    return wrapEnemySvg('en_r3_puppet', isBoss, pose, defs, body, { bg1: '#581c87', primary: '#d4af37', secondary: '#c084fc', kanji: '傀' });
  }

  function enR4Harpy(isBoss, pose) {
    var gFeather = uid('hp_ft');
    var defs =
      '<linearGradient id="' + gFeather + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#38bdf8"/>' +
        '<stop offset="50%" stop-color="#0f766e"/>' +
        '<stop offset="100%" stop-color="#082f49"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Howling Cyclone Wind Arcs
        '<path d="M36,238 Q160,278 284,238" fill="none" stroke="#7dd3fc" stroke-width="2.6" stroke-dasharray="14 8" opacity="0.72" filter="url(#__GLOW__)"/>' +
        // Sweeping Layered Teal-Indigo Pinion Wings
        '<path d="M134,156 C88,92 42,68 16,86 C36,118 52,138 24,162 C54,174 78,176 58,202 C94,196 122,188 144,176 Z" fill="url(#' + gFeather + ')" stroke="#7dd3fc" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M186,156 C232,92 278,68 304,86 C284,118 268,138 296,162 C266,174 242,176 262,202 C226,196 198,188 176,176 Z" fill="url(#' + gFeather + ')" stroke="#7dd3fc" stroke-width="1.7" stroke-linejoin="round"/>' +
        // Graceful Winged Siren Silhouette & Plumage Mantle
        '<path d="M128,158 C124,124 140,86 160,84 C180,86 196,124 192,158 L206,226 L160,256 L114,226 Z" fill="url(#' + gFeather + ')" stroke="#fde68a" stroke-width="1.6"/>' +
        // Feathered Crest Mask & Fierce Glowing Wind-Gold Eyes
        '<path d="M132,116 C132,88 188,88 188,116 C188,142 174,154 160,158 C146,154 132,142 132,116 Z" fill="#f1f5f9" stroke="#0f766e" stroke-width="1.6"/>' +
        '<path d="M126,96 L108,68 L146,88 M194,96 L212,68 L174,88" fill="#fde047" stroke="#0f766e" stroke-width="1.2"/>' +
        '<polygon points="138,118 156,124 142,130" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<polygon points="182,118 164,124 178,130" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        // Gilded Talons & Chest Wind Sigil ('嵐')
        '<circle cx="160" cy="196" r="18" fill="#082f49" stroke="#fde047" stroke-width="1.8"/>' +
        '<text x="160" y="203" text-anchor="middle" font-size="18" font-weight="700" font-family="' + FONT_SERIF + '" fill="#7dd3fc" filter="url(#__GLOW__)">嵐</text>' +
      '</g>' +
      shatteredKanji([[56, 72, '風', -12, '#7dd3fc', 14], [264, 72, '翔', 12, '#fde047', 14]], '__GLOW__');
    return wrapEnemySvg('en_r4_harpy', isBoss, pose, defs, body, { bg1: '#0f766e', primary: '#7dd3fc', secondary: '#fde047', kanji: '嵐' });
  }

  function enR4Gargoyle(isBoss, pose) {
    var gRock = uid('gg_rk');
    var defs =
      '<linearGradient id="' + gRock + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#64748b"/>' +
        '<stop offset="52%" stop-color="#334155"/>' +
        '<stop offset="100%" stop-color="#0f172a"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Jagged Cracked Stone Bat-Wings
        '<path d="M130,152 L42,84 L30,144 L66,154 L46,194 L116,196 Z" fill="url(#' + gRock + ')" stroke="#f59e0b" stroke-width="1.6" stroke-linejoin="round"/>' +
        '<path d="M190,152 L278,84 L290,144 L254,154 L274,194 L204,196 Z" fill="url(#' + gRock + ')" stroke="#f59e0b" stroke-width="1.6" stroke-linejoin="round"/>' +
        // Perched Sculpted Granite Gargoyle Torso & Horns
        '<path d="M110,144 L132,118 L188,118 L210,144 L198,242 L122,242 Z" fill="url(#' + gRock + ')" stroke="#94a3b8" stroke-width="1.9" stroke-linejoin="round"/>' +
        '<path d="M126,104 L102,52 L144,86 M194,104 L218,52 L176,86" fill="url(#' + gRock + ')" stroke="#cbd5e1" stroke-width="1.6"/>' +
        '<path d="M128,96 L160,78 L192,96 L184,136 L160,148 L136,136 Z" fill="url(#' + gRock + ')" stroke="#cbd5e1" stroke-width="1.7"/>' +
        // Glowing Molten-Amber Eyes & Cracked Chest Rune ('守')
        '<polygon points="138,108 156,114 142,120" fill="#fbbf24" filter="url(#__GLOW__)"/>' +
        '<polygon points="182,108 164,114 178,120" fill="#fbbf24" filter="url(#__GLOW__)"/>' +
        '<path d="M126,164 L148,186 L138,214 M194,164 L172,186 L182,214" fill="none" stroke="#f59e0b" stroke-width="2" filter="url(#__GLOW__)"/>' +
        '<text x="160" y="202" text-anchor="middle" font-size="24" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fde047" filter="url(#__GLOW__)">守</text>' +
        // Fractured Temple Cornice Base
        '<path d="M74,244 L246,244 L232,272 L88,272 Z" fill="#1e293b" stroke="#64748b" stroke-width="1.8"/>' +
      '</g>' +
      shatteredKanji([[52, 74, '岩', -12, '#fbbf24', 14], [268, 74, '封', 12, '#94a3b8', 14]], '__GLOW__');
    return wrapEnemySvg('en_r4_gargoyle', isBoss, pose, defs, body, { bg1: '#334155', primary: '#f59e0b', secondary: '#fbbf24', kanji: '守' });
  }

  function enR5Automaton(isBoss, pose) {
    var gBrass = uid('au_br');
    var defs =
      '<linearGradient id="' + gBrass + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#fef08a"/>' +
        '<stop offset="48%" stop-color="#b45309"/>' +
        '<stop offset="100%" stop-color="#451a03"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Rotating Clockwork Gear Halo behind Automaton
        '<g class="svg-magic-ring" ' + ORIGIN_CENTER + '>' +
          '<circle cx="160" cy="144" r="88" fill="none" stroke="url(#' + gBrass + ')" stroke-width="4" stroke-dasharray="14 8"/>' +
          '<polygon points="' + polygonStar(160, 144, 78, 62, 12) + '" fill="none" stroke="#d4af37" stroke-width="1.6" opacity="0.72"/>' +
        '</g>' +
        // Articulated Curved Bronze-Gold Scholar Automaton Carapace & Pauldrons
        '<path d="M76,176 C84,132 114,116 160,116 C206,116 236,132 244,176 L218,256 L160,278 L102,256 Z" fill="url(#' + gBrass + ')" stroke="#fef08a" stroke-width="2" stroke-linejoin="round"/>' +
        '<path d="M114,154 L206,154 L196,248 L124,248 Z" fill="#17192c" stroke="#d4af37" stroke-width="1.6"/>' +
        // Domed Brass Optic Head with Glowing Cyan Crystal Lens
        '<path d="M126,116 C126,74 194,74 194,116 Z" fill="url(#' + gBrass + ')" stroke="#fef08a" stroke-width="1.8"/>' +
        '<circle cx="160" cy="100" r="14" fill="#082f49" stroke="#fde047" stroke-width="2"/>' +
        '<circle cx="160" cy="100" r="7.5" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<circle cx="157" cy="97" r="2.5" fill="#ffffff"/>' +
        // Spinning Chest Gear Core & '機' Kanji
        '<polygon points="' + polygonStar(160, 198, 28, 18, 8) + '" fill="#0c2d6b" stroke="#38e8ff" stroke-width="1.8" class="svg-magic-ring-rev" ' + ORIGIN_CENTER + '/>' +
        '<text x="160" y="206" text-anchor="middle" font-size="22" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fef08a" filter="url(#__GLOW__)">機</text>' +
      '</g>' +
      shatteredKanji([[46, 98, '理', -14, '#38e8ff', 14], [274, 98, '刻', 14, '#fde047', 14]], '__GLOW__');
    return wrapEnemySvg('en_r5_automaton', isBoss, pose, defs, body, { bg1: '#78350f', primary: '#fbbf24', secondary: '#38e8ff', kanji: '機' });
  }

  function enR5Phantom(isBoss, pose) {
    var gMist = uid('ph_ms');
    var defs =
      '<linearGradient id="' + gMist + '" x1="50%" y1="0%" x2="50%" y2="100%">' +
        '<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9"/>' +
        '<stop offset="48%" stop-color="#312e81" stop-opacity="0.92"/>' +
        '<stop offset="100%" stop-color="#050816" stop-opacity="0.25"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Swirling Spectral Cloak of Tattered Calligraphy Manuscripts
        '<path d="M160,54 C112,62 76,118 68,204 L96,268 L128,238 L156,282 L188,238 L224,268 L252,204 C244,118 208,62 160,54 Z" fill="url(#' + gMist + ')" stroke="#7dd3fc" stroke-width="1.8"/>' +
        // Orbiting Torn Glowing Manuscript Pages
        '<path d="M44,116 L78,104 L88,144 L54,156 Z" fill="#fef3c7" stroke="#38bdf8" stroke-width="1.3" opacity="0.88"/>' +
        '<path d="M242,104 L276,116 L266,156 L232,144 Z" fill="#fef3c7" stroke="#c084fc" stroke-width="1.3" opacity="0.88"/>' +
        // Hollow Luminous Porcelain Mask with Weeping Cyan Ink Trails
        '<path d="M126,116 C126,78 194,78 194,116 C194,150 176,166 160,170 C144,166 126,150 126,116 Z" fill="#09071a" stroke="#7dd3fc" stroke-width="2"/>' +
        '<polygon points="136,116 156,124 140,130" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<polygon points="184,116 164,124 180,130" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<path d="M144,128 L142,162 M176,128 L178,162" stroke="#38e8ff" stroke-width="2.4" stroke-linecap="round" opacity="0.8" filter="url(#__GLOW__)"/>' +
        '<text x="160" y="218" text-anchor="middle" font-size="28" font-weight="700" font-family="' + FONT_SERIF + '" fill="#a5f3fc" filter="url(#__GLOW__)">怨</text>' +
      '</g>' +
      shatteredKanji([[58, 72, '頁', -14, '#7dd3fc', 14], [262, 72, '墨', 14, '#c084fc', 14]], '__GLOW__');
    return wrapEnemySvg('en_r5_phantom', isBoss, pose, defs, body, { bg1: '#1e1b4b', primary: '#7dd3fc', secondary: '#c084fc', kanji: '怨' });
  }

  function enR6Archon(isBoss, pose) {
    var gWing = uid('ar_wg');
    var gGold = uid('ar_gd');
    var defs =
      '<linearGradient id="' + gWing + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#334155"/>' +
        '<stop offset="55%" stop-color="#0f172a"/>' +
        '<stop offset="100%" stop-color="#02040a"/>' +
      '</linearGradient>' +
      '<linearGradient id="' + gGold + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#fff4b8"/><stop offset="50%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7c5a12"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Six Asymmetric Fallen-Seraph Obsidian & Gold Feathered Wings
        '<path d="M138,144 L24,54 L54,118 L16,144 L66,174 L32,226 L124,202 Z" fill="url(#' + gWing + ')" stroke="url(#' + gGold + ')" stroke-width="1.8" stroke-linejoin="round"/>' +
        '<path d="M182,144 L296,54 L266,118 L304,144 L254,174 L288,226 L196,202 Z" fill="url(#' + gWing + ')" stroke="url(#' + gGold + ')" stroke-width="1.8" stroke-linejoin="round"/>' +
        // Fractured Golden Halo Ring hovering behind crown
        '<ellipse cx="160" cy="64" rx="56" ry="15" fill="none" stroke="url(#' + gGold + ')" stroke-width="3" stroke-dasharray="28 8 18 6" filter="url(#__GLOW__)"/>' +
        // Regal Fallen Archon Vestment Silhouette
        '<path d="M120,148 L160,126 L200,148 L212,268 L160,288 L108,268 Z" fill="#111326" stroke="url(#' + gGold + ')" stroke-width="2"/>' +
        '<path d="M160,136 L160,284" stroke="url(#' + gGold + ')" stroke-width="2.2"/>' +
        // Blindfolded Ivory-Gold Porcelain Visage with Weeping Golden Runes
        '<path d="M134,104 C134,74 186,74 186,104 C186,134 174,148 160,152 C146,148 134,134 134,104 Z" fill="#f8fafc" stroke="url(#' + gGold + ')" stroke-width="1.8"/>' +
        '<path d="M132,102 L188,102 L186,116 L134,116 Z" fill="#1e1b4b" stroke="url(#' + gGold + ')" stroke-width="1.4"/>' +
        '<circle cx="148" cy="109" r="3" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<circle cx="172" cy="109" r="3" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        // Blazing Spear of Silence ('裁')
        '<line x1="234" y1="42" x2="234" y2="278" stroke="url(#' + gGold + ')" stroke-width="4.2"/>' +
        '<polygon points="234,16 246,52 234,44 222,52" fill="#38e8ff" stroke="#ffffff" stroke-width="1.2" filter="url(#__GLOW__)"/>' +
        '<text x="160" y="218" text-anchor="middle" font-size="26" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fef08a" filter="url(#__GLOW__)">裁</text>' +
      '</g>' +
      shatteredKanji([[44, 62, '聖', -14, '#fde047', 14], [276, 62, '罰', 14, '#38e8ff', 14]], '__GLOW__');
    return wrapEnemySvg('en_r6_archon', isBoss, pose, defs, body, { bg1: '#312e81', primary: '#fbbf24', secondary: '#38e8ff', kanji: '裁' });
  }

  function enR6Voidling(isBoss, pose) {
    var gVoid = uid('vl_vd');
    var defs =
      '<radialGradient id="' + gVoid + '" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#02010a"/>' +
        '<stop offset="56%" stop-color="#581c87"/>' +
        '<stop offset="86%" stop-color="#be123c" stop-opacity="0.72"/>' +
        '<stop offset="100%" stop-color="#040610" stop-opacity="0"/>' +
      '</radialGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        // Curling Eldritch Shadow Tendrils
        '<path d="M160,160 C92,126 52,82 32,126 C64,148 92,162 52,218 C92,208 118,202 104,268" fill="none" stroke="#581c87" stroke-width="10" stroke-linecap="round"/>' +
        '<path d="M160,160 C228,126 268,82 288,126 C256,148 228,162 268,218 C228,208 202,202 216,268" fill="none" stroke="#581c87" stroke-width="10" stroke-linecap="round"/>' +
        // Swirling Dark-Violet Nebula Maw Core ringed by jagged obsidian shards
        '<circle cx="160" cy="158" r="88" fill="url(#' + gVoid + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +
        '<polygon points="160,54 182,88 226,84 202,124 236,158 202,192 226,232 182,228 160,262 138,228 94,232 118,192 84,158 118,124 94,84 138,88" fill="#090418" stroke="#c084fc" stroke-width="2" stroke-linejoin="round"/>' +
        // Multiple Glowing Crimson-Cyan Eldritch Slit Eyes
        '<ellipse cx="160" cy="156" rx="28" ry="18" fill="#ff2a55" filter="url(#__GLOW__)"/>' +
        '<ellipse cx="160" cy="156" rx="6" ry="17" fill="#02010a"/>' +
        '<ellipse cx="118" cy="126" rx="12" ry="7" transform="rotate(24 118 126)" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<ellipse cx="202" cy="126" rx="12" ry="7" transform="rotate(-24 202 126)" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<ellipse cx="122" cy="192" rx="11" ry="6" transform="rotate(-20 122 192)" fill="#fde047" filter="url(#__GLOW__)"/>' +
        '<ellipse cx="198" cy="192" rx="11" ry="6" transform="rotate(20 198 192)" fill="#fde047" filter="url(#__GLOW__)"/>' +
      '</g>' +
      shatteredKanji([[46, 76, '蝕', -16, '#ff3b5c', 15], [274, 76, '空', 16, '#38e8ff', 15]], '__GLOW__');
    return wrapEnemySvg('en_r6_voidling', isBoss, pose, defs, body, { bg1: '#581c87', primary: '#ff3b5c', secondary: '#c084fc', kanji: '蝕' });
  }

  var ENEMY_BUILDERS = {
    en_r1_slime: enR1Slime,
    en_r1_crow: enR1Crow,
    boss_r1_golem: bossR1Golem,
    en_r2_wisp: enR2Wisp,
    en_r2_wolf: enR2Wolf,
    boss_r2_knight: function (isBoss, pose) { return bossR2Knight(pose); },
    en_r3_tanuki: enR3Tanuki,
    en_r3_puppet: enR3Puppet,
    boss_r3_kabuki: function (isBoss, pose) { return bossR3Kabuki(pose); },
    en_r4_harpy: enR4Harpy,
    en_r4_gargoyle: enR4Gargoyle,
    boss_r4_serpent: bossR4Serpent,
    en_r5_automaton: enR5Automaton,
    en_r5_phantom: enR5Phantom,
    boss_r5_chancellor: function (isBoss, pose) { return bossR5Chancellor(pose); },
    en_r6_archon: enR6Archon,
    en_r6_voidling: enR6Voidling,
    boss_r6_overlord: function (isBoss, pose) { return bossR6Overlord(pose); }
  };

  function enemyFallback(enemyId, isBoss, pose) {
    var gMask = uid('fb_mk');
    var defs =
      '<linearGradient id="' + gMask + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
        '<stop offset="0%" stop-color="#3730a3"/><stop offset="100%" stop-color="#0b0d1e"/>' +
      '</linearGradient>';
    var body =
      '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
        '<path d="M96,128 C86,192 108,258 160,282 C212,258 234,192 224,128 C210,68 110,68 96,128 Z" fill="url(#' + gMask + ')" stroke="#d4af37" stroke-width="2.4"/>' +
        '<path d="M120,82 L100,36 L138,72 M200,82 L220,36 L182,72" fill="#d4af37" stroke="#5c430e" stroke-width="1.2"/>' +
        '<polygon points="124,138 152,148 128,156" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<polygon points="196,138 168,148 192,156" fill="#38e8ff" filter="url(#__GLOW__)"/>' +
        '<path d="M126,194 Q160,218 194,194 Q160,204 126,194 Z" fill="#fde68a"/>' +
      '</g>';
    return wrapEnemySvg(enemyId || 'unknown', isBoss, pose, defs, body, { bg1: '#4338ca', primary: '#d4af37', secondary: '#38e8ff', kanji: '妖' });
  }

  function enemy(enemyId, isBoss, pose) {
    var p = normalizeEnemyPose(pose);
    var fn = ENEMY_BUILDERS[enemyId];
    if (typeof fn === 'function') return fn(!!isBoss, p);
    return enemyFallback(enemyId, !!isBoss, p);
  }

  /* ------------------------------------------------------------------------
     4. ITEM ICONS — window.SVGArt.itemIcon(iconType, rarity = 'common') [64x64]
     5 Rarities + 13 Detailed Icons
     ------------------------------------------------------------------------ */

  var RARITY_STYLES = {
    common: { bg1: '#232c3d', bg2: '#0f1420', border: '#94a3b8', border2: '#475569', glow: '#cbd5e1', accent: '#cbd5e1' },
    uncommon: { bg1: '#12382c', bg2: '#071712', border: '#34d399', border2: '#059669', glow: '#34d399', accent: '#6ee7b7' },
    rare: { bg1: '#102c4a', bg2: '#071324', border: '#38bdf8', border2: '#0284c7', glow: '#38e8ff', accent: '#7dd3fc' },
    epic: { bg1: '#2d1654', bg2: '#110824', border: '#c084fc', border2: '#7e22ce', glow: '#c084fc', accent: '#e9d5ff' },
    legendary: { bg1: '#422c0a', bg2: '#181004', border: '#fde047', border2: '#b45309', glow: '#fbbf24', accent: '#fef08a' }
  };

  function itemIcon(iconType, rarity) {
    var rKey = RARITY_STYLES[rarity] ? rarity : 'common';
    var st = RARITY_STYLES[rKey];
    var gBg = uid('it_bg');
    var gFr = uid('it_fr');
    var gGl = uid('it_gl');
    var gGd = uid('it_gd');
    var fGl = uid('it_fl');

    var art = '';
    switch (iconType) {
      case 'sword':
        art =
          '<g filter="url(#' + fGl + ')">' +
            '<path d="M22,42 L50,12 L54,10 L52,16 L26,46 Z" fill="#e0fbff" stroke="#38bdf8" stroke-width="1"/>' +
            '<path d="M24,43 L51,13" stroke="#ffffff" stroke-width="1.3"/>' +
          '</g>' +
          '<ellipse cx="23" cy="43" rx="6.5" ry="2.6" transform="rotate(44 23 43)" fill="url(#' + gGd + ')" stroke="#5c430e" stroke-width="0.9"/>' +
          '<path d="M20,46 L11,55 L9,53 L18,44 Z" fill="#1e293b" stroke="url(#' + gGd + ')" stroke-width="1"/>' +
          '<circle cx="10" cy="54" r="2.2" fill="url(#' + gGd + ')"/>';
        break;
      case 'staff':
        art =
          '<line x1="14" y1="54" x2="42" y2="22" stroke="#5c3a21" stroke-width="3.6" stroke-linecap="round"/>' +
          '<line x1="14" y1="54" x2="42" y2="22" stroke="url(#' + gGd + ')" stroke-width="1" stroke-dasharray="6 5"/>' +
          '<path d="M36,24 C36,12 52,10 53,22 C54,30 42,32 39,26" fill="none" stroke="url(#' + gGd + ')" stroke-width="2.4" stroke-linecap="round"/>' +
          '<circle cx="45" cy="20" r="5.5" fill="#38e8ff" filter="url(#' + fGl + ')"/>' +
          '<circle cx="43.5" cy="18.5" r="2" fill="#ffffff"/>';
        break;
      case 'lute':
        art =
          '<g transform="translate(32,34) rotate(-32)">' +
            '<rect x="-2.4" y="-22" width="4.8" height="16" rx="1" fill="#3c150a" stroke="url(#' + gGd + ')" stroke-width="0.8"/>' +
            '<path d="M-4,-22 L4,-22 L5,-27 L-5,-27 Z" fill="url(#' + gGd + ')"/>' +
            '<path d="M0,-8 C12,-6 16,8 11,17 C7,23 -7,23 -11,17 C-16,8 -12,-6 0,-8 Z" fill="#9a3412" stroke="url(#' + gGd + ')" stroke-width="1.4"/>' +
            '<path d="M-11,4 Q0,0 11,4 L10,9 Q0,6 -10,9 Z" fill="#1e1b4b"/>' +
            '<line x1="-1.2" y1="-21" x2="-1.5" y2="14" stroke="#5de6ff" stroke-width="0.8"/>' +
            '<line x1="1.2" y1="-21" x2="1.5" y2="14" stroke="#fde68a" stroke-width="0.8"/>' +
          '</g>';
        break;
      case 'armor':
        art =
          '<path d="M16,18 L26,14 L32,19 L38,14 L48,18 L52,28 L45,32 L46,50 L18,50 L19,32 L12,28 Z" fill="#1e293b" stroke="url(#' + gGd + ')" stroke-width="1.5"/>' +
          '<path d="M20,28 L44,28 M20,35 L44,35 M20,42 L44,42" stroke="#d4af37" stroke-width="1.1"/>' +
          '<path d="M24,20 L24,48 M40,20 L40,48" stroke="#dc2626" stroke-width="1.3" opacity="0.85"/>' +
          '<polygon points="32,20 36,26 32,32 28,26" fill="url(#' + gGd + ')"/>';
        break;
      case 'robe':
        art =
          '<path d="M22,14 L42,14 L52,28 L44,34 L46,52 L18,52 L20,34 L12,28 Z" fill="#3b1d69" stroke="url(#' + gGd + ')" stroke-width="1.5"/>' +
          '<path d="M25,14 L32,30 L39,14" fill="#eef2ff" stroke="url(#' + gGd + ')" stroke-width="1.3"/>' +
          '<rect x="19" y="34" width="26" height="6" rx="1" fill="#1e1038" stroke="url(#' + gGd + ')" stroke-width="1.1"/>' +
          '<path d="M32,40 L30,50 M32,40 L34,50" stroke="url(#' + gGd + ')" stroke-width="1.3"/>';
        break;
      case 'cloak':
        art =
          '<path d="M22,16 Q32,10 42,16 L52,48 Q32,56 12,48 Z" fill="#7f1d2d" stroke="url(#' + gGd + ')" stroke-width="1.5"/>' +
          '<path d="M22,18 Q32,24 42,18 L46,46 Q32,50 18,46 Z" fill="#172038" opacity="0.8"/>' +
          '<circle cx="32" cy="19" r="3.6" fill="url(#' + gGd + ')" stroke="#5c430e" stroke-width="0.9"/>' +
          '<circle cx="32" cy="19" r="1.5" fill="#38e8ff"/>';
        break;
      case 'ring':
        art =
          '<ellipse cx="32" cy="36" rx="15" ry="11" fill="none" stroke="url(#' + gGd + ')" stroke-width="4.8"/>' +
          '<ellipse cx="32" cy="36" rx="15" ry="11" fill="none" stroke="#fef08a" stroke-width="1" opacity="0.7"/>' +
          '<polygon points="32,14 40,22 32,30 24,22" fill="#38e8ff" stroke="url(#' + gGd + ')" stroke-width="1.4" filter="url(#' + fGl + ')"/>' +
          '<polygon points="32,17 36,22 32,26 28,22" fill="#ffffff" opacity="0.7"/>';
        break;
      case 'amulet':
        art =
          '<path d="M20,12 Q32,26 44,12" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M34,20 C45,20 48,36 39,46 C31,53 20,49 20,40 C20,34 26,33 29,37 C32,40 37,37 36,31 C35,27 28,28 28,24 C28,21 31,20 34,20 Z" fill="#10b981" stroke="url(#' + gGd + ')" stroke-width="1.6" filter="url(#' + fGl + ')"/>' +
          '<circle cx="34" cy="26" r="2.6" fill="#064e3b" stroke="#fde68a" stroke-width="1"/>';
        break;
      case 'talisman':
        art =
          '<rect x="20" y="12" width="24" height="40" rx="2" fill="#fbf0d5" stroke="url(#' + gGd + ')" stroke-width="1.6"/>' +
          '<rect x="23" y="15" width="18" height="34" fill="none" stroke="#dc2626" stroke-width="1"/>' +
          '<text x="32" y="36" text-anchor="middle" font-size="16" font-weight="700" font-family="' + FONT_SERIF + '" fill="#1e1b4b">護</text>' +
          '<circle cx="32" cy="44" r="2.5" fill="#dc2626"/>' +
          '<path d="M27,12 Q32,6 37,12" fill="none" stroke="#dc2626" stroke-width="1.8"/>';
        break;
      case 'potion':
        art =
          '<rect x="27" y="11" width="10" height="5" rx="1" fill="#a16207" stroke="#fde68a" stroke-width="0.9"/>' +
          '<rect x="26" y="16" width="12" height="6" fill="#cbd5e1" stroke="#475569" stroke-width="1"/>' +
          '<path d="M26,22 L16,38 C14,45 19,52 32,52 C45,52 50,45 48,38 L38,22 Z" fill="#1e293b" stroke="#cbd5e1" stroke-width="1.5"/>' +
          '<path d="M19,38 L45,38 C47,44 43,49 32,49 C21,49 17,44 19,38 Z" fill="#ef4444" filter="url(#' + fGl + ')"/>' +
          '<circle cx="27" cy="43" r="2" fill="#fecaca" opacity="0.85"/>' +
          '<circle cx="35" cy="45" r="1.4" fill="#ffffff" opacity="0.8"/>';
        break;
      case 'elixir':
        art =
          '<path d="M22,22 C16,18 14,12 18,14 C22,16 26,18 28,20 M42,22 C48,18 50,12 46,14 C42,16 38,18 36,20" fill="none" stroke="url(#' + gGd + ')" stroke-width="1.8" stroke-linecap="round"/>' +
          '<rect x="28" y="11" width="8" height="7" rx="1.5" fill="url(#' + gGd + ')"/>' +
          '<path d="M32,18 C44,24 48,36 44,46 C40,53 24,53 20,46 C16,36 20,24 32,18 Z" fill="#0e7490" stroke="url(#' + gGd + ')" stroke-width="1.6"/>' +
          '<path d="M23,36 C26,32 38,32 41,36 C43,44 39,49 32,49 C25,49 21,44 23,36 Z" fill="#5de6ff" filter="url(#' + fGl + ')"/>' +
          sparkle(32, 30, 5, '#fef08a', 0.95);
        break;
      case 'scroll':
        art =
          '<g transform="translate(32,32) rotate(-20)">' +
            '<rect x="-15" y="-17" width="30" height="34" rx="2" fill="#fbf0d5" stroke="url(#' + gGd + ')" stroke-width="1.4"/>' +
            '<rect x="-19" y="-20" width="38" height="5" rx="2" fill="#4c1d95" stroke="url(#' + gGd + ')" stroke-width="1"/>' +
            '<rect x="-19" y="15" width="38" height="5" rx="2" fill="#4c1d95" stroke="url(#' + gGd + ')" stroke-width="1"/>' +
            '<line x1="-9" y1="-7" x2="9" y2="-7" stroke="#0284c7" stroke-width="1.5"/>' +
            '<line x1="-9" y1="0" x2="9" y2="0" stroke="#4c1d95" stroke-width="1.5"/>' +
            '<line x1="-9" y1="7" x2="5" y2="7" stroke="#0284c7" stroke-width="1.5"/>' +
          '</g>';
        break;
      case 'charm':
      default:
        art =
          '<path d="M26,18 Q32,8 38,18" fill="none" stroke="#f43f5e" stroke-width="2.2" stroke-linecap="round"/>' +
          '<path d="M22,20 L42,20 L46,48 Q32,54 18,48 Z" fill="#9f1239" stroke="url(#' + gGd + ')" stroke-width="1.6"/>' +
          '<path d="M22,26 L42,26" stroke="url(#' + gGd + ')" stroke-width="1.5"/>' +
          '<rect x="26" y="30" width="12" height="14" rx="1.5" fill="#fbf0d5" stroke="url(#' + gGd + ')" stroke-width="1"/>' +
          '<text x="32" y="40.5" text-anchor="middle" font-size="10" font-weight="700" font-family="' + FONT_SERIF + '" fill="#7f1d1d">守</text>';
        break;
    }

    var cornerDecor = '';
    if (rKey === 'legendary') {
      cornerDecor =
        '<rect x="5" y="5" width="54" height="54" rx="7" fill="none" stroke="#fef08a" stroke-width="1" stroke-dasharray="6 4" opacity="0.8"/>' +
        sparkle(11, 11, 4.5, '#fef08a', 0.95) +
        sparkle(53, 53, 4.5, '#fef08a', 0.95) +
        sparkle(53, 11, 3.5, '#38e8ff', 0.9);
    } else if (rKey === 'epic' || rKey === 'rare') {
      cornerDecor =
        '<circle cx="9" cy="9" r="1.8" fill="' + st.accent + '"/>' +
        '<circle cx="55" cy="9" r="1.8" fill="' + st.accent + '"/>' +
        '<circle cx="9" cy="55" r="1.8" fill="' + st.accent + '"/>' +
        '<circle cx="55" cy="55" r="1.8" fill="' + st.accent + '"/>';
    }

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="svg-art svg-item rarity-' + rKey + '">' +
        '<defs>' +
          '<radialGradient id="' + gBg + '" cx="50%" cy="46%" r="58%">' +
            '<stop offset="0%" stop-color="' + st.bg1 + '"/>' +
            '<stop offset="100%" stop-color="' + st.bg2 + '"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + gFr + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="' + st.border + '"/>' +
            '<stop offset="100%" stop-color="' + st.border2 + '"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + gGl + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="' + st.glow + '" stop-opacity="0.34"/>' +
            '<stop offset="100%" stop-color="' + st.glow + '" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + gGd + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fff0a6"/><stop offset="50%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7c5a12"/>' +
          '</linearGradient>' +
          defsGlow(fGl, 2) +
        '</defs>' +
        '<rect x="2" y="2" width="60" height="60" rx="10" fill="url(#' + gBg + ')" stroke="url(#' + gFr + ')" stroke-width="2.2"/>' +
        '<circle cx="32" cy="32" r="24" fill="url(#' + gGl + ')"/>' +
        cornerDecor +
        art +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------------
     5. WORLD MAP — window.SVGArt.worldMap(regions, unlockedIds, clearedBossIds, currentRegionId)
     [viewBox="0 0 900 480"]
     ------------------------------------------------------------------------ */

  var DEFAULT_MAP_POS = [
    { x: 118, y: 318 },
    { x: 258, y: 192 },
    { x: 416, y: 312 },
    { x: 562, y: 168 },
    { x: 704, y: 296 },
    { x: 794, y: 122 }
  ];

  function worldMap(regions, unlockedIds, clearedBossIds, currentRegionId) {
    var list = Array.isArray(regions) && regions.length ? regions : [];
    var unlocked = toSet(unlockedIds);
    var cleared = toSet(clearedBossIds);

    var gSea = uid('wm_sea');
    var gLand = uid('wm_lnd');
    var gCoast = uid('wm_cst');
    var gGold = uid('wm_gld');
    var gLine = uid('wm_ln');
    var fGlow = uid('wm_glw');
    var fBlur = uid('wm_blr');

    // Normalize coordinates safely
    var pts = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i] || {};
      var def = DEFAULT_MAP_POS[i % DEFAULT_MAP_POS.length];
      var px = r.mapPos && typeof r.mapPos.x === 'number' ? r.mapPos.x : def.x;
      var py = r.mapPos && typeof r.mapPos.y === 'number' ? r.mapPos.y : def.y;
      pts.push({ region: r, x: px, y: py });
    }

    // Subtle nautical grid & seigaiha wave accents
    var gridLines = '';
    for (var gx = 90; gx < 900; gx += 90) {
      gridLines += '<line x1="' + gx + '" y1="12" x2="' + gx + '" y2="468" stroke="#38bdf8" stroke-width="0.6" opacity="0.1"/>';
    }
    for (var gy = 80; gy < 480; gy += 80) {
      gridLines += '<line x1="12" y1="' + gy + '" x2="888" y2="' + gy + '" stroke="#38bdf8" stroke-width="0.6" opacity="0.1"/>';
    }
    var waveSpots = [[140, 82], [320, 412], [510, 66], [648, 418], [826, 382], [202, 424], [434, 88], [744, 62]];
    var waves = '';
    for (var w = 0; w < waveSpots.length; w++) {
      var wx = waveSpots[w][0];
      var wy = waveSpots[w][1];
      waves +=
        '<path d="M' + (wx - 22) + ',' + wy + ' Q' + (wx - 11) + ',' + (wy - 6) + ' ' + wx + ',' + wy +
        ' Q' + (wx + 11) + ',' + (wy - 6) + ' ' + (wx + 22) + ',' + wy + '" fill="none" stroke="#38bdf8" stroke-width="1.1" opacity="0.22"/>' +
        '<path d="M' + (wx - 14) + ',' + (wy + 7) + ' Q' + wx + ',' + (wy + 1) + ' ' + (wx + 14) + ',' + (wy + 7) + '" fill="none" stroke="#38bdf8" stroke-width="0.9" opacity="0.16"/>';
    }

    // Dynamic Archipelago / Continental Landmasses anchored cleanly beneath each region!
    var landHalos = '';
    var landShapes = '';
    var landDetails = '';
    for (var li = 0; li < pts.length; li++) {
      var p = pts[li];
      var rx = p.x;
      var ry = p.y;
      var seed = (li + 1) * 19;
      var w1 = 68 + (li % 3) * 12;
      var h1 = 44 + ((li + 1) % 2) * 10;

      // Connecting continental causeway / ridge to next island (except final celestial sanctuary isle)
      if (li < pts.length - 1 && li < pts.length - 2) {
        var nx = pts[li + 1].x;
        var ny = pts[li + 1].y;
        landHalos +=
          '<line x1="' + rx + '" y1="' + ry + '" x2="' + nx + '" y2="' + ny + '" stroke="#1e3a5f" stroke-width="48" stroke-linecap="round" opacity="0.45"/>';
        landShapes +=
          '<line x1="' + rx + '" y1="' + ry + '" x2="' + nx + '" y2="' + ny + '" stroke="url(#' + gLand + ')" stroke-width="26" stroke-linecap="round" opacity="0.88"/>';
      }

      // Sculpted organic island contour around (rx, ry)
      var islandD =
        'M' + (rx - w1) + ',' + (ry + 4) +
        ' C' + (rx - w1 + 8) + ',' + (ry - h1 + (seed % 7)) + ' ' + (rx - 18) + ',' + (ry - h1 - 10) + ' ' + (rx + 10) + ',' + (ry - h1 + 2) +
        ' C' + (rx + w1 - 12) + ',' + (ry - h1 + 8) + ' ' + (rx + w1 + 8) + ',' + (ry - 8) + ' ' + (rx + w1 - 6) + ',' + (ry + 18) +
        ' C' + (rx + w1 - 24) + ',' + (ry + h1 + 8) + ' ' + (rx - 16) + ',' + (ry + h1 + 12) + ' ' + (rx - w1 + 14) + ',' + (ry + h1 - 6) +
        ' C' + (rx - w1 - 6) + ',' + (ry + 24) + ' ' + (rx - w1 - 4) + ',' + (ry + 12) + ' ' + (rx - w1) + ',' + (ry + 4) + ' Z';

      landHalos += '<path d="' + islandD + '" fill="url(#' + gCoast + ')" opacity="0.65" filter="url(#' + fBlur + ')"/>';
      landShapes +=
        '<path d="' + islandD + '" fill="url(#' + gLand + ')" stroke="#d4af37" stroke-width="1.2" stroke-opacity="0.48"/>' +
        '<path d="' + islandD + '" fill="none" stroke="#38bdf8" stroke-width="0.7" stroke-dasharray="4 4" stroke-opacity="0.28" transform="translate(0,2)"/>';

      // Stylized terrain accents (mountain ridges / forest silhouettes / coastal islet)
      landDetails +=
        '<path d="M' + (rx - 44) + ',' + (ry - 14) + ' L' + (rx - 34) + ',' + (ry - 28) + ' L' + (rx - 24) + ',' + (ry - 14) + '" fill="none" stroke="#64748b" stroke-width="1.2" opacity="0.55"/>' +
        '<path d="M' + (rx + 26) + ',' + (ry - 10) + ' L' + (rx + 36) + ',' + (ry - 24) + ' L' + (rx + 46) + ',' + (ry - 10) + '" fill="none" stroke="#64748b" stroke-width="1.2" opacity="0.55"/>' +
        '<ellipse cx="' + (rx + (li % 2 === 0 ? 64 : -64)) + '" cy="' + (ry + 28) + '" rx="14" ry="7" fill="url(#' + gLand + ')" stroke="#d4af37" stroke-width="0.8" stroke-opacity="0.38"/>';
    }

    // Glowing Ley-Line Paths connecting r1 -> r2 -> r3 -> r4 -> r5 -> r6
    var leyLines = '';
    for (var pi = 0; pi < pts.length - 1; pi++) {
      var a = pts[pi];
      var b = pts[pi + 1];
      var mx = (a.x + b.x) / 2;
      var my = (a.y + b.y) / 2 + (pi % 2 === 0 ? -36 : 36);
      var pathD = 'M' + a.x + ',' + a.y + ' Q' + mx.toFixed(1) + ',' + my.toFixed(1) + ' ' + b.x + ',' + b.y;
      var destUnlocked = unlocked.has(b.region.id);

      if (destUnlocked) {
        leyLines +=
          '<path d="' + pathD + '" fill="none" stroke="#38e8ff" stroke-width="7" opacity="0.22" filter="url(#' + fGlow + ')"/>' +
          '<path d="' + pathD + '" fill="none" stroke="url(#' + gLine + ')" stroke-width="2.6" stroke-linecap="round"/>' +
          '<circle cx="' + ((a.x + 2 * mx + b.x) / 4).toFixed(1) + '" cy="' + ((a.y + 2 * my + b.y) / 4).toFixed(1) + '" r="3.2" fill="#fde68a" filter="url(#' + fGlow + ')"/>';
      } else {
        leyLines +=
          '<path d="' + pathD + '" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="6 7" opacity="0.48"/>';
      }
    }

    // Interactive Region Nodes
    var nodesSvg = '';
    for (var ni = 0; ni < pts.length; ni++) {
      var np = pts[ni];
      var reg = np.region;
      var rid = reg.id || ('r' + (ni + 1));
      var isUnl = unlocked.has(rid);
      var isClr = cleared.has(rid);
      var isCur = rid === currentRegionId;
      var classes = 'map-node ' + (isUnl ? 'unlocked' : 'locked') + (isClr ? ' cleared' : '') + (isCur ? ' current' : '');

      var nx = np.x;
      var ny = np.y;
      var nameText = reg.name || rid;
      var jlptText = reg.jlpt || '';
      var emblem = reg.kanjiEmblem || '言';

      // Pill placement clamped neatly inside 900x480
      var pillW = Math.max(114, nameText.length * 13 + (jlptText ? 40 : 20));
      var pillX = Math.max(22 + pillW / 2, Math.min(878 - pillW / 2, nx));
      var pillY = ny > 406 ? ny - 54 : ny + 38;

      var auraRings = '';
      if (isCur) {
        auraRings =
          '<circle cx="' + nx + '" cy="' + ny + '" r="40" fill="#38e8ff" opacity="0.18" class="svg-aura" filter="url(#' + fGlow + ')" ' + ORIGIN_CENTER + '/>' +
          '<g class="svg-magic-ring" ' + ORIGIN_CENTER + '>' +
            '<circle cx="' + nx + '" cy="' + ny + '" r="34" fill="none" stroke="#fde047" stroke-width="1.8" stroke-dasharray="10 5"/>' +
          '</g>' +
          '<g class="svg-magic-ring-rev" ' + ORIGIN_CENTER + '>' +
            '<circle cx="' + nx + '" cy="' + ny + '" r="29" fill="none" stroke="#38e8ff" stroke-width="1.3" stroke-dasharray="5 4"/>' +
          '</g>' +
          // Floating Current Position Pointer above node
          '<g class="svg-float" ' + ORIGIN_CENTER + '>' +
            '<polygon points="' + nx + ',' + (ny - 34) + ' ' + (nx - 7) + ',' + (ny - 45) + ' ' + (nx + 7) + ',' + (ny - 45) + '" fill="#fde047" stroke="#7c5a12" stroke-width="1" filter="url(#' + fGlow + ')"/>' +
          '</g>';
      } else if (isUnl) {
        auraRings =
          '<circle cx="' + nx + '" cy="' + ny + '" r="31" fill="#d4af37" opacity="0.12"/>' +
          '<g class="svg-magic-ring" ' + ORIGIN_CENTER + '>' +
            '<circle cx="' + nx + '" cy="' + ny + '" r="29" fill="none" stroke="#d4af37" stroke-width="1.2" stroke-dasharray="6 5" opacity="0.8"/>' +
          '</g>';
      }

      var centerIcon = isUnl
        ? '<text x="' + nx + '" y="' + (ny + 8) + '" text-anchor="middle" font-size="22" font-weight="700" font-family="' + FONT_SERIF + '" fill="' + (isCur ? '#e0fbff' : '#fde68a') + '" filter="url(#' + fGlow + ')">' + esc(emblem) + '</text>'
        : // Sculpted Lock Icon
          '<g fill="none" stroke="#64748b" stroke-width="1.8">' +
            '<path d="M' + (nx - 5) + ',' + (ny - 2) + ' V' + (ny - 7) + ' A5,5 0 0,1 ' + (nx + 5) + ',' + (ny - 7) + ' V' + (ny - 2) + '"/>' +
            '<rect x="' + (nx - 8) + '" y="' + (ny - 2) + '" width="16" height="12" rx="2" fill="#1e2433"/>' +
            '<circle cx="' + nx + '" cy="' + (ny + 4) + '" r="1.6" fill="#94a3b8" stroke="none"/>' +
          '</g>';

      var clearedCrown = isClr
        ? '<g transform="translate(' + (nx + 18) + ',' + (ny - 18) + ')" filter="url(#' + fGlow + ')">' +
            '<circle cx="0" cy="0" r="9.5" fill="#1c1406" stroke="#fde047" stroke-width="1.4"/>' +
            '<polygon points="-5,3 -5,-3 -2,0 0,-4.5 2,0 5,-3 5,3" fill="#fde047"/>' +
          '</g>'
        : '';

      nodesSvg +=
        '<g class="' + classes + '" data-region-id="' + esc(rid) + '" tabindex="0" role="button" aria-label="' + esc(nameText + (jlptText ? ' ' + jlptText : '')) + '" style="cursor:' + (isUnl ? 'pointer' : 'not-allowed') + ';">' +
          auraRings +
          // Ornate Medallion
          '<circle cx="' + nx + '" cy="' + ny + '" r="23" fill="' + (isCur ? '#0e2444' : isUnl ? '#121b38' : '#121622') + '" stroke="' + (isCur ? '#38e8ff' : isUnl ? 'url(#' + gGold + ')' : '#475569') + '" stroke-width="' + (isCur ? '2.8' : '2.2') + '"/>' +
          '<circle cx="' + nx + '" cy="' + ny + '" r="19" fill="none" stroke="' + (isCur ? '#fde047' : isUnl ? '#38bdf8' : '#334155') + '" stroke-width="0.9" opacity="0.65"/>' +
          centerIcon +
          clearedCrown +
          // Clean Dark Pill Label below node
          '<g>' +
            '<rect x="' + (pillX - pillW / 2).toFixed(1) + '" y="' + (pillY - 12) + '" width="' + pillW + '" height="24" rx="12" fill="#080d1c" fill-opacity="0.92" stroke="' + (isCur ? '#38e8ff' : isUnl ? '#d4af37' : '#475569') + '" stroke-width="1.2"/>' +
            '<text x="' + (jlptText ? pillX - 14 : pillX).toFixed(1) + '" y="' + (pillY + 4) + '" text-anchor="middle" font-size="11.5" font-weight="600" font-family="' + FONT_SANS + '" fill="' + (isUnl ? '#f8fafc' : '#64748b') + '">' + esc(nameText) + '</text>' +
            (jlptText
              ? '<rect x="' + (pillX + pillW / 2 - 34).toFixed(1) + '" y="' + (pillY - 8.5) + '" width="28" height="17" rx="8.5" fill="' + (isCur ? '#0284c7' : isUnl ? '#422006' : '#1e293b') + '" stroke="' + (isUnl ? '#d4af37' : '#475569') + '" stroke-width="0.8"/>' +
                '<text x="' + (pillX + pillW / 2 - 20).toFixed(1) + '" y="' + (pillY + 3.5) + '" text-anchor="middle" font-size="9.5" font-weight="700" font-family="' + FONT_SANS + '" fill="' + (isUnl ? '#fde68a' : '#94a3b8') + '">' + esc(jlptText) + '</text>'
              : '') +
          '</g>' +
        '</g>';
    }

    // Decorative Misty Sea Clouds at Corners
    var mist =
      '<g opacity="0.24" filter="url(#' + fBlur + ')">' +
        '<ellipse cx="830" cy="436" rx="90" ry="26" fill="#38bdf8"/>' +
        '<ellipse cx="90" cy="48" rx="80" ry="22" fill="#6366f1"/>' +
        '<ellipse cx="450" cy="462" rx="130" ry="20" fill="#1e3a8a"/>' +
      '</g>';

    // Ornate Gilded Compass Rose (bottom-left corner)
    var compass =
      '<g transform="translate(68,412)" opacity="0.86">' +
        '<circle cx="0" cy="0" r="34" fill="#091124" fill-opacity="0.72" stroke="url(#' + gGold + ')" stroke-width="1.3"/>' +
        '<circle cx="0" cy="0" r="28" fill="none" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3 3"/>' +
        '<polygon points="' + polygonStar(0, 0, 26, 7, 4) + '" fill="url(#' + gGold + ')" stroke="#5c430e" stroke-width="0.7"/>' +
        '<polygon points="' + polygonStar(0, 0, 17, 5, 4) + '" transform="rotate(45)" fill="#38e8ff" opacity="0.75"/>' +
        '<circle cx="0" cy="0" r="3.5" fill="#091124" stroke="#fde68a" stroke-width="1.2"/>' +
        '<text x="0" y="-37" text-anchor="middle" font-size="9" font-family="' + FONT_SERIF + '" fill="#fde68a">北</text>' +
        '<text x="0" y="45" text-anchor="middle" font-size="9" font-family="' + FONT_SERIF + '" fill="#94a3b8">南</text>' +
        '<text x="41" y="3" text-anchor="middle" font-size="9" font-family="' + FONT_SERIF + '" fill="#94a3b8">東</text>' +
        '<text x="-41" y="3" text-anchor="middle" font-size="9" font-family="' + FONT_SERIF + '" fill="#94a3b8">西</text>' +
      '</g>';

    // Cartouche Crest (top-left)
    var cartouche =
      '<g transform="translate(26,24)">' +
        '<rect x="0" y="0" width="146" height="44" rx="8" fill="#080d1d" fill-opacity="0.86" stroke="url(#' + gGold + ')" stroke-width="1.4"/>' +
        '<text x="73" y="22" text-anchor="middle" font-size="16" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fde68a" letter-spacing="3">言霊大陸</text>' +
        '<text x="73" y="36" text-anchor="middle" font-size="8" font-family="' + FONT_SANS + '" fill="#7dd3fc" letter-spacing="1.8">KOTODAMA REALM</text>' +
      '</g>';

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" width="100%" preserveAspectRatio="xMidYMid meet" class="svg-art world-map-svg">' +
        '<defs>' +
          '<radialGradient id="' + gSea + '" cx="52%" cy="46%" r="65%">' +
            '<stop offset="0%" stop-color="#13254c"/>' +
            '<stop offset="58%" stop-color="#0b1530"/>' +
            '<stop offset="100%" stop-color="#050916"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + gLand + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#293556"/>' +
            '<stop offset="55%" stop-color="#1a223b"/>' +
            '<stop offset="100%" stop-color="#101628"/>' +
          '</linearGradient>' +
          '<radialGradient id="' + gCoast + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>' +
            '<stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + gGold + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fef08a"/><stop offset="50%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7c5a12"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gLine + '" x1="0%" y1="0%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#fde047"/><stop offset="50%" stop-color="#38e8ff"/><stop offset="100%" stop-color="#fde047"/>' +
          '</linearGradient>' +
          defsGlow(fGlow, 3.2) +
          '<filter id="' + fBlur + '" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="7"/></filter>' +
        '</defs>' +

        // Deep Indigo Ocean
        '<rect x="0" y="0" width="900" height="480" rx="12" fill="url(#' + gSea + ')"/>' +
        gridLines +
        waves +
        mist +

        // Stylized Continent & Archipelago
        landHalos +
        landShapes +
        landDetails +

        // Outer Gilded Map Frame
        '<rect x="10" y="10" width="880" height="460" rx="8" fill="none" stroke="url(#' + gGold + ')" stroke-width="1.5" opacity="0.65"/>' +
        '<rect x="15" y="15" width="870" height="450" rx="6" fill="none" stroke="#38bdf8" stroke-width="0.7" opacity="0.25"/>' +

        compass +
        cartouche +
        leyLines +
        nodesSvg +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------------
     6. ACHIEVEMENT BADGES — window.SVGArt.badge(iconType, unlocked = false) [72x72]
     12 Icons: sword, book, crown, flame, star, heart, shield, coin, scroll, bolt, gem, torii
     ------------------------------------------------------------------------ */

  function badge(iconType, unlocked) {
    var isUnl = !!unlocked;
    var gBg = uid('bd_bg');
    var gFr = uid('bd_fr');
    var gIc = uid('bd_ic');
    var fGl = uid('bd_fl');

    var iconFill = isUnl ? 'url(#' + gIc + ')' : '#64748b';
    var accent = isUnl ? '#38e8ff' : '#475569';
    var glyph = '';

    switch (iconType) {
      case 'sword':
        glyph =
          '<path d="M23,49 L47,21 L51,19 L49,24 L26,51 Z" fill="' + iconFill + '"/>' +
          '<path d="M49,49 L25,21 L21,19 L23,24 L46,51 Z" fill="' + iconFill + '" opacity="0.85"/>' +
          '<circle cx="36" cy="36" r="4" fill="' + accent + '"/>';
        break;
      case 'book':
        glyph =
          '<path d="M18,26 Q27,22 36,26 L36,48 Q27,44 18,48 Z" fill="' + iconFill + '"/>' +
          '<path d="M36,26 Q45,22 54,26 L54,48 Q45,44 36,48 Z" fill="' + iconFill + '" opacity="0.88"/>' +
          '<line x1="36" y1="26" x2="36" y2="48" stroke="#1e1b4b" stroke-width="1.6"/>' +
          '<circle cx="36" cy="20" r="3" fill="' + accent + '"/>';
        break;
      case 'crown':
        glyph =
          '<path d="M19,46 L17,27 L27,34 L36,20 L45,34 L55,27 L53,46 Z" fill="' + iconFill + '" stroke="#4a3106" stroke-width="1"/>' +
          '<rect x="19" y="46" width="34" height="4.5" rx="1.5" fill="' + iconFill + '"/>' +
          '<circle cx="36" cy="36" r="3.4" fill="' + accent + '"/>';
        break;
      case 'flame':
        glyph =
          '<path d="M36,16 C45,26 50,35 47,44 C44,51 28,51 25,44 C22,35 28,28 31,24 C30,29 33,31 35,28 C36,24 35,20 36,16 Z" fill="' + iconFill + '"/>' +
          '<path d="M36,30 C41,36 42,43 36,46 C30,43 31,36 36,30 Z" fill="' + accent + '"/>';
        break;
      case 'heart':
        glyph =
          '<path d="M36,52 C20,41 16,30 22,23 C27,18 33,21 36,26 C39,21 45,18 50,23 C56,30 52,41 36,52 Z" fill="' + iconFill + '"/>' +
          '<polygon points="36,29 40,35 36,41 32,35" fill="' + accent + '"/>';
        break;
      case 'shield':
        glyph =
          '<path d="M21,21 L36,16 L51,21 V36 C51,45 43,52 36,55 C29,52 21,45 21,36 Z" fill="' + iconFill + '" stroke="#4a3106" stroke-width="1"/>' +
          '<path d="M36,22 V49 M26,33 H46" stroke="' + accent + '" stroke-width="2.4" stroke-linecap="round"/>';
        break;
      case 'coin':
        glyph =
          '<circle cx="36" cy="36" r="16" fill="' + iconFill + '" stroke="#5c430e" stroke-width="1.3"/>' +
          '<circle cx="36" cy="36" r="12.5" fill="none" stroke="' + accent + '" stroke-width="1"/>' +
          '<rect x="31.5" y="31.5" width="9" height="9" fill="#141828" stroke="#5c430e" stroke-width="1"/>';
        break;
      case 'scroll':
        glyph =
          '<rect x="23" y="21" width="26" height="30" rx="2" fill="' + iconFill + '"/>' +
          '<rect x="19" y="18" width="34" height="5" rx="2" fill="' + accent + '"/>' +
          '<rect x="19" y="49" width="34" height="5" rx="2" fill="' + accent + '"/>' +
          '<line x1="28" y1="30" x2="44" y2="30" stroke="#141828" stroke-width="2"/>' +
          '<line x1="28" y1="37" x2="44" y2="37" stroke="#141828" stroke-width="2"/>' +
          '<line x1="28" y1="43" x2="39" y2="43" stroke="#141828" stroke-width="2"/>';
        break;
      case 'bolt':
        glyph =
          '<polygon points="40,16 23,38 35,38 31,56 49,33 37,33" fill="' + iconFill + '" stroke="' + accent + '" stroke-width="1.2"/>';
        break;
      case 'gem':
        glyph =
          '<polygon points="36,16 51,28 45,50 27,50 21,28" fill="' + accent + '" stroke="' + iconFill + '" stroke-width="2"/>' +
          '<polygon points="36,22 44,30 36,44 28,30" fill="#ffffff" opacity="' + (isUnl ? '0.62' : '0.18') + '"/>';
        break;
      case 'torii':
        glyph =
          '<path d="M16,25 Q36,19 56,25 L54,29 Q36,24 18,29 Z" fill="' + iconFill + '"/>' +
          '<rect x="21" y="32" width="30" height="3.5" fill="' + iconFill + '"/>' +
          '<rect x="25" y="27" width="4" height="25" fill="' + iconFill + '"/>' +
          '<rect x="43" y="27" width="4" height="25" fill="' + iconFill + '"/>' +
          '<rect x="34" y="26" width="4" height="8" fill="' + accent + '"/>';
        break;
      case 'star':
      default:
        glyph =
          '<polygon points="' + polygonStar(36, 36, 18, 7.5, 8) + '" fill="' + iconFill + '"/>' +
          '<polygon points="36,28 42,36 36,44 30,36" fill="' + accent + '"/>';
        break;
    }

    var hexOuter = regularPolygon(36, 36, 32, 6, -90);
    var hexInner = regularPolygon(36, 36, 26.5, 6, -90);

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" class="svg-art svg-badge ' + (isUnl ? 'unlocked' : 'locked') + '">' +
        '<defs>' +
          '<radialGradient id="' + gBg + '" cx="50%" cy="42%" r="58%">' +
            (isUnl
              ? '<stop offset="0%" stop-color="#2c2463"/><stop offset="65%" stop-color="#131636"/><stop offset="100%" stop-color="#080a1a"/>'
              : '<stop offset="0%" stop-color="#272c38"/><stop offset="100%" stop-color="#11141c"/>') +
          '</radialGradient>' +
          '<linearGradient id="' + gFr + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            (isUnl
              ? '<stop offset="0%" stop-color="#fff4b8"/><stop offset="50%" stop-color="#d4af37"/><stop offset="100%" stop-color="#7c5a12"/>'
              : '<stop offset="0%" stop-color="#64748b"/><stop offset="100%" stop-color="#334155"/>') +
          '</linearGradient>' +
          '<linearGradient id="' + gIc + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fff4b8"/><stop offset="50%" stop-color="#f5c542"/><stop offset="100%" stop-color="#b45309"/>' +
          '</linearGradient>' +
          defsGlow(fGl, 2.2) +
        '</defs>' +

        '<polygon points="' + hexOuter + '" fill="url(#' + gBg + ')" stroke="url(#' + gFr + ')" stroke-width="2.6"/>' +
        '<polygon points="' + hexInner + '" fill="none" stroke="' + (isUnl ? '#38e8ff' : '#475569') + '" stroke-width="1" opacity="' + (isUnl ? '0.65' : '0.45') + '"/>' +
        '<g' + (isUnl ? ' filter="url(#' + fGl + ')"' : ' opacity="0.72"') + '>' +
          glyph +
        '</g>' +
        (isUnl
          ? sparkle(14, 18, 3.6, '#fef08a', 0.95) + sparkle(58, 54, 3.6, '#38e8ff', 0.9)
          : '') +
      '</svg>'
    );
  }

  /* ------------------------------------------------------------------------
     7. TITLE LOGO — window.SVGArt.logo()  [viewBox="0 0 280 120"]
     Glowing Torii Gate inside Golden Spirit Mandala, Crossed Spirit Brush & Katana,
     Floating Kanji '言' & '霊' Sparkles
     ------------------------------------------------------------------------ */

  function logo() {
    var gAura = uid('lg_au');
    var gGold = uid('lg_gd');
    var gBlade = uid('lg_bl');
    var gTorii = uid('lg_tr');
    var fGlow = uid('lg_fl');

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="100%" preserveAspectRatio="xMidYMid meet" class="svg-art svg-logo">' +
        '<defs>' +
          '<radialGradient id="' + gAura + '" cx="50%" cy="50%" r="50%">' +
            '<stop offset="0%" stop-color="#38e8ff" stop-opacity="0.34"/>' +
            '<stop offset="48%" stop-color="#d4af37" stop-opacity="0.22"/>' +
            '<stop offset="100%" stop-color="#070912" stop-opacity="0"/>' +
          '</radialGradient>' +
          '<linearGradient id="' + gGold + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="#fff4bd"/>' +
            '<stop offset="48%" stop-color="#d4af37"/>' +
            '<stop offset="100%" stop-color="#855d12"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gBlade + '" x1="0%" y1="100%" x2="100%" y2="0%">' +
            '<stop offset="0%" stop-color="#38bdf8"/>' +
            '<stop offset="60%" stop-color="#a5f3fc"/>' +
            '<stop offset="100%" stop-color="#ffffff"/>' +
          '</linearGradient>' +
          '<linearGradient id="' + gTorii + '" x1="0%" y1="0%" x2="0%" y2="100%">' +
            '<stop offset="0%" stop-color="#ef4444"/>' +
            '<stop offset="45%" stop-color="#991b1b"/>' +
            '<stop offset="100%" stop-color="#3b0a14"/>' +
          '</linearGradient>' +
          defsGlow(fGlow, 2.8) +
        '</defs>' +

        // Radiant Background Aura
        '<ellipse cx="140" cy="58" rx="116" ry="52" fill="url(#' + gAura + ')" class="svg-aura" ' + ORIGIN_CENTER + '/>' +

        // Rotating Golden Spirit Mandala Centerpiece
        magicCircle(140, 58, 49, {
          primary: '#d4af37',
          secondary: '#38e8ff',
          opacity: 0.88,
          runes: ['言', '霊', '旅', '始', '知', '韻', '剣', '聖']
        }) +

        // Crossed Spirit Katana (bottom-left to top-right)
        '<g>' +
          '<path d="M104,92 L182,16 L188,13 L185,20 L108,96 Z" fill="url(#' + gBlade + ')" stroke="#ffffff" stroke-width="0.6" filter="url(#' + fGlow + ')"/>' +
          '<ellipse cx="106" cy="94" rx="7" ry="2.8" transform="rotate(44 106 94)" fill="url(#' + gGold + ')"/>' +
          '<line x1="103" y1="97" x2="92" y2="108" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>' +
          '<line x1="103" y1="97" x2="92" y2="108" stroke="url(#' + gGold + ')" stroke-width="1.2" stroke-dasharray="3 2"/>' +
        '</g>' +

        // Crossed Spirit Ink Brush (bottom-right to top-left)
        '<g>' +
          '<line x1="188" y1="108" x2="105" y2="26" stroke="#1e1b4b" stroke-width="4.4" stroke-linecap="round"/>' +
          '<line x1="188" y1="108" x2="105" y2="26" stroke="url(#' + gGold + ')" stroke-width="1.4" stroke-dasharray="10 6"/>' +
          '<rect x="100" y="21" width="9" height="6" rx="1" transform="rotate(45 104 24)" fill="url(#' + gGold + ')"/>' +
          '<path d="M101,22 C93,18 89,11 88,6 C94,8 100,13 105,18 Z" fill="#fef08a" filter="url(#' + fGlow + ')"/>' +
        '</g>' +

        // Glowing Torii Gate Silhouette
        '<g filter="url(#' + fGlow + ')">' +
          // Curved Kasagi Top Lintel
          '<path d="M92,38 Q140,26 188,38 L184,45 Q140,35 96,45 Z" fill="url(#' + gTorii + ')" stroke="url(#' + gGold + ')" stroke-width="1.5"/>' +
          '<path d="M90,36 Q140,24 190,36" fill="none" stroke="url(#' + gGold + ')" stroke-width="2" stroke-linecap="round"/>' +
          // Nuki Tie Beam
          '<rect x="104" y="51" width="72" height="5.5" rx="1" fill="url(#' + gTorii + ')" stroke="url(#' + gGold + ')" stroke-width="1.1"/>' +
          // Twin Tapered Pillars
          '<polygon points="114,42 121,42 119,94 111,94" fill="url(#' + gTorii + ')" stroke="url(#' + gGold + ')" stroke-width="1.2"/>' +
          '<polygon points="159,42 166,42 169,94 161,94" fill="url(#' + gTorii + ')" stroke="url(#' + gGold + ')" stroke-width="1.2"/>' +
          // Pillar Stone Bases
          '<rect x="108" y="91" width="13" height="5" rx="1.5" fill="#1e293b" stroke="url(#' + gGold + ')" stroke-width="1"/>' +
          '<rect x="159" y="91" width="13" height="5" rx="1.5" fill="#1e293b" stroke="url(#' + gGold + ')" stroke-width="1"/>' +
          // Sacred Center Plaque
          '<rect x="135" y="40" width="10" height="16" rx="1.5" fill="#140c24" stroke="url(#' + gGold + ')" stroke-width="1.3"/>' +
          '<circle cx="140" cy="48" r="2.6" fill="#5de6ff"/>' +
        '</g>' +

        // Ornate Filigree Base Horizon Line
        '<path d="M36,104 L126,104 M154,104 L244,104" stroke="url(#' + gGold + ')" stroke-width="1.3" opacity="0.78"/>' +
        '<polygon points="140,98 147,104 140,110 133,104" fill="url(#' + gGold + ')"/>' +

        // Floating Kanji '言' & '霊' Medallions + Sparkles
        '<g class="svg-float" filter="url(#' + fGlow + ')" ' + ORIGIN_CENTER + '>' +
          '<circle cx="54" cy="58" r="20" fill="#0d1328" fill-opacity="0.72" stroke="url(#' + gGold + ')" stroke-width="1.4"/>' +
          '<text x="54" y="66" text-anchor="middle" font-size="22" font-weight="700" font-family="' + FONT_SERIF + '" fill="#fef08a">言</text>' +
          '<circle cx="226" cy="58" r="20" fill="#0d1328" fill-opacity="0.72" stroke="#38e8ff" stroke-width="1.4"/>' +
          '<text x="226" y="66" text-anchor="middle" font-size="22" font-weight="700" font-family="' + FONT_SERIF + '" fill="#a5f3fc">霊</text>' +
          sparkle(26, 36, 5.5, '#fef08a', 0.95) +
          sparkle(254, 36, 5.5, '#5de6ff', 0.95) +
          sparkle(78, 22, 4, '#5de6ff', 0.88) +
          sparkle(202, 22, 4, '#fef08a', 0.88) +
          sparkle(74, 88, 3.5, '#fde68a', 0.8) +
          sparkle(206, 88, 3.5, '#5de6ff', 0.8) +
        '</g>' +
      '</svg>'
    );
  }


  /* ------------------------------------------------------------------------
     Export Public API onto window.SVGArt (Zero ES Module syntax)
     ------------------------------------------------------------------------ */
  global.SVGArt = {
    renderAnimeCharacter: renderAnimeCharacter,
    hero: hero,
    npc: npc,
    enemy: enemy,
    itemIcon: itemIcon,
    worldMap: worldMap,
    badge: badge,
    logo: logo
  };
})(window);
