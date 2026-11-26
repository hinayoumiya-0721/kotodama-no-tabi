/**
 * 《言霊の旅》常數、工具函式、安全的資料存取、音效包裝（Sound）、立繪（js/core.js）
 * 遊戲程式分成 js/ 底下多個一般 <script>，彼此共用最上層的 const／let／function，
 * 載入順序見 index.html（core → state → … → main）。
 */
'use strict';

  // Shared global object (window in the browser, the VM context in tests)
  const global = typeof window !== 'undefined' ? window : globalThis;


  // ============================================================================
  // 1. Constants & Storage Keys
  // ============================================================================
  const APP_VERSION = 'v1.6.1';
  const GITHUB_REPO_ISSUES_URL = 'https://github.com/hinayoumiya-0721/kotodama-no-tabi/issues/new';
  const RECENT_ERROR_LIMIT = 5;
  const recentRuntimeErrors = [];

  function recordRuntimeError(rawMsg) {
    const msg = String(rawMsg || '').replace(/[\x00-\x1f\x7f]/g, ' ').trim().slice(0, 160);
    if (!msg) return;
    recentRuntimeErrors.push({
      time: new Date().toTimeString().slice(0, 8),
      message: msg
    });
    if (recentRuntimeErrors.length > RECENT_ERROR_LIMIT) {
      recentRuntimeErrors.shift();
    }
  }

  if (typeof global !== 'undefined' && typeof global.addEventListener === 'function') {
    global.addEventListener('error', (e) => {
      if (e && (e.message || (e.error && e.error.message))) {
        recordRuntimeError(e.message || e.error.message);
      }
    });
    global.addEventListener('unhandledrejection', (e) => {
      const r = e && e.reason;
      recordRuntimeError(r && r.message ? r.message : String(r || 'Unhandled promise rejection'));
    });
  }

  const SAVE_VERSION = 1;
  const SAVE_KEYS = {
    auto: 'kotodama_save_auto',
    slot1: 'kotodama_save_slot_1',
    slot2: 'kotodama_save_slot_2',
    slot3: 'kotodama_save_slot_3'
  };
  const SAVE_SLOT_LIST = [
    { key: SAVE_KEYS.auto, label: '自動存檔（Auto Save）', isAuto: true },
    { key: SAVE_KEYS.slot1, label: '存檔欄位 1', isAuto: false },
    { key: SAVE_KEYS.slot2, label: '存檔欄位 2', isAuto: false },
    { key: SAVE_KEYS.slot3, label: '存檔欄位 3', isAuto: false }
  ];

  const QUESTION_TYPE_LABELS = {
    reading: '漢字讀音',
    particle: '助詞辨析',
    conjugation: '動詞活用',
    reorder: '句子重組',
    unnatural: '找出不自然表達',
    vocab: '單字',
    grammar: '文法',
    kanji: '漢字讀音',
    listening: '聽力'
  };

  const JLPT_LEVELS = ['N4', 'N3', 'N2', 'N1'];
  const DAY_MS = 86400000;
  const SRS_INTERVAL_DAYS = [1, 3, 7];

  const NPC_REGISTER_LABELS = {
    mayor: '【村長・長老敬語】',
    merchant: '【商人・圓滑丁寧語】',
    scholar: '【學者・考據解説調】',
    priest: '【祭司・莊嚴書面語】',
    default: '【宿屋・親切日常調】'
  };

  const TITLE_FLAVOR_TEXTS = {
    '初醒的旅人': '「在晨霧中睜開雙眼之人，唇齒間仍殘留著失落言靈的微溫。」',
    '古文書解讀者': '「能從殘破羊皮紙的字裡行間，聽見百年前先人低語的智者。」',
    'N4試煉突破者': '「跨越基礎言靈之檻，手中之刃已能斬斷荒野的迷惘。」',
    'N3試煉突破者': '「熟稔日常與書信之理，言靈化為堅不可摧的護身結界。」',
    'N2試煉突破者': '「洞悉敬語與世事脈絡，一言一行皆具破邪之威。」',
    'N1試煉突破者': '「登臨言靈之巔，連古神晦澀的祝詞亦為之俯首。」'
  };

  function getTitleFlavorText(titleStr) {
    if (!titleStr) return TITLE_FLAVOR_TEXTS['初醒的旅人'];
    if (TITLE_FLAVOR_TEXTS[titleStr]) return TITLE_FLAVOR_TEXTS[titleStr];
    if (titleStr.includes('N1')) return TITLE_FLAVOR_TEXTS['N1試煉突破者'];
    if (titleStr.includes('N2')) return TITLE_FLAVOR_TEXTS['N2試煉突破者'];
    if (titleStr.includes('N3')) return TITLE_FLAVOR_TEXTS['N3試煉突破者'];
    if (titleStr.includes('N4')) return TITLE_FLAVOR_TEXTS['N4試煉突破者'];
    return `「銘刻於言靈大陸的榮耀之名——【${titleStr}】。」`;
  }

  const NPC_EXTRA_DIALOGUES = {
    mayor: [
      {
        id: 'mayor_v130_lore',
        emotion: 'serious',
        npcLineJp: 'おお、<ruby>旅<rt>たび</rt></ruby>の<ruby>方<rt>かた</rt></ruby>よ。<ruby>夜霧<rt>よぎり</rt></ruby>が<ruby>深<rt>ふか</rt></ruby>まるにつれ、<ruby>村<rt>むら</rt></ruby>を<ruby>守<rt>まも</rt></ruby>る<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>灯<rt>ともしび</rt></ruby>も<ruby>揺<rt>ゆ</rt></ruby>らいでおりますじゃ。どうかお<ruby>気<rt>き</rt></ruby>をつけてな。',
        npcLineZh: '喔喔，遠道而來的旅人啊。隨著夜霧漸深，守護村莊的言靈燈火也開始搖曳了。出村請務必多加小心吶。',
        choices: [
          {
            jp: 'ご<ruby>心配<rt>しんぱい</rt></ruby>なく。<ruby>私<rt>わたし</rt></ruby>が<ruby>結界<rt>けっかい</rt></ruby>を<ruby>守<rt>まも</rt></ruby>り<ruby>抜<rt>ぬ</rt></ruby>きます。',
            zh: '請村長放心，我一定會守護好結界的。',
            affectionDelta: 15,
            replyEmotion: 'happy',
            replyJp: 'ほっほっほ、なんと<ruby>頼<rt>たの</rt></ruby>もしいお<ruby>言葉<rt>ことば</rt></ruby>！<ruby>礼儀<rt>れいぎ</rt></ruby>と<ruby>覚悟<rt>かくご</rt></ruby>を<ruby>備<rt>そな</rt></ruby>えたお<ruby>方<rt>かた</rt></ruby>じゃ。',
            replyZh: '呵呵呵，多麼可靠的一番話！真是位兼具禮節與覺悟的旅人吶。',
            culturalNote: '💡 對長輩使用「ご心配なく（請別擔心）」搭配丁寧語「〜ます」，既能表達敬意又顯得沉穩可靠。'
          },
          {
            jp: '<ruby>結界<rt>けっかい</rt></ruby>の<ruby>歴史<rt>れきし</rt></ruby>について、もっとお<ruby>聞<rt>き</rt></ruby>かせいただけますか。',
            zh: '能否請您多告訴我一些關於結界的歷史呢？',
            affectionDelta: 12,
            replyEmotion: 'neutral',
            replyJp: 'うむ、<ruby>謙虚<rt>けんきょ</rt></ruby>に<ruby>学<rt>まな</rt></ruby>ぼうとするその<ruby>姿勢<rt>しせい</rt></ruby>こそ、<ruby>強<rt>つよ</rt></ruby>き<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>源<rt>みなもと</rt></ruby>ですぞ。',
            replyZh: '嗯，這份謙虛求教的姿態，正是強大言靈的根源啊。',
            culturalNote: '💡 「お聞かせいただけますか」為「聞かせる（讓我聽）」的謙讓請求句型，向長者請益時非常道地。'
          }
        ]
      }
    ],
    merchant: [
      {
        id: 'merchant_v130_abacus',
        emotion: 'happy',
        npcLineJp: 'まいどご<ruby>贔屓<rt>ひいき</rt></ruby>に！お<ruby>客<rt>きゃく</rt></ruby><ruby>様<rt>さま</rt></ruby>の<ruby>言霊<rt>ことだま</rt></ruby>が<ruby>冴<rt>さ</rt></ruby>えるほど、<ruby>手前<rt>てまえ</rt></ruby>どもの<ruby>鍛冶炉<rt>かじろ</rt></ruby>も<ruby>威勢<rt>いせい</rt></ruby>よく<ruby>燃<rt>も</rt></ruby>え<ruby>上<rt>あ</rt></ruby>がるのでございますよ！',
        npcLineZh: '多謝惠顧！客官您的言靈越是精湛，咱們商會的鍛造爐火就燒得越旺呀！',
        choices: [
          {
            jp: 'いつも<ruby>良質<rt>りょうしつ</rt></ruby>な<ruby>武具<rt>ぶぐ</rt></ruby>を<ruby>揃<rt>そろ</rt></ruby>えてくださり、<ruby>助<rt>たす</rt></ruby>かっています。',
            zh: '總是為我準備這麼精良的武具，真是幫了大忙。',
            affectionDelta: 15,
            replyEmotion: 'happy',
            replyJp: 'いやぁ、そう<ruby>言<rt>い</rt></ruby>っていただけると<ruby>商人冥利<rt>しょうにんみょうり</rt></ruby>に<ruby>尽<rt>つ</rt></ruby>きますなぁ！<ruby>次<rt>つぎ</rt></ruby>も<ruby>特別価格<rt>とくべつかかく</rt></ruby>で<ruby>勉強<rt>べんきょう</rt></ruby>させていただきますよ！',
            replyZh: '哎呀，能聽您這麼說真是做商人的最大福氣！下次也一定給您算個特別優惠價！',
            culturalNote: '💡 日文商業會話中，「勉強させていただきます（我來勉強算便宜一點）」是商人表示「給您打折」的經典慣用語。'
          },
          {
            jp: '<ruby>掘<rt>ほ</rt></ruby>り<ruby>出<rt>だ</rt></ruby>し<ruby>物<rt>もの</rt></ruby>があれば、<ruby>見<rt>み</rt></ruby>せていただけますか。',
            zh: '如果有什麼划算的好貨，可以讓我看看嗎？',
            affectionDelta: 12,
            replyEmotion: 'happy',
            replyJp: 'お<ruby>目<rt>め</rt></ruby>が<ruby>高<rt>たか</rt></ruby>い！とっておきの<ruby>逸品<rt>いっぴん</rt></ruby>を<ruby>奥<rt>おく</rt></ruby>から<ruby>出<rt>だ</rt></ruby>してまいりますね！',
            replyZh: '您真有眼光！我這就從裡頭把壓箱寶給您端出來！',
            culturalNote: '💡 「掘り出し物（ほりだしもの）」指意外淘到的珍品或划算好貨；「お目が高い」則是稱讚對方識貨的常用丁寧表現。'
          }
        ]
      }
    ],
    scholar: [
      {
        id: 'scholar_v130_codex',
        emotion: 'neutral',
        npcLineJp: '<ruby>興味深<rt>きょうみぶか</rt></ruby>いですね……<ruby>遺跡<rt>いせき</rt></ruby>の<ruby>文献<rt>ぶんけん</rt></ruby>を<ruby>紐解<rt>ひもと</rt></ruby>くと、<ruby>助詞<rt>じょし</rt></ruby>ひとつで<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>属性<rt>ぞくせい</rt></ruby>が<ruby>反転<rt>はんてん</rt></ruby>すると<ruby>記<rt>しる</rt></ruby>されているのです。',
        npcLineZh: '真是耐人尋味呢……翻閱遺跡文獻後發現，古籍記載僅僅一個助詞的差異，就會讓言靈的屬性完全反轉。',
        choices: [
          {
            jp: 'なるほど、<ruby>文脈<rt>ぶんみゃく</rt></ruby>の<ruby>構造<rt>こうぞう</rt></ruby>を<ruby>正確<rt>せいかく</rt></ruby>に<ruby>掴<rt>つか</rt></ruby>むことが<ruby>重要<rt>じゅうよう</rt></ruby>なのですね。',
            zh: '原來如此，精準掌握文脈的結構才是最關鍵的呢。',
            affectionDelta: 15,
            replyEmotion: 'happy',
            replyJp: 'まさにその<ruby>通<rt>とお</rt></ruby>りです！あなたとなら、<ruby>夜<rt>よ</rt></ruby>が<ruby>明<rt>あ</rt></ruby>けるまで<ruby>語法<rt>ごほう</rt></ruby>の<ruby>議論<rt>ぎろん</rt></ruby>ができそうですね。',
            replyZh: '正是如此！和您聊起來，感覺就算討論語法到天亮也不會膩呢。',
            culturalNote: '💡 「〜というわけです／〜なのですね」常於知性對話中用來歸納並確認對方的論點，語氣自然且富邏輯感。'
          },
          {
            jp: '<ruby>未解読<rt>みかいどく</rt></ruby>の<ruby>巻物<rt>まきもの</rt></ruby>があれば、<ruby>調査<rt>ちょうさ</rt></ruby>を<ruby>手伝<rt>てつだ</rt></ruby>わせてください。',
            zh: '如果還有未解讀的卷軸，請務必讓我協助調查。',
            affectionDelta: 12,
            replyEmotion: 'happy',
            replyJp: 'なんと<ruby>心強<rt>こころづよ</rt></ruby>いご<ruby>提案<rt>ていあん</rt></ruby>でしょう！<ruby>読書<rt>どくしょ</rt></ruby>ダンジョンの<ruby>史料<rt>しりょう</rt></ruby>をすぐにご<ruby>案内<rt>あんない</rt></ruby>します。',
            replyZh: '真是令人安心的提議！我馬上為您指引閱讀副本裡的珍貴史料。',
            culturalNote: '💡 「手伝わせてください（請讓我幫忙）」使用使役形＋てください，是主動請纓協助時的禮貌句型。'
          }
        ]
      }
    ],
    priest: [
      {
        id: 'priest_v130_oracle',
        emotion: 'serious',
        npcLineJp: '<ruby>静寂<rt>せいじゃく</rt></ruby>の<ruby>神殿<rt>しんでん</rt></ruby>に<ruby>響<rt>ひび</rt></ruby>くは、<ruby>汝<rt>なんじ</rt></ruby>が<ruby>紡<rt>つむ</rt></ruby>ぎし<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>調<rt>しら</rt></ruby>べ。<ruby>迷<rt>まよ</rt></ruby>いを<ruby>祓<rt>はら</rt></ruby>い、<ruby>真<rt>まこと</rt></ruby>の<ruby>語義<rt>ごぎ</rt></ruby>を<ruby>見極<rt>みきわ</rt></ruby>めるがよい。',
        npcLineZh: '迴盪於靜寂神殿之中的，正是汝所編織的言靈之音。拂去心頭迷惘，看清詞句真正的意涵吧。',
        choices: [
          {
            jp: '<ruby>心<rt>こころ</rt></ruby>を<ruby>澄<rt>す</rt></ruby>ませ、<ruby>神殿<rt>しんでん</rt></ruby>の<ruby>試練<rt>しれん</rt></ruby>に<ruby>臨<rt>のぞ</rt></ruby>みます。',
            zh: '我會澄澈心神，謹慎迎接神殿的試煉。',
            affectionDelta: 15,
            replyEmotion: 'happy',
            replyJp: 'うむ、その<ruby>澄<rt>す</rt></ruby>み<ruby>切<rt>き</rt></ruby>った<ruby>瞳<rt>ひとみ</rt></ruby>ならば、<ruby>古<rt>いにしえ</rt></ruby>の<ruby>祝詞<rt>のりと</rt></ruby>も<ruby>汝<rt>なんじ</rt></ruby>に<ruby>味方<rt>みかた</rt></ruby>するであろう。',
            replyZh: '嗯，憑汝那雙澄澈的眼眸，古老的祝詞亦會庇佑於你吧。',
            culturalNote: '💡 祭司台詞中常見古雅書面語：「汝（なんじ＝你）」、「紡ぎし（過去連體形＝所編織的）」、「〜であろう（莊重推量）」。'
          },
          {
            jp: 'お<ruby>導<rt>みちび</rt></ruby>きに<ruby>感謝<rt>かんしゃ</rt></ruby>いたします。さらなる<ruby>高<rt>たか</rt></ruby>みを<ruby>目指<rt>めざ</rt></ruby>します。',
            zh: '感謝您的指引，我會向更高的境界邁進。',
            affectionDelta: 12,
            replyEmotion: 'neutral',
            replyJp: 'よきかな。<ruby>研鑽<rt>けんさん</rt></ruby>を<ruby>積<rt>つ</rt></ruby>みし<ruby>者<rt>もの</rt></ruby>に、<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>加護<rt>かご</rt></ruby>があらんことを。',
            replyZh: '善哉。願言靈的加護常伴勤於磨練之人。',
            culturalNote: '💡 「〜あらんことを」為古典祈願句型（相當於「〜ありますように」），常見於神殿祝禱與奇幻文學。'
          }
        ]
      }
    ]
  };

  function getNpcDialoguesWithExpansion(npc) {
    const base = (npc && Array.isArray(npc.dialogues)) ? npc.dialogues : [];
    const extras = (npc && NPC_EXTRA_DIALOGUES[npc.id]) || [];
    if (extras.length === 0) return base;
    const existingIds = new Set(base.map((d) => d && d.id));
    return base.concat(extras.filter((d) => !existingIds.has(d.id)));
  }

  const IMMERSION_MODES = ['standard', 'advanced', 'immersion'];
  const UI_SCALE_STORAGE_KEY = 'kotodama_ui_scale';
  const UI_SCALE_MODES = ['compact', 'cozy', 'normal', 'large'];
  const UI_SCALE_LABELS = {
    compact: '精巧 80%',
    cozy: '適中 90%',
    normal: '標準 100%',
    large: '放大 110%'
  };

  const DAILY_TRAINING_DEFS = [
    {
      id: 'dt_correct_10',
      title: '今日答對 10 題',
      desc: '於戰鬥、古籍閱讀或錯題試煉中累計詠唱 10 次正解。',
      target: 10,
      metric: 'correctCount',
      reward: { exp: 80, gold: 100 }
    },
    {
      id: 'dt_review_3',
      title: '完成 3 題錯題複習',
      desc: '推進 3 道到期錯題的記憶刻印階級。',
      target: 3,
      metric: 'reviewCount',
      reward: { exp: 90, gold: 120 }
    }
  ];
  const DIFFICULTY_MODES = [
    {
      id: 'adaptive',
      label: '動態自適應（推薦）',
      shortLabel: '⚡ 自適應 (N4-N1)',
      tag: '推薦',
      targetJlpt: null,
      desc: '依連勝與答題速度即時升降（N4 ↔ N3 ↔ N2 ↔ N1），最低不低於 N4。'
    },
    {
      id: 'fixed_n4',
      label: 'N4 基礎鞏固（固定）',
      shortLabel: '🌿 固定 N4',
      tag: '100% N4',
      targetJlpt: 'N4',
      desc: '全地圖與戰鬥 100% 僅抽取 N4 題目，穩固基礎文法與動詞變化。'
    },
    {
      id: 'fixed_n3',
      label: 'N3 實戰特訓（固定）',
      shortLabel: '⚔️ 固定 N3',
      tag: '100% N3',
      targetJlpt: 'N3',
      desc: '全地圖與戰鬥 100% 僅抽取 N3 題目，高強度模擬檢定實戰。'
    },
    {
      id: 'fixed_n2',
      label: 'N2 進階試煉（固定）',
      shortLabel: '🔮 固定 N2',
      tag: '100% N2',
      targetJlpt: 'N2',
      desc: '全地圖與戰鬥 100% 僅抽取 N2 題目，專攻敬語、接續詞與新聞書面語。'
    },
    {
      id: 'fixed_n1',
      label: 'N1 魔境挑戰（固定）',
      shortLabel: '🔥 N1 魔境 ×2',
      tag: 'EXP/掉落 ×2',
      targetJlpt: 'N1',
      desc: '全地圖與戰鬥 100% 僅抽取 N1 題目，勝利享雙倍經驗值與掉落率加成！'
    }
  ];

  function getDifficultyModeConfig(modeId) {
    return DIFFICULTY_MODES.find((m) => m.id === modeId) || DIFFICULTY_MODES[0];
  }

  function normalizeJlptLevel(rawJlpt, fallbackRegionId) {
    const s = String(rawJlpt || '').toUpperCase();
    if (s === 'N4' || s === 'N3' || s === 'N2' || s === 'N1') return s;
    const m = s.match(/N([1-4])/);
    if (m) return `N${m[1]}`;
    const regionDefaults = { r1: 'N4', r2: 'N4', r3: 'N3', r4: 'N3', r5: 'N2', r6: 'N1' };
    return regionDefaults[fallbackRegionId] || 'N4';
  }

  function getAdaptiveRegionFloorIdx(regionId) {
    const floors = { r1: 0, r2: 0, r3: 0, r4: 1, r5: 1, r6: 2 };
    return floors[regionId] !== undefined ? floors[regionId] : 0;
  }

  const RARITY_LABELS = {
    common: '普通',
    uncommon: '精良',
    rare: '稀有',
    epic: '史詩',
    legendary: '傳說'
  };

  const STAT_LABELS = {
    INT: '智力 INT',
    WIS: '智慧 WIS',
    CHA: '魅力 CHA',
    hp: '最大 HP',
    maxHp: '最大 HP',
    mp: '最大 MP',
    maxMp: '最大 MP'
  };

  const SKILL_IDS = [
    'vocab_insight',
    'grammar_shield',
    'speed_reading',
    'clairaudience',
    'kotodama_negotiate'
  ];

  const SKILL_DEFAULTS = {
    vocab_insight: {
      id: 'vocab_insight',
      name: '單字洞察',
      jpName: '<ruby>単語洞察<rt>たんごどうさつ</rt></ruby>',
      branch: '語彙系',
      type: 'active',
      mpCost: 10,
      maxLevel: 3,
      spCost: 1,
      desc: '解析敵方言靈結構，在戰鬥中消除錯誤選項並顯示解題提示，高等級更可追加傷害與破防。',
      levels: [
        'Lv.1：消除 1 個錯誤選項（句子重組則提示首個語塊），並顯示文法提示。',
        'Lv.2：消除 2 個錯誤選項（句子重組提示前 2 個語塊），本回合答對傷害 +20%。',
        'Lv.3：消除 2 個錯誤選項，本回合答對傷害 +35% 且額外造成 +1 點破防。'
      ]
    },
    grammar_shield: {
      id: 'grammar_shield',
      name: '助詞護盾',
      jpName: '<ruby>助詞<rt>じょし</rt></ruby>の<ruby>盾<rt>たて</rt></ruby>',
      branch: '文法系',
      type: 'passive',
      mpCost: 0,
      maxLevel: 3,
      spCost: 1,
      desc: '被動生效：戰鬥答錯承受反擊時，構築文法結界大幅減免傷害；Lv3 額外回復 5 MP。',
      levels: [
        'Lv.1：答錯反擊傷害減免 50%',
        'Lv.2：答錯反擊傷害減免 58%',
        'Lv.3：答錯反擊傷害減免 65%，且觸發時回復 5 MP'
      ]
    },
    speed_reading: {
      id: 'speed_reading',
      name: '速讀解析',
      jpName: '<ruby>速読解析<rt>そくどくかいせき</rt></ruby>',
      branch: '閱讀系',
      type: 'active',
      mpCost: 12,
      maxLevel: 3,
      spCost: 1,
      desc: '閱讀副本中消耗 12 MP，標示出目前題目對應的關鍵句並自動捲動至該處。Lv2 起提升副本結算獎勵。',
      levels: [
        'Lv.1：高亮當前題目關鍵句（12 MP）',
        'Lv.2：高亮關鍵句 + 閱讀副本獎勵 +15%',
        'Lv.3：高亮關鍵句 + 閱讀副本獎勵 +30%'
      ]
    },
    clairaudience: {
      id: 'clairaudience',
      name: '順風耳',
      jpName: '<ruby>順風耳<rt>じゅんぷうじ</rt></ruby>',
      branch: '聽力系',
      type: 'active',
      mpCost: 10,
      maxLevel: 3,
      spCost: 1,
      desc: '戰鬥中消耗 10 MP，以 0.65x 清晰慢速重播題目語音，並以言霊治癒自身 HP。',
      levels: [
        'Lv.1：0.65x 慢速重播 + 回復 15% 最大 HP（10 MP）',
        'Lv.2：0.65x 慢速重播 + 回復 22% 最大 HP',
        'Lv.3：0.65x 慢速重播 + 回復 30% 最大 HP'
      ]
    },
    kotodama_negotiate: {
      id: 'kotodama_negotiate',
      name: '言靈交涉',
      jpName: '<ruby>言霊交渉<rt>ことだまこうしょう</rt></ruby>',
      branch: '會話系',
      type: 'passive',
      mpCost: 0,
      maxLevel: 3,
      spCost: 1,
      desc: '被動生效：以得體日語與城鎮及商會交涉，大幅提高任務報酬並疊加額外商店折扣。',
      levels: [
        'Lv.1：任務金幣/經驗 +20%，額外商店折扣 10%',
        'Lv.2：任務金幣/經驗 +30%，額外商店折扣 15%',
        'Lv.3：任務金幣/經驗 +40%，額外商店折扣 20%'
      ]
    }
  };

  // ============================================================================
  // 2. Utility Helpers & Safe External Data Accessors
  // ============================================================================
  function $(id) {
    return document.getElementById(id);
  }

  // Integer coercion for untrusted save data. Only real numbers / numeric strings count:
  // null, '', booleans, objects and arrays fall back (Number(null) === 0 would otherwise
  // silently turn a missing value into the minimum). NaN / ±Infinity fall back too.
  function toSafeInt(v, fallback, min = 0, max = 1e9) {
    if (typeof v !== 'number' && !(typeof v === 'string' && v.trim() !== '')) return fallback;
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }

  // QA S-2: objects such as {"toString":1} make Number()/String() throw. These helpers only
  // accept real numbers / strings, so a corrupted save can never crash boot or loading.
  function safeNum(v) {
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return Number(v);
    return NaN;
  }
  // QA S-3: imported lists are capped so a huge save cannot freeze the game or fill localStorage.
  const SAVE_LIST_MAX = 2000;
  const IMPORT_MAX_CHARS = 1000000;
  function toStrList(arr) {
    return Array.isArray(arr)
      ? arr.filter((x) => typeof x === 'string' || typeof x === 'number').slice(0, SAVE_LIST_MAX).map(String)
      : [];
  }

  // Upper bounds for imported counters / item stacks (keeps numbers sane, never Infinity)
  const COUNTER_MAX = 1e7;
  const INVENTORY_QTY_MAX = 9999;
  const SHRINE_RANKS = ['S', 'A', 'B', 'C'];

  // Keys that must never be copied from untrusted JSON into plain objects.
  const UNSAFE_OBJECT_KEYS = new Set(['__proto__', 'prototype', 'constructor']);
  function safeOwnKeys(obj) {
    return Object.keys(obj).filter((k) => !UNSAFE_OBJECT_KEYS.has(k));
  }

  function clamp(val, min, max) {
    const n = Number(val);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripRubyHtml(html) {
    if (!html) return '';
    return String(html)
      .replace(/<rt\b[^>]*>[\s\S]*?<\/rt>/gi, '')
      .replace(/<rp\b[^>]*>[\s\S]*?<\/rp>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function getTodayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  // QA L-2: the daily date used to be checked only in sanitizeSaveData (on load), so a game left
  // open past midnight kept yesterday's progress and claims. Every daily read/write now calls this.
  function ensureDailyQuestsFresh() {
    if (!state || !state.quests) return;
    const today = getTodayStr();
    if (state.quests.dailyDate === today) return;
    state.quests.dailyDate = today;
    state.quests.dailyProgress = { win_battles: 0, correct_answers: 0, npc_talk: 0, complete_shrine: 0, reach_fever: 0 };
    const dailyIds = new Set(getQuests().filter((q) => (q.type || q.category) === 'daily').map((q) => q.id));
    state.quests.claimedIds = (state.quests.claimedIds || []).filter((id) => !dailyIds.has(id));
  }

  function getDailyProgress() {
    ensureDailyQuestsFresh();
    return state.quests.dailyProgress;
  }


  function formatTimestamp(iso) {
    if (!iso) return '未知時間';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '未知時間';
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${day} ${hh}:${mm}`;
    } catch (_) {
      return '未知時間';
    }
  }

  function formatMMSS(sec) {
    const s = Math.max(0, Math.floor(sec));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function shuffleArray(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function toList(collection) {
    if (!collection) return [];
    if (Array.isArray(collection)) return collection;
    if (typeof collection === 'object') {
      return Object.keys(collection).map((k) => {
        const entry = collection[k];
        if (entry && typeof entry === 'object' && !entry.id) {
          return Object.assign({ id: k }, entry);
        }
        return entry;
      }).filter(Boolean);
    }
    return [];
  }

  function getData() {
    return global.GAME_DATA || {};
  }

  function getJobs() {
    return toList(getData().JOBS);
  }

  function getJobById(id) {
    const jobs = getJobs();
    return jobs.find((j) => j.id === id) || jobs[0] || {
      id: 'scholar',
      name: '言霊學者',
      title: '古文書解讀者',
      desc: '精於詞彙與語意解析的旅人。',
      baseHp: 100,
      baseMp: 60,
      baseINT: 14,
      baseWIS: 12,
      baseCHA: 9,
      growth: { hp: 14, mp: 8, INT: 3, WIS: 2, CHA: 1 },
      startWeaponId: null
    };
  }

  function getJobBaseStats(job) {
    const s = job && job.baseStats ? job.baseStats : (job && job.stats ? job.stats : {});
    return {
      hp: Number(job.baseHp ?? job.maxHp ?? job.hp ?? s.hp ?? s.maxHp ?? 100),
      mp: Number(job.baseMp ?? job.maxMp ?? job.mp ?? s.mp ?? s.maxMp ?? 50),
      INT: Number(job.baseINT ?? job.INT ?? job.int ?? s.INT ?? s.int ?? 10),
      WIS: Number(job.baseWIS ?? job.WIS ?? job.wis ?? s.WIS ?? s.wis ?? 10),
      CHA: Number(job.baseCHA ?? job.CHA ?? job.cha ?? s.CHA ?? s.cha ?? 10)
    };
  }

  function getJobGrowth(job) {
    const g = (job && job.growth) || {};
    return {
      hp: Number(g.hp ?? g.maxHp ?? 14),
      mp: Number(g.mp ?? g.maxMp ?? 7),
      INT: Number(g.INT ?? g.int ?? 2),
      WIS: Number(g.WIS ?? g.wis ?? 2),
      CHA: Number(g.CHA ?? g.cha ?? 2)
    };
  }

  function getJobStarterWeaponId(job) {
    if (!job) return null;
    const raw = job.startWeaponId || job.starterWeaponId || job.starterWeapon || job.weaponId || null;
    if (raw && getItemById(raw)) return raw;
    const weapons = getItems().filter((i) => i.type === 'weapon');
    return weapons[0] ? weapons[0].id : raw;
  }

  function getItems() {
    return toList(getData().ITEMS);
  }

  function getItemById(id) {
    if (typeof id !== 'string' || !id || UNSAFE_OBJECT_KEYS.has(id)) return null;
    const data = getData().ITEMS;
    if (data && !Array.isArray(data) && Object.prototype.hasOwnProperty.call(data, id) && data[id]) {
      return data[id].id ? data[id] : Object.assign({ id }, data[id]);
    }
    return getItems().find((i) => i.id === id) || null;
  }

  function getSkills() {
    const raw = toList(getData().SKILLS);
    if (raw.length > 0) {
      return raw.map((sk) => Object.assign({}, SKILL_DEFAULTS[sk.id] || {}, sk));
    }
    return SKILL_IDS.map((id) => SKILL_DEFAULTS[id]);
  }

  function getSkillById(id) {
    return getSkills().find((s) => s.id === id) || SKILL_DEFAULTS[id] || null;
  }

  function getRegions() {
    return toList(getData().REGIONS);
  }

  function getRegionById(id) {
    const regions = getRegions();
    return regions.find((r) => r.id === id) || regions[0] || null;
  }

  function getEnemies() {
    return toList(getData().ENEMIES);
  }

  function getEnemyById(id) {
    if (typeof id !== 'string' || !id || UNSAFE_OBJECT_KEYS.has(id)) return null;
    const data = getData().ENEMIES;
    if (data && !Array.isArray(data) && Object.prototype.hasOwnProperty.call(data, id) && data[id]) {
      return data[id].id ? data[id] : Object.assign({ id }, data[id]);
    }
    return getEnemies().find((e) => e.id === id) || null;
  }

  function getRegionBoss(regionId) {
    const region = getRegionById(regionId);
    if (region && region.bossId) {
      const b = getEnemyById(region.bossId);
      if (b) return b;
    }
    const enemies = getEnemies();
    return (
      enemies.find((e) => e.regionId === regionId && e.isBoss) ||
      enemies.find((e) => e.isBoss) ||
      enemies[0] ||
      null
    );
  }

  function getRegionNormalEnemies(regionId) {
    const region = getRegionById(regionId);
    let list = [];
    const rawIds = (region && Array.isArray(region.enemyIds) && region.enemyIds.length > 0)
      ? region.enemyIds
      : (region && Array.isArray(region.enemies) ? region.enemies : []);
    if (rawIds.length > 0) {
      list = rawIds
        .map((idOrObj) => (typeof idOrObj === 'string' ? getEnemyById(idOrObj) : idOrObj))
        .filter((e) => e && !e.isBoss);
    }
    if (list.length === 0) {
      list = getEnemies().filter((e) => e.regionId === regionId && !e.isBoss);
    }
    if (list.length === 0) {
      list = getEnemies().filter((e) => !e.isBoss);
    }
    return list;
  }

  // ---- Exploration pacing & mid-region elite (player feedback: "before the boss you just
  // keep pressing 前進 with nothing in the way") ----
  // Old pacing: +25% per step → 4 steps, ~1.65 fights on average, ~9% chance of zero fights.
  const EXPLORE_STEP_PCT = 15;          // 0 → 15 → 30 → 45 → [elite @50] → 65 → 80 → 95 → 100
  const EXPLORE_ELITE_AT = 50;          // an elite blocks the road here until defeated
  const EXPLORE_MAX_DRY_STEPS = 2;      // after 2 fight-free steps in a row, the next step is a fight
  const ELITE_HP_MULT = 1.8;
  const ELITE_REWARD_MULT = 2.5;
  let exploreDryStreak = 0;

  // Route choice (player feedback: pressing 前進 involved no decision). Before 100% the player
  // picks a route each step; 'normal' is used for the post-100% patrol and the elite gate.
  //  - safe : slower, fewer fights, more chests / events / campfires
  //  - risky: faster, mostly fights, and battle / chest rewards ×1.3
  const EXPLORE_ROUTES = {
    normal: { pct: EXPLORE_STEP_PCT, battleChance: 0.55, rewardMult: 1 },
    safe: { pct: 10, battleChance: 0.35, rewardMult: 1 },
    risky: { pct: 20, battleChance: 0.8, rewardMult: 1.3 }
  };

  function isRegionEliteDefeated(regionId) {
    return Array.isArray(state.progress.defeatedElites) && state.progress.defeatedElites.includes(regionId);
  }

  // Elite = the region's sturdiest normal enemy, buffed. Built at runtime (no data.js entry):
  // it keeps the base `id` so enemy art / codex lookups keep working; `isElite` marks it.
  function createRegionElite(regionId) {
    const normals = getRegionNormalEnemies(regionId);
    if (normals.length === 0) return null;
    const base = normals.reduce((a, b) => (Number(b.hp || b.maxHp || 0) > Number(a.hp || a.maxHp || 0) ? b : a));
    const hp = Math.round(Number(base.hp || base.maxHp || 100) * ELITE_HP_MULT);
    return Object.assign({}, base, {
      name: `精英・${base.name}`,
      isElite: true,
      isBoss: false,
      regionId,
      hp,
      maxHp: hp,
      breakMax: 3,
      exp: Math.round(Number(base.exp ?? base.expReward ?? 40) * ELITE_REWARD_MULT),
      gold: Math.round(Number(base.gold ?? base.goldReward ?? 35) * ELITE_REWARD_MULT)
    });
  }

  function getNPCs() {
    return toList(getData().NPCS);
  }

  function getNPCById(id) {
    return getNPCs().find((n) => n.id === id) || null;
  }

  function getQuestions() {
    const q = getData().QUESTIONS || global.QUESTIONS || [];
    return Array.isArray(q) ? q : toList(q);
  }

  function getQuestionById(id) {
    return getQuestions().find((q) => q.id === id) || null;
  }

  function getReadingDungeons() {
    return toList(getData().READING_DUNGEONS || getData().READINGS);
  }

  function getReadingById(id) {
    return getReadingDungeons().find((r) => r.id === id) || null;
  }

  function getShrineTiers() {
    return toList(getData().SHRINE_TIERS || getData().SHRINES);
  }

  function getQuests() {
    return toList(getData().QUESTS);
  }

  function getAchievements() {
    return toList(getData().ACHIEVEMENTS);
  }

  function normalizeQuestion(raw) {
    if (!raw) return null;
    const type = raw.type || 'reading';
    const region = raw.regionId ? getRegionById(raw.regionId) : null;
    const promptZh = raw.promptZh || raw.prompt || raw.questionZh || '';
    const promptJp = raw.promptJp || raw.jp || raw.questionJp || '';
    const fullRubyJp = raw.fullRubyJp || raw.fullRuby || promptJp;
    const tts = raw.tts || stripRubyHtml(promptJp) || stripRubyHtml(fullRubyJp);

    let options = Array.isArray(raw.options) ? raw.options.slice() : [];
    const answerIndex = Number(
      raw.answerIndex ?? raw.correctIndex ?? raw.answer ?? 0
    );

    // Reorder normalization: supports both data.js `chunks: [{id, text, plain, html}]` and legacy `chips`
    let chunks = [];
    let correctOrderPlain = '';
    if (type === 'reorder') {
      if (Array.isArray(raw.chunks) && raw.chunks.length > 0) {
        chunks = raw.chunks.map((c, idx) => ({
          id: c.id !== undefined ? Number(c.id) : idx,
          text: String(c.text ?? c.plain ?? ''),
          plain: String(c.plain ?? c.text ?? ''),
          html: String(c.html ?? c.text ?? '')
        }));
        correctOrderPlain = chunks.map((c) => c.plain).join('');
      } else {
        const rawChips = raw.chips || raw.tokens || raw.words || raw.parts || [];
        const chipList = Array.isArray(rawChips) ? rawChips.map(String) : [];
        const rawOrder = raw.correctOrder || raw.answerOrder || raw.order || [];
        let ordered = chipList.slice();
        if (Array.isArray(rawOrder) && rawOrder.length > 0) {
          ordered = typeof rawOrder[0] === 'number'
            ? rawOrder.map((idx) => chipList[idx]).filter((v) => v != null)
            : rawOrder.map(String);
        }
        chunks = ordered.map((t, idx) => ({ id: idx, text: t, plain: stripRubyHtml(t), html: t }));
        correctOrderPlain = chunks.map((c) => c.plain).join('');
      }
    }

    let correctDisplay = raw.correctDisplay || raw.answerText || '';
    if (!correctDisplay) {
      if (type === 'reorder') {
        correctDisplay = chunks.map((c) => c.plain).join(' ');
      } else if (options[answerIndex] != null) {
        const opt = options[answerIndex];
        correctDisplay = typeof opt === 'object' ? (opt.jp || opt.text || opt.label || '') : String(opt);
      }
    }

    return {
      id: raw.id || `q_${Math.random().toString(36).slice(2, 8)}`,
      regionId: raw.regionId || 'r1',
      jlpt: normalizeJlptLevel(raw.jlpt || (region && region.jlpt), raw.regionId),
      difficulty: Number(raw.difficulty || 1),
      type,
      typeLabel: raw.typeLabel || QUESTION_TYPE_LABELS[type] || type,
      promptZh,
      promptJp,
      fullRubyJp,
      tts,
      options: options.map((opt) =>
        typeof opt === 'object' ? (opt.jp || opt.text || opt.label || '') : String(opt)
      ),
      answerIndex,
      chunks,
      correctOrderPlain,
      correctDisplay,
      kanaReading: raw.kanaReading || raw.reading || raw.kana || stripRubyHtml(correctDisplay),
      wrongReason: raw.wrongReason || raw.commonMistake || '注意句子中的助詞搭配、詞彙意義與時態語氣。',
      explanation: raw.explanation || raw.detail || '請朗讀正確句型並記住核心用法。',
      hint: raw.hint || raw.tip || '提示：仔細觀察句中的時間詞、助詞與動詞變化！'
    };
  }

  function formatSpeechLine(line) {
    if (!line) return { jp: '', zh: '', tts: '' };
    if (typeof line === 'string') {
      return { jp: line, zh: '', tts: stripRubyHtml(line) };
    }
    return {
      jp: line.jp || line.text || '',
      zh: line.zh || line.translation || '',
      tts: line.tts || stripRubyHtml(line.jp || line.text || '')
    };
  }

  // Safe audio wrapper (named Sound so it never shadows the browser's Audio constructor)
  const Sound = {
    canSpeakJapanese() {
      try {
        if (global.AudioEngine && typeof global.AudioEngine.canSpeakJapanese === 'function') {
          return global.AudioEngine.canSpeakJapanese();
        }
      } catch (_) {}
      return false;
    },
    init() {
      try { if (global.AudioEngine && global.AudioEngine.init) global.AudioEngine.init(); } catch (_) {}
    },
    playBGM(track) {
      try { if (global.AudioEngine && global.AudioEngine.playBGM) global.AudioEngine.playBGM(track); } catch (_) {}
    },
    stopBGM() {
      try { if (global.AudioEngine && global.AudioEngine.stopBGM) global.AudioEngine.stopBGM(); } catch (_) {}
    },
    playSFX(name) {
      try { if (global.AudioEngine && global.AudioEngine.playSFX) global.AudioEngine.playSFX(name); } catch (_) {}
    },
    playTypeTick() {
      try { if (global.AudioEngine && global.AudioEngine.playTypeTick) global.AudioEngine.playTypeTick(); } catch (_) {}
    },
    speak(text, rate, onEnd) {
      try {
        if (global.AudioEngine && global.AudioEngine.speak) {
          return global.AudioEngine.speak(stripRubyHtml(text), rate || 1.0, onEnd);
        }
      } catch (_) {}
      return false;
    },
    stopSpeak() {
      try { if (global.AudioEngine && global.AudioEngine.stopSpeak) global.AudioEngine.stopSpeak(); } catch (_) {}
    },
    toggleBGM() {
      try { if (global.AudioEngine && global.AudioEngine.toggleBGM) return global.AudioEngine.toggleBGM(); } catch (_) {}
      return false;
    },
    toggleSFX() {
      try { if (global.AudioEngine && global.AudioEngine.toggleSFX) return global.AudioEngine.toggleSFX(); } catch (_) {}
      return false;
    },
    getState() {
      try {
        if (global.AudioEngine && global.AudioEngine.getState) return global.AudioEngine.getState();
      } catch (_) {}
      return { bgmMuted: false, sfxMuted: false };
    }
  };

  // Safe SVGArt wrapper
  // Wraps a character SVG's contents in <g class="px-g">. pixel-theme.css (P17) then applies a
  // pixelate filter (index.html #px-lg / #px-md) only inside containers of known size.
  // Filtering the inner group — not the <svg> — keeps the existing CSS pose / emotion
  // animations (which set transform/filter on the <svg>) working unchanged. Without the theme
  // or filter support, the original art renders as before.
  function pixelArt(svgStr) {
    const s = String(svgStr || '');
    const open = s.match(/<svg\b[^>]*>/);
    const closeIdx = s.lastIndexOf('</svg>');
    if (!open || closeIdx < 0) return s;
    const start = open.index + open[0].length;
    return `${s.slice(0, start)}<g class="px-g">${s.slice(start, closeIdx)}</g>${s.slice(closeIdx)}`;
  }

  // ---- Pixel UI icons (assets/icons/*.svg, generated by tools/gen-pixel-icons.js) ----
  // Replace OS-dependent emoji in the most visible UI. Decorative (alt="", aria-hidden);
  // the adjacent text carries the meaning. Unknown names render nothing.
  const PX_ICONS = new Set([
    'coin', 'heart', 'mana', 'star', 'sparkle', 'gear', 'save', 'music', 'speaker', 'eye', 'lock',
    'check', 'turtle', 'house', 'map', 'book', 'person', 'scroll', 'torii', 'chest', 'campfire',
    'skull', 'sword', 'staff', 'lute', 'cloak', 'armor', 'robe', 'amulet', 'ring', 'fan', 'herb',
    'elixir', 'charm'
  ]);
  function pxIcon(name, extraClass = '') {
    if (!PX_ICONS.has(name)) return '';
    return `<img class="px-icon${extraClass ? ` ${extraClass}` : ''}" src="assets/icons/${name}.svg" alt="" aria-hidden="true" draggable="false">`;
  }
  // data.js item `icon` values → pixel icon names
  const ITEM_ICON_MAP = {
    sword: 'sword', staff: 'staff', lute: 'lute',
    cloak: 'cloak', armor: 'armor', robe: 'robe',
    amulet: 'amulet', ring: 'ring', talisman: 'fan',
    potion: 'herb', elixir: 'elixir', scroll: 'scroll', charm: 'charm',
    weapon: 'sword', accessory: 'ring', consumable: 'herb'
  };

  // Hand-drawn pixel portraits (512x512 WebP, transparent bg) — one image per character.
  // They replace the generated SVG art for heroes and town NPCs; enemies keep SVG art.
  const PORTRAIT_IMAGES = {
    hero: {
      swordsman: 'assets/portraits/hero_swordsman.webp',
      scholar: 'assets/portraits/hero_scholar.webp',
      bard: 'assets/portraits/hero_bard.webp'
    },
    npc: {
      mayor: 'assets/portraits/npc_mayor.webp',
      merchant: 'assets/portraits/npc_merchant.webp',
      scholar: 'assets/portraits/npc_scholar.webp',
      priest: 'assets/portraits/npc_priest.webp',
      guide: 'assets/portraits/npc_guide.png'
    }
  };

  // Wraps a portrait image in an <svg> carrying the SAME root classes / data attributes as
  // SVGArt output (svg-hero hero-<job> hero-pose-<pose> / svg-npc npc-<id> emo-<mood>), so all
  // existing pose, emotion and sizing CSS keeps targeting it. No .px-g → no pixelate filter.
  // Hand-drawn monster art (512x512 transparent WebP, see assets/monsters/PROMPTS.md).
  // Enemies listed here use the image; any other enemy id keeps the SVGArt + pixel filter.
  PORTRAIT_IMAGES.enemy = {};
  [
    'en_r1_slime', 'en_r1_crow', 'boss_r1_golem', 'en_r2_wisp', 'en_r2_wolf', 'boss_r2_knight',
    'en_r3_tanuki', 'en_r3_puppet', 'boss_r3_kabuki', 'en_r4_harpy', 'en_r4_gargoyle', 'boss_r4_serpent',
    'en_r5_automaton', 'en_r5_phantom', 'boss_r5_chancellor', 'en_r6_archon', 'en_r6_voidling', 'boss_r6_overlord'
  ].forEach((id) => { PORTRAIT_IMAGES.enemy[id] = `assets/monsters/${id}.webp`; });
  function portraitImageSvg(kind, id, variant) {
    const src = PORTRAIT_IMAGES[kind] && Object.prototype.hasOwnProperty.call(PORTRAIT_IMAGES[kind], id)
      ? PORTRAIT_IMAGES[kind][id]
      : null;
    if (!src) return null;
    const v = String(variant || (kind === 'hero' ? 'idle' : 'neutral')).replace(/[^a-z0-9_-]/gi, '');
    const rootAttrs = kind === 'enemy'
      ? `class="svg-art svg-enemy enemy-${id} enemy-pose-${v} has-portrait-img" data-enemy="${id}" data-pose="${v}"`
      : kind === 'hero'
      ? `class="svg-art svg-hero hero-${id} hero-pose-${v} has-portrait-img" data-job="${id}" data-pose="${v}"`
      : `class="svg-art svg-npc npc-${id} emo-${v} has-portrait-img" data-npc="${id}" data-mood="${v}"`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ${rootAttrs}>`
      + `<image href="${src}" x="0" y="0" width="512" height="512" preserveAspectRatio="xMidYMid meet" style="image-rendering:pixelated"/>`
      + '</svg>';
  }

  const Art = {
    logo() {
      try {
        if (global.SVGArt && typeof global.SVGArt.logo === 'function') {
          return global.SVGArt.logo();
        }
      } catch (_) {}
      return '<svg viewBox="0 0 120 120" width="96" height="96"><circle cx="60" cy="60" r="52" fill="#182038" stroke="#d4af37" stroke-width="4"/><text x="60" y="72" text-anchor="middle" fill="#f3d57a" font-size="44" font-family="serif">言</text></svg>';
    },
    hero(jobId, poseOrOpts) {
      const pose = poseOrOpts && typeof poseOrOpts === 'object' ? poseOrOpts.pose : poseOrOpts;
      const img = portraitImageSvg('hero', jobId, pose);
      if (img) return img;
      try {
        if (global.SVGArt && typeof global.SVGArt.hero === 'function') {
          return pixelArt(global.SVGArt.hero(jobId, poseOrOpts));
        }
      } catch (_) {}
      return '<svg viewBox="0 0 120 120"><circle cx="60" cy="48" r="24" fill="#38bdf8"/><path d="M24 108 C24 78 96 78 96 108 Z" fill="#1e293b" stroke="#d4af37" stroke-width="3"/></svg>';
    },
    npc(npcId, emotion) {
      const img = portraitImageSvg('npc', npcId, emotion);
      if (img) return img;
      try {
        if (global.SVGArt && typeof global.SVGArt.npc === 'function') {
          return pixelArt(global.SVGArt.npc(npcId, emotion || 'neutral'));
        }
      } catch (_) {}
      return '<svg viewBox="0 0 120 120"><circle cx="60" cy="50" r="24" fill="#d4af37"/><rect x="30" y="80" width="60" height="32" rx="14" fill="#334155"/></svg>';
    },
    enemy(enemyId, isBoss, pose) {
      const img = portraitImageSvg('enemy', enemyId, pose || 'idle');
      if (img) return img;
      try {
        if (global.SVGArt && typeof global.SVGArt.enemy === 'function') {
          return pixelArt(global.SVGArt.enemy(enemyId, Boolean(isBoss), pose || 'idle'));
        }
      } catch (_) {}
      return '<svg viewBox="0 0 140 140"><polygon points="70,14 124,116 16,116" fill="#7f1d1d" stroke="#ef4444" stroke-width="4"/><circle cx="56" cy="70" r="7" fill="#fef08a"/><circle cx="84" cy="70" r="7" fill="#fef08a"/></svg>';
    },
    worldMap(regions, unlockedIds, defeatedBosses, currentRegionId) {
      try {
        if (global.SVGArt && typeof global.SVGArt.worldMap === 'function') {
          return global.SVGArt.worldMap(regions, unlockedIds, defeatedBosses, currentRegionId);
        }
      } catch (_) {}
      // Built-in interactive fallback SVG map if SVGArt.worldMap is unavailable
      const nodes = regions.map((r, idx) => {
        const x = (r.mapPos && r.mapPos.x) || (110 + idx * 120);
        const y = (r.mapPos && r.mapPos.y) || (idx % 2 === 0 ? 120 : 240);
        const unlocked = unlockedIds.includes(r.id);
        const cleared = defeatedBosses.includes(r.id);
        const current = currentRegionId === r.id;
        const cls = [
          'map-node',
          unlocked ? 'unlocked' : 'locked',
          cleared ? 'cleared' : '',
          current ? 'current' : ''
        ].filter(Boolean).join(' ');
        return `<g class="${cls}" data-region="${r.id}" style="cursor:pointer;">
          <circle cx="${x}" cy="${y}" r="26" fill="${cleared ? '#166534' : unlocked ? '#1e3a5f' : '#1f2937'}" stroke="${current ? '#f5d061' : unlocked ? '#38bdf8' : '#64748b'}" stroke-width="3"/>
          <text x="${x}" y="${y + 5}" text-anchor="middle" fill="#f8fafc" font-size="13" font-weight="bold">${escapeHtml(r.jlpt || 'N4')}</text>
          <text x="${x}" y="${y + 44}" text-anchor="middle" fill="#e2e8f0" font-size="12">${escapeHtml(r.name || r.id)}</text>
        </g>`;
      }).join('');
      return `<svg viewBox="0 0 820 360" width="100%" height="100%"><rect width="820" height="360" rx="14" fill="#0d1322"/>${nodes}</svg>`;
    },
    itemIcon(item) {
      if (!item) return '';
      // Pixel icon first (rarity shown as a coloured frame via CSS); SVGArt as fallback
      const px = ITEM_ICON_MAP[item.icon] || ITEM_ICON_MAP[item.type];
      if (px) {
        const rarity = String(item.rarity || 'common').replace(/[^a-z]/gi, '');
        return `<span class="px-item rarity-${rarity}">${pxIcon(px)}</span>`;
      }
      try {
        if (global.SVGArt && typeof global.SVGArt.itemIcon === 'function') {
          const out = global.SVGArt.itemIcon(item.icon || item.type || 'weapon', item.rarity || 'common');
          if (out) return out;
        }
      } catch (_) {}
      const icons = { weapon: '⚔️', armor: '🛡️', accessory: '💍', consumable: '🧪' };
      return `<svg viewBox="0 0 48 48" width="40" height="40"><rect x="4" y="4" width="40" height="40" rx="10" fill="#182238" stroke="#d4af37" stroke-width="2"/><text x="24" y="31" text-anchor="middle" font-size="22">${icons[item.type] || '✨'}</text></svg>`;
    },
    badge(icon, unlocked) {
      try {
        if (global.SVGArt && typeof global.SVGArt.badge === 'function') {
          return global.SVGArt.badge(icon, Boolean(unlocked));
        }
      } catch (_) {}
      return `<svg viewBox="0 0 56 56" width="48" height="48"><circle cx="28" cy="28" r="24" fill="${unlocked ? '#422006' : '#111827'}" stroke="${unlocked ? '#f5d061' : '#475569'}" stroke-width="3"/><text x="28" y="35" text-anchor="middle" font-size="22">${unlocked ? '🏆' : '🔒'}</text></svg>`;
    },
    exploreVisual(region, eventType) {
      try {
        if (global.SVGArt && typeof global.SVGArt.regionScene === 'function') {
          return global.SVGArt.regionScene(region.id, eventType);
        }
      } catch (_) {}
      const palette = {
        r1: ['#134e4a', '#2dd4bf'],
        r2: ['#1e3a8a', '#60a5fa'],
        r3: ['#581c87', '#c084fc'],
        r4: ['#7c2d12', '#fb923c'],
        r5: ['#7f1d1d', '#f87171'],
        r6: ['#312e81', '#facc15']
      };
      const cols = palette[(region && region.id) || 'r1'] || palette.r1;
      const glyph = eventType === 'boss' ? '👹' : eventType === 'chest' ? '🎁' : eventType === 'camp' ? '🔥' : eventType === 'event' ? '🗿' : '🧭';
      return `<svg viewBox="0 0 220 120" width="100%" height="120" aria-hidden="true">
        <defs><linearGradient id="expGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${cols[0]}"/><stop offset="100%" stop-color="#0b101d"/></linearGradient></defs>
        <rect width="220" height="120" rx="12" fill="url(#expGrad)" stroke="${cols[1]}" stroke-opacity="0.45" stroke-width="2"/>
        <circle cx="110" cy="60" r="36" fill="${cols[1]}" fill-opacity="0.16" stroke="${cols[1]}" stroke-width="2"/>
        <text x="110" y="72" text-anchor="middle" font-size="34">${glyph}</text>
      </svg>`;
    }
  };
