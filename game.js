/**
 * 《言霊の旅（ことだまのたび）》 — Core JRPG & Japanese Learning Engine
 * Zero-dependency Vanilla ES6+ on `window.Game` (safe for file:// execution).
 * Integrates strictly with index.html DOM IDs, style.css, window.GAME_DATA,
 * window.AudioEngine, and window.SVGArt.
 */
(function (global) {
  'use strict';

  // ============================================================================
  // 1. Constants & Storage Keys
  // ============================================================================
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

  function formatTimestamp(iso) {
    if (!iso) return '未知時間';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return String(iso);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${day} ${hh}:${mm}`;
    } catch (_) {
      return String(iso);
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

  // Safe Audio wrapper
  const Audio = {
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
      priest: 'assets/portraits/npc_priest.webp'
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

  // ============================================================================
  // 3. State Schema, Default Creation & Safe Sanitization
  // ============================================================================
  function createDefaultState() {
    const firstJob = getJobs()[0] || getJobById('scholar');
    const base = getJobBaseStats(firstJob);
    const starterWeapon = getJobStarterWeaponId(firstJob);
    return {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      player: {
        name: '旅人',
        jobId: firstJob.id || 'scholar',
        level: 1,
        exp: 0,
        nextExp: 100,
        hp: base.hp,
        maxHp: base.hp,
        mp: base.mp,
        maxMp: base.mp,
        baseINT: base.INT,
        baseWIS: base.WIS,
        baseCHA: base.CHA,
        gold: 120,
        sp: 1,
        activeTitle: '初醒的旅人',
        unlockedTitles: ['初醒的旅人'],
        equipment: {
          weapon: starterWeapon,
          armor: null,
          accessory: null
        },
        enhancements: {}
      },
      inventory: [
        { id: 'con_herb', qty: 3 },
        { id: 'con_water', qty: 2 }
      ],
      skills: {
        vocab_insight: 0,
        grammar_shield: 0,
        speed_reading: 0,
        clairaudience: 0,
        kotodama_negotiate: 0
      },
      progress: {
        currentRegionId: 'r1',
        regionExplore: { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0 },
        defeatedBosses: [],
        defeatedElites: [],
        unlockedAllOverride: false,
        clearedReadings: [],
        shrineBest: {},
        solvedByJlpt: { N4: [], N3: [], N2: [], N1: [] },
        bagByJlpt: { N4: [], N3: [], N2: [], N1: [] },
        cycleCountsByJlpt: { N4: 0, N3: 0, N2: 0, N1: 0 }
      },
      npc: {
        mayor: { affection: 0, talkedIds: [], claimedMilestones: [] },
        merchant: { affection: 0, talkedIds: [], claimedMilestones: [] },
        scholar: { affection: 0, talkedIds: [], claimedMilestones: [] },
        priest: { affection: 0, talkedIds: [], claimedMilestones: [] }
      },
      quests: {
        claimedIds: [],
        dailyProgress: {
          win_battles: 0,
          correct_answers: 0,
          npc_talk: 0,
          complete_shrine: 0,
          reach_fever: 0
        },
        dailyDate: getTodayStr()
      },
      stats: {
        battlesWon: 0,
        totalCorrect: 0,
        totalWrong: 0,
        maxCombo: 0,
        feverCount: 0,
        breaksTriggered: 0,
        goldEarned: 0,
        enhanceCount: 0,
        npcTalks: 0,
        shrineCompleted: 0,
        shrineRankS: 0,
        encounteredEnemies: [],
        defeatedEnemies: []
      },
      mistakes: [],
      wrongNotes: {},
      dailyTraining: {
        dateStr: new Date().toDateString(),
        correctCount: 0,
        reviewCount: 0,
        claimedIds: []
      },
      achievements: [],
      settings: {
        furigana: true,
        immersionMode: 'standard',
        difficultyMode: 'adaptive',
        adaptiveStartJlpt: 'N4'
      }
    };
  }

  function getValidTitlesSet() {
    const valid = new Set(['初醒的旅人', ...Object.keys(TITLE_FLAVOR_TEXTS)]);
    const add = (t) => {
      if (typeof t === 'string' && t.trim()) valid.add(t.trim());
    };
    getJobs().forEach((j) => add(j && j.title));
    getQuests().forEach((q) => {
      if (!q) return;
      add(q.reward && q.reward.title);
      add(q.rewards && q.rewards.title);
    });
    getAchievements().forEach((a) => {
      if (!a) return;
      add(a.reward && a.reward.title);
      add(a.rewards && a.rewards.title);
    });
    getNPCs().forEach((n) => {
      if (!n || !Array.isArray(n.milestones)) return;
      n.milestones.forEach((m) => {
        if (!m) return;
        add(m.title);
        add(m.reward && m.reward.title);
        add(m.rewards && m.rewards.title);
      });
    });
    getShrineTiers().forEach((t) => {
      if (!t) return;
      add(t.rewardTitle);
      add(t.rewards && t.rewards.title);
      add(`${t.jlpt || '言霊'}試煉突破者`);
    });
    return valid;
  }

  function sanitizeSaveData(raw) {
    const def = createDefaultState();
    if (!raw || typeof raw !== 'object') return def;

    const out = def;
    out.version = SAVE_VERSION;
    out.savedAt = typeof raw.savedAt === 'string' ? raw.savedAt : def.savedAt;

    // Player
    const rp = raw.player && typeof raw.player === 'object' && !Array.isArray(raw.player) ? raw.player : {};
    out.player.name = typeof rp.name === 'string' && rp.name.trim() ? rp.name.trim().slice(0, 12) : def.player.name;
    // getJobById() falls back to jobs[0] (always truthy), so validate against the real id list
    const validJobIds = new Set(getJobs().map((j) => j.id));
    out.player.jobId = typeof rp.jobId === 'string' && validJobIds.has(rp.jobId) ? rp.jobId : def.player.jobId;
    // toSafeInt rejects NaN/Infinity from malformed imports (e.g. "gold":"abc", "level":1e400)
    out.player.level = toSafeInt(rp.level, 1, 1, 999);
    out.player.exp = toSafeInt(rp.exp, 0, 0);
    out.player.nextExp = toSafeInt(rp.nextExp, Math.max(50, calcNextExp(out.player.level)), 50);
    out.player.maxHp = toSafeInt(rp.maxHp, def.player.maxHp, 30, 99999);
    out.player.hp = toSafeInt(rp.hp, out.player.maxHp, 1, out.player.maxHp * 3);
    out.player.maxMp = toSafeInt(rp.maxMp, def.player.maxMp, 20, 99999);
    out.player.mp = toSafeInt(rp.mp, out.player.maxMp, 0, out.player.maxMp * 3);
    out.player.baseINT = toSafeInt(rp.baseINT, def.player.baseINT, 1, 9999);
    out.player.baseWIS = toSafeInt(rp.baseWIS, def.player.baseWIS, 1, 9999);
    out.player.baseCHA = toSafeInt(rp.baseCHA, def.player.baseCHA, 1, 9999);
    out.player.gold = toSafeInt(rp.gold, def.player.gold, 0);
    out.player.sp = toSafeInt(rp.sp, def.player.sp, 0);
    const validTitles = getValidTitlesSet();
    const cleanTitles = Array.isArray(rp.unlockedTitles)
      ? Array.from(
          new Set(
            rp.unlockedTitles
              .filter((t) => typeof t === 'string')
              .map((t) => t.trim().slice(0, 24))
              .filter((t) => t && validTitles.has(t))
          )
        )
      : [];
    out.player.unlockedTitles = cleanTitles.length > 0 ? cleanTitles : ['初醒的旅人'];
    out.player.activeTitle = typeof rp.activeTitle === 'string' && out.player.unlockedTitles.includes(rp.activeTitle)
      ? rp.activeTitle
      : out.player.unlockedTitles[0];

    const req = rp.equipment && typeof rp.equipment === 'object' && !Array.isArray(rp.equipment) ? rp.equipment : {};
    const validEquipId = (slot, id) => {
      if (typeof id !== 'string' || !id || UNSAFE_OBJECT_KEYS.has(id)) return null;
      const item = getItemById(id);
      return item && (!item.type || item.type === slot) ? id : null;
    };
    out.player.equipment = {
      weapon: validEquipId('weapon', req.weapon),
      armor: validEquipId('armor', req.armor),
      accessory: validEquipId('accessory', req.accessory)
    };

    const renh = rp.enhancements && typeof rp.enhancements === 'object' ? rp.enhancements : {};
    out.player.enhancements = {};
    safeOwnKeys(renh).forEach((k) => {
      out.player.enhancements[k] = clamp(Math.floor(Number(renh[k]) || 0), 0, 5);
    });

    // Inventory
    if (Array.isArray(raw.inventory)) {
      const merged = new Map();
      raw.inventory.forEach((entry) => {
        if (entry && typeof entry.id === 'string' && entry.id && !UNSAFE_OBJECT_KEYS.has(entry.id)) {
          const qty = toSafeInt(entry.qty, 0, 0, INVENTORY_QTY_MAX);
          if (qty > 0) merged.set(entry.id, Math.min(INVENTORY_QTY_MAX, (merged.get(entry.id) || 0) + qty));
        }
      });
      out.inventory = Array.from(merged.entries()).map(([id, qty]) => ({ id, qty }));
    }

    // Skills
    const rsk = raw.skills && typeof raw.skills === 'object' ? raw.skills : {};
    SKILL_IDS.forEach((sid) => {
      out.skills[sid] = clamp(Math.floor(Number(rsk[sid]) || 0), 0, 3);
    });

    // Progress
    const validRegionSet = new Set(['r1', 'r2', 'r3', 'r4', 'r5', 'r6']);
    const rpr = raw.progress && typeof raw.progress === 'object' ? raw.progress : {};
    out.progress.currentRegionId = typeof rpr.currentRegionId === 'string' && validRegionSet.has(rpr.currentRegionId)
      ? rpr.currentRegionId
      : 'r1';
    const rex = rpr.regionExplore && typeof rpr.regionExplore === 'object' ? rpr.regionExplore : {};
    ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'].forEach((rid) => {
      out.progress.regionExplore[rid] = clamp(Math.floor(Number(rex[rid]) || 0), 0, 100);
    });
    out.progress.defeatedBosses = Array.isArray(rpr.defeatedBosses)
      ? Array.from(new Set(rpr.defeatedBosses.map(String).filter((id) => validRegionSet.has(id))))
      : [];
    // Regions whose mid-exploration elite has been beaten (missing in pre-v1.5 saves → [])
    out.progress.defeatedElites = Array.isArray(rpr.defeatedElites)
      ? Array.from(new Set(rpr.defeatedElites.map(String).filter((id) => validRegionSet.has(id))))
      : [];
    out.progress.unlockedAllOverride = Boolean(rpr.unlockedAllOverride);
    out.progress.clearedReadings = Array.isArray(rpr.clearedReadings) ? Array.from(new Set(rpr.clearedReadings.map(String))) : [];
    // shrineBest is rendered into innerHTML: rebuild each entry from whitelisted fields only
    // (rank ∈ S/A/B/C, integer score/total/timeLeft) — never copy untrusted objects through.
    out.progress.shrineBest = {};
    if (rpr.shrineBest && typeof rpr.shrineBest === 'object' && !Array.isArray(rpr.shrineBest)) {
      safeOwnKeys(rpr.shrineBest).forEach((tierId) => {
        const b = rpr.shrineBest[tierId];
        if (!b || typeof b !== 'object' || !SHRINE_RANKS.includes(b.rank)) return;
        const total = toSafeInt(b.total, 0, 0, 1000);
        out.progress.shrineBest[tierId] = {
          rank: b.rank,
          score: toSafeInt(b.score, 0, 0, total),
          total,
          timeLeft: toSafeInt(b.timeLeft, 0, 0, 86400)
        };
      });
    }

    const rsj = rpr.solvedByJlpt && typeof rpr.solvedByJlpt === 'object' ? rpr.solvedByJlpt : {};
    const rbg = rpr.bagByJlpt && typeof rpr.bagByJlpt === 'object' ? rpr.bagByJlpt : {};
    const rcc = rpr.cycleCountsByJlpt && typeof rpr.cycleCountsByJlpt === 'object' ? rpr.cycleCountsByJlpt : {};
    JLPT_LEVELS.forEach((lvl) => {
      out.progress.solvedByJlpt[lvl] = Array.isArray(rsj[lvl]) ? Array.from(new Set(rsj[lvl].map(String))) : [];
      out.progress.bagByJlpt[lvl] = Array.isArray(rbg[lvl]) ? Array.from(new Set(rbg[lvl].map(String))) : [];
      out.progress.cycleCountsByJlpt[lvl] = toSafeInt(rcc[lvl], 0, 0, 100000);
    });

    // NPCs
    const rnpc = raw.npc && typeof raw.npc === 'object' ? raw.npc : {};
    ['mayor', 'merchant', 'scholar', 'priest'].forEach((nid) => {
      const n = rnpc[nid] && typeof rnpc[nid] === 'object' ? rnpc[nid] : {};
      out.npc[nid] = {
        affection: clamp(Math.floor(Number(n.affection) || 0), 0, 100),
        talkedIds: Array.isArray(n.talkedIds) ? Array.from(new Set(n.talkedIds.map(String))) : [],
        claimedMilestones: Array.isArray(n.claimedMilestones)
          ? Array.from(new Set(n.claimedMilestones.map((m) => toSafeInt(m, 0, 0, 100)).filter((m) => m > 0)))
          : []
      };
    });

    // Quests (with daily date rollover)
    const rq = raw.quests && typeof raw.quests === 'object' ? raw.quests : {};
    const today = getTodayStr();
    const savedDate = typeof rq.dailyDate === 'string' ? rq.dailyDate : today;
    out.quests.claimedIds = Array.isArray(rq.claimedIds) ? Array.from(new Set(rq.claimedIds.map(String))) : [];
    if (savedDate === today) {
      const dp = rq.dailyProgress && typeof rq.dailyProgress === 'object' ? rq.dailyProgress : {};
      out.quests.dailyDate = today;
      out.quests.dailyProgress = {
        win_battles: toSafeInt(dp.win_battles, 0, 0, COUNTER_MAX),
        correct_answers: toSafeInt(dp.correct_answers, 0, 0, COUNTER_MAX),
        npc_talk: toSafeInt(dp.npc_talk, 0, 0, COUNTER_MAX),
        complete_shrine: toSafeInt(dp.complete_shrine, 0, 0, COUNTER_MAX),
        reach_fever: toSafeInt(dp.reach_fever, 0, 0, COUNTER_MAX)
      };
    } else {
      out.quests.dailyDate = today;
      out.quests.dailyProgress = { win_battles: 0, correct_answers: 0, npc_talk: 0, complete_shrine: 0, reach_fever: 0 };
      const dailyIds = new Set(getQuests().filter((q) => (q.type || q.category) === 'daily').map((q) => q.id));
      out.quests.claimedIds = out.quests.claimedIds.filter((id) => !dailyIds.has(id));
    }

    // Stats
    const rst = raw.stats && typeof raw.stats === 'object' ? raw.stats : {};
    [
      'battlesWon', 'totalCorrect', 'totalWrong', 'maxCombo',
      'feverCount', 'breaksTriggered', 'goldEarned', 'enhanceCount',
      'npcTalks', 'shrineCompleted', 'shrineRankS'
    ].forEach((k) => {
      out.stats[k] = toSafeInt(rst[k], 0, 0, COUNTER_MAX);
    });
    out.stats.encounteredEnemies = Array.isArray(rst.encounteredEnemies) ? Array.from(new Set(rst.encounteredEnemies.map(String))) : [];
    out.stats.defeatedEnemies = Array.isArray(rst.defeatedEnemies) ? Array.from(new Set(rst.defeatedEnemies.map(String))) : [];

    // Mistakes (legacy array)
    if (Array.isArray(raw.mistakes)) {
      out.mistakes = raw.mistakes
        .filter((m) => m && typeof m.questionId === 'string')
        .map((m) => ({
          questionId: m.questionId,
          count: toSafeInt(m.count, 1, 1, COUNTER_MAX),
          lastWrongAt: typeof m.lastWrongAt === 'string' ? m.lastWrongAt : new Date().toISOString()
        }));
    }

    // Wrong Notes (言霊錯題筆記 + SRS Forgetting Curve - backwards compatible with old saves)
    out.wrongNotes = {};
    if (raw.wrongNotes && typeof raw.wrongNotes === 'object' && !Array.isArray(raw.wrongNotes)) {
      const nowMs = Date.now();
      safeOwnKeys(raw.wrongNotes).forEach((qid) => {
        const entry = raw.wrongNotes[qid];
        if (!entry || typeof entry !== 'object') return;
        const id = typeof entry.id === 'string' && entry.id ? entry.id : String(qid);
        if (UNSAFE_OBJECT_KEYS.has(id)) return;
        const rawMastered = Boolean(entry.mastered);
        const rawSrs = entry.srsLevel !== undefined && entry.srsLevel !== null
          ? clamp(Math.floor(Number(entry.srsLevel) || 0), 0, 4)
          : (rawMastered ? 4 : 0);
        const isMastered = rawMastered || rawSrs >= 4;
        const srsLevel = isMastered ? 4 : rawSrs;
        const nextReviewAt = isMastered
          ? null
          : (entry.nextReviewAt !== undefined && entry.nextReviewAt !== null && Number.isFinite(Number(entry.nextReviewAt))
              ? Number(entry.nextReviewAt)
              : nowMs);
        out.wrongNotes[id] = {
          id,
          wrongCount: toSafeInt(entry.wrongCount, 1, 1, COUNTER_MAX),
          lastWrongAt: typeof entry.lastWrongAt === 'string' ? entry.lastWrongAt : new Date().toISOString(),
          playerLastChoice: typeof entry.playerLastChoice === 'number' && Number.isFinite(entry.playerLastChoice)
            ? Math.floor(entry.playerLastChoice)
            : (typeof entry.playerLastChoice === 'string' ? entry.playerLastChoice.slice(0, 200) : null),
          correctCount: toSafeInt(entry.correctCount, 0, 0),
          mastered: isMastered,
          srsLevel,
          nextReviewAt
        };
      });
    }

    // Daily Training Quests (auto-resets whenever dateStr !== new Date().toDateString())
    const todayDateStr = new Date().toDateString();
    const rdt = raw.dailyTraining && typeof raw.dailyTraining === 'object' ? raw.dailyTraining : null;
    if (rdt && rdt.dateStr === todayDateStr) {
      out.dailyTraining = {
        dateStr: todayDateStr,
        correctCount: toSafeInt(rdt.correctCount, 0, 0, COUNTER_MAX),
        reviewCount: toSafeInt(rdt.reviewCount, 0, 0, COUNTER_MAX),
        claimedIds: Array.isArray(rdt.claimedIds) ? Array.from(new Set(rdt.claimedIds.map(String))) : []
      };
    } else {
      out.dailyTraining = {
        dateStr: todayDateStr,
        correctCount: 0,
        reviewCount: 0,
        claimedIds: []
      };
    }

    // Achievements
    out.achievements = Array.isArray(raw.achievements) ? Array.from(new Set(raw.achievements.map(String))) : [];

    // Settings (3-tier Immersion Mode backwards compatible with legacy furigana boolean)
    const rset = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    if (typeof rset.immersionMode === 'string' && IMMERSION_MODES.includes(rset.immersionMode)) {
      out.settings.immersionMode = rset.immersionMode;
    } else if (rset.furigana !== undefined) {
      out.settings.immersionMode = Boolean(rset.furigana) ? 'standard' : 'advanced';
    } else {
      out.settings.immersionMode = 'standard';
    }
    out.settings.furigana = out.settings.immersionMode === 'standard';
    const validModes = new Set(DIFFICULTY_MODES.map((m) => m.id));
    out.settings.difficultyMode = typeof rset.difficultyMode === 'string' && validModes.has(rset.difficultyMode)
      ? rset.difficultyMode
      : 'adaptive';
    out.settings.adaptiveStartJlpt = rset.adaptiveStartJlpt === 'N3' ? 'N3' : 'N4';

    // Clamp HP/MP to actual derived max
    const derived = computeTotalStatsFor(out);
    out.player.hp = clamp(out.player.hp, 1, derived.maxHp);
    out.player.mp = clamp(out.player.mp, 0, derived.maxMp);

    return out;
  }

  function calcNextExp(level) {
    return Math.round(100 * Math.pow(1.28, Math.max(0, level - 1)));
  }

  // ============================================================================
  // 4. Runtime Engine State
  // ============================================================================
  let state = createDefaultState();
  let hasActiveSession = false;
  let currentView = 'title';

  // UI sub-states
  let hudCollapsedMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  let createSelectedJobId = null;
  let createPreviewPose = 'idle';
  let createSelectedDifficultyMode = 'adaptive';
  let createAdaptiveStartJlpt = 'N4';
  let townState = {
    selectedNpcId: null,
    dialogueIndex: 0,
    currentDialogue: null,
    awaitingNext: false,
    typingTimerId: null,
    typingFullJp: '',
    typingFullZh: '',
    typingActive: false,
    currentTts: ''
  };
  let mapSelectedRegionId = 'r1';
  let exploreLogs = [];
  let explorePendingEvent = null;
  let crossRegionNotifiedKeys = new Set();
  let uiNotesFilter = {
    jlpt: 'all',
    type: 'all',
    status: 'all'
  };

  let battle = {
    active: false,
    enemy: null,
    regionId: 'r1',
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyBreak: 2,
    enemyBreakMax: 2,
    enemyStunned: false,
    stunJustTriggered: false,
    combo: 0,
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
    feverActive: false,
    difficultyOffset: 0,
    currentQ: null,
    qStartTime: 0,
    speedTimerId: null,
    insightActive: false,
    usedQuestionIds: [],
    reorderPool: [],
    reorderSelected: [],
    locked: false,
    returnView: 'explore'
  };

  let reading = {
    active: false,
    dungeon: null,
    qIdx: 0,
    correctCount: 0,
    answered: false,
    answers: []
  };

  let shrine = {
    active: false,
    tier: null,
    questions: [],
    qIdx: 0,
    timeLeft: 180,
    timeLimit: 180,
    timerId: null,
    results: [],
    reorderPool: [],
    reorderSelected: []
  };

  let uiTabs = {
    inv: 'all',
    selectedInvItemId: null,
    quests: 'main',
    codex: 'bestiary',
    shop: 'buy'
  };

  let explainCallback = null;
  let saveModalLoadOnly = false;
  let genericModalCallback = null;

  // ============================================================================
  // 5. Storage Operations
  // ============================================================================
  function readRawSlot(key) {
    try {
      const txt = global.localStorage.getItem(key);
      if (!txt) return null;
      return JSON.parse(txt);
    } catch (_) {
      return null;
    }
  }

  function writeSlot(key, dataObj) {
    try {
      const clone = JSON.parse(JSON.stringify(dataObj));
      clone.version = SAVE_VERSION;
      clone.savedAt = new Date().toISOString();
      global.localStorage.setItem(key, JSON.stringify(clone));
      return true;
    } catch (err) {
      showToast('存檔寫入失敗（瀏覽器儲存空間受限）', 'error');
      return false;
    }
  }

  function deleteSlot(key) {
    try {
      global.localStorage.removeItem(key);
      return true;
    } catch (_) {
      return false;
    }
  }

  function findLatestSaveKey() {
    let bestKey = null;
    let bestTime = -1;
    SAVE_SLOT_LIST.forEach((slot) => {
      const raw = readRawSlot(slot.key);
      if (raw && raw.player) {
        const ts = raw.savedAt ? Date.parse(raw.savedAt) : 0;
        if (ts > bestTime) {
          bestTime = ts;
          bestKey = slot.key;
        }
      }
    });
    return bestKey;
  }

  function autoSave() {
    if (!hasActiveSession) return false;
    state.savedAt = new Date().toISOString();
    return writeSlot(SAVE_KEYS.auto, state);
  }

  function saveToSlot(slotKey) {
    if (!hasActiveSession) {
      showToast('尚未啟程，無可銘刻的旅途記憶。', 'warning');
      return false;
    }
    const ok = writeSlot(slotKey, state);
    if (ok) {
      Audio.playSFX('confirm');
      showToast('💾 旅途記憶已銘刻於書卷！', 'success');
      renderSaveModal();
    }
    return ok;
  }

  function loadFromSlot(slotKey) {
    const raw = readRawSlot(slotKey);
    if (!raw) {
      showToast('此書卷尚無銘刻紀錄。', 'warning');
      return false;
    }
    state = sanitizeSaveData(raw);
    hasActiveSession = true;
    battle.active = false;
    shrine.active = false;
    reading.active = false;
    stopBattleTimers();
    stopShrineTimer();
    applyFuriganaSetting();
    closeModal('modal-save');
    Audio.playSFX('confirm');
    showToast(`✨ 記憶書卷展開——歡迎歸來，${state.player.name}（Lv.${state.player.level}）！`, 'success');
    switchView('town');
    return true;
  }

  // ============================================================================
  // 6. Derived Stats, Enhancement & Skill Calculators
  // ============================================================================
  function getItemEnhancementLevel(itemId) {
    if (!itemId || !state || !state.player || !state.player.enhancements) return 0;
    return clamp(state.player.enhancements[itemId] || 0, 0, 5);
  }

  function getEnhancedItemStats(item, enhLevelOverride) {
    if (!item) return { INT: 0, WIS: 0, CHA: 0, hp: 0, mp: 0 };
    const lv = enhLevelOverride !== undefined
      ? clamp(enhLevelOverride, 0, 5)
      : getItemEnhancementLevel(item.id);
    const s = item.stats || {};
    const calc = (val) => {
      const base = Number(val || 0);
      if (base <= 0) return 0;
      if (lv <= 0) return base;
      const perLv = Math.max(1, Math.round(base * 0.15));
      return base + perLv * lv;
    };
    return {
      INT: calc(s.INT ?? s.int),
      WIS: calc(s.WIS ?? s.wis),
      CHA: calc(s.CHA ?? s.cha),
      hp: calc(s.hp ?? s.maxHp),
      mp: calc(s.mp ?? s.maxMp)
    };
  }

  function computeTotalStatsFor(st) {
    const p = st.player;
    const eq = p.equipment || {};
    let gearINT = 0, gearWIS = 0, gearCHA = 0, gearHp = 0, gearMp = 0;

    ['weapon', 'armor', 'accessory'].forEach((slot) => {
      const itemId = eq[slot];
      if (!itemId) return;
      const item = getItemById(itemId);
      if (!item) return;
      const lv = clamp((p.enhancements && p.enhancements[itemId]) || 0, 0, 5);
      const es = getEnhancedItemStats(item, lv);
      gearINT += es.INT;
      gearWIS += es.WIS;
      gearCHA += es.CHA;
      gearHp += es.hp;
      gearMp += es.mp;
    });

    const INT = p.baseINT + gearINT;
    const WIS = p.baseWIS + gearWIS;
    const CHA = p.baseCHA + gearCHA;
    const maxHp = p.maxHp + gearHp;
    const maxMp = p.maxMp + gearMp;

    const negLv = clamp((st.skills && st.skills.kotodama_negotiate) || 0, 0, 3);
    const chaShopDiscount = Math.min(28, Math.floor(CHA * 0.8));
    const skillShopDiscount = [0, 10, 15, 20][negLv];
    const totalShopDiscount = Math.min(50, chaShopDiscount + skillShopDiscount);

    return {
      INT,
      WIS,
      CHA,
      maxHp,
      maxMp,
      gearINT,
      gearWIS,
      gearCHA,
      gearHp,
      gearMp,
      baseAtk: Math.round(18 + INT * 2.1),
      critRate: Math.min(75, Number((10 + INT * 0.8).toFixed(1))),
      wisDmgReduce: Math.min(0.40, WIS * 0.011),
      readingBonus: WIS * 0.02,
      chaAffectionBonus: Math.floor(CHA / 10),
      chaShopDiscount,
      skillShopDiscount,
      totalShopDiscount,
      questRewardBonus: [0, 0.20, 0.30, 0.40][negLv]
    };
  }

  function getTotalStats() {
    return computeTotalStatsFor(state);
  }

  function getShopBuyPrice(item) {
    const base = Math.max(1, Number(item.price ?? item.cost ?? 50));
    const disc = getTotalStats().totalShopDiscount;
    return Math.max(1, Math.round(base * (1 - disc / 100)));
  }

  function getEnhanceCost(item, currentLv) {
    const base = Math.max(40, Number(item.price ?? item.cost ?? 100));
    const disc = getTotalStats().totalShopDiscount;
    const raw = Math.round(base * (0.45 + currentLv * 0.35));
    return Math.max(15, Math.round(raw * (1 - disc / 100)));
  }

  function getSellPrice(item) {
    const base = Math.max(10, Number(item.sellPrice ?? Math.floor((item.price ?? item.cost ?? 40) * 0.5)));
    return Math.max(5, base);
  }

  // ============================================================================
  // 7. Inventory, Rewards, Level-Up & Progression Helpers
  // ============================================================================
  function getItemQty(itemId) {
    const entry = state.inventory.find((i) => i.id === itemId);
    return entry ? entry.qty : 0;
  }

  function isItemEquipped(itemId) {
    const eq = state.player.equipment;
    return eq.weapon === itemId || eq.armor === itemId || eq.accessory === itemId;
  }

  function addItem(itemId, qty = 1) {
    if (!itemId || qty <= 0) return;
    const item = getItemById(itemId);
    if (!item) return;
    const existing = state.inventory.find((i) => i.id === itemId);
    if (existing) {
      existing.qty += qty;
    } else {
      state.inventory.push({ id: itemId, qty });
    }
  }

  function removeItem(itemId, qty = 1) {
    const idx = state.inventory.findIndex((i) => i.id === itemId);
    if (idx === -1) return false;
    if (state.inventory[idx].qty < qty) return false;
    state.inventory[idx].qty -= qty;
    if (state.inventory[idx].qty <= 0) {
      state.inventory.splice(idx, 1);
    }
    return true;
  }

  function equipItem(itemId) {
    const item = getItemById(itemId);
    if (!item || !['weapon', 'armor', 'accessory'].includes(item.type)) return false;
    const slot = item.type;
    const currentId = state.player.equipment[slot];
    if (currentId === itemId) return false;

    if (!removeItem(itemId, 1)) {
      showToast('背包中沒有此裝備。', 'warning');
      return false;
    }
    if (currentId) {
      addItem(currentId, 1);
    }
    state.player.equipment[slot] = itemId;
    const stats = getTotalStats();
    state.player.hp = Math.min(state.player.hp, stats.maxHp);
    state.player.mp = Math.min(state.player.mp, stats.maxMp);
    Audio.playSFX('confirm');
    showToast(`⚔️ 已裝備【${item.name}】`, 'success');
    autoSave();
    updateHUD();
    return true;
  }

  function unequipSlot(slot) {
    const currentId = state.player.equipment[slot];
    if (!currentId) return false;
    const item = getItemById(currentId);
    state.player.equipment[slot] = null;
    addItem(currentId, 1);
    const stats = getTotalStats();
    state.player.hp = Math.min(state.player.hp, stats.maxHp);
    state.player.mp = Math.min(state.player.mp, stats.maxMp);
    Audio.playSFX('click');
    showToast(`已卸下【${item ? item.name : currentId}】`, 'info');
    autoSave();
    updateHUD();
    return true;
  }

  function grantTitle(titleStr) {
    if (!titleStr) return false;
    if (!state.player.unlockedTitles.includes(titleStr)) {
      state.player.unlockedTitles.push(titleStr);
      showToast(`👑 解鎖新稱號：【${titleStr}】`, 'gold');
      return true;
    }
    return false;
  }

  function gainGold(amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0) return 0;
    state.player.gold += n;
    state.stats.goldEarned += n;
    return n;
  }

  function gainExp(amount) {
    const n = Math.max(0, Math.floor(Number(amount) || 0));
    if (n <= 0) return { leveledUp: false, levelsGained: 0 };
    state.player.exp += n;
    let levelsGained = 0;
    const job = getJobById(state.player.jobId);
    const growth = getJobGrowth(job);

    while (state.player.exp >= state.player.nextExp) {
      state.player.exp -= state.player.nextExp;
      state.player.level += 1;
      state.player.sp += 1;
      state.player.maxHp += growth.hp;
      state.player.maxMp += growth.mp;
      state.player.baseINT += growth.INT;
      state.player.baseWIS += growth.WIS;
      state.player.baseCHA += growth.CHA;
      state.player.nextExp = calcNextExp(state.player.level);
      levelsGained += 1;
    }

    if (levelsGained > 0) {
      const stats = getTotalStats();
      state.player.hp = stats.maxHp;
      state.player.mp = stats.maxMp;
      Audio.playSFX('levelup');
      showToast(
        `🎉 等級提升！達到 Lv.${state.player.level}（SP +${levelsGained}，HP/MP 全回復）`,
        'gold'
      );
    }

    return { leveledUp: levelsGained > 0, levelsGained };
  }

  function isRegionUnlocked(regionId) {
    const region = getRegionById(regionId);
    if (!region) return false;
    if (region.id === 'r1') return true;
    if (state.progress.unlockedAllOverride) return true;
    if (region.unlockLevel && state.player.level >= region.unlockLevel) return true;
    if (region.prevRegionId && state.progress.defeatedBosses.includes(region.prevRegionId)) return true;
    return false;
  }

  function isReadingUnlocked(rd) {
    if (!rd) return false;
    if (rd.id === 'rd_1' || !rd.unlockRegionId) return true;
    if (state.progress.unlockedAllOverride) return true;
    return isRegionUnlocked(rd.unlockRegionId);
  }

  // ---- Quest destinations: shared by the quest-card 「前往」 button and the objective bar ----
  function getHighestUnlockedRegionId() {
    let best = null;
    getRegions().forEach((r) => { if (isRegionUnlocked(r.id)) best = r.id; });
    return best || 'r1';
  }

  function getRegionIdForBoss(bossId) {
    const region = getRegions().find((r) => r.bossId === bossId);
    if (region) return region.id;
    const boss = getEnemyById(bossId);
    return boss && boss.isBoss && boss.regionId ? boss.regionId : null;
  }

  // Where a quest's 「前往」 should take the player, or null when there is no sensible place
  // (then no button is shown). Region-based targets carry `locked` so the UI can explain.
  function getQuestDestination(q) {
    if (!q) return null;
    const type = q.targetType || (q.goal && q.goal.type) || '';
    const regionDest = (regionId) => {
      const region = getRegionById(regionId);
      if (!region) return null;
      const locked = !isRegionUnlocked(region.id);
      return { kind: 'explore', regionId: region.id, locked, icon: locked ? 'lock' : 'sword', label: locked ? `${region.name}（未解鎖）` : `前往 ${region.name}` };
    };
    switch (type) {
      case 'defeat_boss':
        return regionDest(getRegionIdForBoss(q.targetId));
      case 'clear_reading':
        return { kind: 'view', view: 'reading', icon: 'book', label: '前往閱讀副本' };
      case 'complete_shrine':
        return { kind: 'view', view: 'shrine', icon: 'torii', label: '前往試煉神殿' };
      case 'npc_talk':
        return { kind: 'view', view: 'town', icon: 'house', label: '前往城鎮' };
      case 'correct_answers':
      case 'win_battles':
      case 'reach_fever': {
        const cur = state.progress.currentRegionId;
        return regionDest(cur && isRegionUnlocked(cur) ? cur : getHighestUnlockedRegionId());
      }
      default:
        return null;
    }
  }

  // ---- Current objective bar (town / world map / explore): the first unclaimed main quest ----
  function getCurrentObjective() {
    const mains = getQuests().filter((q) => (q.type || q.category || 'main') === 'main');
    const q = mains.find((x) => !state.quests.claimedIds.includes(x.id));
    if (!q) return null;
    return { q, prog: evaluateGoalProgress(q), dest: getQuestDestination(q) };
  }

  function renderObjectiveBar(containerId) {
    const el = $(containerId);
    if (!el) return;
    const obj = hasActiveSession ? getCurrentObjective() : null;
    if (!obj) {
      el.innerHTML = '';
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    const { q, prog, dest } = obj;
    const alreadyHere = dest && dest.kind === 'explore' && currentView === 'explore'
      && dest.regionId === state.progress.currentRegionId;
    let action = '';
    let actionDest = null;
    if (prog.done) {
      actionDest = { kind: 'quests', tab: 'main' };
      action = '<button type="button" class="btn btn-gold btn-sm objective-btn">🎁 領取報酬</button>';
    } else if (alreadyHere) {
      action = '<span class="badge badge-gold">📍 目標就在此區</span>';
    } else if (dest) {
      actionDest = dest;
      action = `<button type="button" class="btn btn-sm ${dest.locked ? 'btn-secondary' : 'btn-primary'} objective-btn">${pxIcon(dest.icon)} ${escapeHtml(dest.label)}</button>`;
    }
    el.innerHTML = `
      <span class="objective-label">🎯 目前目標</span>
      <span class="objective-title">${escapeHtml(q.title || q.name || '')}</span>
      <span class="objective-progress">${prog.current}/${prog.target}</span>
      ${action}
    `;
    const btn = el.querySelector('.objective-btn');
    if (btn && actionDest) btn.addEventListener('click', () => goToQuestDestination(actionDest));
  }

  // Performs the jump. All screen changes go through switchView(); per-view resets mirror
  // what the nav / town buttons already do for reading & shrine.
  function goToQuestDestination(dest) {
    if (!dest) return;
    Audio.playSFX('confirm');
    if (dest.kind === 'explore') {
      const region = getRegionById(dest.regionId);
      if (!region) return;
      if (!isRegionUnlocked(region.id)) {
        mapSelectedRegionId = region.id; // map opens with this region's (locked) details
        switchView('map');
        const prevBoss = region.prevRegionId ? getRegionBoss(region.prevRegionId) : null;
        const how = [
          region.unlockLevel ? `升到 Lv.${region.unlockLevel}` : '',
          prevBoss ? `擊敗「${prevBoss.name}」` : ''
        ].filter(Boolean).join('，或');
        showToast(`🔒 ${region.name} 尚未解鎖${how ? `：${how}` : ''}`, 'warning');
        return;
      }
      state.progress.currentRegionId = region.id;
      explorePendingEvent = null;
      autoSave();
      switchView('explore');
      return;
    }
    if (dest.kind === 'quests') {
      uiTabs.quests = dest.tab || 'main';
      switchView('quests');
      return;
    }
    if (dest.view === 'reading') {
      reading.active = false;
      const p = $('reading-paragraphs');
      if (p) p.removeAttribute('data-rd-rendered');
    } else if (dest.view === 'shrine' && !shrine.active) {
      shrine.results = [];
      shrine.tier = null;
    }
    switchView(dest.view);
  }

  function logMistake(questionId) {
    if (!questionId) return;
    const existing = state.mistakes.find((m) => m.questionId === questionId);
    if (existing) {
      existing.count += 1;
      existing.lastWrongAt = new Date().toISOString();
    } else {
      state.mistakes.unshift({
        questionId,
        count: 1,
        lastWrongAt: new Date().toISOString()
      });
    }
  }

  function ensureWrongNotesMap() {
    if (!state.wrongNotes || typeof state.wrongNotes !== 'object' || Array.isArray(state.wrongNotes)) {
      state.wrongNotes = {};
    }
    return state.wrongNotes;
  }

  function isWrongNoteDue(entry, nowMs = Date.now()) {
    if (!entry || entry.mastered) return false;
    return !entry.nextReviewAt || nowMs >= Number(entry.nextReviewAt);
  }

  function recordWrongNote(questionId, playerLastChoice = null) {
    if (!questionId) return;
    const notes = ensureWrongNotesMap();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    const prev = notes[questionId];
    if (prev) {
      prev.wrongCount = Math.max(1, Number(prev.wrongCount) || 1) + 1;
      prev.lastWrongAt = nowIso;
      if (playerLastChoice !== undefined && playerLastChoice !== null) {
        prev.playerLastChoice = playerLastChoice;
      }
      prev.srsLevel = 0;
      prev.nextReviewAt = nowMs;
      prev.mastered = false;
    } else {
      notes[questionId] = {
        id: questionId,
        wrongCount: 1,
        lastWrongAt: nowIso,
        playerLastChoice: playerLastChoice !== undefined ? playerLastChoice : null,
        srsLevel: 0,
        nextReviewAt: nowMs,
        mastered: false
      };
    }
    if (getQuestionById(questionId)) {
      logMistake(questionId);
    }
    updateNavMistakeBadge();
  }

  // opts.requireDue: when true, a correct answer on a not-yet-due note only bumps correctCount
  // and does NOT raise srsLevel (prevents "all"-mode grinding from skipping the forgetting curve).
  function advanceWrongNoteSRS(questionId, isCorrect = true, opts = {}) {
    if (!questionId) {
      return { advanced: false, mastered: false, srsLevel: 0, daysAdded: 0, label: '' };
    }
    if (isCorrect === false) {
      recordWrongNote(questionId);
      return {
        advanced: false,
        mastered: false,
        srsLevel: 0,
        daysAdded: 0,
        label: 'SRS Lv.0（記憶重置・今日到期）'
      };
    }
    if (!state.wrongNotes || !state.wrongNotes[questionId]) {
      return { advanced: false, mastered: false, srsLevel: 0, daysAdded: 0, label: '' };
    }
    const entry = state.wrongNotes[questionId];
    if (entry.mastered) {
      return { advanced: false, mastered: true, srsLevel: 4, daysAdded: 0, label: '已完全刻印' };
    }
    entry.correctCount = toSafeInt(entry.correctCount, 0, 0) + 1;
    if (opts && opts.requireDue && !isWrongNoteDue(entry)) {
      const lv = clamp(Math.floor(Number(entry.srsLevel) || 0), 0, 3);
      return {
        advanced: false,
        mastered: false,
        early: true,
        srsLevel: lv,
        daysAdded: 0,
        label: `Lv.${lv}（未到期預習）`
      };
    }
    const curLv = clamp(Math.floor(Number(entry.srsLevel) || 0), 0, 3);
    const nextLv = curLv + 1;
    entry.srsLevel = nextLv;

    let daysAdded = 0;
    let label = '';
    if (nextLv >= 4) {
      entry.mastered = true;
      entry.nextReviewAt = null;
      label = '✅ 已完全刻印 (Lv.4)';
    } else {
      daysAdded = SRS_INTERVAL_DAYS[curLv] || 1;
      entry.mastered = false;
      entry.nextReviewAt = Date.now() + daysAdded * DAY_MS;
      label = `Lv.${nextLv}（${daysAdded}天後）`;
    }

    recordDailyTrainingProgress('review', 1);
    updateNavMistakeBadge();
    return { advanced: true, mastered: entry.mastered, srsLevel: nextLv, daysAdded, label };
  }

  function markWrongNoteMastered(questionId) {
    if (!questionId || !state.wrongNotes || !state.wrongNotes[questionId]) return false;
    const entry = state.wrongNotes[questionId];
    const wasUnmastered = !entry.mastered;
    entry.srsLevel = 4;
    entry.nextReviewAt = null;
    entry.mastered = true;
    updateNavMistakeBadge();
    return wasUnmastered;
  }

  // ---- Daily Training Quests (Date-keyed auto-reset) ----
  function ensureDailyTrainingFresh(st = state) {
    const todayKey = new Date().toDateString();
    if (!st.dailyTraining || typeof st.dailyTraining !== 'object' || st.dailyTraining.dateStr !== todayKey) {
      st.dailyTraining = {
        dateStr: todayKey,
        correctCount: 0,
        reviewCount: 0,
        claimedIds: []
      };
    } else {
      st.dailyTraining.correctCount = Math.max(0, Math.floor(Number(st.dailyTraining.correctCount) || 0));
      st.dailyTraining.reviewCount = Math.max(0, Math.floor(Number(st.dailyTraining.reviewCount) || 0));
      st.dailyTraining.claimedIds = Array.isArray(st.dailyTraining.claimedIds)
        ? Array.from(new Set(st.dailyTraining.claimedIds.map(String)))
        : [];
    }
    return st.dailyTraining;
  }

  function recordDailyTrainingProgress(type, amount = 1) {
    const dt = ensureDailyTrainingFresh(state);
    const inc = Math.max(0, Math.floor(Number(amount) || 0));
    if (inc <= 0) return;
    if (type === 'correct') dt.correctCount += inc;
    else if (type === 'review') dt.reviewCount += inc;
  }

  function claimDailyTrainingTask(taskId) {
    const dt = ensureDailyTrainingFresh(state);
    const task = DAILY_TRAINING_DEFS.find((t) => t.id === taskId);
    if (!task) return false;
    if (dt.claimedIds.includes(task.id)) return false;
    const curVal = Number(dt[task.metric] || 0);
    if (curVal < task.target) return false;

    dt.claimedIds.push(task.id);
    gainExp(task.reward.exp);
    gainGold(task.reward.gold);
    Audio.playSFX('levelup');
    showToast(`☀️ 達成每日修練【${task.title}】！獲賜 ⭐ +${task.reward.exp} EXP、🪙 +${task.reward.gold} 金幣`, 'gold');
    checkAchievements();
    autoSave();
    updateHUD();
    renderDailyTrainingPanel();
    return true;
  }

  function renderDailyTrainingPanel() {
    const dt = ensureDailyTrainingFresh(state);
    const targets = [$('town-daily-training'), $('quests-daily-training')].filter(Boolean);
    if (targets.length === 0) return;

    const html = `
      <div class="daily-training-header">
        <div>
          <h3 class="daily-training-title">☀️ 每日言霊特訓</h3>
          <span class="daily-training-sub">跨日刷新・達成即領言靈賞賜</span>
        </div>
        <span class="badge badge-gold">${escapeHtml(dt.dateStr)}</span>
      </div>
      <div class="daily-training-grid">
        ${DAILY_TRAINING_DEFS.map((task) => {
          const cur = Math.min(task.target, Number(dt[task.metric] || 0));
          const pct = Math.round((cur / task.target) * 100);
          const claimed = dt.claimedIds.includes(task.id);
          const ready = !claimed && cur >= task.target;
          return `
            <div class="daily-training-item ${claimed ? 'is-claimed' : ready ? 'is-ready' : ''}">
              <div class="daily-training-item-top">
                <div>
                  <div class="daily-training-item-name">${escapeHtml(task.title)}</div>
                  <div class="daily-training-item-desc">${escapeHtml(task.desc)}</div>
                </div>
                <div class="daily-training-item-action">
                  ${claimed
                    ? '<span class="badge badge-emerald">✅ 已領賞</span>'
                    : ready
                      ? `<button type="button" class="btn btn-gold btn-sm" data-claim-daily-training="${escapeHtml(task.id)}">🎁 領取賞賜</button>`
                      : `<span class="badge">${cur} / ${task.target}</span>`
                  }
                </div>
              </div>
              <div class="progress-track daily-training-bar">
                <div class="progress-fill" style="width: ${pct}%;"></div>
              </div>
              <div class="daily-training-reward">${pxIcon('star')} ${task.reward.exp}　${pxIcon('coin')} ${task.reward.gold}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    targets.forEach((container) => {
      container.innerHTML = html;
      container.querySelectorAll('[data-claim-daily-training]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tid = btn.getAttribute('data-claim-daily-training');
          if (tid) claimDailyTrainingTask(tid);
        });
      });
    });
  }

  function resolveWrongNoteQuestion(noteId) {
    if (!noteId) return null;
    const rawQ = getQuestionById(noteId);
    if (rawQ) {
      return { source: 'battle', rd: null, q: normalizeQuestion(rawQ) };
    }
    const rdMatch = String(noteId).match(/^(rd_[a-zA-Z0-9]+)_q(\d+)$/);
    if (rdMatch) {
      const rd = getReadingById(rdMatch[1]);
      const qIdx = Number(rdMatch[2]);
      if (rd && Array.isArray(rd.questions) && rd.questions[qIdx]) {
        const rq = rd.questions[qIdx];
        const opts = (rq.options || []).map((o) => (typeof o === 'object' ? (o.jp || o.text || '') : String(o)));
        const ansIdx = clamp(Number(rq.answerIndex ?? rq.answer ?? 0), 0, Math.max(0, opts.length - 1));
        const excerpt = rd.paragraphs && rd.paragraphs[0] ? (rd.paragraphs[0].html || '') : '';
        return {
          source: 'reading',
          rd,
          qIdx,
          q: {
            id: noteId,
            regionId: rd.unlockRegionId || 'r1',
            jlpt: rd.jlpt || 'N4',
            difficulty: 1,
            type: 'reading_comp',
            typeLabel: `長文閱讀・${rq.category || '理解'}`,
            promptZh: rq.prompt || rq.promptZh || '閱讀理解測驗',
            promptJp: `<div class="text-cyan" style="font-size:0.88rem;margin-bottom:4px;">📚 出自長文副本《${escapeHtml(rd.title || rd.id)}》（${escapeHtml(rd.jlpt || 'N4')}）</div>${excerpt ? `<div style="font-size:0.86rem;line-height:1.55;">${excerpt}</div>` : ''}`,
            fullRubyJp: `<div>《${escapeHtml(rd.title || rd.id)}》</div>`,
            tts: '',
            options: opts,
            answerIndex: ansIdx,
            kanaReading: '',
            correctDisplay: opts[ansIdx] || '',
            wrongReason: rq.wrongReason || '請對照長文副本內容再仔細確認。',
            explanation: rq.explanation || '請回顧該篇長文關鍵段落。',
            hint: rq.wrongReason || '請回顧長文副本中的關鍵依據句。',
            chunks: []
          }
        };
      }
    }
    return null;
  }

  function getWrongNoteCategory(q) {
    if (!q) return 'conjugation';
    if (q.type === 'reading_comp') return 'reading_comp';
    if (q.type === 'reading') return 'reading';
    if (q.type === 'particle') return 'particle';
    if (q.type === 'reorder' || (q.typeLabel && String(q.typeLabel).includes('句子重組'))) return 'reorder';
    return 'conjugation';
  }

  function getWrongNotesSummary() {
    const notes = ensureWrongNotesMap();
    const nowMs = Date.now();
    const list = Object.values(notes).filter((entry) => entry && resolveWrongNoteQuestion(entry.id));
    const unmastered = list.filter((e) => !e.mastered).length;
    const dueCount = list.filter((e) => isWrongNoteDue(e, nowMs)).length;
    const mastered = list.length - unmastered;
    return { total: list.length, unmastered, dueCount, mastered, entries: list };
  }

  function updateNavMistakeBadge() {
    const badge = $('nav-notes-badge');
    const dockBadge = $('dock-notes-badge');
    if (!badge && !dockBadge) return;
    const { dueCount } = getWrongNotesSummary();
    if (badge) {
      badge.textContent = dueCount > 0 ? `(${dueCount})` : '(0)';
      badge.classList.toggle('hidden', dueCount <= 0);
    }
    // Mirror the due count on the 修練 dock slot so it is visible from any screen
    if (dockBadge) {
      dockBadge.textContent = dueCount > 99 ? '99+' : String(dueCount);
      dockBadge.classList.toggle('hidden', dueCount <= 0);
    }
  }

  // ============================================================================
  // 8. Toast & Modal Utilities
  // ============================================================================
  function showToast(message, type = 'info') {
    const container = $('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast-item toast-${type}`;
    el.textContent = String(message == null ? '' : message);
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(24px)';
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(() => el.remove(), 260);
    }, 3400);
  }

  function openModal(id) {
    const el = $(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = $(id);
    if (el) el.classList.remove('open');
  }

  function showGenericModal(title, bodyHtml, icon = '✨', onClose = null) {
    const iconEl = $('generic-modal-icon');
    const titleEl = $('generic-modal-title');
    const bodyEl = $('generic-modal-body');
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = bodyHtml;
    genericModalCallback = typeof onClose === 'function' ? onClose : null;
    openModal('modal-generic');
  }

  // First sentence of the explanation (HTML-safe: data HTML is trusted ruby markup and
  // "。" never appears inside a tag). Falls back to the short hint.
  function getExplainKeyPoint(q) {
    const src = String((q && (q.explanation || q.hint)) || '');
    if (!src) return '';
    const cut = src.indexOf('。');
    const first = cut >= 0 ? src.slice(0, cut + 1) : src;
    return `💡 ${first}`;
  }

  function openExplainModal(q, damageNotice, onConfirm) {
    const dmgEl = $('explain-damage-notice');
    const ansEl = $('explain-correct-answer');
    const readEl = $('explain-reading');
    const wrongEl = $('explain-wrong-reason');
    const detailEl = $('explain-detail');

    if (dmgEl) dmgEl.innerHTML = damageNotice || '';
    if (ansEl) {
      ansEl.classList.add('force-furigana');
      ansEl.innerHTML = `
        <div class="jp-text" style="font-size:1.18rem;margin-bottom:6px;">${q.fullRubyJp || q.promptJp || ''}</div>
        <div class="text-emerald" style="font-weight:700;">▶ 正解：${q.correctDisplay}</div>
      `;
    }
    if (readEl) {
      readEl.textContent = q.kanaReading || stripRubyHtml(q.correctDisplay);
    }
    if (wrongEl) wrongEl.innerHTML = q.wrongReason || '';
    if (detailEl) detailEl.innerHTML = q.explanation || '';

    // Players reported the old modal as "too much text": show ONE key line by default,
    // keep the full analysis folded (and re-folded on every open).
    const keyEl = $('explain-keypoint');
    if (keyEl) keyEl.innerHTML = getExplainKeyPoint(q);
    const moreEl = $('explain-more');
    if (moreEl) moreEl.open = false;

    const ttsBtn = $('btn-explain-tts');
    const ttsSlowBtn = $('btn-explain-tts-slow');
    const speakText = q.tts || stripRubyHtml(q.fullRubyJp || q.correctDisplay);
    if (ttsBtn) ttsBtn.onclick = () => Audio.speak(speakText, 1.0);
    if (ttsSlowBtn) ttsSlowBtn.onclick = () => Audio.speak(speakText, 0.65);

    explainCallback = typeof onConfirm === 'function' ? onConfirm : null;
    openModal('modal-explain');
  }

  // ============================================================================
  // 9. HUD, Three-Tier Immersion Mode, Mobile Collapsible HUD & View Router
  // ============================================================================
  // A peek wrap may mirror its revealed state onto elements outside it, listed by id in
  // data-peek-targets (e.g. the NPC dialogue peek also reveals #dialogue-choices translations).
  function setZhPeekState(wrapEl, revealed) {
    if (!wrapEl) return;
    wrapEl.classList.toggle('zh-revealed', revealed);
    const btn = wrapEl.querySelector('.btn-peek-zh');
    if (btn) btn.innerHTML = `${pxIcon('eye')} ${revealed ? '隱藏中譯' : '偷看中譯'}`;
    const targets = (wrapEl.getAttribute('data-peek-targets') || '').split(/\s+/).filter(Boolean);
    targets.forEach((id) => {
      const el = $(id);
      if (el) el.classList.toggle('zh-revealed', revealed);
    });
  }

  function resetZhPeekWrap(wrapEl) {
    setZhPeekState(wrapEl, false);
  }

  function applyFuriganaSetting() {
    const app = $('app');
    const btn = $('btn-toggle-furigana');
    let mode = state && state.settings && state.settings.immersionMode;
    if (!IMMERSION_MODES.includes(mode)) {
      mode = (state && state.settings && state.settings.furigana === false) ? 'advanced' : 'standard';
    }
    if (state && state.settings) {
      state.settings.immersionMode = mode;
      state.settings.furigana = mode === 'standard';
    }

    if (app) {
      // Leaving/entering a mode must not carry over a previously revealed peek state.
      const prevMode = app.classList.contains('immersion-full') ? 'immersion'
        : (app.classList.contains('immersion-advanced') ? 'advanced' : 'standard');
      if (prevMode !== mode) {
        document.querySelectorAll('.zh-peek-wrap').forEach(resetZhPeekWrap);
      }
      app.classList.remove('furigana-on', 'furigana-off', 'immersion-standard', 'immersion-advanced', 'immersion-full');
      if (mode === 'standard') {
        app.classList.add('furigana-on', 'immersion-standard');
      } else if (mode === 'advanced') {
        app.classList.add('furigana-off', 'immersion-advanced');
      } else {
        app.classList.add('furigana-off', 'immersion-full');
      }
    }
    if (btn) {
      if (mode === 'standard') {
        btn.textContent = '標準: 假名+中';
        btn.classList.add('active');
        btn.classList.remove('immersion-active');
      } else if (mode === 'advanced') {
        btn.textContent = '進階: 無假名';
        btn.classList.remove('active');
        btn.classList.remove('immersion-active');
      } else {
        btn.textContent = '沉浸: 全日文';
        btn.classList.add('active');
        btn.classList.add('immersion-active');
      }
      btn.setAttribute('data-immersion-mode', mode);
    }
  }

  function cycleImmersionMode(silent = false) {
    const cur = (state && state.settings && IMMERSION_MODES.includes(state.settings.immersionMode))
      ? state.settings.immersionMode
      : (state && state.settings && state.settings.furigana === false ? 'advanced' : 'standard');
    const nextIdx = (IMMERSION_MODES.indexOf(cur) + 1) % IMMERSION_MODES.length;
    const nextMode = IMMERSION_MODES[nextIdx];
    state.settings.immersionMode = nextMode;
    state.settings.furigana = nextMode === 'standard';
    applyFuriganaSetting();
    if (hasActiveSession) autoSave();
    if (!silent) {
      const labels = {
        standard: '標準模式（振假名＋中譯）',
        advanced: '進階模式（無振假名・保留中譯）',
        immersion: '沉浸模式（全日文・可偷看中譯）'
      };
      showToast(`🌸 視界切換：【${labels[nextMode]}】`, 'info');
    }
    return nextMode;
  }

  function applyMobileHudCollapseState() {
    const hud = $('top-hud');
    const toggleBtn = $('btn-hud-collapse-toggle');
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const shouldCollapse = isMobile && Boolean(hudCollapsedMobile);
    if (hud) {
      hud.classList.toggle('hud-collapsed', shouldCollapse);
    }
    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
      toggleBtn.textContent = shouldCollapse ? '▼ 角色狀態' : '▲ 收合狀態';
    }
  }

  // Publishes the live #top-hud height as --hud-h on #app so the mobile battle view can size
  // itself to the remaining viewport (no page scroll + inner scroll = no double scrollbar).
  // Single observer for the app lifetime; guarded against double init.
  let hudResizeObserver = null;
  function initHudHeightSync() {
    const hud = $('top-hud');
    const app = $('app');
    if (!hud || !app || hudResizeObserver) return;
    let lastValue = '';
    let rafId = 0;
    const sync = () => {
      rafId = 0;
      const value = `${Math.ceil(hud.getBoundingClientRect().height)}px`;
      if (value === lastValue) return; // no-op writes would re-trigger layout for nothing
      lastValue = value;
      app.style.setProperty('--hud-h', value);
    };
    if (typeof ResizeObserver === 'function') {
      // Defer the write to the next frame: changing --hud-h inside the RO callback resizes
      // #view-battle in the same frame, which Chrome reports as
      // "ResizeObserver loop completed with undelivered notifications".
      hudResizeObserver = new ResizeObserver(() => {
        if (!rafId) rafId = requestAnimationFrame(sync);
      });
      hudResizeObserver.observe(hud);
    }
    sync();
  }

  function syncAudioButtons() {
    const st = Audio.getState();
    const bgmBtn = $('btn-toggle-bgm');
    const sfxBtn = $('btn-toggle-sfx');
    if (bgmBtn) {
      bgmBtn.innerHTML = `${pxIcon('music')} BGM`;
      bgmBtn.classList.toggle('is-muted', Boolean(st.bgmMuted));
      bgmBtn.classList.toggle('active', !st.bgmMuted);
    }
    if (sfxBtn) {
      sfxBtn.innerHTML = `${pxIcon('speaker')} SFX`;
      sfxBtn.classList.toggle('is-muted', Boolean(st.sfxMuted));
      sfxBtn.classList.toggle('active', !st.sfxMuted);
    }
  }

  function syncDifficultyControls() {
    const modeId = (state && state.settings && state.settings.difficultyMode) || 'adaptive';
    const sel = $('hud-difficulty-select');
    if (sel) {
      if (sel.value !== modeId) sel.value = modeId;
      sel.classList.toggle('diff-n1-active', modeId === 'fixed_n1');
    }
    if (currentView === 'map') {
      renderMapDifficultyBar();
    }
    if (battle && battle.active) {
      updateBattleUI();
    }
  }

  function setDifficultyMode(modeId, options = {}) {
    const cfg = getDifficultyModeConfig(modeId);
    state.settings.difficultyMode = cfg.id;

    if (battle && battle.active) {
      const startIdx = state.settings.adaptiveStartJlpt === 'N3' ? 1 : 0;
      battle.adaptiveLevelIdx = Math.max(getAdaptiveRegionFloorIdx(battle.regionId), startIdx);
      updateBattleUI();
      if (!battle.locked && options.refreshCurrentBattleQuestion) {
        nextBattleQuestion();
      }
    }

    syncDifficultyControls();
    if (currentView === 'explore') {
      renderExplore();
    }
    if (hasActiveSession) autoSave();

    if (!options.silent) {
      if (cfg.id === 'fixed_n1') {
        showToast('🔥 已切換至【N1 魔境挑戰】：全題庫鎖定 N1，戰鬥勝利享 EXP ×2 與掉落率 ×2！', 'gold');
      } else {
        showToast(`🎯 題庫難度已切換為【${cfg.label}】`, 'info');
      }
    }
  }

  function setAdaptiveStartJlpt(jlpt, options = {}) {
    const next = jlpt === 'N3' ? 'N3' : 'N4';
    state.settings.adaptiveStartJlpt = next;
    if (battle && battle.active && state.settings.difficultyMode === 'adaptive') {
      battle.adaptiveLevelIdx = Math.max(getAdaptiveRegionFloorIdx(battle.regionId), next === 'N3' ? 1 : 0);
      updateBattleUI();
    }
    syncDifficultyControls();
    if (currentView === 'explore') {
      renderExplore();
    }
    if (hasActiveSession) autoSave();
    if (!options.silent) {
      showToast(`⚡ 動態自適應起步難度已設為【從 ${next} 起步】`, 'info');
    }
  }

  function updateHUD() {
    if (!hasActiveSession) return;
    const stats = getTotalStats();
    const p = state.player;
    p.hp = clamp(p.hp, 0, stats.maxHp);
    p.mp = clamp(p.mp, 0, stats.maxMp);

    const avatarEl = $('hud-avatar');
    if (avatarEl) avatarEl.innerHTML = Art.hero(p.jobId);
    const nameEl = $('hud-name');
    if (nameEl) nameEl.textContent = p.name;
    const lvEl = $('hud-level');
    if (lvEl) lvEl.textContent = `Lv.${p.level}`;
    const titleEl = $('hud-title');
    if (titleEl) titleEl.textContent = p.activeTitle || '初醒的旅人';

    const hpPct = stats.maxHp > 0 ? Math.round((p.hp / stats.maxHp) * 100) : 0;
    const mpPct = stats.maxMp > 0 ? Math.round((p.mp / stats.maxMp) * 100) : 0;
    const expPct = p.nextExp > 0 ? Math.min(100, Math.round((p.exp / p.nextExp) * 100)) : 0;

    if ($('hud-hp-bar')) $('hud-hp-bar').style.width = `${hpPct}%`;
    if ($('hud-hp-text')) $('hud-hp-text').textContent = `HP ${p.hp}/${stats.maxHp}`;
    if ($('hud-mp-bar')) $('hud-mp-bar').style.width = `${mpPct}%`;
    if ($('hud-mp-text')) $('hud-mp-text').textContent = `MP ${p.mp}/${stats.maxMp}`;
    if ($('hud-exp-bar')) $('hud-exp-bar').style.width = `${expPct}%`;
    if ($('hud-exp-text')) $('hud-exp-text').textContent = `EXP ${p.exp}/${p.nextExp}`;

    if ($('hud-gold')) $('hud-gold').textContent = String(p.gold);
    if ($('hud-sp')) $('hud-sp').textContent = String(p.sp);

    if ($('hud-mini-name')) $('hud-mini-name').textContent = `${p.name} Lv.${p.level}`;
    if ($('hud-mini-hp')) $('hud-mini-hp').textContent = `HP ${p.hp}/${stats.maxHp}`;
    if ($('hud-mini-mp')) $('hud-mini-mp').textContent = `MP ${p.mp}/${stats.maxMp}`;

    applyMobileHudCollapseState();
    applyFuriganaSetting();
    syncAudioButtons();
    syncDifficultyControls();
    updateNavMistakeBadge();
  }

  function updateChromeVisibility(viewName) {
    const hud = $('top-hud');
    const nav = $('nav-bar');
    const hideHud = viewName === 'title' || viewName === 'create';
    const hideNav =
      hideHud ||
      viewName === 'battle' ||
      (viewName === 'shrine' && shrine.active);

    if (hud) hud.classList.toggle('hidden', hideHud);
    if (hud && hideHud) setHudSettingsOpen(false);
    applyMobileHudCollapseState();

    document.querySelectorAll('#nav-bar .nav-btn').forEach((btn) => {
      const target = btn.getAttribute('data-view');
      const active =
        target === viewName ||
        (viewName === 'explore' && target === 'map');
      btn.classList.toggle('active', active);
    });

    // Bottom dock + group sub-tabs
    const group = getNavGroupForView(viewName);
    if (group) navLastViewByGroup[group] = viewName === 'explore' ? 'map' : viewName;
    const groupSize = group ? document.querySelectorAll(`#nav-bar .nav-btn[data-group="${group}"]`).length : 0;
    if (nav) {
      nav.setAttribute('data-active-group', group || '');
      // A single-view group (城鎮) needs no sub-tab strip
      nav.classList.toggle('hidden', hideNav || groupSize <= 1);
    }
    const dock = $('nav-dock');
    if (dock) dock.classList.toggle('hidden', hideNav);
    document.querySelectorAll('#nav-dock .dock-btn').forEach((btn) => {
      const isActive = btn.getAttribute('data-group') === group;
      btn.classList.toggle('active', isActive);
      if (isActive) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    if ($('app')) $('app').classList.toggle('has-dock', !hideNav);
  }

  // ---- Bottom dock: 5 groups over the existing 10 views ----
  const NAV_GROUP_DEFAULT_VIEW = {
    town: 'town',
    adventure: 'map',
    training: 'notes',
    traveler: 'character',
    journal: 'quests'
  };
  const navLastViewByGroup = {};

  function getNavGroupForView(viewName) {
    const key = viewName === 'explore' ? 'map' : viewName;
    const btn = document.querySelector(`#nav-bar .nav-btn[data-view="${key}"]`);
    return btn ? btn.getAttribute('data-group') : null;
  }

  function openNavGroup(group) {
    const view = navLastViewByGroup[group] || NAV_GROUP_DEFAULT_VIEW[group];
    // Route through the original nav button so its per-view setup (reading/shrine reset) still runs
    const btn = view ? document.querySelector(`#nav-bar .nav-btn[data-view="${view}"]`) : null;
    if (btn) btn.click();
  }

  // ---- HUD ⚙ settings menu (desktop popover; inline on mobile via CSS) ----
  function setHudSettingsOpen(open) {
    const hud = $('top-hud');
    const btn = $('btn-hud-settings');
    if (hud) hud.classList.toggle('settings-open', Boolean(open));
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function switchView(viewName) {
    // Support shorthand aliases gracefully
    if (viewName === 'char') viewName = 'character';
    if (viewName === 'inv') viewName = 'inventory';

    if (currentView !== viewName) {
      stopTypewriter();
      Audio.stopSpeak();
      if (currentView === 'battle' && viewName !== 'battle') {
        stopBattleTimers();
      }
      if (currentView === 'shrine' && viewName !== 'shrine' && shrine.active) {
        stopShrineTimer();
        shrine.active = false;
      }
    }

    if (viewName === 'battle' && typeof window !== 'undefined' && window.innerWidth <= 768) {
      hudCollapsedMobile = true;
    }

    currentView = viewName;
    if ($('app')) {
      $('app').classList.toggle('view-battle-active', viewName === 'battle');
      // Lets the theme pick a scene backdrop per screen (night sky vs. village pattern)
      $('app').setAttribute('data-view', viewName);
    }

    document.querySelectorAll('.game-view').forEach((v) => {
      v.classList.toggle('active', v.id === `view-${viewName}`);
    });

    updateChromeVisibility(viewName);

    // BGM routing
    if (viewName === 'title' || viewName === 'create') {
      Audio.playBGM('title');
    } else if (viewName === 'battle') {
      Audio.playBGM(battle.enemy && battle.enemy.isBoss ? 'boss' : 'battle');
    } else if (viewName === 'shrine' && shrine.active) {
      Audio.playBGM('battle');
    } else {
      Audio.playBGM('town');
    }

    if (hasActiveSession) {
      checkAchievements();
      updateHUD();
    }

    switch (viewName) {
      case 'title': renderTitle(); break;
      case 'create': renderCreate(); break;
      case 'town': renderTown(); break;
      case 'map': renderMap(); break;
      case 'explore': renderExplore(); break;
      case 'battle': renderBattle(); break;
      case 'reading': renderReading(); break;
      case 'shrine': renderShrine(); break;
      case 'character': renderCharacter(); break;
      case 'skills': renderSkills(); break;
      case 'inventory': renderInventory(); break;
      case 'quests': renderQuests(); break;
      case 'codex': renderCodex(); break;
      case 'notes': renderNotes(); break;
      default: break;
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ============================================================================
  // 10. Title Screen & Character Creation
  // ============================================================================
  function renderTitle() {
    const slot = $('title-logo-slot');
    if (slot) slot.innerHTML = Art.logo();

    const latestKey = findLatestSaveKey();
    const contBtn = $('btn-title-continue');
    if (contBtn) {
      contBtn.classList.toggle('hidden', !latestKey);
    }
  }

  function renderCreate() {
    const jobs = getJobs();
    if (!createSelectedJobId || !jobs.some((j) => j.id === createSelectedJobId)) {
      createSelectedJobId = jobs[0] ? jobs[0].id : 'scholar';
    }

    const cardsEl = $('create-job-cards');
    if (cardsEl) {
      cardsEl.innerHTML = jobs.map((job) => {
        const base = getJobBaseStats(job);
        const selected = job.id === createSelectedJobId;
        return `
          <button type="button" class="job-card ${selected ? 'selected' : ''}" data-job-id="${escapeHtml(job.id)}">
            <div class="job-card-portrait">${Art.hero(job.id, selected ? 'victory' : 'idle')}</div>
            <div class="job-card-title">${escapeHtml(job.name)}</div>
            <div class="text-gold" style="font-size:0.82rem;margin-bottom:6px;">${escapeHtml(job.focus || job.title || job.subtitle || '')}</div>
            <div class="job-card-desc">${escapeHtml(job.desc || job.description || '')}</div>
            <div style="display:flex;justify-content:center;gap:8px;margin-top:8px;font-size:0.78rem;" class="text-cyan">
              <span>INT ${base.INT}</span>
              <span>WIS ${base.WIS}</span>
              <span>CHA ${base.CHA}</span>
            </div>
          </button>
        `;
      }).join('');

      cardsEl.querySelectorAll('.job-card').forEach((btn) => {
        btn.addEventListener('click', () => {
          createSelectedJobId = btn.getAttribute('data-job-id');
          createPreviewPose = 'idle';
          Audio.playSFX('click');
          renderCreate();
        });
      });
    }

    const selectedJob = getJobById(createSelectedJobId);
    const base = getJobBaseStats(selectedJob);
    const starterWpnId = getJobStarterWeaponId(selectedJob);
    const starterWpn = getItemById(starterWpnId);

    const previewEl = $('create-hero-preview');
    if (previewEl) {
      const poseOpts = [
        { id: 'idle', label: '待機' },
        { id: 'attack', label: '出擊' },
        { id: 'hurt', label: '受擊' },
        { id: 'victory', label: '勝利' }
      ];
      previewEl.innerHTML = `
        <div class="create-portrait-frame stage-pose-${escapeHtml(createPreviewPose)}">${Art.hero(selectedJob.id, createPreviewPose)}</div>
        <div class="pose-preview-bar" role="group" aria-label="預覽動作差分">
          ${poseOpts.map((po) => `<button type="button" class="pose-pill ${createPreviewPose === po.id ? 'active' : ''}" data-preview-pose="${po.id}">${po.label}</button>`).join('')}
        </div>
        <h3 style="text-align:center;margin:2px 0 0;color:var(--gold-bright);">${escapeHtml(selectedJob.name)}</h3>
        ${selectedJob.jpName ? `<div class="jp-text text-cyan" style="text-align:center;font-size:0.86rem;margin-top:2px;">${selectedJob.jpName}</div>` : ''}
        <p class="text-muted" style="text-align:center;font-size:0.88rem;margin:4px 0 0;">${escapeHtml(selectedJob.focus || selectedJob.passive || selectedJob.trait || selectedJob.title || '')}</p>
      `;
      previewEl.querySelectorAll('[data-preview-pose]').forEach((pBtn) => {
        pBtn.addEventListener('click', () => {
          createPreviewPose = pBtn.getAttribute('data-preview-pose') || 'idle';
          Audio.playSFX('click');
          renderCreate();
        });
      });
    }

    const statsEl = $('create-stats-preview');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="char-stats-grid" style="margin-top:12px;">
          <div class="stat-tile"><span class="stat-tile-label">HP</span><span class="stat-tile-value text-emerald">${base.hp}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">MP</span><span class="stat-tile-value text-cyan">${base.mp}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">智力 INT</span><span class="stat-tile-value">${base.INT}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">智慧 WIS</span><span class="stat-tile-value">${base.WIS}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">魅力 CHA</span><span class="stat-tile-value">${base.CHA}</span></div>
          <div class="stat-tile"><span class="stat-tile-label">初始武器</span><span class="stat-tile-value text-gold" style="font-size:0.86rem;">${escapeHtml(starterWpn ? starterWpn.name : '旅人之筆')}</span></div>
        </div>
      `;
    }

    // Difficulty Mode Selector in Character Creation
    const diffGrid = $('create-difficulty-cards');
    if (diffGrid) {
      diffGrid.innerHTML = DIFFICULTY_MODES.map((m) => {
        const selected = m.id === createSelectedDifficultyMode;
        const isN1 = m.id === 'fixed_n1';
        return `
          <button type="button" class="diff-mode-card ${selected ? 'selected' : ''} ${isN1 ? 'mode-n1' : ''}" data-diff-mode="${m.id}">
            <div class="diff-mode-head">
              <span class="diff-mode-title">${escapeHtml(m.label)}</span>
              <span class="diff-mode-tag ${isN1 ? 'tag-n1' : ''}">${escapeHtml(m.tag)}</span>
            </div>
            <div class="diff-mode-desc">${escapeHtml(m.desc)}</div>
          </button>
        `;
      }).join('');

      diffGrid.querySelectorAll('[data-diff-mode]').forEach((btn) => {
        btn.addEventListener('click', () => {
          createSelectedDifficultyMode = btn.getAttribute('data-diff-mode') || 'adaptive';
          Audio.playSFX('click');
          renderCreate();
        });
      });
    }

    const startRow = $('create-adaptive-start-row');
    if (startRow) {
      startRow.classList.toggle('hidden', createSelectedDifficultyMode !== 'adaptive');
      startRow.querySelectorAll('[data-adaptive-start]').forEach((btn) => {
        const val = btn.getAttribute('data-adaptive-start');
        btn.classList.toggle('active', val === createAdaptiveStartJlpt);
        btn.onclick = () => {
          createAdaptiveStartJlpt = val === 'N3' ? 'N3' : 'N4';
          Audio.playSFX('click');
          renderCreate();
        };
      });
    }
  }

  function confirmCharacterCreation() {
    const input = $('create-name-input');
    const name = input && input.value.trim() ? input.value.trim().slice(0, 12) : '旅人';
    const job = getJobById(createSelectedJobId);
    const base = getJobBaseStats(job);
    const starterWeapon = getJobStarterWeaponId(job);

    state = createDefaultState();
    state.player.name = name;
    state.player.jobId = job.id;
    state.player.hp = base.hp;
    state.player.maxHp = base.hp;
    state.player.mp = base.mp;
    state.player.maxMp = base.mp;
    state.player.baseINT = base.INT;
    state.player.baseWIS = base.WIS;
    state.player.baseCHA = base.CHA;
    state.player.equipment.weapon = starterWeapon;
    state.settings.difficultyMode = getDifficultyModeConfig(createSelectedDifficultyMode).id;
    state.settings.adaptiveStartJlpt = createAdaptiveStartJlpt === 'N3' ? 'N3' : 'N4';

    // Ensure full derived HP/MP including starter weapon bonus
    const total = getTotalStats();
    state.player.hp = total.maxHp;
    state.player.mp = total.maxMp;

    hasActiveSession = true;
    townState.selectedNpcId = null;
    exploreLogs = [];

    const modeCfg = getDifficultyModeConfig(state.settings.difficultyMode);
    Audio.init();
    Audio.playSFX('levelup');
    autoSave();
    showToast(`✨ 記憶甦醒！${name}（${job.name}）以【${modeCfg.label}】踏上言霊大陸！`, 'gold');
    switchView('town');
  }

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
          Audio.playTypeTick();
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
        Audio.playSFX('click');
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
      Audio.playSFX('click');
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
          Audio.playSFX('click');
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
    state.quests.dailyProgress.npc_talk += 1;

    const emotion = choice.replyEmotion || (baseDelta >= 10 ? 'happy' : baseDelta <= 0 ? 'surprised' : 'serious');
    townState.awaitingNext = true;

    const replyJp = choice.replyJp || choice.reply || '';
    const replyZh = choice.replyZh || choice.replyTranslation || '';
    townState.currentTts = choice.replyTts || stripRubyHtml(replyJp);

    if (baseDelta > 0) Audio.playSFX('correct');
    else Audio.playSFX('click');

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
        Audio.playSFX('levelup');
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
          Audio.playSFX('chest');
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
          Audio.playSFX('levelup');
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
          Audio.playSFX('click');
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
      <div class="map-diff-top-row">
        <div class="map-diff-title">
          <span>🎯 題庫難度模式</span>
          ${modeId === 'fixed_n1' ? '<span class="badge badge-crimson">🔥 EXP ×2・掉落 ×2</span>' : ''}
        </div>
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
    `;

    bar.querySelectorAll('[data-map-diff]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        setDifficultyMode(btn.getAttribute('data-map-diff'));
      });
    });
    bar.querySelectorAll('[data-map-start]').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
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
          Audio.playSFX('click');
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
        Audio.playSFX('confirm');
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

    renderExploreLog();
  }

  // routeKey: 'safe' | 'risky' (route buttons). Click events or anything else → 'normal'.
  // After 100% (patrol) the route no longer matters and 'normal' is always used.
  function handleExploreStep(routeKey) {
    if (explorePendingEvent) return;
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
        Audio.playSFX('boss_enter');
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
      Audio.playSFX('boss_enter');
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
      Audio.playSFX('chest');
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
      Audio.playSFX('heal');
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
    Audio.playSFX('click');
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

    Audio.playSFX(parts.length > 0 ? 'chest' : 'click');
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

  // ============================================================================
  // 13. Break-Gauge Turn-Based Battle Engine + Dynamic Difficulty + Teaching Modal
  // ============================================================================
  const HERO_BATTLE_LINES = {
    intro: {
      swordsman: {
        jp: '<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>刃<rt>やいば</rt></ruby>よ、<ruby>真実<rt>しんじつ</rt></ruby>を<ruby>斬<rt>き</rt></ruby>り<ruby>裂<rt>さ</rt></ruby>け！',
        zh: '言靈之刃啊，斬開真實吧！'
      },
      scholar: {
        jp: '<ruby>古<rt>いにしえ</rt></ruby>の<ruby>知識<rt>ちしき</rt></ruby>で、<ruby>言葉<rt>ことば</rt></ruby>の<ruby>秩序<rt>ちつじょ</rt></ruby>を<ruby>取<rt>と</rt></ruby>り<ruby>戻<rt>もど</rt></ruby>します。',
        zh: '以古老的知識，取回語言的秩序。'
      },
      bard: {
        jp: 'さあ、<ruby>響<rt>ひび</rt></ruby>け<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>旋律<rt>せんりつ</rt></ruby>！',
        zh: '來吧，迴響吧言靈的旋律！'
      }
    },
    attack: [
      {
        jp: '<ruby>見切<rt>みき</rt></ruby>った！この<ruby>言霊<rt>ことだま</rt></ruby>を<ruby>受<rt>う</rt></ruby>け<ruby>止<rt>と</rt></ruby>めろ！',
        zh: '看穿了！接下這道言靈吧！'
      },
      {
        jp: 'そこだ！<ruby>正解<rt>せいかい</rt></ruby>の<ruby>一撃<rt>いちげき</rt></ruby>を<ruby>喰<rt>く</rt></ruby>らえ！',
        zh: '就是這裡！吃我正解的一擊！'
      },
      {
        jp: '<ruby>響<rt>ひび</rt></ruby>き<ruby>渡<rt>わた</rt></ruby>れ、<ruby>正<rt>ただ</rt></ruby>しき<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>刃<rt>やいば</rt></ruby>！',
        zh: '迴盪吧，正確的言靈之刃！'
      }
    ],
    crit: {
      jp: '<ruby>見切<rt>みき</rt></ruby>った！<ruby>会心<rt>かいしん</rt></ruby>の<ruby>言霊<rt>ことだま</rt></ruby>を<ruby>受<rt>う</rt></ruby>け<ruby>止<rt>と</rt></ruby>めろ！',
      zh: '看穿了！接下會心一擊的言靈吧！'
    },
    break: {
      jp: '<ruby>盾<rt>たて</rt></ruby>は<ruby>砕<rt>くだ</rt></ruby>けた！<ruby>今<rt>いま</rt></ruby>が<ruby>決<rt>き</rt></ruby>め<ruby>時<rt>どき</rt></ruby>だ！',
      zh: '護盾碎裂了！現在正是決勝時刻！'
    },
    hurt: [
      {
        jp: 'くっ……！<ruby>読<rt>よ</rt></ruby>み<ruby>違<rt>ちが</rt></ruby>えたか……！',
        zh: '唔……！看錯了嗎……！'
      },
      {
        jp: 'しまった……！だが、まだ<ruby>負<rt>ま</rt></ruby>けない！',
        zh: '糟了……！但我還不會認輸！'
      }
    ],
    victory: {
      jp: 'やった！<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>秩序<rt>ちつじょ</rt></ruby>を<ruby>守<rt>まも</rt></ruby>り<ruby>抜<rt>ぬ</rt></ruby>いたぞ！',
      zh: '太好了！成功守護了言靈的秩序！'
    },
    skillVocab: {
      jp: '<ruby>発動<rt>はつどう</rt></ruby>——【<ruby>単語洞察<rt>たんごどうさつ</rt></ruby>】！<ruby>偽<rt>いつわ</rt></ruby>りの<ruby>選択肢<rt>せんたくし</rt></ruby>を<ruby>見抜<rt>みぬ</rt></ruby>け！',
      zh: '發動——【單字洞察】！看破錯誤的選項吧！'
    },
    skillListen: {
      jp: '<ruby>発動<rt>はつどう</rt></ruby>——【<ruby>順風耳<rt>じゅんぷうじ</rt></ruby>】！<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>響<rt>ひび</rt></ruby>きよ、わが<ruby>力<rt>ちから</rt></ruby>に！',
      zh: '發動——【順風耳】！讓言靈的迴響化為我的力量！'
    }
  };

  function ensureBattleStageDecor() {
    const arena = document.querySelector('#view-battle .battle-arena');
    if (arena && !arena.querySelector('.battle-vs-crest')) {
      const crest = document.createElement('div');
      crest.className = 'battle-vs-crest';
      crest.setAttribute('aria-hidden', 'true');
      crest.innerHTML = '<span>VS</span>';
      arena.appendChild(crest);
    }
    const playerSide = document.querySelector('#view-battle .combatant-card.player-side');
    if (playerSide && !$('battle-hero-speech')) {
      const bubble = document.createElement('div');
      bubble.id = 'battle-hero-speech';
      bubble.className = 'hero-speech-bubble';
      const heroArt = $('battle-hero-art');
      if (heroArt && heroArt.parentNode === playerSide) {
        playerSide.insertBefore(bubble, heroArt);
      } else {
        playerSide.prepend(bubble);
      }
    }
  }

  function stopBattleTimers() {
    if (battle.speedTimerId) {
      clearInterval(battle.speedTimerId);
      battle.speedTimerId = null;
    }
    if (battle.poseTimerId) {
      clearTimeout(battle.poseTimerId);
      battle.poseTimerId = null;
    }
  }

  function showHeroSpeech(jpHtml, zhText = '', variant = '') {
    ensureBattleStageDecor();
    const el = $('battle-hero-speech');
    if (!el) return;
    el.className = 'hero-speech-bubble' + (variant ? ` ${variant}` : '');
    if (!jpHtml && !zhText) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="jp-text">「${jpHtml || ''}」</div>
      ${zhText ? `<div class="speech-zh">${escapeHtml(zhText)}</div>` : ''}
    `;
    el.classList.remove('speech-pop');
    void el.offsetWidth;
    el.classList.add('speech-pop');
  }

  function renderBattleStageArt(force = false) {
    if (!battle.enemy) return;
    const p = state.player;
    const enemy = battle.enemy;
    const hPose = battle.heroPose || 'idle';
    const ePose = battle.enemyPose || 'idle';

    const heroKey = `${p.jobId}:${hPose}`;
    const heroArtEl = $('battle-hero-art');
    if (heroArtEl && (force || battle.renderedHeroKey !== heroKey)) {
      heroArtEl.innerHTML = Art.hero(p.jobId, hPose);
      battle.renderedHeroKey = heroKey;
    }

    const enemyKey = `${enemy.id}:${Boolean(enemy.isBoss)}:${ePose}`;
    const enemyArtEl = $('battle-enemy-art');
    if (enemyArtEl && (force || battle.renderedEnemyKey !== enemyKey)) {
      enemyArtEl.innerHTML = Art.enemy(enemy.id, enemy.isBoss, ePose);
      battle.renderedEnemyKey = enemyKey;
    }

    const playerCard = document.querySelector('#view-battle .combatant-card.player-side');
    if (playerCard) {
      playerCard.classList.remove('stage-pose-idle', 'stage-pose-attack', 'stage-pose-hurt', 'stage-pose-victory');
      if (hPose !== 'idle') void playerCard.offsetWidth;
      playerCard.classList.add(`stage-pose-${hPose}`);
    }

    const enemyCard = document.querySelector('#view-battle .combatant-card.enemy-side');
    if (enemyCard) {
      enemyCard.classList.remove('stage-enemy-idle', 'stage-enemy-hit', 'stage-enemy-break', 'stage-enemy-attack', 'stage-enemy-defeat');
      if (ePose !== 'idle') void enemyCard.offsetWidth;
      enemyCard.classList.add(`stage-enemy-${ePose}`);
    }
  }

  function setBattlePoses(heroPose, enemyPose, revertMs = 0) {
    if (battle.poseTimerId) {
      clearTimeout(battle.poseTimerId);
      battle.poseTimerId = null;
    }
    battle.heroPose = heroPose || 'idle';
    battle.enemyPose = enemyPose || (battle.enemyStunned ? 'break' : 'idle');
    renderBattleStageArt(false);

    if (revertMs > 0) {
      battle.poseTimerId = setTimeout(() => {
        battle.poseTimerId = null;
        if (!battle.active) return;
        battle.heroPose = 'idle';
        battle.enemyPose = battle.enemyStunned ? 'break' : 'idle';
        renderBattleStageArt(false);
      }, revertMs);
    }
  }

  function getBossPhaseInfo(hp, maxHp) {
    const ratio = maxHp > 0 ? Number(hp) / Number(maxHp) : 1;
    if (ratio > 0.65) {
      return { phase: 1, label: '【第一幕】詞彙識讀', css: 'boss-phase-1' };
    }
    if (ratio > 0.30) {
      return { phase: 2, label: '【第二幕】文法奔流', css: 'boss-phase-2' };
    }
    return { phase: 3, label: '【終幕】語序重組決戰', css: 'boss-phase-3' };
  }

  function matchesBossPhaseQuestion(q, phase) {
    if (!q) return false;
    const typeLabel = q.typeLabel ? String(q.typeLabel) : '';
    if (phase === 1) {
      return q.type === 'reading' || typeLabel.includes('文字語彙');
    }
    if (phase === 2) {
      return q.type === 'particle' || (q.type === 'conjugation' && !typeLabel.includes('句子重組'));
    }
    if (phase === 3) {
      return q.type === 'reorder' || typeLabel.includes('句子重組');
    }
    return true;
  }

  function checkBossPhaseTransition() {
    if (!battle.active || !battle.enemy || !battle.enemy.isBoss || battle.isWrongNoteTraining || battle.enemyHp <= 0) {
      return false;
    }
    const info = getBossPhaseInfo(battle.enemyHp, battle.enemyMaxHp);
    if (info.phase > (battle.bossPhase || 1)) {
      battle.bossPhase = info.phase;
      Audio.playSFX('boss_enter');
      triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
      if (info.phase === 2) {
        showEnemySpeech(
          'ふっ……<ruby>断片<rt>だんぺん</rt></ruby>の<ruby>語彙<rt>ごい</rt></ruby>など<ruby>無力<rt>むりょく</rt></ruby>！<ruby>荒<rt>あ</rt></ruby>れ<ruby>狂<rt>くる</rt></ruby>う<ruby>文法<rt>ぶんぽう</rt></ruby>の<ruby>奔流<rt>ほんりゅう</rt></ruby>に<ruby>呑<rt>の</rt></ruby>まれるがいい！',
          '哼……零碎的詞彙毫無意義！在狂暴的文法奔流中沉沒吧！'
        );
        showHeroSpeech(
          '<ruby>魔気<rt>まき</rt></ruby>が<ruby>変質<rt>へんしつ</rt></ruby>した……！<ruby>助詞<rt>じょし</rt></ruby>と<ruby>活用<rt>かつよう</rt></ruby>の<ruby>型<rt>かた</rt></ruby>を<ruby>見極<rt>みきわ</rt></ruby>める！',
          '魔氣變質了……！看清助詞與活用的脈絡！',
          'speech-skill'
        );
      } else if (info.phase === 3) {
        showEnemySpeech(
          'おのれ……ならば<ruby>言葉<rt>ことば</rt></ruby>そのものを<ruby>砕<rt>くだ</rt></ruby>く！<ruby>散<rt>ち</rt></ruby>りゆく<ruby>語順<rt>ごじゅん</rt></ruby>の<ruby>深淵<rt>しんえん</rt></ruby>で<ruby>果<rt>は</rt></ruby>てよ！',
          '可惡……那就把語言本身徹底碾碎！在崩解的語序深淵中化為虛無吧！'
        );
        showHeroSpeech(
          'どれほど<ruby>砕<rt>くだ</rt></ruby>かれようと、<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>絆<rt>きずな</rt></ruby>は<ruby>必<rt>かなら</rt></ruby>ず<ruby>繋<rt>つな</rt></ruby>ぎ<ruby>直<rt>なお</rt></ruby>す！',
          '無論被擊碎多少次，言靈的羈絆都由我重新串連！',
          'speech-victory'
        );
      }
      showToast(`🔥 【${battle.enemy.name}】解放魔力——進入${info.label}！`, 'warning');
      return true;
    }
    return false;
  }

  // ---- Fixed answers-per-battle balance ----
  // Correct answers needed to defeat an enemy at base damage (no combo / crit / stun).
  // An enemy may override this with `hitsToDefeat` in data.js.
  const BATTLE_HITS_NORMAL = 4;
  const BATTLE_HITS_BOSS = 8;
  const BATTLE_HITS_ELITE = 6;     // mid-region elite: at least 4 correct answers
  // Max per-hit multiplier from in-battle performance. With 1.5 a fight still needs at least
  // ceil(hits / 1.5) correct answers: 3 for normal enemies, 6 for bosses.
  const BATTLE_PERFORMANCE_CAP = 1.5;

  function getRequiredHits(enemy) {
    const override = enemy ? Math.floor(Number(enemy.hitsToDefeat)) : NaN;
    if (Number.isFinite(override) && override >= 1) return override;
    if (enemy && enemy.isBoss) return BATTLE_HITS_BOSS;
    if (enemy && enemy.isElite) return BATTLE_HITS_ELITE;
    return BATTLE_HITS_NORMAL;
  }

  function getMinAnswersToDefeat(enemy) {
    return Math.ceil(getRequiredHits(enemy) / BATTLE_PERFORMANCE_CAP);
  }

  function startBattle(enemyOrId, options = {}) {
    const enemy = typeof enemyOrId === 'string' ? getEnemyById(enemyOrId) : enemyOrId;
    if (!enemy) {
      showToast('魔物資料遺失，無法進入戰鬥。', 'error');
      return;
    }

    const isTraining = Boolean(options.isWrongNoteTraining);
    if (!isTraining && !state.stats.encounteredEnemies.includes(enemy.id)) {
      state.stats.encounteredEnemies.push(enemy.id);
    }

    const breakMax = Math.max(1, Number(enemy.breakMax || (enemy.isBoss ? 3 : 2)));
    const enemyMaxHp = Math.max(40, Number(enemy.hp || enemy.maxHp || 100));
    const battleRegionId = enemy.regionId || state.progress.currentRegionId || 'r1';
    const startAdaptiveIdx = Math.max(
      getAdaptiveRegionFloorIdx(battleRegionId),
      state.settings.adaptiveStartJlpt === 'N3' ? 1 : 0
    );
    const trainingQueue = isTraining && Array.isArray(options.trainingQueue)
      ? options.trainingQueue.slice()
      : [];

    battle = {
      active: true,
      enemy,
      regionId: battleRegionId,
      bossPhase: enemy.isBoss && !isTraining ? 1 : 0,
      isWrongNoteTraining: isTraining,
      trainingMode: options.trainingMode || 'due',
      trainingQueue,
      trainingTotal: trainingQueue.length,
      masteredIdsInRun: [],
      trainingFullyMasteredCount: 0,
      trainingExpEarned: 0,
      trainingGoldEarned: 0,
      enemyHp: enemyMaxHp,
      enemyMaxHp,
      enemyBreak: breakMax,
      enemyBreakMax: breakMax,
      enemyStunned: false,
      stunJustTriggered: false,
      combo: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      feverActive: false,
      difficultyOffset: 0,
      adaptiveLevelIdx: startAdaptiveIdx,
      currentQ: null,
      qStartTime: 0,
      speedTimerId: null,
      poseTimerId: null,
      heroPose: 'idle',
      enemyPose: 'idle',
      renderedHeroKey: '',
      renderedEnemyKey: '',
      attackLineCount: 0,
      insightActive: false,
      usedQuestionIds: [],
      reorderPool: [],
      reorderSelected: [],
      locked: false,
      returnView: options.returnView || 'explore',
      // Explore route bonus (危險捷徑 ×1.3); 1 for every other battle
      rewardMult: Number(options.rewardMult) > 0 ? Number(options.rewardMult) : 1,
      rewardLabel: typeof options.rewardLabel === 'string' ? options.rewardLabel : ''
    };

    const viewEl = $('view-battle');
    if (viewEl) viewEl.classList.remove('fever-active');

    ensureBattleStageDecor();
    switchView('battle');

    const introHero = HERO_BATTLE_LINES.intro[state.player.jobId] || HERO_BATTLE_LINES.intro.swordsman;
    showHeroSpeech(introHero.jp, introHero.zh);
    setBattlePoses('idle', 'idle');

    if (enemy.isBoss) {
      Audio.playSFX('boss_enter');
      const intro = formatSpeechLine(enemy.introLine);
      showEnemySpeech(intro.jp || `${enemy.name} 釋放出壓倒性的言霊威壓！`, intro.zh);
      if (intro.tts) Audio.speak(intro.tts, 1.0);
    } else {
      const intro = formatSpeechLine(enemy.introLine);
      showEnemySpeech(intro.jp || `${enemy.name} 擋住了去路！`, intro.zh);
    }

    nextBattleQuestion();
  }

  function showEnemySpeech(jpHtml, zhText = '') {
    const el = $('battle-enemy-speech');
    if (!el) return;
    if (!jpHtml && !zhText) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = `
      <div class="jp-text">${jpHtml || ''}</div>
      ${zhText ? `<div class="speech-zh">${escapeHtml(zhText)}</div>` : ''}
    `;
    el.classList.remove('speech-pop');
    void el.offsetWidth;
    el.classList.add('speech-pop');
  }

  function spawnFloatingNumber(target, text, cssClass) {
    const container = $(target === 'enemy' ? 'battle-enemy-fx' : 'battle-hero-fx');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `floating-num ${cssClass || 'num-dmg'}`;
    el.textContent = text;
    el.style.left = `${35 + Math.random() * 30}%`;
    el.style.top = `${20 + Math.random() * 25}%`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 1100);
  }

  function triggerCombatAnim(selector, animClass) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.classList.remove(animClass);
    void el.offsetWidth;
    el.classList.add(animClass);
    setTimeout(() => el.classList.remove(animClass), 650);
  }

  function renderBattle() {
    if (!battle.active || !battle.enemy) return;
    updateBattleUI();
  }

  function updateBattleUI() {
    if (!battle.active || !battle.enemy) return;
    const enemy = battle.enemy;
    const stats = getTotalStats();
    const p = state.player;
    const region = getRegionById(battle.regionId);

    if ($('battle-region-label')) {
      $('battle-region-label').textContent = battle.isWrongNoteTraining
        ? `📓 錯題特訓・記憶試煉（進度 ${battle.masteredIdsInRun.length}/${battle.trainingTotal}）`
        : `${region ? region.name : '戰場'}｜${enemy.isBoss ? '💀 BOSS 戰' : (enemy.isElite ? '⚠️ 精英戰' : '⚔️ 遭遇戰')}`;
    }
    const bossPhaseBadge = $('battle-boss-phase-badge');
    if (bossPhaseBadge) {
      if (enemy.isBoss && !battle.isWrongNoteTraining) {
        const phaseInfo = getBossPhaseInfo(battle.enemyHp, battle.enemyMaxHp);
        battle.bossPhase = Math.max(battle.bossPhase || 1, phaseInfo.phase);
        bossPhaseBadge.textContent = phaseInfo.label;
        bossPhaseBadge.className = `battle-badge boss-phase-badge ${phaseInfo.css}`;
      } else {
        bossPhaseBadge.classList.add('hidden');
      }
    }
    if ($('battle-combo-badge')) {
      $('battle-combo-badge').textContent = `🔥 Combo x${battle.combo}`;
    }
    if ($('battle-fever-badge')) {
      $('battle-fever-badge').classList.toggle('hidden', !battle.feverActive);
    }
    const viewEl = $('view-battle');
    if (viewEl) viewEl.classList.toggle('fever-active', battle.feverActive);

    const activeMode = getDifficultyModeConfig(state.settings.difficultyMode);
    const activeJlpt = getEffectiveBattleJlpt();
    const isDemonRealm = activeMode.id === 'fixed_n1' && !battle.isWrongNoteTraining;
    if ($('battle-difficulty-badge')) {
      const diffText = battle.isWrongNoteTraining
        ? `專攻未攻克錯題（剩餘 ${Math.max(0, battle.trainingTotal - battle.masteredIdsInRun.length)} 題）`
        : activeMode.id === 'adaptive'
          ? `難度：動態自適應（當前 ${activeJlpt}）`
          : `難度：${activeMode.label}`;
      $('battle-difficulty-badge').textContent = diffText;
    }
    if ($('battle-n1-bonus-badge')) {
      $('battle-n1-bonus-badge').classList.toggle('hidden', !isDemonRealm);
    }

    // Player side
    ensureBattleStageDecor();
    renderBattleStageArt(false);
    if ($('battle-hero-name')) $('battle-hero-name').textContent = `${p.name} (Lv.${p.level})`;
    const hpPct = stats.maxHp > 0 ? Math.round((p.hp / stats.maxHp) * 100) : 0;
    const mpPct = stats.maxMp > 0 ? Math.round((p.mp / stats.maxMp) * 100) : 0;
    if ($('battle-hero-hp-bar')) $('battle-hero-hp-bar').style.width = `${hpPct}%`;
    if ($('battle-hero-hp-text')) $('battle-hero-hp-text').textContent = `HP ${p.hp}/${stats.maxHp}`;
    if ($('battle-hero-mp-bar')) $('battle-hero-mp-bar').style.width = `${mpPct}%`;
    if ($('battle-hero-mp-text')) $('battle-hero-mp-text').textContent = `MP ${p.mp}/${stats.maxMp}`;

    const buffsEl = $('battle-player-buffs');
    if (buffsEl) {
      const buffs = [];
      if (battle.insightActive) buffs.push('<span class="badge badge-cyan">👁️ 單字洞察啟動</span>');
      if (battle.feverActive) buffs.push('<span class="badge badge-gold">⚡ FEVER 火力+25%</span>');
      if ((state.skills.grammar_shield || 0) > 0) {
        const red = [0, 50, 58, 65][state.skills.grammar_shield];
        buffs.push(`<span class="badge badge-violet">🛡️ 助詞護盾 -${red}%</span>`);
      }
      buffsEl.innerHTML = buffs.join('');
    }

    // Enemy side
    const arenaEl = document.querySelector('#view-battle .battle-arena');
    if (arenaEl) {
      arenaEl.classList.toggle('boss-battle-stage', Boolean(enemy.isBoss));
      arenaEl.classList.toggle('revenge-battle-stage', Boolean(battle.isWrongNoteTraining));
    }
    const enemyCard = document.querySelector('#view-battle .combatant-card.enemy-side');
    if (enemyCard) enemyCard.classList.toggle('boss-card', Boolean(enemy.isBoss || enemy.isElite));
    if (enemyCard) enemyCard.classList.toggle('elite-card', Boolean(enemy.isElite));

    if ($('battle-enemy-name')) $('battle-enemy-name').textContent = enemy.name;
    if ($('battle-enemy-weakness')) {
      const wkLabel = enemy.weaknessLabel || QUESTION_TYPE_LABELS[enemy.weakness] || enemy.weakness || '單字';
      $('battle-enemy-weakness').textContent = `弱點：${wkLabel}`;
    }

    const eHpPct = battle.enemyMaxHp > 0 ? Math.round((battle.enemyHp / battle.enemyMaxHp) * 100) : 0;
    if ($('battle-enemy-hp-bar')) $('battle-enemy-hp-bar').style.width = `${eHpPct}%`;
    if ($('battle-enemy-hp-text')) $('battle-enemy-hp-text').textContent = `HP ${battle.enemyHp}/${battle.enemyMaxHp}`;

    // Break pips
    const pipsEl = $('battle-break-pips');
    if (pipsEl) {
      let html = '';
      for (let i = 0; i < battle.enemyBreakMax; i++) {
        const filled = !battle.enemyStunned && i < battle.enemyBreak;
        html += `<span class="break-pip ${filled ? 'filled' : 'broken'}"></span>`;
      }
      pipsEl.innerHTML = html;
    }

    const stunEl = $('battle-enemy-stun-badge');
    if (stunEl) {
      stunEl.textContent = battle.enemyStunned ? '💫 BREAK! 暈眩（受傷 ×1.6）' : `護盾 ${battle.enemyBreak}/${battle.enemyBreakMax}`;
    }

    // Skill buttons
    const vocabLv = state.skills.vocab_insight || 0;
    const listenLv = state.skills.clairaudience || 0;
    const btnVocab = $('btn-skill-vocab');
    if (btnVocab) {
      btnVocab.textContent = vocabLv > 0 ? `👁️ 單字洞察 Lv.${vocabLv} (10 MP)` : '🔒 單字洞察';
      btnVocab.disabled = vocabLv <= 0 || p.mp < 10 || battle.insightActive || battle.locked;
    }
    const btnListen = $('btn-skill-listen');
    if (btnListen) {
      btnListen.textContent = listenLv > 0 ? `🎐 順風耳 Lv.${listenLv} (10 MP)` : '🔒 順風耳';
      btnListen.disabled = listenLv <= 0 || p.mp < 10 || battle.locked;
    }

    renderBattleConsumables();
  }

  function renderBattleConsumables() {
    const wrap = $('battle-consumables');
    if (!wrap) return;
    const cons = state.inventory
      .map((e) => ({ entry: e, item: getItemById(e.id) }))
      .filter((x) => x.item && x.item.type === 'consumable' && x.entry.qty > 0);

    if (cons.length === 0) {
      wrap.innerHTML = '<span class="text-muted" style="font-size:0.82rem;">無可用消耗品</span>';
      return;
    }

    wrap.innerHTML = cons.map(({ entry, item }) => `
      <button type="button" class="btn btn-sm btn-secondary" data-use-con="${escapeHtml(item.id)}" ${battle.locked ? 'disabled' : ''} title="${escapeHtml(item.desc || '')}">
        🧪 ${escapeHtml(item.name)} x${entry.qty}
      </button>
    `).join('');

    wrap.querySelectorAll('[data-use-con]').forEach((btn) => {
      btn.addEventListener('click', () => {
        useBattleConsumable(btn.getAttribute('data-use-con'));
      });
    });
  }

  function getEffectiveBattleJlpt() {
    const modeCfg = getDifficultyModeConfig(state.settings.difficultyMode);
    if (modeCfg.targetJlpt) return modeCfg.targetJlpt;
    const idx = clamp(Number(battle.adaptiveLevelIdx || 0), 0, JLPT_LEVELS.length - 1);
    return JLPT_LEVELS[idx];
  }

  function ensureShuffleBagForJlpt(targetJlpt) {
    const allRaw = getQuestions();
    const allForJlpt = allRaw.filter((q) => normalizeJlptLevel(q.jlpt, q.regionId) === targetJlpt);
    if (allForJlpt.length === 0) return [];

    if (!state.progress.solvedByJlpt) state.progress.solvedByJlpt = { N4: [], N3: [], N2: [], N1: [] };
    if (!state.progress.bagByJlpt) state.progress.bagByJlpt = { N4: [], N3: [], N2: [], N1: [] };
    if (!state.progress.cycleCountsByJlpt) state.progress.cycleCountsByJlpt = { N4: 0, N3: 0, N2: 0, N1: 0 };

    const qMap = new Map(allForJlpt.map((q) => [q.id, q]));
    let solved = Array.isArray(state.progress.solvedByJlpt[targetJlpt])
      ? state.progress.solvedByJlpt[targetJlpt].filter((id) => qMap.has(id))
      : [];
    let solvedSet = new Set(solved);

    let unsolvedIds = allForJlpt.map((q) => q.id).filter((id) => !solvedSet.has(id));
    if (unsolvedIds.length === 0) {
      // Player conquered EVERY question in this JLPT tier! Reset and reshuffle for next round
      solved = [];
      solvedSet = new Set();
      state.progress.solvedByJlpt[targetJlpt] = [];
      state.progress.cycleCountsByJlpt[targetJlpt] = (state.progress.cycleCountsByJlpt[targetJlpt] || 0) + 1;
      unsolvedIds = allForJlpt.map((q) => q.id);
      const freshBag = shuffleArray(unsolvedIds);
      state.progress.bagByJlpt[targetJlpt] = freshBag;
      showToast(`🎉 【${targetJlpt}】全境 ${allForJlpt.length} 道言靈已悉數破除一輪！記憶星盤重新洗牌！`, 'gold');
      return freshBag.map((id) => qMap.get(id)).filter(Boolean);
    }

    const unsolvedSet = new Set(unsolvedIds);
    const existingBag = Array.isArray(state.progress.bagByJlpt[targetJlpt])
      ? state.progress.bagByJlpt[targetJlpt].filter((id) => unsolvedSet.has(id))
      : [];
    const inBagSet = new Set(existingBag);
    const missing = shuffleArray(unsolvedIds.filter((id) => !inBagSet.has(id)));
    const mergedBag = existingBag.concat(missing);
    state.progress.solvedByJlpt[targetJlpt] = solved;
    state.progress.bagByJlpt[targetJlpt] = mergedBag;

    return mergedBag.map((id) => qMap.get(id)).filter(Boolean);
  }

  function recordQuestionOutcomeInShuffleBag(q, isCorrect) {
    if (!q || !q.id) return;
    const lvl = normalizeJlptLevel(q.jlpt, q.regionId);
    if (!state.progress.solvedByJlpt) state.progress.solvedByJlpt = { N4: [], N3: [], N2: [], N1: [] };
    if (!state.progress.bagByJlpt) state.progress.bagByJlpt = { N4: [], N3: [], N2: [], N1: [] };

    const solved = Array.isArray(state.progress.solvedByJlpt[lvl]) ? state.progress.solvedByJlpt[lvl] : [];
    const bag = Array.isArray(state.progress.bagByJlpt[lvl]) ? state.progress.bagByJlpt[lvl] : [];

    if (isCorrect) {
      if (!solved.includes(q.id)) solved.push(q.id);
      state.progress.solvedByJlpt[lvl] = solved;
      state.progress.bagByJlpt[lvl] = bag.filter((id) => id !== q.id);
    } else {
      // Keep unsolved and rotate to the back of the shuffle bag so it won't repeat immediately
      const rotated = bag.filter((id) => id !== q.id);
      rotated.push(q.id);
      state.progress.bagByJlpt[lvl] = rotated;
    }
  }

  function pickBattleQuestion() {
    if (battle.isWrongNoteTraining) {
      const notes = ensureWrongNotesMap();
      const lastId = battle.currentQ ? battle.currentQ.id : null;
      const doneInRun = new Set(battle.masteredIdsInRun || []);
      // Draw strictly from trainingQueue (never leak non-due items during due-only training)
      const pendingIds = (battle.trainingQueue || []).filter((id) => {
        if (doneInRun.has(id)) return false;
        const e = notes[id];
        return e && !e.mastered && resolveWrongNoteQuestion(id);
      });
      if (pendingIds.length === 0) return null;
      let nextId = pendingIds.find((id) => id !== lastId);
      if (!nextId) nextId = pendingIds[0];
      const resolved = resolveWrongNoteQuestion(nextId);
      return resolved ? resolved.q : null;
    }

    const allRaw = getQuestions();
    if (allRaw.length === 0) return null;

    const targetJlpt = getEffectiveBattleJlpt();
    const bagQuestions = ensureShuffleBagForJlpt(targetJlpt);
    const lastId = battle.currentQ ? battle.currentQ.id : null;
    const usedSet = new Set(battle.usedQuestionIds);

    // Filter out questions already asked in this battle unless only those remain in unseen pool
    let candidates = bagQuestions.filter((q) => !usedSet.has(q.id));
    if (candidates.length === 0) {
      candidates = bagQuestions.filter((q) => q.id !== lastId);
      if (candidates.length === 0) candidates = bagQuestions;
    }

    if (candidates.length === 0) {
      // Safety fallback if targetJlpt somehow had 0 items
      const fallback = allRaw.filter((q) => q.id !== lastId);
      const chosen = (fallback.length ? fallback : allRaw)[0];
      return normalizeQuestion(chosen);
    }

    // Priority 1: Current region unseen questions in the shuffle bag
    const regionCandidates = candidates.filter((q) => q.regionId === battle.regionId);
    let activeTier = regionCandidates;

    // Priority 2: Current region target JLPT unseen pool exhausted -> seamless cross-region draw!
    if (activeTier.length === 0) {
      activeTier = candidates;
      const notifyKey = `${battle.regionId}_${targetJlpt}`;
      if (!crossRegionNotifiedKeys.has(notifyKey)) {
        crossRegionNotifiedKeys.add(notifyKey);
        showToast(`🌐 本區 ${targetJlpt} 題目已答完，改從其他區域出題`, 'info');
      }
    }

    // Region Boss 3-Phase Subject Evolution filter (with seamless fallback so Boss fights never stall)
    if (battle.enemy && battle.enemy.isBoss && !battle.isWrongNoteTraining) {
      const phaseInfo = getBossPhaseInfo(battle.enemyHp, battle.enemyMaxHp);
      let phaseMatches = activeTier.filter((q) => matchesBossPhaseQuestion(q, phaseInfo.phase));
      if (phaseMatches.length === 0) {
        phaseMatches = candidates.filter((q) => matchesBossPhaseQuestion(q, phaseInfo.phase));
      }
      if (phaseMatches.length > 0) {
        activeTier = phaseMatches;
      }
    }

    // Draw deterministically from shuffled bag order, lightly favoring enemy weakness within top shuffled window
    let chosen = activeTier[0];
    if (activeTier.length > 1 && battle.enemy && battle.enemy.weakness && Math.random() < 0.42) {
      const weakMatch = activeTier.slice(0, 6).find((q) => q.type === battle.enemy.weakness);
      if (weakMatch) chosen = weakMatch;
    }

    return normalizeQuestion(chosen);
  }

  function nextBattleQuestion() {
    if (!battle.active) return;
    stopBattleTimers();

    const q = pickBattleQuestion();
    if (!q) {
      showToast('題庫為空，無法生成戰鬥題目。', 'error');
      return;
    }

    battle.currentQ = q;
    battle.usedQuestionIds.push(q.id);
    battle.insightActive = false;
    battle.locked = false;
    battle.reorderSelected = [];
    battle.heroPose = 'idle';
    battle.enemyPose = battle.enemyStunned ? 'break' : 'idle';

    const qCard = $('battle-question-card');
    if (qCard) qCard.classList.remove('force-furigana');
    resetZhPeekWrap($('battle-zh-peek-wrap'));

    const isWeak = q.type === battle.enemy.weakness;
    const typeLabel = q.typeLabel || QUESTION_TYPE_LABELS[q.type] || q.type;
    if ($('battle-q-type')) {
      $('battle-q-type').innerHTML = `${typeLabel}（${escapeHtml(q.jlpt)}）${isWeak ? ' <b class="text-gold">⚡弱點</b>' : ''}`;
    }

    if ($('battle-q-prompt-zh')) $('battle-q-prompt-zh').innerHTML = q.promptZh;
    if ($('battle-q-prompt-jp')) {
      $('battle-q-prompt-jp').innerHTML = q.type === 'listening'
        ? '<span class="text-cyan">🎧 請點擊上方「🔊 朗讀」聆聽日文語音並選出正確答案</span>'
        : q.promptJp;
    }

    // Show adaptive hint if consecutiveWrong >= 2
    const hintEl = $('battle-q-hint');
    if (hintEl) {
      if (battle.consecutiveWrong >= 2) {
        hintEl.textContent = `💡 輔助提示：${q.hint}`;
        hintEl.classList.remove('hidden');
      } else {
        hintEl.textContent = '';
        hintEl.classList.add('hidden');
      }
    }

    renderBattleQuestionOptions(q);
    updateBattleUI();
    startBattleSpeedTimer();

    if (q.type === 'listening' && q.tts) {
      Audio.speak(q.tts, 1.0);
    }
  }

  function formatBattleSpeedText(leftSec) {
    const isNarrow = typeof window !== 'undefined' && Number(window.innerWidth) > 0 && window.innerWidth <= 360;
    if (leftSec <= 0) {
      return isNarrow ? '🧘 無加成' : '🧘 無速答加成';
    }
    return isNarrow ? `⚡ ${leftSec.toFixed(1)}s` : `⚡ ${leftSec.toFixed(1)}s 速答`;
  }

  function startBattleSpeedTimer() {
    stopBattleTimers();
    battle.qStartTime = performance.now();
    const bar = $('battle-speed-bar');
    const txt = $('battle-speed-text');
    if (bar) bar.style.width = '100%';
    if (txt) txt.textContent = formatBattleSpeedText(10);

    battle.speedTimerId = setInterval(() => {
      const elapsed = (performance.now() - battle.qStartTime) / 1000;
      const left = Math.max(0, 10 - elapsed);
      if (bar) bar.style.width = `${(left / 10) * 100}%`;
      if (left <= 0) {
        if (txt) txt.textContent = formatBattleSpeedText(0);
        stopBattleTimers();
      } else {
        if (txt) txt.textContent = formatBattleSpeedText(left);
      }
    }, 100);
  }

  function renderBattleQuestionOptions(q) {
    const container = $('battle-options-container');
    if (!container) return;

    if (q.type === 'reorder') {
      battle.reorderPool = shuffleArray(q.chunks.map((c) => ({ id: c.id, text: c.text, plain: c.plain, html: c.html })));
      battle.reorderSelected = [];
      container.classList.remove('options-grid');
      renderReorderUI(container, battle.reorderPool, battle.reorderSelected, () => {
        const answerStr = battle.reorderSelected.map((c) => c.plain).join('');
        handleBattleAnswer(answerStr === q.correctOrderPlain, null);
      });
      return;
    }

    container.classList.add('options-grid');
    const letters = ['A', 'B', 'C', 'D'];
    container.innerHTML = q.options.map((opt, idx) => `
      <button type="button" class="option-btn" data-opt-idx="${idx}">
        <span class="badge badge-gold" style="margin-right:8px;">${letters[idx] || idx + 1}</span>
        <span class="jp-text">${opt}</span>
      </button>
    `).join('');

    container.querySelectorAll('.option-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (battle.locked) return;
        const idx = Number(btn.getAttribute('data-opt-idx'));
        handleBattleAnswer(idx === q.answerIndex, idx);
      });
    });
  }

  function renderReorderUI(container, pool, selected, onSubmit) {
    const usedIds = new Set(selected.map((s) => s.id));
    container.innerHTML = `
      <div class="reorder-wrap">
        <div class="text-muted" style="font-size:0.84rem;margin-bottom:6px;">依正確日文語序點擊下方詞塊（點擊已放入的詞塊可收回）：</div>
        <div class="reorder-dropzone ${selected.length > 0 ? 'has-items' : ''}">
          ${selected.length === 0
            ? '<span class="text-muted">請點擊下方語詞碎片組成完整句子…</span>'
            : selected.map((chip, pos) => `<button type="button" class="reorder-chip jp-text" data-remove-pos="${pos}">${chip.html || chip.text}</button>`).join('')
          }
        </div>
        <div class="reorder-bank">
          ${pool.map((chip) => `
            <button type="button" class="reorder-chip jp-text ${usedIds.has(chip.id) ? 'used' : ''}" data-add-id="${chip.id}" ${usedIds.has(chip.id) ? 'disabled' : ''}>
              ${chip.html || chip.text}
            </button>
          `).join('')}
        </div>
        <div class="reorder-actions">
          <button type="button" class="btn btn-secondary btn-sm" id="btn-reorder-clear">↺ 清空重排</button>
          <button type="button" class="btn btn-gold" id="btn-reorder-submit" ${selected.length < pool.length ? 'disabled' : ''}>⚔️ 詠唱提交</button>
        </div>
      </div>
    `;

    container.querySelectorAll('[data-add-id]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = Number(btn.getAttribute('data-add-id'));
        const chip = pool.find((c) => c.id === id);
        if (!chip) return;
        Audio.playSFX('click');
        selected.push(chip);
        renderReorderUI(container, pool, selected, onSubmit);
      });
    });

    container.querySelectorAll('[data-remove-pos]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const pos = Number(btn.getAttribute('data-remove-pos'));
        Audio.playSFX('click');
        selected.splice(pos, 1);
        renderReorderUI(container, pool, selected, onSubmit);
      });
    });

    const clearBtn = container.querySelector('#btn-reorder-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        Audio.playSFX('click');
        selected.length = 0;
        renderReorderUI(container, pool, selected, onSubmit);
      });
    }

    const submitBtn = container.querySelector('#btn-reorder-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (selected.length < pool.length) return;
        onSubmit();
      });
    }
  }

  function handleBattleAnswer(isCorrect, chosenIdx) {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    battle.locked = true;
    stopBattleTimers();

    const q = battle.currentQ;
    const enemy = battle.enemy;
    const elapsedSec = (performance.now() - battle.qStartTime) / 1000;

    // Highlight buttons for 4-choice
    if (chosenIdx !== null) {
      document.querySelectorAll('#battle-options-container .option-btn').forEach((btn) => {
        const idx = Number(btn.getAttribute('data-opt-idx'));
        btn.disabled = true;
        if (idx === q.answerIndex) btn.classList.add('correct');
        else if (idx === chosenIdx && !isCorrect) btn.classList.add('wrong');
      });
    }

    if (isCorrect) {
      recordQuestionOutcomeInShuffleBag(q, true);
      // Early (not-yet-due) correct answers never raise SRS level — in any mode, so the
      // forgetting curve cannot be skipped from normal battles either (QA v1.4 BUG-5).
      const srsRes = advanceWrongNoteSRS(q.id, true, { requireDue: true });
      recordDailyTrainingProgress('correct', 1);
      battle.consecutiveCorrect += 1;
      battle.consecutiveWrong = 0;
      battle.combo += 1;
      state.stats.totalCorrect += 1;
      state.quests.dailyProgress.correct_answers += 1;
      state.stats.maxCombo = Math.max(state.stats.maxCombo, battle.combo);

      if (battle.isWrongNoteTraining) {
        if (!battle.masteredIdsInRun.includes(q.id)) {
          battle.masteredIdsInRun.push(q.id);
        }
        if (srsRes.mastered) {
          battle.trainingFullyMasteredCount = (battle.trainingFullyMasteredCount || 0) + 1;
        }
        battle.trainingQueue = (battle.trainingQueue || []).filter((id) => id !== q.id);
        const bonusExp = 15;
        const bonusGold = 12;
        gainGold(bonusGold);
        gainExp(bonusExp);
        battle.trainingExpEarned += bonusExp;
        battle.trainingGoldEarned += bonusGold;
        showToast(
          srsRes.advanced
            ? `✔ 錯題推進至 ${srsRes.label}！獲得 +${bonusExp} EXP、+${bonusGold} 金幣`
            : (srsRes.early
                ? `✔ 提前複習答對（${srsRes.label}）！+${bonusExp} EXP、+${bonusGold} 金幣`
                : `✔ 複習答對！+${bonusExp} EXP、+${bonusGold} 金幣`),
          'success'
        );
      } else if (srsRes.advanced) {
        showToast(`📓 錯題筆記記憶曲線提升：${srsRes.label}！`, 'success');
      }

      if (battle.consecutiveCorrect >= 3 && !battle.feverActive) {
        battle.feverActive = true;
        battle.difficultyOffset = 1;
        state.stats.feverCount += 1;
        state.quests.dailyProgress.reach_fever = (state.quests.dailyProgress.reach_fever || 0) + 1;
        showToast('⚡ FEVER TIME 啟動！攻擊火力 +25%、結算 EXP/金幣 ×1.5！', 'gold');
      } else if (battle.consecutiveCorrect >= 2 && battle.difficultyOffset < 0) {
        battle.difficultyOffset = 0;
      }

      // Dynamic Adaptive Difficulty step-up (N4 -> N3 -> N2 -> N1) on streak & speed
      if (state.settings.difficultyMode === 'adaptive') {
        const fastStreak = elapsedSec <= 8.5 && battle.consecutiveCorrect >= 2 && battle.consecutiveCorrect % 2 === 0;
        const steadyStreak = battle.consecutiveCorrect >= 3 && battle.consecutiveCorrect % 3 === 0;
        if ((fastStreak || steadyStreak) && battle.adaptiveLevelIdx < JLPT_LEVELS.length - 1) {
          battle.adaptiveLevelIdx += 1;
          showToast(`⚡ 自適應難度提升至 ${JLPT_LEVELS[battle.adaptiveLevelIdx]}！`, 'info');
        }
      }

      const isWeakness = q.type === enemy.weakness;
      const isFast = elapsedSec <= 10;
      let breakDmg = 0;
      if (isWeakness && isFast) breakDmg = 2;
      else if (isWeakness || isFast) breakDmg = 1;
      if (battle.insightActive && (state.skills.vocab_insight || 0) >= 3) {
        breakDmg += 1;
      }

      const stats = getTotalStats();
      const isCrit = Math.random() * 100 < stats.critRate;
      const insightLv = state.skills.vocab_insight || 0;
      const insightMult = battle.insightActive ? [1, 1, 1.20, 1.35][insightLv] : 1;
      const wasAlreadyStunned = battle.enemyStunned;

      // Fixed "answers per battle" damage model (player feedback: better gear used to mean
      // fewer questions per fight). Each correct answer deals maxHp / requiredHits; in-battle
      // performance (combo, FEVER, stun, crit, insight) can speed it up, but only up to
      // BATTLE_PERFORMANCE_CAP, so a fight always needs >= ceil(requiredHits / cap) answers
      // no matter how strong the gear is.
      const requiredHits = getRequiredHits(enemy);
      const perHit = battle.enemyMaxHp / requiredHits;
      const performanceMult = Math.min(
        BATTLE_PERFORMANCE_CAP,
        (1 + Math.min(battle.combo, 10) * 0.08) *
        (battle.feverActive ? 1.25 : 1.0) *
        (wasAlreadyStunned ? 1.6 : 1.0) *
        (isCrit ? 1.5 : 1.0) *
        insightMult
      );
      let dmg = Math.max(1, Math.round(perHit * performanceMult));

      if (battle.isWrongNoteTraining) {
        const remainingToMaster = Math.max(0, battle.trainingTotal - battle.masteredIdsInRun.length);
        if (remainingToMaster <= 0) {
          dmg = battle.enemyHp;
        } else {
          const slice = Math.max(10, Math.round(battle.enemyMaxHp / Math.max(1, battle.trainingTotal)));
          dmg = Math.min(Math.max(1, battle.enemyHp - remainingToMaster), slice);
        }
      }

      battle.enemyHp = Math.max(0, battle.enemyHp - dmg);

      let brokeNow = false;
      if (!wasAlreadyStunned && breakDmg > 0) {
        battle.enemyBreak = Math.max(0, battle.enemyBreak - breakDmg);
        if (battle.enemyBreak <= 0) {
          battle.enemyStunned = true;
          battle.stunJustTriggered = true;
          brokeNow = true;
          state.stats.breaksTriggered += 1;
        }
      }

      const attackLines = HERO_BATTLE_LINES.attack;
      const heroAttackLine = brokeNow
        ? HERO_BATTLE_LINES.break
        : isCrit
          ? HERO_BATTLE_LINES.crit
          : attackLines[battle.attackLineCount % attackLines.length];
      battle.attackLineCount = (battle.attackLineCount || 0) + 1;

      showHeroSpeech(heroAttackLine.jp, heroAttackLine.zh, brokeNow ? 'speech-victory' : 'speech-attack');
      setBattlePoses('attack', brokeNow ? 'break' : 'hit');

      if (brokeNow) {
        Audio.playSFX('break');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-shake');
        spawnFloatingNumber('enemy', 'BREAK! 破防暈眩!', 'num-break');
        setTimeout(() => spawnFloatingNumber('enemy', `-${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'num-crit' : 'num-dmg'), 140);
        const brkLine = formatSpeechLine(enemy.breakLine);
        showEnemySpeech(
          brkLine.jp || 'ぐわぁっ……！<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>障壁<rt>しょうへき</rt></ruby>が……！',
          brkLine.zh || '言靈障壁被徹底擊碎了！'
        );
      } else {
        Audio.playSFX(isCrit ? 'crit' : 'correct');
        triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-shake');
        spawnFloatingNumber('enemy', `-${dmg}${isCrit ? ' CRIT!' : ''}`, isCrit ? 'num-crit' : 'num-dmg');
        if (enemy.hitLine && Math.random() < 0.5) {
          const hit = formatSpeechLine(enemy.hitLine);
          showEnemySpeech(hit.jp, hit.zh);
        }
      }

      battle.insightActive = false;
      checkBossPhaseTransition();
      updateBattleUI();
      updateHUD();

      if (battle.enemyHp <= 0) {
        setTimeout(() => {
          if (!battle.active) return;
          setBattlePoses('victory', 'defeat');
          showHeroSpeech(HERO_BATTLE_LINES.victory.jp, HERO_BATTLE_LINES.victory.zh, 'speech-victory');
        }, 450);
        setTimeout(() => handleBattleVictory(), 1100);
      } else {
        setTimeout(() => {
          if (!battle.active) return;
          if (wasAlreadyStunned) {
            // Enemy spent its stunned turn taking 1.6x damage; now recover shield
            battle.enemyStunned = false;
            battle.enemyBreak = battle.enemyBreakMax;
            showEnemySpeech(`${enemy.name} 重聚魔氣，修復了言靈障壁！`);
          }
          battle.stunJustTriggered = false;
          nextBattleQuestion();
        }, 900);
      }
    } else {
      // Wrong Answer -> Friendly Capped Damage + MANDATORY Teaching Explanation Modal
      recordQuestionOutcomeInShuffleBag(q, false);
      battle.consecutiveWrong += 1;
      battle.consecutiveCorrect = 0;
      battle.combo = 0;
      battle.feverActive = false;
      if (battle.consecutiveWrong >= 2) {
        battle.difficultyOffset = -1;
        if (state.settings.difficultyMode === 'adaptive' && battle.adaptiveLevelIdx > 0) {
          battle.adaptiveLevelIdx = Math.max(0, battle.adaptiveLevelIdx - 1);
          showToast(`🌿 言靈共鳴調降為 ${JLPT_LEVELS[battle.adaptiveLevelIdx]}（保底 N4）`, 'info');
        }
      }

      state.stats.totalWrong += 1;
      recordWrongNote(q.id, chosenIdx !== null && chosenIdx !== undefined ? chosenIdx : -1);
      if (battle.isWrongNoteTraining) {
        battle.trainingQueue = (battle.trainingQueue || []).filter((id) => id !== q.id);
        battle.trainingQueue.push(q.id);
      }

      const stats = getTotalStats();
      let dmg = 0;
      let damageNotice = '';

      if (battle.enemyStunned) {
        dmg = 0;
        damageNotice = '💫 魔物破防失衡，未能反擊';
        battle.enemyStunned = false;
        battle.enemyBreak = battle.enemyBreakMax;
        spawnFloatingNumber('player', 'STUNNED 0', 'num-shield');
      } else {
        const rawAtk = Number(enemy.atk || 18);
        const wisRed = stats.wisDmgReduce;
        const shieldLv = state.skills.grammar_shield || 0;
        const shieldRed = [0, 0.50, 0.58, 0.65][shieldLv];
        const reduced = Math.round(rawAtk * (1 - wisRed) * (1 - shieldRed));
        const cap = Math.max(1, Math.floor(stats.maxHp * 0.35));
        dmg = Math.max(1, Math.min(reduced, cap));

        state.player.hp = Math.max(0, state.player.hp - dmg);

        if (shieldLv >= 3) {
          state.player.mp = Math.min(stats.maxMp, state.player.mp + 5);
        }

        // Short line only — the WIS / shield breakdown lives in the character screen
        damageNotice = `💥 承受魔氣反噬 <strong>-${dmg} HP</strong>${shieldLv >= 3 ? "（護盾回流 +5 MP）" : ""}`;
        spawnFloatingNumber('player', `-${dmg}`, 'num-enemy-dmg');
      }

      Audio.playSFX('wrong');
      const hurtLines = HERO_BATTLE_LINES.hurt;
      const hurtLine = hurtLines[(battle.consecutiveWrong - 1) % hurtLines.length];
      showHeroSpeech(hurtLine.jp, hurtLine.zh, 'speech-hurt');
      setBattlePoses('hurt', dmg > 0 ? 'attack' : 'break');
      triggerCombatAnim('#view-battle .combatant-card.player-side', 'anim-shake');
      battle.insightActive = false;
      updateBattleUI();
      updateHUD();
      autoSave();

      // Open MANDATORY Teaching Modal (only closes on clicking 「我已理解」)
      openExplainModal(q, damageNotice, () => {
        if (!battle.active) return;
        if (state.player.hp <= 0) {
          const total = getTotalStats();
          state.player.hp = Math.max(1, Math.round(total.maxHp * 0.3));
          battle.active = false;
          stopBattleTimers();
          autoSave();
          showToast('🕊️ 體力耗盡，結界已將你平安送回黎明之村（未損失金幣與經驗值，保留 30% HP）。', 'warning');
          switchView('town');
        } else {
          nextBattleQuestion();
        }
      });
    }
  }

  function handleBattleVictory() {
    if (!battle.active || !battle.enemy) return;
    stopBattleTimers();
    const enemy = battle.enemy;
    const regionId = battle.regionId;
    const feverMult = battle.feverActive ? 1.5 : 1.0;
    const isDemonRealm = state.settings.difficultyMode === 'fixed_n1';
    const n1ExpMult = isDemonRealm ? 2.0 : 1.0;
    const n1DropMult = isDemonRealm ? 2.0 : 1.0;

    const baseExp = Number(enemy.exp ?? enemy.expReward ?? (enemy.isBoss ? 120 : 40));
    const baseGold = Number(enemy.gold ?? enemy.goldReward ?? (enemy.isBoss ? 140 : 35));
    const routeMult = battle.rewardMult || 1;
    const finalExp = Math.round(baseExp * feverMult * n1ExpMult * routeMult);
    const finalGold = Math.round(baseGold * feverMult * routeMult);

    state.stats.battlesWon += 1;
    state.quests.dailyProgress.win_battles += 1;
    if (!battle.isWrongNoteTraining && !state.stats.defeatedEnemies.includes(enemy.id)) {
      state.stats.defeatedEnemies.push(enemy.id);
    }

    if (battle.isWrongNoteTraining) {
      const masteredCount = battle.masteredIdsInRun.length;
      const bonusExp = 20;
      const bonusGold = 15;
      gainGold(bonusGold);
      const lvRes = gainExp(bonusExp);
      const totalExpShown = battle.trainingExpEarned + bonusExp;
      const totalGoldShown = battle.trainingGoldEarned + bonusGold;

      Audio.playSFX('victory');
      setBattlePoses('victory', 'defeat');
      battle.active = false;
      checkAchievements();
      autoSave();
      updateHUD();

      const trainingHeroHtml = `<div class="victory-portrait-banner">
        <div class="victory-portrait-art">${Art.hero(state.player.jobId, 'victory')}</div>
        <div class="victory-portrait-quote">
          <div class="jp-text">「忘却の霧を斬り払い、己の弱点を乗り越えた！」</div>
          <div class="text-muted" style="font-size:0.84rem;margin-top:4px;">已斬斷遺忘迷霧，徹底克服過往的言靈弱點！</div>
        </div>
      </div>`;

      const trainingLines = [
        `<div class="panel-card" style="padding:10px 14px;border-left:3px solid var(--emerald);background:rgba(6,78,59,0.22);font-size:1.05rem;font-weight:700;color:#a7f3d0;">🎉 本次成功攻克 ${masteredCount} 題錯題！</div>`,
        `🧠 SRS 記憶曲線已自動排程下次複習${battle.trainingFullyMasteredCount > 0 ? `（其中 <strong>${battle.trainingFullyMasteredCount} 題</strong> 已達 Lv.4 完全掌握！）` : '（答對 1/3/7 天後再次複習，連破 4 階即完全掌握）'}`,
        `⭐ 特訓累計獲得經驗：<strong>+${totalExpShown} EXP</strong>（含通關獎勵 +${bonusExp}）`,
        `🪙 特訓累計獲得金幣：<strong>+${totalGoldShown} 金幣</strong>（含通關獎勵 +${bonusGold}）`
      ];
      if (lvRes.leveledUp) {
        trainingLines.push(`🎊 升級至 <strong>Lv.${state.player.level}</strong>（SP +${lvRes.levelsGained}）！`);
      }

      showGenericModal(
        '📓 記憶試煉完成・錯題特訓勝利！',
        `${trainingHeroHtml}<div style="display:flex;flex-direction:column;gap:8px;font-size:0.96rem;">${trainingLines.map((l) => `<div>${l}</div>`).join('')}</div>`,
        '📓',
        () => switchView('notes')
      );
      return;
    }

    const rewardLines = [
      `⭐ 獲得經驗值：<strong>+${finalExp} EXP</strong>${battle.feverActive ? ' <span class="badge badge-gold">FEVER ×1.5</span>' : ''}${isDemonRealm ? ' <span class="badge badge-crimson">🔥 N1 魔境 EXP ×2</span>' : ''}`,
      `🪙 獲得金幣：<strong>+${finalGold} 金幣</strong>${routeMult > 1 ? ` <span class="badge badge-gold">${escapeHtml(battle.rewardLabel || "路線")} ×${routeMult}</span>` : ""}`
    ];
    if (isDemonRealm) {
      rewardLines.push('🔥 <strong>N1 魔境挑戰加成生效：</strong>經驗值雙倍、戰利品掉落率 ×2！');
    }

    gainGold(finalGold);
    const lvRes = gainExp(finalExp);
    if (lvRes.leveledUp) {
      rewardLines.push(`🎉 升級至 <strong>Lv.${state.player.level}</strong>（SP +${lvRes.levelsGained}）！`);
    }

    // Elite first-clear: opens the road past EXPLORE_ELITE_AT in this region
    if (enemy.isElite && !state.progress.defeatedElites.includes(regionId)) {
      state.progress.defeatedElites.push(regionId);
      rewardLines.push(`⚔️ 擊敗精英！<strong>前方的道路已開啟</strong>，可以繼續探索。`);
      addExploreLog(`⚔️ 擊敗精英【${enemy.name}】，道路已開啟！`, 'battle');
    }

    // Boss first-clear & region unlock
    let bossStoryHtml = '';
    if (enemy.isBoss) {
      const defLine = formatSpeechLine(enemy.defeatLine);
      if (defLine.jp || defLine.zh) {
        bossStoryHtml = `<div class="panel-card" style="padding:12px;margin-bottom:12px;border-left:3px solid var(--gold);">
          <div class="jp-text">${defLine.jp}</div>
          ${defLine.zh ? `<div class="text-muted" style="font-size:0.86rem;margin-top:4px;">${escapeHtml(defLine.zh)}</div>` : ''}
        </div>`;
      }
      const isFirstBossClear = !state.progress.defeatedBosses.includes(regionId);
      if (isFirstBossClear) {
        state.progress.defeatedBosses.push(regionId);
        const fcr = enemy.firstClearReward;
        if (fcr && typeof fcr === 'object') {
          if (fcr.gold) {
            gainGold(fcr.gold);
            rewardLines.push(`🪙 首通加碼金幣：<strong>+${fcr.gold} 金幣</strong>`);
          }
          if (fcr.exp) {
            const fLv = gainExp(fcr.exp);
            rewardLines.push(`⭐ 首通加碼經驗：<strong>+${fcr.exp} EXP</strong>`);
            if (fLv.leveledUp) {
              rewardLines.push(`🎉 升級至 <strong>Lv.${state.player.level}</strong>！`);
            }
          }
          if (fcr.itemId && getItemById(fcr.itemId)) {
            addItem(fcr.itemId, 1);
            rewardLines.push(`🎁 首通秘寶：<strong>【${getItemById(fcr.itemId).name}】</strong>`);
          }
        } else {
          const firstItem = enemy.firstClearItem || (typeof fcr === 'string' ? fcr : null) || enemy.dropItemId;
          if (firstItem && getItemById(firstItem)) {
            addItem(firstItem, 1);
            rewardLines.push(`🎁 首通秘寶：<strong>【${getItemById(firstItem).name}】</strong>`);
          }
        }
        const regions = getRegions();
        const nextRegion = regions.find((r) => r.prevRegionId === regionId);
        if (nextRegion) {
          rewardLines.push(`🗺️ 解鎖新區域：<strong>【${nextRegion.name}（${nextRegion.jlpt}）】</strong>！`);
        }
      }
    } else {
      // Chance for normal drop from enemy or region.dropTable (2x chance in N1 Demon Realm mode)
      const region = getRegionById(regionId);
      const dropTable = region && Array.isArray(region.dropTable) ? region.dropTable : [];
      let droppedId = null;
      for (let i = 0; i < dropTable.length; i++) {
        const effChance = Math.min(0.95, Number(dropTable[i].chance || 0.2) * n1DropMult);
        if (Math.random() < effChance) {
          droppedId = dropTable[i].itemId;
          break;
        }
      }
      if (!droppedId) {
        const directDrop = enemy.dropItemId || (Array.isArray(enemy.drops) && enemy.drops[0]);
        if (directDrop && Math.random() < Math.min(0.95, 0.35 * n1DropMult)) droppedId = directDrop;
      }
      if (droppedId && getItemById(droppedId)) {
        addItem(droppedId, 1);
        rewardLines.push(`🎁 戰利品掉落：<strong>【${getItemById(droppedId).name}】</strong>${isDemonRealm ? ' <span class="badge badge-crimson">🔥 掉落 ×2</span>' : ''}`);
      }
    }

    Audio.playSFX('victory');
    setBattlePoses('victory', 'defeat');
    battle.active = false;
    checkAchievements();
    autoSave();
    updateHUD();

    const victoryHeroHtml = `<div class="victory-portrait-banner">
      <div class="victory-portrait-art">${Art.hero(state.player.jobId, 'victory')}</div>
      <div class="victory-portrait-quote">
        <div class="jp-text">「${HERO_BATTLE_LINES.victory.jp}」</div>
        <div class="text-muted" style="font-size:0.84rem;margin-top:4px;">${escapeHtml(HERO_BATTLE_LINES.victory.zh)}</div>
      </div>
    </div>`;

    const targetView = battle.returnView || 'explore';
    showGenericModal(
      enemy.isBoss ? `🏆 首領討伐成功：${enemy.name}` : `⚔️ 戰鬥勝利：擊敗 ${enemy.name}`,
      `${victoryHeroHtml}${bossStoryHtml}<div style="display:flex;flex-direction:column;gap:8px;font-size:0.96rem;">
        ${rewardLines.map((l) => `<div>${l}</div>`).join('')}
      </div>`,
      enemy.isBoss ? '👑' : '⚔️',
      () => switchView(targetView)
    );
  }

  function useVocabInsight() {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    const lv = state.skills.vocab_insight || 0;
    if (lv <= 0) {
      showToast('尚未習得【單字洞察】，可至技能樹以 1 SP 解鎖！', 'warning');
      return;
    }
    if (state.player.mp < 10) {
      showToast('💧 言靈魔力不足（需 10 MP）！', 'warning');
      return;
    }
    if (battle.insightActive) return;

    state.player.mp -= 10;
    battle.insightActive = true;
    const q = battle.currentQ;
    const qCard = $('battle-question-card');
    if (qCard) qCard.classList.add('force-furigana');

    const hintEl = $('battle-q-hint');
    let effectSummary = '';

    if (q.type === 'reorder' && Array.isArray(q.chunks) && q.chunks.length > 0) {
      const hintCount = lv >= 2 ? Math.min(2, q.chunks.length) : 1;
      const firstChunks = q.chunks.slice(0, hintCount);
      const firstIds = new Set(firstChunks.map((c) => c.id));
      const orderPreview = firstChunks.map((c, idx) => `第${idx + 1}塊「${c.plain || c.text}」`).join(' → ');
      document.querySelectorAll('#battle-options-container [data-add-id]').forEach((chipBtn) => {
        const cid = Number(chipBtn.getAttribute('data-add-id'));
        if (firstIds.has(cid)) {
          chipBtn.classList.add('chip-insight-hint');
        }
      });
      if (hintEl) {
        hintEl.textContent = `👁️ 洞察提示：${orderPreview}${q.hint ? `｜${q.hint}` : ''}`;
        hintEl.classList.remove('hidden');
      }
      effectSummary = `已標示前 ${hintCount} 個語塊順序`;
    } else {
      // 4-choice question: eliminate 1 wrong option at Lv.1, 2 wrong options at Lv.2/Lv.3
      const elimCount = lv >= 2 ? 2 : 1;
      const optionBtns = Array.from(document.querySelectorAll('#battle-options-container .option-btn'));
      const wrongBtns = optionBtns.filter((btn) => {
        const idx = Number(btn.getAttribute('data-opt-idx'));
        return idx !== q.answerIndex && !btn.disabled;
      });
      const toEliminate = shuffleArray(wrongBtns).slice(0, elimCount);
      toEliminate.forEach((btn) => {
        btn.disabled = true;
        btn.classList.add('eliminated');
        if (!btn.querySelector('.eliminated-tag')) {
          const tag = document.createElement('span');
          tag.className = 'eliminated-tag';
          tag.textContent = '✕ 已排除';
          btn.appendChild(tag);
        }
      });
      if (hintEl && q.hint) {
        hintEl.textContent = `👁️ 洞察提示：${q.hint}`;
        hintEl.classList.remove('hidden');
      }
      effectSummary = `已劃除 ${toEliminate.length} 個錯誤選項`;
    }

    Audio.playSFX('skill');
    showHeroSpeech(HERO_BATTLE_LINES.skillVocab.jp, HERO_BATTLE_LINES.skillVocab.zh, 'speech-skill');
    setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 1100);
    const extra = lv === 3 ? '（本題傷害 +35%、破防 +1）' : lv === 2 ? '（本題傷害 +20%）' : '';
    showToast(`👁️ 發動【單字洞察 Lv.${lv}】！${effectSummary}並顯示提示${extra}`, 'info');
    updateBattleUI();
    updateHUD();
  }

  function useClairaudience() {
    if (!battle.active || battle.locked || !battle.currentQ) return;
    const lv = state.skills.clairaudience || 0;
    if (lv <= 0) {
      showToast('尚未習得【順風耳】，可至技能樹以 1 SP 解鎖！', 'warning');
      return;
    }
    if (state.player.mp < 10) {
      showToast('💧 言靈魔力不足（需 10 MP）！', 'warning');
      return;
    }

    state.player.mp -= 10;
    const stats = getTotalStats();
    const ratio = [0, 0.15, 0.22, 0.30][lv];
    const heal = Math.max(10, Math.round(stats.maxHp * ratio));
    state.player.hp = Math.min(stats.maxHp, state.player.hp + heal);

    Audio.playSFX('heal');
    Audio.speak(battle.currentQ.tts || stripRubyHtml(battle.currentQ.fullRubyJp), 0.65);
    showHeroSpeech(HERO_BATTLE_LINES.skillListen.jp, HERO_BATTLE_LINES.skillListen.zh, 'speech-skill');
    setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 1100);
    spawnFloatingNumber('player', `+${heal} HP`, 'num-heal');
    showToast(`🎐 發動【順風耳 Lv.${lv}】！慢速重播語音並回復 +${heal} HP`, 'success');
    updateBattleUI();
    updateHUD();
  }

  function useBattleConsumable(itemId) {
    if (!battle.active || battle.locked) return;
    const item = getItemById(itemId);
    if (!item || !removeItem(itemId, 1)) return;

    const stats = getTotalStats();
    const eff = item.effect || {};
    const effType = eff.type || '';
    const itemSpeechJp = `【${escapeHtml(item.name)}】を<ruby>使<rt>つか</rt></ruby>う！`;
    const itemSpeechZh = `使用【${item.name}】！`;

    if (itemId === 'con_herb' || effType === 'heal_hp' || eff.healHpPct || eff.hp) {
      const val = eff.healHpPct
        ? Math.max(10, Math.round((stats.maxHp * Number(eff.healHpPct)) / 100))
        : Number(eff.value || eff.hp || Math.round(stats.maxHp * 0.45));
      state.player.hp = Math.min(stats.maxHp, state.player.hp + val);
      Audio.playSFX('heal');
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-skill');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 900);
      spawnFloatingNumber('player', `+${val} HP`, 'num-heal');
      showToast(`🧪 使用【${item.name}】，回復 +${val} HP！`, 'success');
    } else if (itemId === 'con_water' || effType === 'heal_mp' || eff.healMpPct || eff.mp) {
      const val = eff.healMpPct
        ? Math.max(8, Math.round((stats.maxMp * Number(eff.healMpPct)) / 100))
        : Number(eff.value || eff.mp || Math.round(stats.maxMp * 0.5));
      state.player.mp = Math.min(stats.maxMp, state.player.mp + val);
      Audio.playSFX('skill');
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-skill');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 900);
      spawnFloatingNumber('player', `+${val} MP`, 'num-shield');
      showToast(`🧪 使用【${item.name}】，回復 +${val} MP！`, 'info');
    } else if (itemId === 'con_break_scroll' || effType === 'break' || eff.breakDamage) {
      const bVal = Number(eff.breakDamage || eff.value || 2);
      const bonusDmg = Number(eff.bonusDamage || 25);
      battle.enemyHp = Math.max(0, battle.enemyHp - bonusDmg);
      if (!battle.enemyStunned) {
        battle.enemyBreak = Math.max(0, battle.enemyBreak - bVal);
        if (battle.enemyBreak <= 0) {
          battle.enemyStunned = true;
          battle.stunJustTriggered = true;
          state.stats.breaksTriggered += 1;
          Audio.playSFX('break');
          triggerCombatAnim('#view-battle .combatant-card.enemy-side', 'anim-break-flash');
          spawnFloatingNumber('enemy', 'BREAK! 破防暈眩!', 'num-break');
        } else {
          Audio.playSFX('skill');
          spawnFloatingNumber('enemy', `護盾 -${bVal}`, 'num-break');
        }
      }
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-attack');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'hit', 950);
      if (bonusDmg > 0) {
        setTimeout(() => spawnFloatingNumber('enemy', `-${bonusDmg}`, 'num-dmg'), 120);
      }
      showToast(`📜 使用【${item.name}】，造成 ${bVal} 點破防與 ${bonusDmg} 點傷害！`, 'gold');
      checkBossPhaseTransition();
      if (battle.enemyHp <= 0) {
        autoSave();
        updateBattleUI();
        updateHUD();
        setTimeout(() => {
          if (!battle.active) return;
          setBattlePoses('victory', 'defeat');
          showHeroSpeech(HERO_BATTLE_LINES.victory.jp, HERO_BATTLE_LINES.victory.zh, 'speech-victory');
        }, 420);
        setTimeout(() => handleBattleVictory(), 1050);
        return;
      }
    } else if (itemId === 'con_fever_charm' || effType === 'fever' || eff.feverInstant) {
      battle.feverActive = true;
      battle.combo = Math.max(battle.combo, 3);
      showHeroSpeech(itemSpeechJp, itemSpeechZh, 'speech-victory');
      setBattlePoses('attack', battle.enemyStunned ? 'break' : 'idle', 950);
      battle.consecutiveCorrect = Math.max(battle.consecutiveCorrect, 3);
      state.stats.feverCount += 1;
      state.quests.dailyProgress.reach_fever = (state.quests.dailyProgress.reach_fever || 0) + 1;
      if (eff.healHpPct) {
        const healVal = Math.max(10, Math.round((stats.maxHp * Number(eff.healHpPct)) / 100));
        state.player.hp = Math.min(stats.maxHp, state.player.hp + healVal);
        spawnFloatingNumber('player', `+${healVal} HP`, 'num-heal');
      }
      Audio.playSFX('levelup');
      spawnFloatingNumber('player', 'FEVER!', 'num-crit');
      showToast(`⚡ 使用【${item.name}】，立即進入 FEVER TIME！`, 'gold');
    } else {
      // Generic heal fallback
      const val = Math.round(stats.maxHp * 0.35);
      state.player.hp = Math.min(stats.maxHp, state.player.hp + val);
      Audio.playSFX('heal');
      spawnFloatingNumber('player', `+${val} HP`, 'num-heal');
    }

    autoSave();
    updateBattleUI();
    updateHUD();
  }

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
        Audio.playSFX('confirm');
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
          Audio.speak(text, rate);
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
            state.quests.dailyProgress.correct_answers += 1;
            recordDailyTrainingProgress('correct', 1);
            const rdSrs = advanceWrongNoteSRS(noteId, true, { requireDue: true });
            if (rdSrs.advanced) showToast(`📓 閱讀錯題記憶曲線提升：${rdSrs.label}！`, 'success');
            Audio.playSFX('correct');
          } else {
            state.stats.totalWrong += 1;
            recordWrongNote(noteId, chosen);
            Audio.playSFX('wrong');
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
    Audio.playSFX('skill');

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
      Audio.playSFX('victory');
    } else {
      Audio.playSFX('click');
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

    Audio.playSFX('boss_enter');
    Audio.playBGM('battle');
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
        ? '<span class="text-cyan">🎧 聽力試題：點擊上方「🔊 朗讀題目」後作答</span>'
        : q.promptJp;
    }

    const ttsBtn = $('btn-shrine-tts');
    if (ttsBtn) {
      ttsBtn.onclick = () => Audio.speak(q.tts || stripRubyHtml(q.promptJp), 1.0);
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
      Audio.speak(q.tts, 1.0);
    }
  }

  function recordShrineAnswer(q, isCorrect, userDisplay) {
    Audio.playSFX(isCorrect ? 'correct' : 'wrong');
    shrine.results.push({ q, isCorrect, userDisplay });

    if (isCorrect) {
      state.stats.totalCorrect += 1;
      state.quests.dailyProgress.correct_answers += 1;
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
    Audio.stopSpeak();
    shrine.active = false;
    updateChromeVisibility('shrine');
    Audio.playBGM('town');

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
    state.quests.dailyProgress.complete_shrine += 1;
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

    Audio.playSFX(rank === 'S' || rank === 'A' ? 'victory' : 'confirm');
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

  // ============================================================================
  // 16. Character, Skill Tree, Inventory, Quests & Codex
  // ============================================================================
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
        Audio.playSFX('click');
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

    const titleSelect = $('char-title-select');
    if (titleSelect) {
      titleSelect.innerHTML = p.unlockedTitles.map((t) =>
        `<option value="${escapeHtml(t)}" ${t === p.activeTitle ? 'selected' : ''}>${escapeHtml(t)}</option>`
      ).join('');
      titleSelect.onchange = () => {
        state.player.activeTitle = titleSelect.value;
        Audio.playSFX('click');
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
        Audio.playSFX('levelup');
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
        Audio.playSFX('click');
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
        Audio.playSFX('levelup');
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
          Audio.playSFX('heal');
          showToast(`💚 使用【${item.name}】，回復 +${val} HP！`, 'success');
        } else {
          const val = eff.healMpPct
            ? Math.max(8, Math.round((stats.maxMp * Number(eff.healMpPct)) / 100))
            : Number(eff.value || Math.round(stats.maxMp * 0.5));
          state.player.mp = Math.min(stats.maxMp, state.player.mp + val);
          Audio.playSFX('skill');
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
        Audio.playSFX('click');
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
      grantTitle(rew.title);
      parts.push(`👑 ${rew.title}`);
    }

    Audio.playSFX('levelup');
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
    let anyNew = false;

    list.forEach((ach) => {
      if (state.achievements.includes(ach.id)) return;
      const prog = evaluateGoalProgress(ach);
      if (prog.done) {
        state.achievements.push(ach.id);
        anyNew = true;
        const rew = ach.rewards || ach.reward || {};
        const notes = [];
        if (rew.gold) { gainGold(rew.gold); notes.push(`🪙 +${rew.gold}`); }
        if (rew.exp) { gainExp(rew.exp); notes.push(`⭐ +${rew.exp} EXP`); }
        if (rew.sp) { state.player.sp += Number(rew.sp); notes.push(`✨ +${rew.sp} SP`); }
        if (rew.title) { grantTitle(rew.title); notes.push(`👑 稱號「${rew.title}」`); }

        Audio.playSFX('levelup');
        showToast(
          `🏆 成就解鎖：【${ach.title || ach.name}】${notes.length ? `（${notes.join('、')}）` : ''}`,
          'achievement'
        );
      }
    });

    if (anyNew) autoSave();
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
          Audio.speak(q.tts || stripRubyHtml(q.fullRubyJp), Number(btn.getAttribute('data-rate')) || 1.0);
        });
      });

      contentEl.querySelectorAll('[data-master-q]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const qid = btn.getAttribute('data-master-q');
          state.mistakes = state.mistakes.filter((m) => m.questionId !== qid);
          Audio.playSFX('correct');
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
    Audio.playSFX('confirm');
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

    Audio.playSFX('confirm');
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
          Audio.playSFX('click');
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
      if (goBtn) goBtn.addEventListener('click', () => { Audio.playSFX('click'); switchView('map'); });
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
          Audio.playSFX('click');
          uiNotesFilter = { jlpt: 'all', type: 'all', status: 'all' };
          renderNotes();
        });
      }
      const goBtn = $('btn-notes-go-battle');
      if (goBtn) goBtn.addEventListener('click', () => { Audio.playSFX('click'); switchView('map'); });
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
        if (text) Audio.speak(text, rate);
      });
    });

    listEl.querySelectorAll('[data-note-remove]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nid = btn.getAttribute('data-note-remove');
        Audio.playSFX('click');
        removeWrongNote(nid);
      });
    });
  }

  // ============================================================================
  // 17. Save / Load Modal
  // ============================================================================
  function openSaveModal(loadOnly = false) {
    saveModalLoadOnly = Boolean(loadOnly || !hasActiveSession);
    renderSaveModal();
    openModal('modal-save');
  }

  function renderSaveModal() {
    const listEl = $('save-slots-list');
    if (!listEl) return;

    listEl.innerHTML = SAVE_SLOT_LIST.map((slot) => {
      const raw = readRawSlot(slot.key);
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
                <div class="text-muted" style="font-size:0.78rem;margin-top:2px;">存檔時間：${formatTimestamp(raw.savedAt)}</div>`
              : '<div class="text-muted" style="font-size:0.86rem;margin-top:4px;">（空欄位）</div>'
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
        Audio.playSFX('cancel');
        showToast('已刪除該存檔欄位。', 'info');
        renderSaveModal();
        if (currentView === 'title') renderTitle();
      });
    });
  }

  function exportSaveJsonCode() {
    let payload = null;
    if (hasActiveSession) {
      payload = JSON.parse(JSON.stringify(state));
      payload.version = SAVE_VERSION;
      payload.savedAt = new Date().toISOString();
    } else {
      const latestKey = findLatestSaveKey();
      if (latestKey) {
        payload = readRawSlot(latestKey);
      }
    }
    if (!payload || !payload.player) {
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

    Audio.playSFX('confirm');
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
    const trimmed = String(rawText || '').trim();
    if (!trimmed) {
      showToast('❌ 請先貼上 JSON 存檔碼後再點擊匯入。', 'error');
      return false;
    }

    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch (_) {
      Audio.playSFX('wrong');
      showToast('❌ 存檔碼格式錯誤（無效的 JSON），未覆蓋現有存檔。', 'error');
      return false;
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !parsed.player || typeof parsed.player !== 'object' || Array.isArray(parsed.player)) {
      Audio.playSFX('wrong');
      showToast('❌ 存檔碼缺少必要角色資料（player），未覆蓋現有存檔。', 'error');
      return false;
    }

    // Sanitize BEFORE touching any live timers/state, so a throw here leaves the session intact.
    let nextState;
    try {
      nextState = sanitizeSaveData(parsed);
    } catch (err) {
      Audio.playSFX('wrong');
      showToast('❌ 存檔碼內容損毀，無法解析，未覆蓋現有存檔。', 'error');
      return false;
    }

    // Confirm before replacing the live session / auto slot (autoSave writes SAVE_KEYS.auto).
    const existing = hasActiveSession ? state : readRawSlot(SAVE_KEYS.auto);
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
    Audio.stopSpeak();

    state = nextState;
    hasActiveSession = true;
    battle.active = false;
    shrine.active = false;
    reading.active = false;
    crossRegionNotifiedKeys = new Set();

    applyFuriganaSetting();
    autoSave();
    updateHUD();
    closeModal('modal-save');
    Audio.playSFX('levelup');
    showToast(`📥 存檔匯入成功！歡迎回來，${state.player.name}（Lv.${state.player.level}）！`, 'gold');

    if (currentView === 'title' || currentView === 'create' || currentView === 'battle') {
      switchView('town');
    } else {
      refreshActiveView();
    }
    return true;
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
    Audio.playSFX('levelup');
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
      default: break;
    }
  }

  // ============================================================================
  // 19. Global Event Binding & Bootstrap
  // ============================================================================
  function bindStaticEvents() {
    // Mobile Collapsible HUD toggle & resize handler
    if ($('btn-hud-collapse-toggle')) {
      $('btn-hud-collapse-toggle').addEventListener('click', () => {
        hudCollapsedMobile = !hudCollapsedMobile;
        Audio.playSFX('click');
        applyMobileHudCollapseState();
      });
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        applyMobileHudCollapseState();
      });
    }
    initHudHeightSync();

    // Delegated handler for Immersion Mode Chinese hint peek buttons (.btn-peek-zh)
    document.addEventListener('click', (e) => {
      const peekBtn = e.target && e.target.closest ? e.target.closest('.btn-peek-zh') : null;
      if (!peekBtn) return;
      e.stopPropagation();
      const wrap = peekBtn.closest('.zh-peek-wrap');
      if (!wrap) return;
      setZhPeekState(wrap, !wrap.classList.contains('zh-revealed'));
      Audio.playSFX('click');
    });

    // Top HUD controls
    if ($('btn-toggle-furigana')) {
      $('btn-toggle-furigana').addEventListener('click', () => {
        Audio.playSFX('click');
        cycleImmersionMode(false);
      });
    }
    if ($('btn-toggle-bgm')) {
      $('btn-toggle-bgm').addEventListener('click', () => {
        Audio.toggleBGM();
        syncAudioButtons();
      });
    }
    if ($('btn-toggle-sfx')) {
      $('btn-toggle-sfx').addEventListener('click', () => {
        Audio.toggleSFX();
        syncAudioButtons();
      });
    }
    if ($('hud-difficulty-select')) {
      $('hud-difficulty-select').addEventListener('change', (e) => {
        Audio.playSFX('click');
        setDifficultyMode(e.target.value, { refreshCurrentBattleQuestion: true });
      });
    }
    if ($('btn-open-save')) {
      $('btn-open-save').addEventListener('click', () => {
        Audio.playSFX('click');
        openSaveModal(false);
      });
    }

    // Bottom dock (5 groups) → delegates to the matching #nav-bar button
    document.querySelectorAll('#nav-dock .dock-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.getAttribute('data-group');
        if (group) openNavGroup(group);
      });
    });

    // HUD ⚙ settings popover: toggle, close on outside click / Escape
    if ($('btn-hud-settings')) {
      $('btn-hud-settings').addEventListener('click', (e) => {
        e.stopPropagation();
        Audio.playSFX('click');
        const hud = $('top-hud');
        setHudSettingsOpen(!(hud && hud.classList.contains('settings-open')));
      });
      document.addEventListener('click', (e) => {
        const menu = $('hud-settings-menu');
        if (menu && !menu.contains(e.target)) setHudSettingsOpen(false);
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && $('top-hud') && $('top-hud').classList.contains('settings-open')) {
          setHudSettingsOpen(false);
          $('btn-hud-settings').focus();
        }
      });
    }

    // Main Navigation Bar (now the group sub-tab strip)
    document.querySelectorAll('#nav-bar .nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (!view) return;
        Audio.playSFX('click');
        if (view === 'reading') {
          reading.active = false;
          const p = $('reading-paragraphs');
          if (p) p.removeAttribute('data-rd-rendered');
        }
        if (view === 'shrine' && !shrine.active) {
          shrine.results = [];
          shrine.tier = null;
        }
        switchView(view);
      });
    });

    // Title Screen buttons
    if ($('btn-title-continue')) {
      $('btn-title-continue').addEventListener('click', () => {
        const key = findLatestSaveKey();
        if (key) loadFromSlot(key);
      });
    }
    if ($('btn-title-new')) {
      $('btn-title-new').addEventListener('click', () => {
        Audio.init();
        Audio.playSFX('confirm');
        switchView('create');
      });
    }
    if ($('btn-title-load')) {
      $('btn-title-load').addEventListener('click', () => {
        Audio.init();
        Audio.playSFX('click');
        openSaveModal(true);
      });
    }

    // Character Creation buttons
    if ($('btn-create-confirm')) {
      $('btn-create-confirm').addEventListener('click', confirmCharacterCreation);
    }
    if ($('btn-create-back')) {
      $('btn-create-back').addEventListener('click', () => {
        Audio.playSFX('cancel');
        switchView('title');
      });
    }

    // Town Quick Actions & Dialogue Speech Click-to-Complete
    if ($('btn-town-rest')) {
      $('btn-town-rest').addEventListener('click', () => {
        const stats = getTotalStats();
        state.player.hp = stats.maxHp;
        state.player.mp = stats.maxMp;
        Audio.playSFX('heal');
        autoSave();
        updateHUD();
        showToast('🛏️ 於宿屋安穩歇息，體力與言靈魔力已完全充盈！', 'success');
      });
    }
    if ($('btn-town-map')) $('btn-town-map').addEventListener('click', () => { Audio.playSFX('click'); switchView('map'); });
    if ($('btn-town-reading')) $('btn-town-reading').addEventListener('click', () => { Audio.playSFX('click'); reading.active = false; switchView('reading'); });
    if ($('btn-town-shrine')) $('btn-town-shrine').addEventListener('click', () => { Audio.playSFX('click'); shrine.results = []; shrine.tier = null; switchView('shrine'); });

    // Anti-misclick AVG skip: bind click ONLY on #dialogue-text-jp and #dialogue-text-zh
    ['dialogue-text-jp', 'dialogue-text-zh'].forEach((id) => {
      const textEl = $(id);
      if (textEl) {
        textEl.addEventListener('click', (e) => {
          if (townState.typingActive) {
            e.stopPropagation();
            completeTypewriterImmediately();
          }
        });
      }
    });
    if ($('btn-dialogue-tts')) {
      $('btn-dialogue-tts').addEventListener('click', (e) => {
        e.stopPropagation();
        if (townState.currentTts) Audio.speak(townState.currentTts, 1.0);
      });
    }
    if ($('btn-dialogue-tts-slow')) {
      $('btn-dialogue-tts-slow').addEventListener('click', (e) => {
        e.stopPropagation();
        if (townState.currentTts) Audio.speak(townState.currentTts, 0.65);
      });
    }

    // Explore buttons
    if ($('btn-explore-retreat')) $('btn-explore-retreat').addEventListener('click', () => { Audio.playSFX('click'); explorePendingEvent = null; switchView('map'); });
    // Route buttons pass an explicit route (handleExploreStep ignores it after 100% / at the elite gate)
    if ($('btn-explore-step')) $('btn-explore-step').addEventListener('click', () => handleExploreStep('safe'));
    if ($('btn-explore-risky')) $('btn-explore-risky').addEventListener('click', () => handleExploreStep('risky'));
    if ($('btn-explore-boss')) $('btn-explore-boss').addEventListener('click', () => triggerRegionBossBattle(state.progress.currentRegionId));
    if ($('btn-explore-camp')) $('btn-explore-camp').addEventListener('click', () => { Audio.playSFX('click'); switchView('inventory'); });

    // Battle controls
    if ($('btn-battle-tts-normal')) {
      $('btn-battle-tts-normal').addEventListener('click', () => {
        if (battle.currentQ) Audio.speak(battle.currentQ.tts || stripRubyHtml(battle.currentQ.fullRubyJp), 1.0);
      });
    }
    if ($('btn-battle-tts-slow')) {
      $('btn-battle-tts-slow').addEventListener('click', () => {
        if (battle.currentQ) Audio.speak(battle.currentQ.tts || stripRubyHtml(battle.currentQ.fullRubyJp), 0.65);
      });
    }
    if ($('btn-skill-vocab')) $('btn-skill-vocab').addEventListener('click', useVocabInsight);
    if ($('btn-skill-listen')) $('btn-skill-listen').addEventListener('click', useClairaudience);
    if ($('btn-battle-flee')) {
      $('btn-battle-flee').addEventListener('click', () => {
        if (!battle.active) return;
        stopBattleTimers();
        battle.active = false;
        Audio.playSFX('cancel');
        showToast('🏃 已收劍脫離戰線，退回安全據點。', 'info');
        switchView(battle.returnView || 'explore');
      });
    }

    // Reading controls
    if ($('btn-reading-skill')) $('btn-reading-skill').addEventListener('click', useSpeedReadingSkill);
    if ($('btn-reading-next')) $('btn-reading-next').addEventListener('click', advanceReadingQuestion);
    if ($('btn-reading-exit')) {
      $('btn-reading-exit').addEventListener('click', () => {
        Audio.playSFX('cancel');
        Audio.stopSpeak();
        reading.active = false;
        const p = $('reading-paragraphs');
        if (p) p.removeAttribute('data-rd-rendered');
        renderReading();
      });
    }

    // Shrine controls
    if ($('btn-shrine-quit')) {
      $('btn-shrine-quit').addEventListener('click', () => {
        stopShrineTimer();
        Audio.stopSpeak();
        shrine.active = false;
        shrine.results = [];
        shrine.tier = null;
        Audio.playSFX('cancel');
        Audio.playBGM('town');
        updateChromeVisibility('shrine');
        renderShrine();
      });
    }
    if ($('btn-shrine-return')) {
      $('btn-shrine-return').addEventListener('click', () => {
        Audio.playSFX('click');
        shrine.results = [];
        shrine.tier = null;
        renderShrine();
      });
    }

    // Tab bars (Inventory, Quests, Codex, Shop)
    document.querySelectorAll('#inv-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.inv = btn.getAttribute('data-tab') || 'all';
        renderInventory();
      });
    });
    document.querySelectorAll('#quest-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.quests = btn.getAttribute('data-tab') || 'main';
        renderQuests();
      });
    });
    document.querySelectorAll('#codex-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.codex = btn.getAttribute('data-tab') || 'bestiary';
        renderCodex();
      });
    });
    document.querySelectorAll('#shop-tabs .tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        Audio.playSFX('click');
        uiTabs.shop = btn.getAttribute('data-tab') || 'buy';
        document.querySelectorAll('#shop-tabs .tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderShopModal();
      });
    });
    if ($('btn-start-wrong-training')) {
      $('btn-start-wrong-training').addEventListener('click', () => startWrongNoteBattle('due'));
    }
    if ($('btn-start-wrong-training-all')) {
      $('btn-start-wrong-training-all').addEventListener('click', () => startWrongNoteBattle('all'));
    }
    if ($('btn-clear-mastered-notes')) {
      $('btn-clear-mastered-notes').addEventListener('click', clearMasteredWrongNotes);
    }
    if ($('btn-export-save-json')) {
      $('btn-export-save-json').addEventListener('click', () => exportSaveJsonCode());
    }
    if ($('btn-import-save-json')) {
      $('btn-import-save-json').addEventListener('click', () => importSaveJsonCode());
    }

    // Modals
    // IMPORTANT: #modal-explain can ONLY be closed via #btn-explain-confirm!
    if ($('btn-explain-confirm')) {
      $('btn-explain-confirm').addEventListener('click', () => {
        Audio.stopSpeak();
        Audio.playSFX('confirm');
        closeModal('modal-explain');
        const cb = explainCallback;
        explainCallback = null;
        if (cb) cb();
      });
    }

    if ($('btn-shop-close')) $('btn-shop-close').addEventListener('click', () => { Audio.playSFX('click'); closeModal('modal-shop'); });
    if ($('btn-save-close')) $('btn-save-close').addEventListener('click', () => { Audio.playSFX('click'); closeModal('modal-save'); });
    if ($('btn-generic-close')) {
      $('btn-generic-close').addEventListener('click', () => {
        Audio.playSFX('click');
        closeModal('modal-generic');
        const cb = genericModalCallback;
        genericModalCallback = null;
        if (cb) cb();
      });
    }

    // Backdrop click closes ONLY non-mandatory modals (never #modal-explain!)
    ['modal-shop', 'modal-save', 'modal-generic'].forEach((mid) => {
      const overlay = $(mid);
      if (!overlay) return;
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeModal(mid);
          if (mid === 'modal-generic' && genericModalCallback) {
            const cb = genericModalCallback;
            genericModalCallback = null;
            cb();
          }
        }
      });
    });

    // Discreet Corner Dev / Test Tool
    const drawer = $('dev-drawer');
    if ($('btn-dev-toggle') && drawer) {
      $('btn-dev-toggle').addEventListener('click', () => {
        drawer.classList.toggle('hidden');
      });
    }
    if ($('dev-close') && drawer) {
      $('dev-close').addEventListener('click', () => {
        drawer.classList.add('hidden');
      });
    }

    if ($('dev-add-gold')) {
      $('dev-add-gold').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        gainGold(5000);
        Audio.playSFX('chest');
        autoSave();
        updateHUD();
        if ($('modal-shop') && $('modal-shop').classList.contains('open')) renderShopModal();
        showToast('🪙 測試工具：獲得 +5000 金幣！', 'gold');
      });
    }
    if ($('dev-level-up')) $('dev-level-up').addEventListener('click', () => devLevelUp(1));
    if ($('dev-level-5')) $('dev-level-5').addEventListener('click', () => devLevelUp(5));
    if ($('dev-full-heal')) {
      $('dev-full-heal').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        const stats = getTotalStats();
        state.player.hp = stats.maxHp;
        state.player.mp = stats.maxMp;
        Audio.playSFX('heal');
        autoSave();
        updateHUD();
        refreshActiveView();
        showToast('💚 測試工具：HP / MP 已完全回復！', 'success');
      });
    }
    if ($('dev-add-sp')) {
      $('dev-add-sp').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        state.player.sp += 10;
        Audio.playSFX('levelup');
        autoSave();
        updateHUD();
        refreshActiveView();
        showToast('✨ 測試工具：獲得 +10 SP！', 'gold');
      });
    }
    if ($('dev-unlock-all')) {
      $('dev-unlock-all').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        state.progress.unlockedAllOverride = true;
        Audio.playSFX('levelup');
        autoSave();
        refreshActiveView();
        showToast('🗺️ 測試工具：已解鎖全部 6 大區域與全部 10 座閱讀副本！', 'gold');
      });
    }
    if ($('dev-trigger-boss')) {
      $('dev-trigger-boss').addEventListener('click', () => {
        if (!ensureSessionForDev()) return;
        if (drawer) drawer.classList.add('hidden');
        triggerRegionBossBattle(state.progress.currentRegionId || 'r1');
      });
    }
    if ($('dev-reset-all')) {
      $('dev-reset-all').addEventListener('click', () => {
        Object.values(SAVE_KEYS).forEach(deleteSlot);
        stopBattleTimers();
        stopShrineTimer();
        stopTypewriter();
        Audio.stopSpeak();
        state = createDefaultState();
        hasActiveSession = false;
        crossRegionNotifiedKeys = new Set();
        battle.active = false;
        shrine.active = false;
        reading.active = false;
        if (drawer) drawer.classList.add('hidden');
        closeModal('modal-explain');
        closeModal('modal-shop');
        closeModal('modal-save');
        closeModal('modal-generic');
        Audio.playSFX('cancel');
        showToast('🗑️ 已清空所有本機存檔並回到標題畫面。', 'warning');
        switchView('title');
      });
    }
  }

  function init() {
    bindStaticEvents();
    // Show dev/debug corner toggle ONLY when ?debug=1 is explicitly present
    const debugBtn = $('btn-dev-toggle');
    if (debugBtn) {
      const params = new URLSearchParams(window.location.search);
      const isDebug = params.get('debug') === '1';
      debugBtn.classList.toggle('hidden', !isDebug);
      if (!isDebug && $('dev-drawer')) $('dev-drawer').classList.add('hidden');
    }
    applyMobileHudCollapseState();
    applyFuriganaSetting();
    syncAudioButtons();
    syncDifficultyControls();
    switchView('title');
  }

  // ============================================================================
  // 20. Export Public Engine API on `window.Game`
  // ============================================================================
  const Game = {
    init,
    getState: () => state,
    sanitizeSaveData,
    createDefaultState,
    setDifficultyMode,
    setAdaptiveStartJlpt,
    getDifficultyModeConfig,
    getQuestionBankProgressSummary,
    getTotalStats,
    getEnhancedItemStats,
    isRegionUnlocked,
    isReadingUnlocked,
    switchView,
    autoSave,
    saveToSlot,
    loadFromSlot,
    openSaveModal,
    openShopModal,
    startBattle,
    triggerRegionBossBattle,
    equipItem,
    unequipSlot,
    addItem,
    removeItem,
    gainExp,
    gainGold,
    checkAchievements,
    updateHUD,
    showToast,
    recordWrongNote,
    markWrongNoteMastered,
    advanceWrongNoteSRS,
    isWrongNoteDue,
    getWrongNotesSummary,
    startWrongNoteBattle,
    clearMasteredWrongNotes,
    renderNotes,
    typewriterSpeak,
    cycleImmersionMode,
    exportSaveJsonCode,
    importSaveJsonCode,
    ensureDailyTrainingFresh,
    claimDailyTrainingTask,
    renderDailyTrainingPanel,
    getBossPhaseInfo,
    getQuestDestination,
    getCurrentObjective,
    getItemById,
    getEnemyById,
    formatBattleSpeedText,
    applyMobileHudCollapseState
  };

  global.Game = Game;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => Game.init());
    } else {
      Game.init();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
