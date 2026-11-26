/* ============================================================================
 * 《言霊の旅（ことだまのたび）》 — 遊戲完整資料庫 (data.js)
 * 零外部依賴 Vanilla ES6+ | 掛載於 window.GAME_DATA
 * ============================================================================ */
(function () {
  'use strict';

  const JOBS = {
    swordsman: {
      id: 'swordsman',
      name: '言靈劍士',
      jpName: '<ruby>言霊<rt>ことだま</rt></ruby><ruby>剣士<rt>けんし</rt></ruby>',
      focus: 'INT 重視・語彙斬擊',
      desc: '將精準的詞彙化為鋒刃的旅人。擁有最高的初始生命值與智力（INT），暴擊率最高，擅長在正面對決中穩定推進。',
      baseStats: { maxHp: 115, maxMp: 45, INT: 14, WIS: 9, CHA: 8 },
      growth: { maxHp: 16, maxMp: 6, INT: 3, WIS: 2, CHA: 1 },
      startWeaponId: 'wp_wood_blade'
    },
    scholar: {
      id: 'scholar',
      name: '古籍學者',
      jpName: '<ruby>古籍<rt>こせき</rt></ruby><ruby>学者<rt>がくしゃ</rt></ruby>',
      focus: 'WIS 重視・文法解析',
      desc: '研讀失落古文書的求知者。具備充沛的魔力池與卓越的文法洞察力（WIS），擅長運用主動技能剖析複雜語境與長文。',
      baseStats: { maxHp: 95, maxMp: 65, INT: 10, WIS: 14, CHA: 9 },
      growth: { maxHp: 12, maxMp: 10, INT: 2, WIS: 3, CHA: 2 },
      startWeaponId: 'wp_ink_staff'
    },
    bard: {
      id: 'bard',
      name: '音韻旅藝人',
      jpName: '<ruby>音韻<rt>おんいん</rt></ruby><ruby>旅芸人<rt>たびげいにん</rt></ruby>',
      focus: 'CHA 重視・音韻交涉',
      desc: '以抑揚頓挫的語調喚醒言靈的吟遊行者。極高的表現力（CHA）能大幅提升暴擊率、連擊加成與村莊對話好感度。',
      baseStats: { maxHp: 105, maxMp: 55, INT: 10, WIS: 9, CHA: 14 },
      growth: { maxHp: 14, maxMp: 8, INT: 2, WIS: 1, CHA: 3 },
      startWeaponId: 'wp_reed_lute'
    }
  };

  const REGIONS = [
    {
      id: 'r1',
      order: 1,
      name: '始まりの町',
      rubyName: '<ruby>始<rt>はじ</rt></ruby>まりの<ruby>町<rt>まち</rt></ruby>',
      subtitle: '晨霧微光與最初的音節',
      jlpt: 'N4–N3 生活語境',
      unlockLevel: 1,
      prevRegionId: null,
      difficulty: 1,
      desc: '座落於言靈大陸西南隅的靜謐石砌小鎮。旅人在此重拾日常詞彙與基礎句型，驅散盤踞郊外的雜音魔物。',
      themeColor: '#d4a259',
      kanjiEmblem: '始',
      mapPos: { x: 125, y: 365 },
      enemyIds: ['en_r1_slime', 'en_r1_crow'],
      bossId: 'boss_r1_golem',
      dropTable: [
        { itemId: 'con_herb', chance: 0.35 },
        { itemId: 'con_water', chance: 0.25 },
        { itemId: 'ar_linen_cloak', chance: 0.12 }
      ],
      events: [
        {
          id: 'ev_r1_1',
          title: '路旁的石碑拓本',
          desc: '你在鎮外岔路發現一塊長滿青苔的古石碑，上頭刻著工整的平假名與日用漢字。',
          jpQuote: '<ruby>一歩<rt>いっぽ</rt></ruby>ずつ、<ruby>言葉<rt>ことば</rt></ruby>の<ruby>光<rt>ひかり</rt></ruby>を<ruby>灯<rt>とも</rt></ruby>せ。',
          choices: [
            {
              label: '靜下心仔細朗讀碑文',
              resultText: '清澈的音節在霧氣中迴盪，溫暖的言靈湧入體內，疲勞頓消並獲得了寶貴經驗。',
              reward: { exp: 32, gold: 18, hpPct: 25, mpPct: 25, itemId: null }
            },
            {
              label: '檢查石碑底座的暗格',
              resultText: '你在鬆動的石磚下找到前人留下的旅費與一束乾燥藥草！',
              reward: { exp: 15, gold: 45, hpPct: 0, mpPct: 0, itemId: 'con_herb' }
            }
          ]
        },
        {
          id: 'ev_r1_2',
          title: '迷途的郵差少年',
          desc: '一名背著帆布郵袋的少年對著褪色的門牌抓耳撓腮，似乎分不清「図書館」與「旅館」的路標。',
          jpQuote: 'すみません、<ruby>図書館<rt>としょかん</rt></ruby>はどちらですか。',
          choices: [
            {
              label: '用清晰的日語為他指路',
              resultText: '少年茅塞頓開，連聲道謝並塞給你一瓶清涼的言靈靈水。',
              reward: { exp: 38, gold: 25, hpPct: 0, mpPct: 20, itemId: 'con_water' }
            },
            {
              label: '陪他一起走到十字路口',
              resultText: '一路上你們互相練習日常問候，既長了見識，他也分享了半袋乾糧與銅幣。',
              reward: { exp: 28, gold: 40, hpPct: 30, mpPct: 0, itemId: null }
            }
          ]
        }
      ]
    },
    {
      id: 'r2',
      order: 2,
      name: '基礎の領地',
      rubyName: '<ruby>基礎<rt>きそ</rt></ruby>の<ruby>領地<rt>りょうち</rt></ruby>',
      subtitle: '青翠丘陵與助詞之橋',
      jlpt: 'N4–N2 助詞句型',
      unlockLevel: 3,
      prevRegionId: 'r1',
      difficulty: 2,
      desc: '綿延的石橋橫跨幽暗溪谷，唯有正確串聯助詞與時態，橋面的古老符文才會浮現支撐前行的道路。',
      themeColor: '#4f9d8c',
      kanjiEmblem: '礎',
      mapPos: { x: 270, y: 265 },
      enemyIds: ['en_r2_wisp', 'en_r2_wolf'],
      bossId: 'boss_r2_knight',
      dropTable: [
        { itemId: 'con_herb', chance: 0.3 },
        { itemId: 'con_water', chance: 0.3 },
        { itemId: 'con_break_scroll', chance: 0.16 },
        { itemId: 'ar_traveler_coat', chance: 0.1 }
      ],
      events: [
        {
          id: 'ev_r2_1',
          title: '助詞橋的守衛燈籠',
          desc: '霧中浮起兩盞青火燈籠，燈罩上分別寫著「で」與「に」，引導旅人走向不同方向。',
          jpQuote: '<ruby>動作<rt>どうさ</rt></ruby>の<ruby>場<rt>ば</rt></ruby>か、<ruby>存在<rt>そんざい</rt></ruby>の<ruby>場<rt>ば</rt></ruby>か。',
          choices: [
            {
              label: '點燃「で」燈籠並記錄助詞用法',
              resultText: '青火化作溫潤靈光注入腦海，魔力大幅恢復且文法理解更進一步。',
              reward: { exp: 55, gold: 35, hpPct: 10, mpPct: 40, itemId: null }
            },
            {
              label: '在「に」燈籠下拾取供奉品',
              resultText: '你在石燈籠旁發現一張完好的破防卷軸與旅人遺留的銀幣。',
              reward: { exp: 30, gold: 60, hpPct: 0, mpPct: 0, itemId: 'con_break_scroll' }
            }
          ]
        },
        {
          id: 'ev_r2_2',
          title: '溪畔茶屋的歇腳處',
          desc: '一間無人看守的自助茶棚飄出焙茶香氣，木牌上寫著「ご自由にどうぞ」。',
          jpQuote: '<ruby>旅<rt>たび</rt></ruby>の<ruby>疲<rt>つか</rt></ruby>れを<ruby>癒<rt>いや</rt></ruby>してください。',
          choices: [
            {
              label: '投入賽錢並享用熱茶與糰子',
              resultText: '身心徹底回暖，體力與魔力都恢復了一大截，還領悟了幾句待客用語。',
              reward: { exp: 42, gold: 20, hpPct: 45, mpPct: 35, itemId: null }
            },
            {
              label: '幫茶棚整理被風吹散的帳簿',
              resultText: '藏在帳簿後方的店主現身致謝，贈予你一筆謝禮與回復藥草。',
              reward: { exp: 48, gold: 75, hpPct: 15, mpPct: 0, itemId: 'con_herb' }
            }
          ]
        }
      ]
    },
    {
      id: 'r3',
      order: 3,
      name: '日常の都',
      rubyName: '<ruby>日常<rt>にちじょう</rt></ruby>の<ruby>都<rt>みやこ</rt></ruby>',
      subtitle: '紅燈長街與百態人情',
      jlpt: 'N4–N2 活用會話',
      unlockLevel: 6,
      prevRegionId: 'r2',
      difficulty: 3,
      desc: '暮色永駐的繁華古都，街巷中充滿商店街吆喝與劇場鼓聲。在此必須靈活掌握動詞活用與待人接物的分寸。',
      themeColor: '#c85a48',
      kanjiEmblem: '常',
      mapPos: { x: 425, y: 340 },
      enemyIds: ['en_r3_tanuki', 'en_r3_puppet'],
      bossId: 'boss_r3_kabuki',
      dropTable: [
        { itemId: 'con_water', chance: 0.3 },
        { itemId: 'con_break_scroll', chance: 0.22 },
        { itemId: 'con_fever_charm', chance: 0.14 },
        { itemId: 'ar_scribe_robe', chance: 0.09 }
      ],
      events: [
        {
          id: 'ev_r3_1',
          title: '舊書市集的古戲本',
          desc: '紅燈籠下的舊書攤擺滿江戶風格的手抄台詞本，老闆正考驗客人能否唸出正確的動詞變化。',
          jpQuote: '<ruby>台詞<rt>せりふ</rt></ruby>は<ruby>生<rt>い</rt></ruby>き<ruby>物<rt>もの</rt></ruby>、<ruby>語尾<rt>ごび</rt></ruby>に<ruby>魂<rt>たましい</rt></ruby>が<ruby>宿<rt>やど</rt></ruby>る。',
          choices: [
            {
              label: '即興朗誦一段使役與被動台詞',
              resultText: '圍觀群眾拍手叫好，老闆慷慨送你一張專注護符與不少賞錢！',
              reward: { exp: 95, gold: 80, hpPct: 0, mpPct: 20, itemId: 'con_fever_charm' }
            },
            {
              label: '細心抄錄戲本中的日常慣用語',
              resultText: '你收穫了滿滿的實用表達，思緒變得格外清明。',
              reward: { exp: 120, gold: 50, hpPct: 20, mpPct: 35, itemId: null }
            }
          ]
        },
        {
          id: 'ev_r3_2',
          title: '蕎麥麵屋的排隊風波',
          desc: '名店門前大排長龍，一位外地旅人因聽不懂店員的敬語引導而顯得手足無措。',
          jpQuote: 'お<ruby>待<rt>ま</rt></ruby>たせいたしました。<ruby>奥<rt>おく</rt></ruby>の<ruby>席<rt>せき</rt></ruby>へどうぞ。',
          choices: [
            {
              label: '親切協助翻譯並解說禮貌說法',
              resultText: '老闆感激地端出兩碗熱騰騰的天婦羅蕎麥麵，讓你元氣滿滿。',
              reward: { exp: 88, gold: 90, hpPct: 50, mpPct: 25, itemId: null }
            },
            {
              label: '順便向老闆請教都城商旅情報',
              resultText: '老闆不僅分享了實用的會話訣竅，還贈送你一卷破防卷軸防身。',
              reward: { exp: 75, gold: 110, hpPct: 10, mpPct: 10, itemId: 'con_break_scroll' }
            }
          ]
        }
      ]
    },
    {
      id: 'r4',
      order: 4,
      name: '文脈の峡谷',
      rubyName: '<ruby>文脈<rt>ぶんみゃく</rt></ruby>の<ruby>峡谷<rt>きょうこく</rt></ruby>',
      subtitle: '紫霧絕壁與前後呼應的回音',
      jlpt: 'N3–N1 進階文脈',
      unlockLevel: 10,
      prevRegionId: 'r3',
      difficulty: 4,
      desc: '深邃峽谷中迴盪著交錯的語流。單看隻字片語極易墜入幻象，唯有判讀接續關係與隱藏語境方能踏實前行。',
      themeColor: '#7b68b8',
      kanjiEmblem: '脈',
      mapPos: { x: 560, y: 215 },
      enemyIds: ['en_r4_harpy', 'en_r4_gargoyle'],
      bossId: 'boss_r4_serpent',
      dropTable: [
        { itemId: 'con_break_scroll', chance: 0.28 },
        { itemId: 'con_fever_charm', chance: 0.2 },
        { itemId: 'ar_canyon_mail', chance: 0.09 }
      ],
      events: [
        {
          id: 'ev_r4_1',
          title: '回音崖的雙重路標',
          desc: '峽谷風口立著兩面寫著相反接續詞的風旗，左旗寫「わりに」，右旗寫「せいで」。',
          jpQuote: '<ruby>前後<rt>ぜんご</rt></ruby>の<ruby>脈絡<rt>みゃくらく</rt></ruby>を<ruby>見失<rt>みうしな</rt></ruby>うな。',
          choices: [
            {
              label: '順著文脈風向整理斷裂的碑記',
              resultText: '峽谷的雜音驟然平息，你的洞察力獲得了顯著提升。',
              reward: { exp: 165, gold: 120, hpPct: 15, mpPct: 40, itemId: null }
            },
            {
              label: '沿著岩縫搜尋學者遺落的補給箱',
              resultText: '你在隱蔽的岩穴中找到補給箱，收穫金幣與一張專注護符！',
              reward: { exp: 115, gold: 175, hpPct: 10, mpPct: 0, itemId: 'con_fever_charm' }
            }
          ]
        },
        {
          id: 'ev_r4_2',
          title: '懸橋上的流浪詩人',
          desc: '一位披著紫紗的詩人坐在索橋邊，煩惱著詩句裡「自動詞」與「他動詞」的意象拿捏。',
          jpQuote: '<ruby>扉<rt>とびら</rt></ruby>が<ruby>開<rt>あ</rt></ruby>くのか、<ruby>誰<rt>だれ</rt></ruby>かが<ruby>開<rt>あ</rt></ruby>けるのか。',
          choices: [
            {
              label: '與他深入探討自他動詞的餘韻',
              resultText: '詩人靈感大發，吟唱一曲治癒歌謠，令你體力與魔力雙雙恢復。',
              reward: { exp: 150, gold: 110, hpPct: 45, mpPct: 45, itemId: null }
            },
            {
              label: '替他潤飾後半段轉折語句',
              resultText: '詩人視你為知音，贈予你珍藏的破防卷軸與旅費。',
              reward: { exp: 140, gold: 160, hpPct: 0, mpPct: 20, itemId: 'con_break_scroll' }
            }
          ]
        }
      ]
    },
    {
      id: 'r5',
      order: 5,
      name: '思索の城塞',
      rubyName: '<ruby>思索<rt>しさく</rt></ruby>の<ruby>城塞<rt>じょうさい</rt></ruby>',
      subtitle: '蒼藍高塔與敬語之禮法',
      jlpt: 'N3–N1 長文敬語',
      unlockLevel: 15,
      prevRegionId: 'r4',
      difficulty: 5,
      desc: '矗立在雲海之上的書庫要塞，嚴格的禮法與精密邏輯構築了每道城門。一絲敬語失誤或近義混淆便會觸發機關。',
      themeColor: '#4f7bb5',
      kanjiEmblem: '思',
      mapPos: { x: 695, y: 295 },
      enemyIds: ['en_r5_automaton', 'en_r5_phantom'],
      bossId: 'boss_r5_chancellor',
      dropTable: [
        { itemId: 'con_break_scroll', chance: 0.3 },
        { itemId: 'con_fever_charm', chance: 0.25 },
        { itemId: 'ar_citadel_vestment', chance: 0.08 }
      ],
      events: [
        {
          id: 'ev_r5_1',
          title: '星象迴廊的敬語門禁',
          desc: '城塞迴廊的機械門衛要求來訪者以合宜的謙讓語通報來意，方准通行秘庫捷徑。',
          jpQuote: 'ご<ruby>用件<rt>ようけん</rt></ruby>を<ruby>承<rt>うけたまわ</rt></ruby>ります。',
          choices: [
            {
              label: '從容施禮並以謙讓語致意',
              resultText: '門衛微微欠身放行，秘庫中流瀉的星輝為你注入豐沛經驗與魔力。',
              reward: { exp: 260, gold: 190, hpPct: 20, mpPct: 45, itemId: null }
            },
            {
              label: '檢視門衛胸口銘刻的古禮典',
              resultText: '你在禮典夾層發現前代騎士留下的專注護符與賞金。',
              reward: { exp: 195, gold: 250, hpPct: 0, mpPct: 15, itemId: 'con_fever_charm' }
            }
          ]
        },
        {
          id: 'ev_r5_2',
          title: '書記官的緊急文書',
          desc: '一名疲憊的城塞書記官正為公文中的「に際して」與「ものの」銜接犯愁。',
          jpQuote: '<ruby>誤解<rt>ごかい</rt></ruby>を<ruby>招<rt>まね</rt></ruby>かぬ<ruby>表現<rt>ひょうげん</rt></ruby>こそが<ruby>要<rt>かなめ</rt></ruby>です。',
          choices: [
            {
              label: '協助校對整份長文報告書',
              resultText: '書記官大喜過望，奉上城塞公費酬勞與高階補給卷軸。',
              reward: { exp: 245, gold: 260, hpPct: 15, mpPct: 0, itemId: 'con_break_scroll' }
            },
            {
              label: '與他共飲咖啡並交流寫作心得',
              resultText: '短暫的歇息讓精神煥然一新，體力與魔力皆大幅回復。',
              reward: { exp: 210, gold: 170, hpPct: 50, mpPct: 50, itemId: null }
            }
          ]
        }
      ]
    },
    {
      id: 'r6',
      order: 6,
      name: '言霊の聖域',
      rubyName: '<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>聖域<rt>せいいき</rt></ruby>',
      subtitle: '緋紅鳥居與萬象語感之巔',
      jlpt: 'N2–N1 高階語感',
      unlockLevel: 20,
      prevRegionId: 'r5',
      difficulty: 6,
      desc: '漂浮於天穹彼端的終極聖殿，所有抽象思辨、古雅慣用句與極細微的語氣差異在此交匯，等待真正的言靈大師降臨。',
      themeColor: '#d94862',
      kanjiEmblem: '聖',
      mapPos: { x: 780, y: 125 },
      enemyIds: ['en_r6_archon', 'en_r6_voidling'],
      bossId: 'boss_r6_overlord',
      dropTable: [
        { itemId: 'con_fever_charm', chance: 0.35 },
        { itemId: 'con_break_scroll', chance: 0.35 },
        { itemId: 'ac_sanctuary_crown', chance: 0.08 }
      ],
      events: [
        {
          id: 'ev_r6_1',
          title: '緋紅鳥居下的殘響鏡',
          desc: '千本鳥居盡頭懸浮著一面古銅鏡，鏡面映出旅人一路走來曾猶豫過的無數日語細微差別。',
          jpQuote: '<ruby>言葉<rt>ことば</rt></ruby>の<ruby>極<rt>きわ</rt></ruby>みは、<ruby>心<rt>こころ</rt></ruby>の<ruby>機微<rt>きび</rt></ruby>を<ruby>映<rt>うつ</rt></ruby>す。',
          choices: [
            {
              label: '凝視鏡面並整理高階語感脈絡',
              resultText: '萬千言靈與你共鳴，渾身傷勢盡癒，靈感如潮水般湧現！',
              reward: { exp: 390, gold: 280, hpPct: 55, mpPct: 55, itemId: null }
            },
            {
              label: '收下鏡台旁凝結的聖域符紙',
              resultText: '符紙化作實質的專注護符落入掌心，散發著炙熱的言靈波動。',
              reward: { exp: 310, gold: 360, hpPct: 20, mpPct: 20, itemId: 'con_fever_charm' }
            }
          ]
        },
        {
          id: 'ev_r6_2',
          title: '古代語靈的問答祭壇',
          desc: '一座燃著淡金火焰的祭壇發出低語，詢問旅人何以不畏艱難走到聖域深處。',
          jpQuote: '<ruby>汝<rt>なんじ</rt></ruby>、<ruby>何<rt>なに</rt></ruby>ゆえに<ruby>言霊<rt>ことだま</rt></ruby>を<ruby>求<rt>もと</rt></ruby>むるか。',
          choices: [
            {
              label: '以誠摯的古雅語調回應誓言',
              resultText: '祭壇火焰化為祝福之光，賦予你莫大的修為與財富。',
              reward: { exp: 420, gold: 350, hpPct: 35, mpPct: 35, itemId: null }
            },
            {
              label: '以破邪之勢汲取祭壇餘燼',
              resultText: '餘燼凝成破防卷軸與輝煌金幣，助你迎戰終極魔王。',
              reward: { exp: 340, gold: 420, hpPct: 10, mpPct: 25, itemId: 'con_break_scroll' }
            }
          ]
        }
      ]
    }
  ];

  const ENEMIES = {
    en_r1_slime: {
      id: 'en_r1_slime',
      regionId: 'r1',
      isBoss: false,
      name: '濁音史萊姆',
      jpName: '<ruby>濁音<rt>だくおん</rt></ruby>スライム',
      level: 1,
      maxHp: 78,
      atk: 12,
      breakMax: 2,
      weakness: 'reading',
      weaknessLabel: '單字讀音',
      exp: 28,
      gold: 26,
      lore: '由混淆清音與濁音的迷霧凝聚而成的黏液魔物，只要唸出正確讀音就會迅速瓦解。'
    },
    en_r1_crow: {
      id: 'en_r1_crow',
      regionId: 'r1',
      isBoss: false,
      name: '墨羽烏鴉',
      jpName: '<ruby>墨羽<rt>すみばね</rt></ruby>ガラス',
      level: 2,
      maxHp: 90,
      atk: 15,
      breakMax: 2,
      weakness: 'particle',
      weaknessLabel: '助詞填空',
      exp: 34,
      gold: 32,
      lore: '喜歡叼走旅人筆記本裡助詞的狡猾黑鴉，常在始まりの町屋簷上盤旋。'
    },
    boss_r1_golem: {
      id: 'boss_r1_golem',
      regionId: 'r1',
      isBoss: true,
      name: '石碑巨像・初音守',
      jpName: '<ruby>石碑<rt>せきひ</rt></ruby><ruby>巨像<rt>きょぞう</rt></ruby>・<ruby>初音守<rt>はつねもり</rt></ruby>',
      level: 3,
      maxHp: 175,
      atk: 19,
      breakMax: 4,
      weakness: 'reading',
      weaknessLabel: '單字讀音',
      exp: 115,
      gold: 130,
      lore: '鎮守始まりの町出口的古代漢字石像，考驗踏出第一步的旅人是否真正掌握基礎詞彙。',
      introLine: {
        jp: '<ruby>旅人<rt>たびびと</rt></ruby>よ、<ruby>最初<rt>さいしょ</rt></ruby>の<ruby>文字<rt>もじ</rt></ruby>を<ruby>正<rt>ただ</rt></ruby>しく<ruby>読<rt>よ</rt></ruby>み<ruby>解<rt>と</rt></ruby>けるか。',
        zh: '旅人啊，你能否正確讀解這最初的文字呢？',
        tts: 'たびびとよ、さいしょのもじをただしくよみとけるか。'
      },
      hitLine: {
        jp: 'ほう……<ruby>澄<rt>す</rt></ruby>んだ<ruby>響<rt>ひび</rt></ruby>きだ。<ruby>悪<rt>わる</rt></ruby>くない。',
        zh: '喔……真是清澈的回響。表現不賴。',
        tts: 'ほう、すんだひびきだ。わるくない。'
      },
      breakLine: {
        jp: 'ぐっ……<ruby>石碑<rt>せきひ</rt></ruby>の<ruby>封印<rt>ふういん</rt></ruby>が<ruby>砕<rt>くだ</rt></ruby>け<ruby>散<rt>ち</rt></ruby>ったか！',
        zh: '唔……石碑的封印竟然碎裂了嗎！',
        tts: 'ぐっ、せきひのふういんがくだけちったか！'
      },
      defeatLine: {
        jp: '<ruby>見事<rt>みごと</rt></ruby>だ。<ruby>次<rt>つぎ</rt></ruby>なる<ruby>基礎<rt>きそ</rt></ruby>の<ruby>領地<rt>りょうち</rt></ruby>へ<ruby>進<rt>すす</rt></ruby>むがよい。',
        zh: '幹得好。前往下一片基礎的領地吧。',
        tts: 'みごとだ。つぎなるきそのりょうちへすすむがよい。'
      },
      firstClearReward: { gold: 150, exp: 90, itemId: 'ar_linen_cloak' }
    },

    en_r2_wisp: {
      id: 'en_r2_wisp',
      regionId: 'r2',
      isBoss: false,
      name: '青火助詞靈',
      jpName: '<ruby>青火<rt>あおび</rt></ruby>の<ruby>助詞霊<rt>じょしれい</rt></ruby>',
      level: 4,
      maxHp: 128,
      atk: 18,
      breakMax: 2,
      weakness: 'particle',
      weaknessLabel: '助詞填空',
      exp: 52,
      gold: 48,
      lore: '漂浮在石橋溪霧間的幽藍靈火，專以錯誤的「に」與「で」迷惑過客。'
    },
    en_r2_wolf: {
      id: 'en_r2_wolf',
      regionId: 'r2',
      isBoss: false,
      name: '語序荒狼',
      jpName: '<ruby>語順<rt>ごじゅん</rt></ruby>の<ruby>荒狼<rt>あらおおかみ</rt></ruby>',
      level: 5,
      maxHp: 146,
      atk: 22,
      breakMax: 3,
      weakness: 'reorder',
      weaknessLabel: '句子重組',
      exp: 60,
      gold: 56,
      lore: '會將零散句塊咬得支離破碎的灰毛巨狼，唯有排定正確語序才能制伏其爪牙。'
    },
    boss_r2_knight: {
      id: 'boss_r2_knight',
      regionId: 'r2',
      isBoss: true,
      name: '助詞鐵騎・繋ぎの騎士',
      jpName: '<ruby>助詞<rt>じょし</rt></ruby><ruby>鉄騎<rt>てっき</rt></ruby>・<ruby>繋<rt>つな</rt></ruby>ぎの<ruby>騎士<rt>きし</rt></ruby>',
      level: 6,
      maxHp: 280,
      atk: 28,
      breakMax: 4,
      weakness: 'particle',
      weaknessLabel: '助詞填空',
      exp: 205,
      gold: 220,
      lore: '身披鐵鎖戰甲的領地守護騎士，每個甲片皆以助詞鎖鏈相連，不容絲毫文法鬆動。',
      introLine: {
        jp: '<ruby>助詞<rt>じょし</rt></ruby>ひとつ<ruby>誤<rt>あやま</rt></ruby>れば、<ruby>文<rt>ぶん</rt></ruby>は<ruby>崩<rt>くず</rt></ruby>れ<ruby>落<rt>お</rt></ruby>ちる。いざ<ruby>参<rt>まい</rt></ruby>る！',
        zh: '只要錯了一個助詞，整句話便會崩塌。接招吧！',
        tts: 'じょしひとつあやまれば、ぶんはくずれおちる。いざまいる！'
      },
      hitLine: {
        jp: 'ぬう……<ruby>的確<rt>てきかく</rt></ruby>な<ruby>一撃<rt>いちげき</rt></ruby>、<ruby>鎧<rt>よろい</rt></ruby>の<ruby>繋<rt>つな</rt></ruby>ぎ<ruby>目<rt>め</rt></ruby>を<ruby>突<rt>つ</rt></ruby>いたか！',
        zh: '唔……精準的一擊，竟然刺中了鎧甲的接合處！',
        tts: 'ぬう、てきかくないちげき、よろいのつなぎめをついたか！'
      },
      breakLine: {
        jp: 'ばかな！<ruby>文法<rt>ぶんぽう</rt></ruby>の<ruby>鉄壁<rt>てっぺき</rt></ruby>が<ruby>破<rt>やぶ</rt></ruby>られるとは！',
        zh: '不可能！文法的鐵壁竟然被攻破了！',
        tts: 'ばかな！ぶんぽうのてっぺきがやぶられるとは！'
      },
      defeatLine: {
        jp: '<ruby>確<rt>たし</rt></ruby>かな<ruby>基礎<rt>きそ</rt></ruby>を<ruby>見届<rt>みとど</rt></ruby>けた。<ruby>日常<rt>にちじょう</rt></ruby>の<ruby>都<rt>みやこ</rt></ruby>への<ruby>門<rt>もん</rt></ruby>を<ruby>開<rt>ひら</rt></ruby>こう。',
        zh: '我已見證你紮實的基礎。為你敞開通往日常之都的大門吧。',
        tts: 'たしかなきそをみとどけた。にちじょうのみやこへのもんをひらこう。'
      },
      firstClearReward: { gold: 240, exp: 160, itemId: 'wp_iron_katana' }
    },

    en_r3_tanuki: {
      id: 'en_r3_tanuki',
      regionId: 'r3',
      isBoss: false,
      name: '化形狸妖',
      jpName: '<ruby>活用<rt>かつよう</rt></ruby><ruby>化<rt>ば</rt></ruby>け<ruby>狸<rt>だぬき</rt></ruby>',
      level: 7,
      maxHp: 185,
      atk: 26,
      breakMax: 3,
      weakness: 'conjugation',
      weaknessLabel: '動詞活用',
      exp: 92,
      gold: 84,
      lore: '擅長隨意變換動詞詞尾戲弄商販的都城小妖，常把使役形與被動形攪成一團。'
    },
    en_r3_puppet: {
      id: 'en_r3_puppet',
      regionId: 'r3',
      isBoss: false,
      name: '失禮絡繰人偶',
      jpName: '<ruby>無礼<rt>ぶれい</rt></ruby>からくり<ruby>人形<rt>にんぎょう</rt></ruby>',
      level: 8,
      maxHp: 210,
      atk: 30,
      breakMax: 3,
      weakness: 'unnatural',
      weaknessLabel: '不自然表達',
      exp: 105,
      gold: 96,
      lore: '齒輪錯亂的劇場木偶，會對長輩說出極度不合禮儀的生硬日語。'
    },
    boss_r3_kabuki: {
      id: 'boss_r3_kabuki',
      regionId: 'r3',
      isBoss: true,
      name: '千面歌舞伎・活用幻師',
      jpName: '<ruby>千面<rt>せんめん</rt></ruby><ruby>歌舞伎<rt>かぶき</rt></ruby>・<ruby>活用<rt>かつよう</rt></ruby><ruby>幻師<rt>げんし</rt></ruby>',
      level: 10,
      maxHp: 410,
      atk: 38,
      breakMax: 4,
      weakness: 'conjugation',
      weaknessLabel: '動詞活用',
      exp: 345,
      gold: 360,
      lore: '立於紅燈戲台中央的千面藝人，舉手投足皆化作千變萬化的動詞語態與人情台詞。',
      introLine: {
        jp: 'さあ<ruby>幕開<rt>まくあ</rt></ruby>けだ！<ruby>生<rt>い</rt></ruby>きた<ruby>会話<rt>かいわ</rt></ruby>の<ruby>変化<rt>へんげ</rt></ruby>、ついて<ruby>来<rt>こ</rt></ruby>られるかな？',
        zh: '好戲開場囉！活生生的會話千變萬化，你跟得上嗎？',
        tts: 'さあまくあけだ！いきたかいわのへんげ、ついてこられるかな？'
      },
      hitLine: {
        jp: 'おっと、<ruby>鮮<rt>あざ</rt></ruby>やかな<ruby>返<rt>かえ</rt></ruby>しじゃないか！<ruby>面白<rt>おもしろ</rt></ruby>い！',
        zh: '喔呀，真是俐落的回敬啊！太有趣了！',
        tts: 'おっと、あざやかなかえしじゃないか！おもしろい！'
      },
      breakLine: {
        jp: 'くっ……<ruby>仮面<rt>かめん</rt></ruby>が<ruby>外<rt>はず</rt></ruby>された！<ruby>台本<rt>だいほん</rt></ruby>どおりに<ruby>行<rt>い</rt></ruby>かぬとは！',
        zh: '唔……面具被打落了！竟然沒有照我的劇本走！',
        tts: 'くっ、かめんがはずされた！だいほんどおりにいかぬとは！'
      },
      defeatLine: {
        jp: 'あっぱれだ<ruby>旅人<rt>たびびと</rt></ruby>。<ruby>今宵<rt>こよい</rt></ruby>の<ruby>主役<rt>しゅやく</rt></ruby>は<ruby>君<rt>きみ</rt></ruby>に<ruby>譲<rt>ゆず</rt></ruby>ろう。',
        zh: '太精采了，旅人。今晚的主角就讓給你吧。',
        tts: 'あっぱれだたびびと。こよいのしゅやくはきみにゆずろう。'
      },
      firstClearReward: { gold: 380, exp: 260, itemId: 'wp_azure_brush' }
    },

    en_r4_harpy: {
      id: 'en_r4_harpy',
      regionId: 'r4',
      isBoss: false,
      name: '斷章風妖',
      jpName: '<ruby>断章<rt>だんしょう</rt></ruby>の<ruby>風妖<rt>ふうよう</rt></ruby>',
      level: 11,
      maxHp: 265,
      atk: 35,
      breakMax: 3,
      weakness: 'reorder',
      weaknessLabel: '句子重組',
      exp: 148,
      gold: 132,
      lore: '棲息於峽谷高崖的翼魔，專愛斷章取義，將完整段落撕扯成誤導性的碎片。'
    },
    en_r4_gargoyle: {
      id: 'en_r4_gargoyle',
      regionId: 'r4',
      isBoss: false,
      name: '誤讀石像鬼',
      jpName: '<ruby>誤読<rt>ごどく</rt></ruby>ガーゴイル',
      level: 13,
      maxHp: 295,
      atk: 40,
      breakMax: 3,
      weakness: 'unnatural',
      weaknessLabel: '不自然表達',
      exp: 168,
      gold: 152,
      lore: '守在峽谷岩柱上的黑石魔像，對「雰囲気」等易誤讀漢字與自他動詞陷阱了若指掌。'
    },
    boss_r4_serpent: {
      id: 'boss_r4_serpent',
      regionId: 'r4',
      isBoss: true,
      name: '文脈大蛇・言の葉の龍',
      jpName: '<ruby>文脈<rt>ぶんみゃく</rt></ruby><ruby>大蛇<rt>だいじゃ</rt></ruby>・<ruby>言<rt>こと</rt></ruby>の<ruby>葉<rt>は</rt></ruby>の<ruby>龍<rt>りゅう</rt></ruby>',
      level: 15,
      maxHp: 560,
      atk: 48,
      breakMax: 5,
      weakness: 'reorder',
      weaknessLabel: '句子重組',
      exp: 525,
      gold: 540,
      lore: '盤繞於紫霧峽谷深處的蒼鱗大蛇，身軀由無數接續詞與複合表達交織而成。',
      introLine: {
        jp: '<ruby>前後<rt>ぜんご</rt></ruby>の<ruby>理<rt>ことわり</rt></ruby>を<ruby>見抜<rt>みぬ</rt></ruby>けぬ<ruby>者<rt>もの</rt></ruby>は、<ruby>文脈<rt>ぶんみゃく</rt></ruby>の<ruby>渦<rt>うず</rt></ruby>に<ruby>飲<rt>の</rt></ruby>まれるのみ！',
        zh: '看不透前後邏輯之人，只會被文脈的漩渦吞噬殆盡！',
        tts: 'ぜんごのことわりをみぬけぬものは、ぶんみゃくのうずにのまれるのみ！'
      },
      hitLine: {
        jp: 'しゃあぁ……<ruby>行間<rt>ぎょうかん</rt></ruby>の<ruby>意図<rt>いと</rt></ruby>まで<ruby>読<rt>よ</rt></ruby>み<ruby>切<rt>き</rt></ruby>ったと<ruby>言<rt>い</rt></ruby>うのか！',
        zh: '嘶啊……你連字裡行間的意圖都看穿了嗎！',
        tts: 'しゃあぁ、ぎょうかんのいとまでよみきったというのか！'
      },
      breakLine: {
        jp: 'ぐおおっ！<ruby>絡<rt>から</rt></ruby>み<ruby>合<rt>あ</rt></ruby>う<ruby>文脈<rt>ぶんみゃく</rt></ruby>の<ruby>鱗<rt>うろこ</rt></ruby>が<ruby>剥<rt>は</rt></ruby>がれ<ruby>落<rt>お</rt></ruby>ちる！',
        zh: '嗚喔喔！層層纏繞的文脈龍鱗竟被剝落了！',
        tts: 'ぐおおっ！からみあうぶんみゃくのうろこがはがれおちる！'
      },
      defeatLine: {
        jp: '<ruby>見事<rt>みごと</rt></ruby>な<ruby>読解力<rt>どっかいりょく</rt></ruby>だ……<ruby>雲上<rt>うんじょう</rt></ruby>の<ruby>思索<rt>しさく</rt></ruby>の<ruby>城塞<rt>じょうさい</rt></ruby>が<ruby>汝<rt>なんじ</rt></ruby>を<ruby>待<rt>ま</rt></ruby>つ。',
        zh: '出色的讀解力……雲端的思索城塞正等待著你。',
        tts: 'みごとなどっかいりょくだ。うんじょうのしさくのじょうさいがなんじをまつ。'
      },
      firstClearReward: { gold: 550, exp: 400, itemId: 'wp_thunder_biwa' }
    },

    en_r5_automaton: {
      id: 'en_r5_automaton',
      regionId: 'r5',
      isBoss: false,
      name: '禮法機關兵',
      jpName: '<ruby>礼法<rt>れいほう</rt></ruby><ruby>機関兵<rt>きかんへい</rt></ruby>',
      level: 16,
      maxHp: 355,
      atk: 45,
      breakMax: 3,
      weakness: 'conjugation',
      weaknessLabel: '動詞活用',
      exp: 225,
      gold: 205,
      lore: '巡邏思索城塞的蒼藍人造衛兵，只要偵測到尊敬語與謙讓語錯置便會即刻發動制裁。'
    },
    en_r5_phantom: {
      id: 'en_r5_phantom',
      regionId: 'r5',
      isBoss: false,
      name: '類義幽影',
      jpName: '<ruby>類義<rt>るいぎ</rt></ruby>の<ruby>幽影<rt>ゆうえい</rt></ruby>',
      level: 18,
      maxHp: 390,
      atk: 52,
      breakMax: 3,
      weakness: 'unnatural',
      weaknessLabel: '不自然表達',
      exp: 250,
      gold: 230,
      lore: '游移於高塔書庫間的半透明幻影，專門利用似是而非的近義表達誘使學者失足。'
    },
    boss_r5_chancellor: {
      id: 'boss_r5_chancellor',
      regionId: 'r5',
      isBoss: true,
      name: '思索宰相・敬語の審判者',
      jpName: '<ruby>思索<rt>しさく</rt></ruby><ruby>宰相<rt>さいしょう</rt></ruby>・<ruby>敬語<rt>けいご</rt></ruby>の<ruby>審判者<rt>しんぱんしゃ</rt></ruby>',
      level: 20,
      maxHp: 740,
      atk: 60,
      breakMax: 5,
      weakness: 'unnatural',
      weaknessLabel: '不自然表達',
      exp: 790,
      gold: 810,
      lore: '統理書庫要塞的冷峻宰相，手持律典天秤，審判一切長文邏輯與敬語禮儀的破綻。',
      introLine: {
        jp: 'ご<ruby>来訪<rt>らいほう</rt></ruby>、お<ruby>待<rt>ま</rt></ruby>ち<ruby>申<rt>もう</rt></ruby>し<ruby>上<rt>あ</rt></ruby>げておりました。その<ruby>言葉遣<rt>ことばづか</rt></ruby>い、<ruby>拝見<rt>はいけん</rt></ruby>いたしましょう。',
        zh: '恭候閣下大駕光臨。且容在下拜見您的言辭修養吧。',
        tts: 'ごらいほう、おまちもうしあげておりました。そのことばづかい、はいけんいたしましょう。'
      },
      hitLine: {
        jp: 'なるほど……<ruby>非<rt>ひ</rt></ruby>の<ruby>打<rt>う</rt></ruby>ちどころのない<ruby>論理<rt>ろんり</rt></ruby>でございますな。',
        zh: '原來如此……真是無懈可擊的邏輯啊。',
        tts: 'なるほど、ひのうちどころのないろんりでございますな。'
      },
      breakLine: {
        jp: 'むうっ！<ruby>城塞<rt>じょうさい</rt></ruby>の<ruby>規範<rt>きはん</rt></ruby>すら<ruby>凌駕<rt>りょうが</rt></ruby>するとは<ruby>驚<rt>おどろ</rt></ruby>きです！',
        zh: '唔！竟然連城塞的規範都能凌駕，實在令人震驚！',
        tts: 'むうっ！じょうさいのきはんすらりょうがするとはおどろきです！'
      },
      defeatLine: {
        jp: '<ruby>完敗<rt>かんぱい</rt></ruby>いたしました。<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>聖域<rt>せいいき</rt></ruby>へ<ruby>向<rt>む</rt></ruby>かう<ruby>資格<rt>しかく</rt></ruby>、<ruby>十分<rt>じゅうぶん</rt></ruby>にお<ruby>持<rt>も</rt></ruby>ちです。',
        zh: '在下甘拜下風。閣下已完全具備前往言靈聖域的資格。',
        tts: 'かんぱいいたしました。ことだまのせいいきへむかうしかく、じゅうぶんにおもちです。'
      },
      firstClearReward: { gold: 800, exp: 600, itemId: 'ar_citadel_vestment' }
    },

    en_r6_archon: {
      id: 'en_r6_archon',
      regionId: 'r6',
      isBoss: false,
      name: '慣用句執政官',
      jpName: '<ruby>慣用句<rt>かんようく</rt></ruby>の<ruby>執政官<rt>しっせいかん</rt></ruby>',
      level: 21,
      maxHp: 465,
      atk: 58,
      breakMax: 3,
      weakness: 'reading',
      weaknessLabel: '單字讀音',
      exp: 335,
      gold: 315,
      lore: '披著緋紅聖衣的古老語靈，舉止莊嚴，以罕見漢語與深奧成語考驗闖入者。'
    },
    en_r6_voidling: {
      id: 'en_r6_voidling',
      regionId: 'r6',
      isBoss: false,
      name: '語感虛無獸',
      jpName: '<ruby>語感<rt>ごかん</rt></ruby>の<ruby>虚無獣<rt>きょむじゅう</rt></ruby>',
      level: 23,
      maxHp: 510,
      atk: 65,
      breakMax: 3,
      weakness: 'unnatural',
      weaknessLabel: '不自然表達',
      exp: 370,
      gold: 350,
      lore: '誕生於語意極微裂縫的暗影獸，唯有察覺正面與負面語氣制約者才能將其斬斷。'
    },
    boss_r6_overlord: {
      id: 'boss_r6_overlord',
      regionId: 'r6',
      isBoss: true,
      name: '沈默魔王・無言の覇者',
      jpName: '<ruby>沈黙<rt>ちんもく</rt></ruby><ruby>魔王<rt>まおう</rt></ruby>・<ruby>無言<rt>むごん</rt></ruby>の<ruby>覇者<rt>はしゃ</rt></ruby>',
      level: 25,
      maxHp: 980,
      atk: 74,
      breakMax: 5,
      weakness: 'unnatural',
      weaknessLabel: '不自然表達',
      exp: 1400,
      gold: 1500,
      lore: '意圖抹去世間一切語言微妙溫度的終極魔王。唯有融會貫通 N4 至 N1 的言靈使者方能將其淨化。',
      introLine: {
        jp: '<ruby>幾多<rt>いくた</rt></ruby>の<ruby>試練<rt>しれん</rt></ruby>を<ruby>越<rt>こ</rt></ruby>えし<ruby>者<rt>もの</rt></ruby>よ。<ruby>言葉<rt>ことば</rt></ruby>の<ruby>極致<rt>きょくち</rt></ruby>、その<ruby>身<rt>み</rt></ruby>をもって<ruby>示<rt>しめ</rt></ruby>すがよい！',
        zh: '跨越重重試煉之人啊。就用你自身來展現語言的極致吧！',
        tts: 'いくたのしれんをこえしものよ。ことばのきょくち、そのみをもってしめすがよい！'
      },
      hitLine: {
        jp: 'ほう……<ruby>微細<rt>びさい</rt></ruby>な<ruby>語感<rt>ごかん</rt></ruby>の<ruby>差<rt>さ</rt></ruby>すら<ruby>見誤<rt>みあやま</rt></ruby>らぬとはな！',
        zh: '喔……連如此細微的語感之差都不曾誤判嗎！',
        tts: 'ほう、びさいなごかんのさすらみあやまらぬとはな！'
      },
      breakLine: {
        jp: 'ぐあああっ！<ruby>千載<rt>せんざい</rt></ruby>の<ruby>沈黙<rt>ちんもく</rt></ruby>が、<ruby>汝<rt>なんじ</rt></ruby>の<ruby>言霊<rt>ことだま</rt></ruby>に<ruby>貫<rt>つらぬ</rt></ruby>かれたか！',
        zh: '唔啊啊啊！千年的沈默竟被你的言靈所貫穿了嗎！',
        tts: 'ぐあああっ！せんざいのちんもくが、なんじのことだまにつらぬかれたか！'
      },
      defeatLine: {
        jp: '<ruby>美<rt>うつく</rt></ruby>しき<ruby>響<rt>ひび</rt></ruby>きよ……<ruby>言葉<rt>ことば</rt></ruby>が<ruby>生<rt>い</rt></ruby>きる<ruby>限<rt>かぎ</rt></ruby>り、<ruby>世界<rt>せかい</rt></ruby>は<ruby>決<rt>けっ</rt></ruby>して<ruby>色褪<rt>いろあ</rt></ruby>せまい。',
        zh: '多麼優美的回響……只要語言依然鮮活，世界便絕不會褪色。',
        tts: 'うつくしきひびきよ。ことばがいきるかぎり、せかいはけっしていろあせまい。'
      },
      firstClearReward: { gold: 1600, exp: 1200, itemId: 'wp_kotodama_blade' }
    }
  };

  const SKILLS = [
    {
      id: 'vocab_insight',
      branch: '語彙系',
      icon: 'book',
      name: '單字洞察',
      jpName: '<ruby>単語<rt>たんご</rt></ruby><ruby>洞察<rt>どうさつ</rt></ruby>',
      type: 'active',
      context: 'battle',
      mpCost: 10,
      maxLevel: 3,
      desc: '解析敵方言靈結構，在戰鬥中消除錯誤選項並顯示解題提示，高等級更可追加傷害與破防。',
      levelEffects: [
        'Lv.1：消除 1 個錯誤選項（句子重組則提示首個語塊），並顯示文法提示。',
        'Lv.2：消除 2 個錯誤選項（句子重組提示前 2 個語塊），本回合答對傷害 +20%。',
        'Lv.3：消除 2 個錯誤選項，本回合答對傷害 +35% 且額外造成 +1 點破防。'
      ]
    },
    {
      id: 'grammar_shield',
      branch: '文法系',
      icon: 'shield',
      name: '助詞護盾',
      jpName: '<ruby>助詞<rt>じょし</rt></ruby>の<ruby>盾<rt>たて</rt></ruby>',
      type: 'passive',
      context: 'battle',
      mpCost: 0,
      maxLevel: 3,
      desc: '以穩固的文法知識在周身構築防護結界，答錯時大幅減免受到的反擊傷害並有機會保留連擊。',
      levelEffects: [
        'Lv.1：答錯時受到的傷害減免 22%。',
        'Lv.2：答錯時受到的傷害減免 35%，且連擊歸零改為僅減半。',
        'Lv.3：答錯時受到的傷害減免 48%，每場戰鬥首次答錯免於中斷連擊。'
      ]
    },
    {
      id: 'speed_reading',
      branch: '閱讀系',
      icon: 'scroll',
      name: '速讀解析',
      jpName: '<ruby>速読<rt>そくどく</rt></ruby><ruby>解析<rt>かいせき</rt></ruby>',
      type: 'active',
      context: 'reading',
      mpCost: 12,
      maxLevel: 3,
      desc: '在閱讀地下城中發動，直接高亮標示當前題目的關鍵依據句，高等級還會同時排除干擾選項。',
      levelEffects: [
        'Lv.1：高亮標記當前題目對應的原文關鍵句（key-sentence）。',
        'Lv.2：高亮原文關鍵句，並同時消除 1 個錯誤選項。',
        'Lv.3：高亮原文關鍵句、消除 1 個錯誤選項，且通關經驗與金幣 +25%。'
      ]
    },
    {
      id: 'clairaudience',
      branch: '聽力系',
      icon: 'bolt',
      name: '順風耳',
      jpName: '<ruby>順風耳<rt>じゅんぷうじ</rt></ruby>',
      type: 'active',
      context: 'battle',
      mpCost: 10,
      maxLevel: 3,
      desc: '凝神傾聽日語原生韻律，以清晰慢速朗讀題目並強化當回合的專注值與暴擊威力。',
      levelEffects: [
        'Lv.1：以 0.8x 清晰語速朗讀題目，並顯示題目提示；本回合答對專注值額外 +12%。',
        'Lv.2：以 0.78x 語速朗讀並顯示提示，本回合答對必觸發暴擊且專注值額外 +18%。',
        'Lv.3：以 0.75x 語速朗讀並消除 1 個錯誤選項，本回合答對必暴擊且傷害 +30%。'
      ]
    },
    {
      id: 'kotodama_negotiate',
      branch: '會話系',
      icon: 'heart',
      name: '言靈交涉',
      jpName: '<ruby>言霊<rt>ことだま</rt></ruby><ruby>交渉<rt>こうしょう</rt></ruby>',
      type: 'passive',
      context: 'global',
      mpCost: 0,
      maxLevel: 3,
      desc: '以自然得體的日語應對贏得信任，永久提供商店折扣、戰鬥金幣加成與 NPC 好感度提升。',
      levelEffects: [
        'Lv.1：商店購買享 9 折優惠，NPC 對話好感度獲得 +20%。',
        'Lv.2：商店購買享 85 折優惠，NPC 好感度 +35%，戰鬥獲得金幣 +15%。',
        'Lv.3：商店購買享 78 折優惠，NPC 好感度 +50%，戰鬥獲得金幣 +28%。'
      ]
    }
  ];

  const ITEMS = {
    /* -------------------- 武器 (7) -------------------- */
    wp_wood_blade: {
      id: 'wp_wood_blade',
      name: '初音木刀',
      jpName: '<ruby>初音<rt>はつね</rt></ruby>の<ruby>木刀<rt>ぼくとう</rt></ruby>',
      type: 'weapon',
      rarity: 'common',
      icon: 'sword',
      price: 80,
      shoppable: true,
      minRegion: 1,
      desc: '以檜木削製的言靈劍士初始木刀，刀身刻有清音古紋，揮動時發出清脆風聲。',
      stats: { INT: 5, WIS: 1, CHA: 1, maxHp: 10, maxMp: 0 }
    },
    wp_ink_staff: {
      id: 'wp_ink_staff',
      name: '墨韻短杖',
      jpName: '<ruby>墨韻<rt>ぼくいん</rt></ruby>の<ruby>短杖<rt>たんじょう</rt></ruby>',
      type: 'weapon',
      rarity: 'common',
      icon: 'staff',
      price: 80,
      shoppable: true,
      minRegion: 1,
      desc: '古籍學者隨身攜帶的松煙墨杖，杖尖蘊含清澈文法靈力，能穩定引導魔力。',
      stats: { INT: 2, WIS: 5, CHA: 1, maxHp: 0, maxMp: 12 }
    },
    wp_reed_lute: {
      id: 'wp_reed_lute',
      name: '蘆笛三味線',
      jpName: '<ruby>葦音<rt>あしね</rt></ruby>の<ruby>三味線<rt>しゃみせん</rt></ruby>',
      type: 'weapon',
      rarity: 'common',
      icon: 'lute',
      price: 80,
      shoppable: true,
      minRegion: 1,
      desc: '音韻旅藝人常用的輕便樂器，撥弦之間能讓日語音節產生悅耳共鳴。',
      stats: { INT: 2, WIS: 1, CHA: 5, maxHp: 5, maxMp: 6 }
    },
    wp_iron_katana: {
      id: 'wp_iron_katana',
      name: '助詞鍛鋼刀',
      jpName: '<ruby>助詞<rt>じょし</rt></ruby><ruby>鍛鋼刀<rt>たんこうとう</rt></ruby>',
      type: 'weapon',
      rarity: 'uncommon',
      icon: 'sword',
      price: 260,
      shoppable: true,
      minRegion: 2,
      desc: '由基礎の領地名匠反覆摺疊鍛造的鋼刃，鋒利沉穩，斬斷文法迷霧毫不費力。',
      stats: { INT: 11, WIS: 4, CHA: 3, maxHp: 22, maxMp: 5 }
    },
    wp_azure_brush: {
      id: 'wp_azure_brush',
      name: '蒼墨大筆',
      jpName: '<ruby>蒼墨<rt>そうぼく</rt></ruby>の<ruby>大筆<rt>おおふで</rt></ruby>',
      type: 'weapon',
      rarity: 'rare',
      icon: 'staff',
      price: 520,
      shoppable: true,
      minRegion: 3,
      desc: '日常の都文豪遺留的法器大筆，揮毫之際墨光化刃，大幅提升文法解析與魔力上限。',
      stats: { INT: 12, WIS: 16, CHA: 7, maxHp: 18, maxMp: 28 }
    },
    wp_thunder_biwa: {
      id: 'wp_thunder_biwa',
      name: '雷鳴琵琶',
      jpName: '<ruby>雷鳴<rt>らいめい</rt></ruby><ruby>琵琶<rt>びわ</rt></ruby>',
      type: 'weapon',
      rarity: 'epic',
      icon: 'lute',
      price: 920,
      shoppable: true,
      minRegion: 4,
      desc: '文脈の峡谷紫電淬鍊而成的古琵琶，弦音如雷霆貫耳，能輕易震撼高階語靈。',
      stats: { INT: 18, WIS: 14, CHA: 22, maxHp: 35, maxMp: 25 }
    },
    wp_kotodama_blade: {
      id: 'wp_kotodama_blade',
      name: '真言太刀・言霊丸',
      jpName: '<ruby>真言<rt>しんごん</rt></ruby><ruby>太刀<rt>たち</rt></ruby>・<ruby>言霊丸<rt>ことだままる</rt></ruby>',
      type: 'weapon',
      rarity: 'legendary',
      icon: 'sword',
      price: 2400,
      shoppable: false,
      minRegion: 6,
      desc: '傳說中由千載言靈結晶鑄成的神兵太刀，凝聚語彙、文法與音韻之極致，無堅不摧。',
      stats: { INT: 34, WIS: 28, CHA: 26, maxHp: 75, maxMp: 45 }
    },

    /* -------------------- 防具 (7) -------------------- */
    ar_linen_cloak: {
      id: 'ar_linen_cloak',
      name: '旅人亞麻斗篷',
      jpName: '<ruby>旅人<rt>たびびと</rt></ruby>の<ruby>麻<rt>あさ</rt></ruby>マント',
      type: 'armor',
      rarity: 'common',
      icon: 'cloak',
      price: 110,
      shoppable: true,
      minRegion: 1,
      desc: '始まりの町裁縫師編織的輕便斗篷，能抵禦清晨山霧與微弱的雜音衝擊。',
      stats: { INT: 1, WIS: 2, CHA: 2, maxHp: 28, maxMp: 8 }
    },
    ar_festival_haori: {
      id: 'ar_festival_haori',
      name: '祭典紋樣羽織',
      jpName: '<ruby>祭典<rt>さいてん</rt></ruby><ruby>紋様<rt>もんよう</rt></ruby>の<ruby>羽織<rt>はおり</rt></ruby>',
      type: 'armor',
      rarity: 'uncommon',
      icon: 'cloak',
      price: 240,
      shoppable: true,
      minRegion: 2,
      desc: '繡有金色花火與波浪紋的傳統羽織，令穿戴者在對話與戰鬥中皆充滿從容氣度。',
      stats: { INT: 3, WIS: 4, CHA: 7, maxHp: 42, maxMp: 14 }
    },
    ar_traveler_coat: {
      id: 'ar_traveler_coat',
      name: '領地行者外套',
      jpName: '<ruby>領地<rt>りょうち</rt></ruby><ruby>行者<rt>ぎょうじゃ</rt></ruby>の<ruby>外套<rt>がいとう</rt></ruby>',
      type: 'armor',
      rarity: 'uncommon',
      icon: 'armor',
      price: 280,
      shoppable: true,
      minRegion: 2,
      desc: '厚實皮革內襯助詞符布的實戰長袍，兼顧防護力與行動輕盈度。',
      stats: { INT: 4, WIS: 5, CHA: 3, maxHp: 56, maxMp: 12 }
    },
    ar_scribe_robe: {
      id: 'ar_scribe_robe',
      name: '都城書記法衣',
      jpName: '<ruby>都城<rt>とじょう</rt></ruby><ruby>書記<rt>しょき</rt></ruby>の<ruby>法衣<rt>ほうい</rt></ruby>',
      type: 'armor',
      rarity: 'rare',
      icon: 'robe',
      price: 540,
      shoppable: true,
      minRegion: 3,
      desc: '日常の都文官所著的緋紅錦衣，袖口以金線織就古歌韻腳，極大幅度增幅魔力。',
      stats: { INT: 7, WIS: 11, CHA: 8, maxHp: 78, maxMp: 30 }
    },
    ar_canyon_mail: {
      id: 'ar_canyon_mail',
      name: '峽谷文脈鎖甲',
      jpName: '<ruby>峡谷<rt>きょうこく</rt></ruby><ruby>文脈<rt>ぶんみゃく</rt></ruby>の<ruby>鎖帷子<rt>くさりかたびら</rt></ruby>',
      type: 'armor',
      rarity: 'epic',
      icon: 'armor',
      price: 940,
      shoppable: true,
      minRegion: 4,
      desc: '以紫銀細環編織的輕量鎖甲，能分散強敵反擊造成的言靈震盪。',
      stats: { INT: 12, WIS: 12, CHA: 9, maxHp: 118, maxMp: 28 }
    },
    ar_citadel_vestment: {
      id: 'ar_citadel_vestment',
      name: '思索城塞禮服',
      jpName: '<ruby>思索<rt>しさく</rt></ruby><ruby>城塞<rt>じょうさい</rt></ruby>の<ruby>礼装<rt>れいそう</rt></ruby>',
      type: 'armor',
      rarity: 'epic',
      icon: 'robe',
      price: 1380,
      shoppable: true,
      minRegion: 5,
      desc: '象徵高階禮法與深邃思辨的蒼藍大衣，穿戴者可從容面對長文考驗與敬語審判。',
      stats: { INT: 16, WIS: 20, CHA: 15, maxHp: 150, maxMp: 48 }
    },
    ar_sanctuary_aegis: {
      id: 'ar_sanctuary_aegis',
      name: '聖域神護御衣',
      jpName: '<ruby>聖域<rt>せいいき</rt></ruby><ruby>神護<rt>しんご</rt></ruby>の<ruby>御衣<rt>おんぞ</rt></ruby>',
      type: 'armor',
      rarity: 'legendary',
      icon: 'armor',
      price: 2500,
      shoppable: false,
      minRegion: 6,
      desc: '織入緋紅神木絲線的傳奇護甲，綻放柔和而不可侵犯的言靈聖盾。',
      stats: { INT: 22, WIS: 26, CHA: 24, maxHp: 220, maxMp: 65 }
    },

    /* -------------------- 飾品 (7) -------------------- */
    ac_elder_orb: {
      id: 'ac_elder_orb',
      name: '村長傳承玉佩',
      jpName: '<ruby>村長<rt>そんちょう</rt></ruby><ruby>伝承<rt>でんしょう</rt></ruby>の<ruby>勾玉<rt>まがたま</rt></ruby>',
      type: 'accessory',
      rarity: 'uncommon',
      icon: 'amulet',
      price: 220,
      shoppable: false,
      minRegion: 1,
      desc: '源藏村長代代相傳的溫潤勾玉，寄託著守護村莊與傳承語言的深厚期許。',
      stats: { INT: 4, WIS: 4, CHA: 5, maxHp: 30, maxMp: 15 }
    },
    ac_silver_ring: {
      id: 'ac_silver_ring',
      name: '銀月音韻戒',
      jpName: '<ruby>銀月<rt>ぎんげつ</rt></ruby><ruby>音韻<rt>おんいん</rt></ruby>の<ruby>指輪<rt>ゆびわ</rt></ruby>',
      type: 'accessory',
      rarity: 'uncommon',
      icon: 'ring',
      price: 300,
      shoppable: true,
      minRegion: 2,
      desc: '鑲嵌細小月光石的銀戒，讓持有者在閱讀與對戰時保持冷靜沉著。',
      stats: { INT: 5, WIS: 6, CHA: 4, maxHp: 15, maxMp: 20 }
    },
    ac_festival_fan: {
      id: 'ac_festival_fan',
      name: '夏祭花火摺扇',
      jpName: '<ruby>夏祭<rt>なつまつ</rt></ruby>りの<ruby>花火<rt>はなび</rt></ruby><ruby>扇<rt>おうぎ</rt></ruby>',
      type: 'accessory',
      rarity: 'rare',
      icon: 'talisman',
      price: 460,
      shoppable: false,
      minRegion: 2,
      desc: '繪有夜空大輪花火的雅緻摺扇，輕搖之間能喚起祭典的熱烈氣息與靈感。',
      stats: { INT: 8, WIS: 7, CHA: 11, maxHp: 25, maxMp: 22 }
    },
    ac_shrine_bell: {
      id: 'ac_shrine_bell',
      name: '清澄神樂鈴',
      jpName: '<ruby>清澄<rt>せいちょう</rt></ruby>の<ruby>神楽鈴<rt>かぐらすず</rt></ruby>',
      type: 'accessory',
      rarity: 'rare',
      icon: 'amulet',
      price: 620,
      shoppable: true,
      minRegion: 3,
      desc: '神社試煉場賜予的澄澈銅鈴，輕鳴即可驅散雜念並凝聚言靈專注力。',
      stats: { INT: 9, WIS: 12, CHA: 10, maxHp: 35, maxMp: 30 }
    },
    ac_context_lens: {
      id: 'ac_context_lens',
      name: '文脈解析單片鏡',
      jpName: '<ruby>文脈<rt>ぶんみゃく</rt></ruby><ruby>解析<rt>かいせき</rt></ruby>の<ruby>片眼鏡<rt>かためがね</rt></ruby>',
      type: 'accessory',
      rarity: 'epic',
      icon: 'ring',
      price: 980,
      shoppable: true,
      minRegion: 4,
      desc: '古籍學者秘製的紫水晶鏡片，能一眼洞悉長文中的指代關係與職場潛台詞。',
      stats: { INT: 15, WIS: 18, CHA: 10, maxHp: 30, maxMp: 42 }
    },
    ac_sanctuary_crown: {
      id: 'ac_sanctuary_crown',
      name: '聖域金葉冠',
      jpName: '<ruby>聖域<rt>せいいき</rt></ruby>の<ruby>金葉冠<rt>きんようかん</rt></ruby>',
      type: 'accessory',
      rarity: 'epic',
      icon: 'amulet',
      price: 1450,
      shoppable: false,
      minRegion: 5,
      desc: '唯有通過高階讀解試煉者方能配戴的桂冠，象徵駕馭繁複語境的卓越智慧。',
      stats: { INT: 19, WIS: 21, CHA: 18, maxHp: 60, maxMp: 50 }
    },
    ac_kotodama_heart: {
      id: 'ac_kotodama_heart',
      name: '言靈之心・皆傳御守',
      jpName: '<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>心<rt>こころ</rt></ruby>・<ruby>皆伝<rt>かいでん</rt></ruby><ruby>御守<rt>おまもり</rt></ruby>',
      type: 'accessory',
      rarity: 'legendary',
      icon: 'talisman',
      price: 2600,
      shoppable: false,
      minRegion: 6,
      desc: '試煉神社至高無上的皆傳信物，封印著整個大陸最純粹的言靈脈動。',
      stats: { INT: 26, WIS: 26, CHA: 26, maxHp: 90, maxMp: 70 }
    },

    /* -------------------- 消耗品 (4) -------------------- */
    con_herb: {
      id: 'con_herb',
      name: '回復藥草',
      jpName: '<ruby>回復<rt>かいふく</rt></ruby><ruby>薬草<rt>やくそう</rt></ruby>',
      type: 'consumable',
      rarity: 'common',
      icon: 'potion',
      price: 45,
      shoppable: true,
      minRegion: 1,
      desc: '以朝露採摘的翠綠藥草，使用後立即恢復 45% 最大生命值。',
      stats: { INT: 0, WIS: 0, CHA: 0, maxHp: 0, maxMp: 0 },
      effect: { healHpPct: 45 }
    },
    con_water: {
      id: 'con_water',
      name: '言靈靈水',
      jpName: '<ruby>言霊<rt>ことだま</rt></ruby>の<ruby>霊水<rt>れいすい</rt></ruby>',
      type: 'consumable',
      rarity: 'common',
      icon: 'elixir',
      price: 55,
      shoppable: true,
      minRegion: 1,
      desc: '自聖泉汲取的清澄靈水，飲下後立即恢復 50% 最大魔力值。',
      stats: { INT: 0, WIS: 0, CHA: 0, maxHp: 0, maxMp: 0 },
      effect: { healMpPct: 50 }
    },
    con_break_scroll: {
      id: 'con_break_scroll',
      name: '破防卷軸',
      jpName: '<ruby>破防<rt>はぼう</rt></ruby>の<ruby>巻物<rt>まきもの</rt></ruby>',
      type: 'consumable',
      rarity: 'uncommon',
      icon: 'scroll',
      price: 90,
      shoppable: true,
      minRegion: 1,
      desc: '記載破邪真言的咒符卷軸，對敵人造成 2 點破防與相當於答對一題的傷害（無法直接擊倒），每場戰鬥限用一張。',
      stats: { INT: 0, WIS: 0, CHA: 0, maxHp: 0, maxMp: 0 },
      effect: { breakDamage: 2, bonusDamage: 25 }
    },
    con_fever_charm: {
      id: 'con_fever_charm',
      name: '專注護符',
      jpName: '<ruby>集中<rt>しゅうちゅう</rt></ruby>の<ruby>護符<rt>ごふ</rt></ruby>',
      type: 'consumable',
      rarity: 'rare',
      icon: 'charm',
      price: 140,
      shoppable: true,
      minRegion: 2,
      desc: '燃燒金焰的精純護符，立即發動 FEVER 專注狀態並恢復 20% 生命值！',
      stats: { INT: 0, WIS: 0, CHA: 0, maxHp: 0, maxMp: 0 },
      effect: { feverInstant: true, healHpPct: 20 }
    }
  };

  const NPCS = {
    mayor: {
      id: 'mayor',
      name: '源蔵',
      title: '始まりの町・老村長',
      role: 'main_story',
      greeting: '歡迎回來，年輕的言靈使者。無論走得多遠，別忘了回來看看故鄉的爐火與進度。',
      greetingJp: 'よく<ruby>帰<rt>かえ</rt></ruby>ってきてくれたね。<ruby>旅<rt>たび</rt></ruby>の<ruby>調子<rt>ちょうし</rt></ruby>はどうだい？',
      greetingTts: 'よくかえってきてくれたね。たびのちょうしはどうだい？',
      dialogues: [
        {
          id: 'mayor_d1',
          npcLineJp: '<ruby>最近<rt>さいきん</rt></ruby>、<ruby>町<rt>まち</rt></ruby>の<ruby>外<rt>はず</rt></ruby>れで<ruby>言葉<rt>ことば</rt></ruby>を<ruby>乱<rt>みだ</rt></ruby>す<ruby>魔物<rt>まもの</rt></ruby>が<ruby>増<rt>ふ</rt></ruby>えていてね。<ruby>君<rt>きみ</rt></ruby>に<ruby>力<rt>ちから</rt></ruby>を<ruby>貸<rt>か</rt></ruby>してほしいんだ。',
          npcLineZh: '最近鎮外擾亂語言的魔物越來越多了。我想借重你的力量啊。',
          tts: 'さいきん、まちのはずれでことばをみだすまものがふえていてね。きみにちからをかしてほしいんだ。',
          emotion: 'serious',
          choices: [
            {
              jp: 'お<ruby>任<rt>まか</rt></ruby>せください。<ruby>精一杯<rt>せいいっぱい</rt></ruby><ruby>頑張<rt>がんば</rt></ruby>ります！',
              zh: '請交給我吧，我會竭盡全力努力的！',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'おお、<ruby>頼<rt>たの</rt></ruby>もしい<ruby>返事<rt>へんじ</rt></ruby>だ！<ruby>無理<rt>むり</rt></ruby>だけはしないようにね。',
              replyZh: '喔喔，真是令人安心的回答！千萬別太勉強自己喔。',
              feedback: '非常道地且有禮貌的承接說法！「お任せください」搭配「精一杯頑張ります」能展現十足誠意。'
            },
            {
              jp: 'はい、<ruby>気<rt>き</rt></ruby>をつけて<ruby>行<rt>い</rt></ruby>ってきます。',
              zh: '好的，我會小心出發的。',
              affectionDelta: 8,
              replyEmotion: 'calm',
              replyJp: 'うむ、<ruby>焦<rt>あせ</rt></ruby>らず<ruby>一歩<rt>いっぽ</rt></ruby>ずつ<ruby>進<rt>すす</rt></ruby>むのが<ruby>一番<rt>いちばん</rt></ruby>だよ。',
              replyZh: '嗯，不急不躁一步步前進是最好的。',
              feedback: '自然穩妥的日常禮貌回應，適切而不失親切感。'
            },
            {
              jp: '<ruby>報酬<rt>ほうしゅう</rt></ruby>が<ruby>高<rt>たか</rt></ruby>ければ<ruby>考<rt>かんが</rt></ruby>えてやるよ。',
              zh: '報酬夠高的話我就幫你考慮看看啦。',
              affectionDelta: -4,
              replyEmotion: 'serious',
              replyJp: 'やれやれ……<ruby>目上<rt>めうえ</rt></ruby>の<ruby>者<rt>もの</rt></ruby>に「〜てやる」はちょっと<ruby>乱暴<rt>らんぼう</rt></ruby>だぞ。',
              replyZh: '哎呀呀……對長輩用「〜てやる」可有點太粗魯囉。',
              feedback: '對長輩使用「〜てやる」帶有強烈居高臨下感，在日語交際中相當失禮。'
            }
          ]
        },
        {
          id: 'mayor_d2',
          npcLineJp: '<ruby>長旅<rt>ながたび</rt></ruby>で<ruby>疲<rt>つか</rt></ruby>れたろう。よかったら<ruby>熱<rt>あつ</rt></ruby>いお<ruby>茶<rt>ちゃ</rt></ruby>でも<ruby>一杯<rt>いっぱい</rt></ruby>どうだい？',
          npcLineZh: '長途跋涉累了吧。不介意的話要不要喝杯熱茶呢？',
          tts: 'ながたびでつかれたろう。よかったらあついおちゃでもいっぱいどうだい？',
          emotion: 'happy',
          choices: [
            {
              jp: 'ありがとうございます。ぜひいただきます！',
              zh: '非常感謝，那我就不客氣地享用了！',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'ははは、そう<ruby>言<rt>い</rt></ruby>ってくれると<ruby>嬉<rt>うれ</rt></ruby>しいよ。ゆっくりしていきなさい。',
              replyZh: '哈哈哈，你這麼說我真開心。慢慢坐吧。',
              feedback: '滿分回應！接受長輩盛情款待時，「ありがとうございます。ぜひいただきます」既感謝又自然。'
            },
            {
              jp: 'すみません、お<ruby>気遣<rt>きづか</rt></ruby>いありがとうございます。',
              zh: '不好意思，謝謝您的關心。',
              affectionDelta: 10,
              replyEmotion: 'calm',
              replyJp: '<ruby>遠慮<rt>えんりょ</rt></ruby>はいらないのに。でも<ruby>丁寧<rt>ていねい</rt></ruby>でいい<ruby>心掛<rt>こころが</rt></ruby>けだね。',
              replyZh: '不用那麼客氣的。不過這麼有禮貌真是好習慣呢。',
              feedback: '使用「お気遣いありがとうございます」是非常優雅的敬語感謝。'
            },
            {
              jp: 'いりません。<ruby>忙<rt>いそが</rt></ruby>しいですから。',
              zh: '不用了，因為我很忙。',
              affectionDelta: -3,
              replyEmotion: 'serious',
              replyJp: 'そうか……<ruby>断<rt>ことわ</rt></ruby>る<ruby>時<rt>とき</rt></ruby>は「せっかくですが」と<ruby>添<rt>そ</rt></ruby>えると<ruby>柔<rt>やわ</rt></ruby>らかいぞ。',
              replyZh: '這樣啊……婉拒時加上一句「せっかくですが（盛情難卻但…）」會圓融得多喔。',
              feedback: '直接說「いりません」語氣生硬，日語婉拒建議改說「せっかくですが、今回は遠慮しておきます」。'
            }
          ]
        },
        {
          id: 'mayor_d3',
          npcLineJp: '<ruby>昔<rt>むかし</rt></ruby>から<ruby>言<rt>い</rt></ruby>うだろう。「<ruby>言葉<rt>ことば</rt></ruby>は<ruby>心<rt>こころ</rt></ruby>を<ruby>繋<rt>つな</rt></ruby>ぐ<ruby>橋<rt>はし</rt></ruby>」だと。<ruby>君<rt>きみ</rt></ruby>は<ruby>旅<rt>たび</rt></ruby>で<ruby>何<rt>なに</rt></ruby>を<ruby>感<rt>かん</rt></ruby>じたかな？',
          npcLineZh: '古人常說「語言是連結心靈的橋樑」。你在旅途中感受到了什麼呢？',
          tts: 'むかしからいうだろう。ことばはこころをつなぐはしだと。きみはたびでなにをかんじたかな？',
          emotion: 'calm',
          choices: [
            {
              jp: '<ruby>相手<rt>あいて</rt></ruby>を<ruby>思<rt>おも</rt></ruby>いやって<ruby>話<rt>はな</rt></ruby>す<ruby>大切<rt>たいせつ</rt></ruby>さを<ruby>学<rt>まな</rt></ruby>びました。',
              zh: '我學到了設身處地為對方著想來說話的重要性。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'ほぅ……<ruby>立派<rt>りっぱ</rt></ruby>に<ruby>成長<rt>せいちょう</rt></ruby>したな。<ruby>村<rt>むら</rt></ruby>の<ruby>誇<rt>ほこ</rt></ruby>りだよ。',
              replyZh: '喔……真是茁壯成長了啊。你是村子的驕傲呢。',
              feedback: '「思いやる（體貼、為對方著想）」是極具日語文化溫度的詞彙，表達誠懇深刻！'
            },
            {
              jp: 'たくさんの<ruby>単語<rt>たんご</rt></ruby>や<ruby>文法<rt>ぶんぽう</rt></ruby>が<ruby>身<rt>み</rt></ruby>につきました。',
              zh: '我掌握了許多的單字和文法。',
              affectionDelta: 9,
              replyEmotion: 'calm',
              replyJp: 'コツコツ<ruby>積<rt>つ</rt></ruby>み<ruby>重<rt>かさ</rt></ruby>ねるのが<ruby>一番<rt>いちばん</rt></ruby>の<ruby>力<rt>ちから</rt></ruby>になるからね。',
              replyZh: '腳踏實地累積才是最強大的力量呢。',
              feedback: '「身につく（學會、化為自身能力）」是非常道地的慣用搭配！'
            },
            {
              jp: 'よくわかりません。ただ<ruby>戦<rt>たたか</rt></ruby>っただけです。',
              zh: '我不太清楚，只是不斷戰鬥而已。',
              affectionDelta: 2,
              replyEmotion: 'calm',
              replyJp: 'ふむ、それも<ruby>正直<rt>しょうじき</rt></ruby>でいいが、たまには<ruby>言葉<rt>ことば</rt></ruby>の<ruby>意味<rt>いみ</rt></ruby>も<ruby>味<rt>あじ</rt></ruby>わってみなさい。',
              replyZh: '嗯，雖然很坦白，但偶爾也細細品味話語的涵義吧。',
              feedback: '語法無誤，但在溫馨對談中顯得較為冷淡。'
            }
          ]
        }
      ],
      milestones: [
        {
          affection: 30,
          rewardText: '村長的激勵：金幣 120、技能點 +1、回復藥草 ×2',
          reward: { gold: 120, sp: 1, itemId: 'con_herb', qty: 2, title: '村莊信賴者' }
        },
        {
          affection: 60,
          rewardText: '傳承信物：村長傳承玉佩、金幣 220、技能點 +1',
          reward: { gold: 220, sp: 1, itemId: 'ac_elder_orb', qty: 1, title: '始まりの守護者' }
        },
        {
          affection: 100,
          rewardText: '至高託付：專注護符 ×2、金幣 500、技能點 +2',
          reward: { gold: 500, sp: 2, itemId: 'con_fever_charm', qty: 2, title: '故鄉的榮耀' }
        }
      ]
    },

    merchant: {
      id: 'merchant',
      name: '雪乃',
      title: '言靈行商・裝備鋪店主',
      role: 'shop',
      greeting: '歡迎光臨！從實用的回復藥草到各地域名工打造的防具，這裡全都有喔。',
      greetingJp: 'いらっしゃいませ！<ruby>旅<rt>たび</rt></ruby>に<ruby>役立<rt>やくだ</rt></ruby>つ<ruby>品<rt>しな</rt></ruby>をたくさん<ruby>揃<rt>そろ</rt></ruby>えていますよ。',
      greetingTts: 'いらっしゃいませ！たびにやくだつしなをたくさんそろえていますよ。',
      dialogues: [
        {
          id: 'merchant_d1',
          npcLineJp: 'あら、いいタイミング！ちょうど<ruby>都<rt>みやこ</rt></ruby>から<ruby>珍<rt>めずら</rt></ruby>しい<ruby>巻物<rt>まきもの</rt></ruby>が<ruby>届<rt>とど</rt></ruby>いたところなんです。ご<ruby>覧<rt>らん</rt></ruby>になりますか？',
          npcLineZh: '哎呀，來得正好！剛好從都城運來了一批稀奇的卷軸。您要看看嗎？',
          tts: 'あら、いいタイミング！ちょうどみやこからめずらしいまきものがとどいたところなんです。ごらんになりますか？',
          emotion: 'happy',
          choices: [
            {
              jp: 'ぜひ<ruby>見<rt>み</rt></ruby>せてください！おすすめの<ruby>品<rt>しな</rt></ruby>はありますか？',
              zh: '請務必讓我看看！有推薦的商品嗎？',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'ふふ、お<ruby>目<rt>め</rt></ruby>が<ruby>高<rt>たか</rt></ruby>いですね！<ruby>特別<rt>とくべつ</rt></ruby>にいいものを<ruby>紹介<rt>しょうかい</rt></ruby>しますわ。',
              replyZh: '呵呵，您真有眼光！我特別為您介紹幾樣好貨吧。',
              feedback: '在商店詢問推薦時說「おすすめの品はありますか」既自然又能立刻拉近與店主的距離！'
            },
            {
              jp: 'ちょっと<ruby>見<rt>み</rt></ruby>るだけでもいいですか？',
              zh: '請問只是稍微看看也可以嗎？',
              affectionDelta: 9,
              replyEmotion: 'calm',
              replyJp: 'もちろんです！どうぞごゆっくりご<ruby>覧<rt>らん</rt></ruby>になってくださいね。',
              replyZh: '當然可以！請您慢慢參觀挑選。',
              feedback: '在日本購物時非常實用的禮貌問句：「ちょっと見るだけでもいいですか」。'
            },
            {
              jp: 'どうせ<ruby>高<rt>たか</rt></ruby>いんでしょう？<ruby>安<rt>やす</rt></ruby>くしてよ。',
              zh: '反正一定很貴吧？算便宜一點啦。',
              affectionDelta: -4,
              replyEmotion: 'serious',
              replyJp: 'まあ、いきなりそれはちょっと……<ruby>商売<rt>しょうばい</rt></ruby>にも<ruby>礼儀<rt>れいぎ</rt></ruby>がありますのよ？',
              replyZh: '哎呀，一開口就這樣有點……做買賣也是講究禮節的喔？',
              feedback: '在日本店家直接強硬殺價相當失禮，如果想打折可以培養「言靈交涉」被動技能！'
            }
          ]
        },
        {
          id: 'merchant_d2',
          npcLineJp: '<ruby>装備<rt>そうび</rt></ruby>は<ruby>買<rt>か</rt></ruby>うだけでなく、こまめに<ruby>強化<rt>きょうか</rt></ruby>して<ruby>大事<rt>だいじ</rt></ruby>に<ruby>使<rt>つか</rt></ruby>うと<ruby>長持<rt>ながも</rt></ruby>ちしますよ。',
          npcLineZh: '裝備不只要買，時常強化並細心保養才能用得更久喔。',
          tts: 'そうびはかうだけでなく、こまめにきょうかしてだいじにつかうとながもちしますよ。',
          emotion: 'calm',
          choices: [
            {
              jp: 'いいことを<ruby>教<rt>おし</rt></ruby>えてくださり、ありがとうございます！',
              zh: '非常感謝您告訴我這麼棒的建議！',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'どういたしまして。<ruby>丁寧<rt>ていねい</rt></ruby>なお<ruby>客様<rt>きゃくさま</rt></ruby>には、こちらも<ruby>嬉<rt>うれ</rt></ruby>しくなりますわ。',
              replyZh: '不客氣。遇到這麼有禮貌的客人，我也覺得很開心呢。',
              feedback: '「教えてくださり、ありがとうございます」是比「教えてくれて」更優雅有禮的敬語謝辭。'
            },
            {
              jp: 'なるほど、<ruby>次<rt>つぎ</rt></ruby>から<ruby>気<rt>き</rt></ruby>をつけます。',
              zh: '原來如此，我下次會注意的。',
              affectionDelta: 8,
              replyEmotion: 'calm',
              replyJp: 'ええ、いつでも<ruby>鍛冶<rt>かじ</rt></ruby>や<ruby>補強<rt>ほきょう</rt></ruby>の<ruby>相談<rt>そうだん</rt></ruby>に<ruby>乗<rt>の</rt></ruby>りますからね。',
              replyZh: '嗯，隨時都可以找我商量強化與補強的事喔。',
              feedback: '簡潔得體的回應，「なるほど」代表理解與認同對方的說明。'
            },
            {
              jp: 'そんなの<ruby>知<rt>し</rt></ruby>っていますよ。',
              zh: '那種事我早就知道了啦。',
              affectionDelta: -3,
              replyEmotion: 'serious',
              replyJp: 'あらら、せっかくのアドバイスでしたのに……。',
              replyZh: '哎呀呀，虧我還好心給您建議呢……。',
              feedback: '對好心建議回「そんなの知っています」會顯得不領情，建議改說「おかげさまで再確認できました」。'
            }
          ]
        },
        {
          id: 'merchant_d3',
          npcLineJp: '<ruby>次<rt>つぎ</rt></ruby>の<ruby>仕入<rt>しい</rt></ruby>れで<ruby>峡谷<rt>きょうこく</rt></ruby>の<ruby>方<rt>ほう</rt></ruby>まで<ruby>行<rt>い</rt></ruby>く<ruby>予定<rt>よてい</rt></ruby>なんです。あちらの<ruby>道<rt>みち</rt></ruby>は<ruby>危<rt>あぶ</rt></ruby>なくないでしょうか？',
          npcLineZh: '下次進貨我打算去峽谷那邊。請問那條路會不會很危險呢？',
          tts: 'つぎのしいれできょうこくのほうまでいくよていなんです。あちらのみちはあぶなくないでしょうか？',
          emotion: 'curious',
          choices: [
            {
              jp: '<ruby>霧<rt>きり</rt></ruby>が<ruby>深<rt>ふか</rt></ruby>いので、<ruby>足元<rt>あしもと</rt></ruby>にお<ruby>気<rt>き</rt></ruby>をつけてお<ruby>出<rt>で</rt></ruby>かけください。',
              zh: '那裡霧很濃，出門時請務必小心腳下喔。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'ご<ruby>親切<rt>しんせつ</rt></ruby>にありがとうございます！<ruby>本当<rt>ほんとう</rt></ruby>に<ruby>心強<rt>こころづよ</rt></ruby>いですわ。',
              replyZh: '謝謝您這麼親切！聽您這麼說真的安心多了。',
              feedback: '「足元にお気をつけて」是非常體貼且道地的日語叮嚀！'
            },
            {
              jp: '<ruby>魔物<rt>まもの</rt></ruby>も<ruby>出<rt>で</rt></ruby>るので、<ruby>明<rt>あか</rt></ruby>るいうちに<ruby>通<rt>とお</rt></ruby>るといいですよ。',
              zh: '因為也會有魔物出沒，趁天亮時通過比較好喔。',
              affectionDelta: 10,
              replyEmotion: 'calm',
              replyJp: '<ruby>助<rt>たす</rt></ruby>かります！<ruby>早朝<rt>そうちょう</rt></ruby>に<ruby>出発<rt>しゅっぱつ</rt></ruby>することにしますね。',
              replyZh: '幫大忙了！那我決定一大早就出發。',
              feedback: '「明るいうちに（趁著天還亮的時候）」是 N3 非常實用的時間表達！'
            },
            {
              jp: '<ruby>自分<rt>じぶん</rt></ruby>で<ruby>調<rt>しら</rt></ruby>べてから<ruby>行<rt>い</rt></ruby>ったらどうですか。',
              zh: '妳要不要自己查清楚再去呢？',
              affectionDelta: -4,
              replyEmotion: 'serious',
              replyJp: '……ごもっともですが、<ruby>少<rt>すこ</rt></ruby>し<ruby>冷<rt>つめ</rt></ruby>たいお<ruby>返事<rt>へんじ</rt></ruby>ですね。',
              replyZh: '……您說的固然有理，但這回答可有點冷漠呢。',
              feedback: '「〜たらどうですか」有時帶有責備或推託的語氣，對不熟的人或朋友應謹慎使用。'
            }
          ]
        }
      ],
      milestones: [
        {
          affection: 30,
          rewardText: '熟客見面禮：言靈靈水 ×2、破防卷軸 ×1、金幣 150',
          reward: { gold: 150, sp: 1, itemId: 'con_break_scroll', qty: 1, title: '精明旅商之友' }
        },
        {
          affection: 60,
          rewardText: '雪乃的珍藏：祭典紋樣羽織、金幣 280、技能點 +1',
          reward: { gold: 280, sp: 1, itemId: 'ar_festival_haori', qty: 1, title: '商隊貴賓' }
        },
        {
          affection: 100,
          rewardText: '商行合夥禮：清澄神樂鈴、金幣 600、技能點 +2',
          reward: { gold: 600, sp: 2, itemId: 'ac_shrine_bell', qty: 1, title: '黃金言靈客' }
        }
      ]
    },

    scholar: {
      id: 'scholar',
      name: '京極',
      title: '古籍館主・閱讀地下城引路人',
      role: 'reading',
      greeting: '文字背後總藏著作者未曾明言的脈絡。想挑戰長文閱讀地下城的話，隨時可以找我。',
      greetingJp: '<ruby>文章<rt>ぶんしょう</rt></ruby>の<ruby>奥<rt>おく</rt></ruby>にある<ruby>真意<rt>しんい</rt></ruby>を<ruby>探<rt>さぐ</rt></ruby>りに<ruby>来<rt>き</rt></ruby>たのかね？',
      greetingTts: 'ぶんしょうのおくにあるしんいをさぐりにきたのかね？',
      dialogues: [
        {
          id: 'scholar_d1',
          npcLineJp: '<ruby>長文<rt>ちょうぶん</rt></ruby>を<ruby>読<rt>よ</rt></ruby>む<ruby>際<rt>さい</rt></ruby>、<ruby>分<rt>わ</rt></ruby>からない<ruby>単語<rt>たんご</rt></ruby>が<ruby>出<rt>で</rt></ruby>てきたら<ruby>君<rt>きみ</rt></ruby>はどうしているかね？',
          npcLineZh: '閱讀長文時，若遇到不認識的單字，你平常都怎麼應對呢？',
          tts: 'ちょうぶんをよむさい、わからないたんごがでてきたらきみはどうしているかね？',
          emotion: 'curious',
          choices: [
            {
              jp: '<ruby>前後<rt>ぜんご</rt></ruby>の<ruby>文脈<rt>ぶんみゃく</rt></ruby>から<ruby>意味<rt>いみ</rt></ruby>を<ruby>推測<rt>すいそく</rt></ruby>しながら<ruby>読<rt>よ</rt></ruby>み<ruby>進<rt>すす</rt></ruby>めます。',
              zh: '我會一邊從前後文脈推測語意，一邊繼續往下讀。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'ほぅ、まさに<ruby>読解<rt>どっかい</rt></ruby>の<ruby>極意<rt>ごくい</rt></ruby>だな！<ruby>見込<rt>みこ</rt></ruby>みがあるぞ。',
              replyZh: '喔，那正是閱讀理解的精髓啊！很有前途嘛。',
              feedback: '非常精準的學術表達！「文脈から推測する（從上下文推測）」是 N2–N1 必備高頻詞。'
            },
            {
              jp: 'あとで<ruby>辞書<rt>じしょ</rt></ruby>で<ruby>調<rt>しら</rt></ruby>べるようにメモしておきます。',
              zh: '我會先記下來，之後再用字典查清楚。',
              affectionDelta: 10,
              replyEmotion: 'calm',
              replyJp: '<ruby>堅実<rt>けんじつ</rt></ruby>な<ruby>学習<rt>がくしゅう</rt></ruby><ruby>態度<rt>たいど</rt></ruby>だ。<ruby>忘<rt>わす</rt></ruby>れずに<ruby>復習<rt>ふくしゅう</rt></ruby>するのも<ruby>肝心<rt>かんじん</rt></ruby>だぞ。',
              replyZh: '踏實的學習態度。別忘了事後複習也很關鍵喔。',
              feedback: '「〜ようにしておく」表示養成習慣或預先做好安排，運用得非常自然。'
            },
            {
              jp: '<ruby>難<rt>むずか</rt></ruby>しそうならすぐ<ruby>諦<rt>あきら</rt></ruby>めて<ruby>閉<rt>と</rt></ruby>じちゃいます。',
              zh: '看起來太難的話我就立刻放棄合上書了。',
              affectionDelta: -3,
              replyEmotion: 'serious',
              replyJp: 'むう……<ruby>最初<rt>さいしょ</rt></ruby>から<ruby>逃<rt>に</rt></ruby>げていては、<ruby>古籍<rt>こせき</rt></ruby>の<ruby>扉<rt>とびら</rt></ruby>は<ruby>開<rt>ひら</rt></ruby>かぬぞ。',
              replyZh: '唔……一開始就逃避的話，古籍之門可不會為你敞開喔。',
              feedback: '口語「〜ちゃう」在長輩或學者面前較為隨便，且態度略顯消極。'
            }
          ]
        },
        {
          id: 'scholar_d2',
          npcLineJp: 'この<ruby>書庫<rt>しょこ</rt></ruby>には、<ruby>祭典<rt>さいてん</rt></ruby>から<ruby>現代<rt>げんだい</rt></ruby>の<ruby>職場<rt>しょくば</rt></ruby><ruby>文化<rt>ぶんか</rt></ruby>まで<ruby>様々<rt>さまざま</rt></ruby>な<ruby>記録<rt>きろく</rt></ruby>が<ruby>収<rt>おさ</rt></ruby>められている。',
          npcLineZh: '這座書庫收藏了從祭典到現代職場文化等各式各樣的紀錄。',
          tts: 'このしょこには、さいてんからげんだいのしょくばぶんかまでさまざまなきろくがおさめられている。',
          emotion: 'calm',
          choices: [
            {
              jp: '<ruby>文化<rt>ぶんか</rt></ruby>の<ruby>背景<rt>はいけい</rt></ruby>を<ruby>知<rt>し</rt></ruby>ることで、<ruby>日本語<rt>にほんご</rt></ruby>の<ruby>理解<rt>りかい</rt></ruby>がさらに<ruby>深<rt>ふか</rt></ruby>まりそうですね。',
              zh: '了解背後的文化脈絡，似乎能讓日語的理解更上一層樓呢。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'その<ruby>通<rt>とお</rt></ruby>り！<ruby>言葉<rt>ことば</rt></ruby>と<ruby>文化<rt>ぶんか</rt></ruby>は<ruby>表裏一体<rt>ひょうりいったい</rt></ruby>だからな。',
              replyZh: '正是如此！語言與文化本來就是一體兩面啊。',
              feedback: '「〜ことで（藉由…）」與「理解が深まる（加深理解）」皆為非常道地的中高階日語搭配！'
            },
            {
              jp: 'ぜひ<ruby>一冊<rt>いっさつ</rt></ruby>ずつ<ruby>読破<rt>どくは</rt></ruby>してみたいです。',
              zh: '我非常想一本接一本全部讀完看看。',
              affectionDelta: 10,
              replyEmotion: 'happy',
              replyJp: 'いい<ruby>意気込<rt>いきご</rt></ruby>みだ。<ruby>速読<rt>そくどく</rt></ruby><ruby>解析<rt>かいせき</rt></ruby>の<ruby>技<rt>わざ</rt></ruby>も<ruby>磨<rt>みが</rt></ruby>いておくとよいぞ。',
              replyZh: '很有幹勁。記得也順便磨練「速讀解析」的技能喔。',
              feedback: '「読破する（從頭到尾讀完）」用詞精練有力！'
            },
            {
              jp: '<ruby>長<rt>なが</rt></ruby>い<ruby>文章<rt>ぶんしょう</rt></ruby>は<ruby>眠<rt>ねむ</rt></ruby>くなるので<ruby>苦手<rt>にがて</rt></ruby>です。',
              zh: '長文章會讓我犯睏，我不太擅長。',
              affectionDelta: 2,
              replyEmotion: 'calm',
              replyJp: 'ふっ、<ruby>正直<rt>しょうじき</rt></ruby>なのは<ruby>結構<rt>けっこう</rt></ruby>だが、まずは<ruby>興味<rt>きょうみ</rt></ruby>のある<ruby>話題<rt>わだい</rt></ruby>から<ruby>慣<rt>な</rt></ruby>れてみたまえ。',
              replyZh: '哼，坦白雖好，不如先從感興趣的主題開始慢慢習慣吧。',
              feedback: '語法完全正確自然，只是在學者面前稍顯缺乏求知慾。'
            }
          ]
        },
        {
          id: 'scholar_d3',
          npcLineJp: '<ruby>最近<rt>さいきん</rt></ruby>の<ruby>若者<rt>わかもの</rt></ruby><ruby>言葉<rt>ことば</rt></ruby>も、<ruby>見方<rt>みかた</rt></ruby>を<ruby>変<rt>か</rt></ruby>えれば<ruby>言葉<rt>ことば</rt></ruby>が<ruby>生<rt>い</rt></ruby>きている<ruby>証<rt>あかし</rt></ruby>なのかもしれんな。',
          npcLineZh: '最近流行的年輕人用語，換個角度看或許也是語言充滿生命力的證明吧。',
          tts: 'さいきんのわかものことばも、みかたをかえればことばがいきているあかしなのかもしれんな。',
          emotion: 'calm',
          choices: [
            {
              jp: '<ruby>伝統<rt>でんとう</rt></ruby>を<ruby>大切<rt>たいせつ</rt></ruby>にしつつ、<ruby>時代<rt>じだい</rt></ruby>の<ruby>変化<rt>へんか</rt></ruby>も<ruby>受<rt>う</rt></ruby>け<ruby>入<rt>い</rt></ruby>れるのが<ruby>理想<rt>りそう</rt></ruby>ですね。',
              zh: '在珍視傳統的同時，也接納時代的變化，這才是最理想的吧。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'おお……<ruby>実<rt>じつ</rt></ruby>に<ruby>視野<rt>しや</rt></ruby>の<ruby>広<rt>ひろ</rt></ruby>い<ruby>意見<rt>いけん</rt></ruby>だ。<ruby>君<rt>きみ</rt></ruby>との<ruby>議論<rt>ぎろん</rt></ruby>は<ruby>実<rt>じつ</rt></ruby>に<ruby>有意義<rt>ゆういぎ</rt></ruby>だよ。',
              replyZh: '喔……真是視野寬廣的見解。和你討論實在太有意義了。',
              feedback: '「〜しつつ（一邊…同時…）」是極具書面優雅感的 N2 語法，展現高度語言素養！'
            },
            {
              jp: '<ruby>場面<rt>ばめん</rt></ruby>に<ruby>合<rt>あ</rt></ruby>わせて<ruby>使<rt>つか</rt></ruby>い<ruby>分<rt>わ</rt></ruby>けることが<ruby>大切<rt>たいせつ</rt></ruby>だと<ruby>思<rt>おも</rt></ruby>います。',
              zh: '我認為配合場合區分使用才是最重要的。',
              affectionDelta: 12,
              replyEmotion: 'happy',
              replyJp: 'まさに<ruby>正論<rt>せいろん</rt></ruby>だ。TPOをわきまえてこそ<ruby>真<rt>しん</rt></ruby>の<ruby>言霊<rt>ことだま</rt></ruby><ruby>使<rt>つか</rt></ruby>いよ。',
              replyZh: '所言極是。懂得看場合說話才是真正的言靈使者。',
              feedback: '「使い分ける（視情況區分使用）」是討論語言與敬語時非常核心的詞彙！'
            },
            {
              jp: '<ruby>新<rt>あたら</rt></ruby>しい<ruby>言葉<rt>ことば</rt></ruby>は<ruby>全部<rt>ぜんぶ</rt></ruby><ruby>間違<rt>まちが</rt></ruby>いだと<ruby>思<rt>おも</rt></ruby>います。',
              zh: '我覺得新造的詞彙全都是錯誤的。',
              affectionDelta: 1,
              replyEmotion: 'serious',
              replyJp: 'ふむ、あまり<ruby>一面<rt>いちめん</rt></ruby><ruby>的<rt>てき</rt></ruby>に<ruby>決<rt>き</rt></ruby>めつけると、<ruby>言語<rt>げんご</rt></ruby>の<ruby>歴史<rt>れきし</rt></ruby>を<ruby>見誤<rt>みあやま</rt></ruby>るぞ。',
              replyZh: '嗯，太過片面地下定論，可是會看錯語言的歷史脈絡喔。',
              feedback: '語法正確，但表達過於武斷；討論觀點時常用「〜とも言えますが」緩衝語氣。'
            }
          ]
        }
      ],
      milestones: [
        {
          affection: 30,
          rewardText: '古籍館贈禮：言靈靈水 ×2、金幣 160、技能點 +1',
          reward: { gold: 160, sp: 1, itemId: 'con_water', qty: 2, title: '書庫學徒' }
        },
        {
          affection: 60,
          rewardText: '學者的肯定：銀月音韻戒、金幣 300、技能點 +1',
          reward: { gold: 300, sp: 1, itemId: 'ac_silver_ring', qty: 1, title: '文脈探索者' }
        },
        {
          affection: 100,
          rewardText: '館主秘寶：文脈解析單片鏡、金幣 620、技能點 +2',
          reward: { gold: 620, sp: 2, itemId: 'ac_context_lens', qty: 1, title: '古籍博學者' }
        }
      ]
    },

    priest: {
      id: 'priest',
      name: '白露',
      title: '試煉神社・神官',
      role: 'shrine',
      greeting: '願清風拂去你的迷惘。若想在限時之中考驗自身極限，試煉神社的大門永遠為你敞開。',
      greetingJp: 'ようこそ<ruby>試練<rt>しれん</rt></ruby>の<ruby>社<rt>やしろ</rt></ruby>へ。<ruby>静<rt>しず</rt></ruby>かな<ruby>心<rt>こころ</rt></ruby>で<ruby>言霊<rt>ことだま</rt></ruby>と<ruby>向<rt>む</rt></ruby>き<ruby>合<rt>あ</rt></ruby>いましょう。',
      greetingTts: 'ようこそしれんのやしろへ。しずかなこころでことだまとむきあいましょう。',
      dialogues: [
        {
          id: 'priest_d1',
          npcLineJp: '<ruby>制限時間<rt>せいげんじかん</rt></ruby>のある<ruby>試練<rt>しれん</rt></ruby>では、<ruby>焦<rt>あせ</rt></ruby>らず<ruby>呼吸<rt>こきゅう</rt></ruby>を<ruby>整<rt>ととの</rt></ruby>えることが<ruby>何<rt>なに</rt></ruby>より<ruby>大切<rt>たいせつ</rt></ruby>です。',
          npcLineZh: '在有限時間的試煉裡，不慌不忙調整呼吸比什麼都重要。',
          tts: 'せいげんじかんのあるしれんでは、あせらずこきゅうをととのえることがなによりたいせつです。',
          emotion: 'calm',
          choices: [
            {
              jp: '<ruby>肝<rt>きも</rt></ruby>に<ruby>銘<rt>めい</rt></ruby>じて、<ruby>落<rt>お</rt></ruby>ち<ruby>着<rt>つ</rt></ruby>いて<ruby>挑<rt>いど</rt></ruby>みます。',
              zh: '我會銘記在心，冷靜沉著地迎接挑戰。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: '<ruby>清々<rt>すがすが</rt></ruby>しい<ruby>覚悟<rt>かくご</rt></ruby>ですね。<ruby>神々<rt>かみがみ</rt></ruby>もきっと<ruby>見守<rt>みまも</rt></ruby>ってくださいます。',
              replyZh: '真是令人神清氣爽的覺悟呢。神明也一定會守護著您的。',
              feedback: '「肝に銘じる（銘記在心）」是莊重而富有力量的慣用句，與神官的雅緻語境完美契合！'
            },
            {
              jp: '<ruby>深呼吸<rt>しんこきゅう</rt></ruby>してから<ruby>始<rt>はじ</rt></ruby>めるようにします。',
              zh: '我會先深呼吸之後再開始。',
              affectionDelta: 9,
              replyEmotion: 'calm',
              replyJp: 'ええ、それだけで<ruby>見<rt>み</rt></ruby>える<ruby>景色<rt>けしき</rt></ruby>が<ruby>変<rt>か</rt></ruby>わりますよ。',
              replyZh: '是的，光那樣眼前的景色就會截然不同喔。',
              feedback: '自然溫和的禮貌表達，清楚傳達了聽從建言的意願。'
            },
            {
              jp: '<ruby>時間<rt>じかん</rt></ruby>なんて<ruby>気<rt>き</rt></ruby>にせず<ruby>適当<rt>てきとう</rt></ruby>に<ruby>選<rt>えら</rt></ruby>べばいいでしょ？',
              zh: '不管時間隨便亂選不就好了？',
              affectionDelta: -4,
              replyEmotion: 'serious',
              replyJp: '<ruby>言霊<rt>ことだま</rt></ruby>を<ruby>軽<rt>かろ</rt></ruby>んじてはいけません。ひと<ruby>文字<rt>もじ</rt></ruby>ひと<ruby>文字<rt>もじ</rt></ruby>に<ruby>誠意<rt>せいい</rt></ruby>を<ruby>込<rt>こ</rt></ruby>めてください。',
              replyZh: '不可輕視言靈。請對一字一句都傾注誠意。',
              feedback: '「適当に（隨便敷衍地）」在正式場合語感偏負面，且語尾「〜でしょ？」對神官過於隨便。'
            }
          ]
        },
        {
          id: 'priest_d2',
          npcLineJp: '<ruby>参拝<rt>さんぱい</rt></ruby>の<ruby>作法<rt>さほう</rt></ruby>をご<ruby>存<rt>ぞん</rt></ruby>じですか？「<ruby>二礼<rt>にれい</rt></ruby><ruby>二拍手<rt>にはくしゅ</rt></ruby><ruby>一礼<rt>いちれい</rt></ruby>」と<ruby>申<rt>もう</rt></ruby>します。',
          npcLineZh: '您知道神社參拜的禮節嗎？稱為「二禮、二拍手、一禮」。',
          tts: 'さんぱいのさほうをごぞんじですか？にれいにはくしゅいちれいともうします。',
          emotion: 'calm',
          choices: [
            {
              jp: '<ruby>勉強<rt>べんきょう</rt></ruby>になります。<ruby>作法<rt>さほう</rt></ruby>どおりにお<ruby>参<rt>まい</rt></ruby>りいたします。',
              zh: '真是受益良多。我會按照禮節虔誠參拜。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'まあ、<ruby>美<rt>うつく</rt></ruby>しいお<ruby>言葉遣<rt>ことばづか</rt></ruby>い。<ruby>清<rt>きよ</rt></ruby>らかな<ruby>気<rt>き</rt></ruby>が<ruby>満<rt>み</rt></ruby>ちていますね。',
              replyZh: '哎呀，多麼優美的言辭。周身洋溢著清淨之氣呢。',
              feedback: '「勉強になります（受教了）」搭配謙讓語「お参りいたします」，展現極高禮貌水準！'
            },
            {
              jp: 'はい、<ruby>一度<rt>いちど</rt></ruby><ruby>聞<rt>き</rt></ruby>いたことがあります。',
              zh: '是的，我曾經聽說過一次。',
              affectionDelta: 9,
              replyEmotion: 'calm',
              replyJp: 'それは<ruby>素晴<rt>すば</rt></ruby>らしいです。ぜひ<ruby>実践<rt>じっせん</rt></ruby>してみてくださいね。',
              replyZh: '那真是太棒了。請務必實際體驗看看喔。',
              feedback: '「〜たことがあります」正確表達過往經驗，禮貌且自然。'
            },
            {
              jp: '<ruby>面倒<rt>めんどう</rt></ruby>くさい<ruby>決<rt>き</rt></ruby>まりですね。',
              zh: '真是麻煩的規定呢。',
              affectionDelta: -4,
              replyEmotion: 'serious',
              replyJp: '<ruby>形<rt>かたち</rt></ruby>を<ruby>整<rt>ととの</rt></ruby>えることで、<ruby>心<rt>こころ</rt></ruby>もまた<ruby>整<rt>ととの</rt></ruby>うものですよ。',
              replyZh: '端正外在儀軌，內心也會隨之沉靜端正喔。',
              feedback: '直接批評傳統禮法「面倒くさい（很麻煩）」顯得失禮。'
            }
          ]
        },
        {
          id: 'priest_d3',
          npcLineJp: '<ruby>間違<rt>まちが</rt></ruby>えた<ruby>問題<rt>もんだい</rt></ruby>を<ruby>恐<rt>おそ</rt></ruby>れる<ruby>必要<rt>ひつよう</rt></ruby>はありません。<ruby>誤<rt>あやま</rt></ruby>りこそが<ruby>次<rt>つぎ</rt></ruby>の<ruby>悟<rt>さと</rt></ruby>りへの<ruby>道標<rt>みちしるべ</rt></ruby>です。',
          npcLineZh: '無須畏懼答錯的題目。錯誤本身正是指引下一次領悟的路標。',
          tts: 'まちがえたもんだいをおそれるひつようはありません。あやまりこそがつぎのさとりへのみちしるべです。',
          emotion: 'happy',
          choices: [
            {
              jp: '<ruby>温<rt>あたた</rt></ruby>かいお<ruby>言葉<rt>ことば</rt></ruby>をいただき、<ruby>勇気<rt>ゆうき</rt></ruby>が<ruby>湧<rt>わ</rt></ruby>いてきました。',
              zh: '承蒙您溫暖的話語，讓我湧起了滿滿的勇氣。',
              affectionDelta: 15,
              replyEmotion: 'happy',
              replyJp: 'その<ruby>前向<rt>まえむ</rt></ruby>きな<ruby>姿勢<rt>しせい</rt></ruby>があれば、どんな<ruby>難関<rt>なんかん</rt></ruby>も<ruby>乗<rt>の</rt></ruby>り<ruby>越<rt>こ</rt></ruby>えられますよ。',
              replyZh: '只要保有這份積極態度，任何難關都能跨越喔。',
              feedback: '「勇気が湧く（湧起勇氣）」是極具文學美感的道地搭配！'
            },
            {
              jp: '<ruby>間違<rt>まちが</rt></ruby>えたところを<ruby>丁寧<rt>ていねい</rt></ruby>に<ruby>見直<rt>みなお</rt></ruby>すようにします。',
              zh: '我會仔細重溫訂正答錯的地方。',
              affectionDelta: 10,
              replyEmotion: 'calm',
              replyJp: 'それが<ruby>何<rt>なに</rt></ruby>よりの<ruby>修行<rt>しゅぎょう</rt></ruby>です。<ruby>応援<rt>おうえん</rt></ruby>していますよ。',
              replyZh: '那就是最棒的修行了。我會一直為您加油喔。',
              feedback: '「見直す（重新檢視、複習訂正）」用詞精準實用！'
            },
            {
              jp: 'でも<ruby>一問<rt>いちもん</rt></ruby>も<ruby>間違<rt>まちが</rt></ruby>えたくないです。',
              zh: '但我連一題都不想答錯。',
              affectionDelta: 4,
              replyEmotion: 'calm',
              replyJp: '<ruby>高<rt>たか</rt></ruby>い<ruby>志<rt>こころざし</rt></ruby>は<ruby>立派<rt>りっぱ</rt></ruby>ですが、<ruby>肩<rt>かた</rt></ruby>の<ruby>力<rt>ちから</rt></ruby>を<ruby>抜<rt>ぬ</rt></ruby>くことも<ruby>忘<rt>わす</rt></ruby>れずに。',
              replyZh: '志向遠大固然可嘉，但也別忘了放鬆肩膀別太緊繃喔。',
              feedback: '語法自然，表達了上進心，神官溫和地提醒不要給自己過度壓力。'
            }
          ]
        }
      ],
      milestones: [
        {
          affection: 30,
          rewardText: '神社祝禱：破防卷軸 ×2、金幣 160、技能點 +1',
          reward: { gold: 160, sp: 1, itemId: 'con_break_scroll', qty: 2, title: '社殿參拜者' }
        },
        {
          affection: 60,
          rewardText: '白露的贈禮：專注護符 ×2、金幣 320、技能點 +1',
          reward: { gold: 320, sp: 1, itemId: 'con_fever_charm', qty: 2, title: '清心行者' }
        },
        {
          affection: 100,
          rewardText: '神域加護：聖域金葉冠、金幣 680、技能點 +2',
          reward: { gold: 680, sp: 2, itemId: 'ac_sanctuary_crown', qty: 1, title: '神樂之守護' }
        }
      ]
    }
  };

  /* ==========================================================================
   * 720 道地道自然日語題庫（JLPT N4–N1，含 N3/N2/N1 歷屆仿真擴充各 100 題）
   * ========================================================================== */
  // 題庫本體拆在 data/questions/*.js（index.html 需先於 data.js 載入），這裡依固定順序組裝
  const QUESTION_PART_ORDER = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'jlpt-n3', 'jlpt-n2', 'jlpt-n1'];
  const QUESTION_PARTS = window.KOTODAMA_QUESTION_PARTS || {};
  const missingQuestionParts = QUESTION_PART_ORDER.filter((k) => !Array.isArray(QUESTION_PARTS[k]));
  if (missingQuestionParts.length && typeof console !== 'undefined') {
    console.error('[data.js] 題庫檔案未載入：' + missingQuestionParts.join(', '));
  }
  const QUESTIONS = QUESTION_PART_ORDER.flatMap((k) => QUESTION_PARTS[k] || []);
  try { delete window.KOTODAMA_QUESTION_PARTS; } catch (_) { window.KOTODAMA_QUESTION_PARTS = undefined; }

  /* ==========================================================================
   * 10 座長文閱讀地下城（N4×2、N3×3、N2×3、N1×2）
   * 每個關鍵依據句皆已包覆 <span class="key-sentence" data-q="0|1|2">
   * ========================================================================== */
  const READING_DUNGEONS = [
    {
      "id": "rd_1",
      "title": "夏祭りと花火の心",
      "topic": "日本祭典文化",
      "jlpt": "N4",
      "unlockRegionId": "r1",
      "firstClearItemId": "ac_festival_fan",
      "rewardGold": 160,
      "rewardExp": 140,
      "paragraphs": [
        {
          "html": "<ruby>日本<rt>にほん</rt></ruby>の<ruby>夏<rt>なつ</rt></ruby>になると、<ruby>全国<rt>ぜんこく</rt></ruby><ruby>各地<rt>かくち</rt></ruby>で<ruby>夏祭<rt>なつまつ</rt></ruby>りや<ruby>花火大会<rt>はなびたいかい</rt></ruby>が<ruby>開<rt>ひら</rt></ruby>かれます。<ruby>夕方<rt>ゆうがた</rt></ruby>から<ruby>浴衣<rt>ゆかた</rt></ruby>を<ruby>着<rt>き</rt></ruby>た<ruby>人々<rt>ひとびと</rt></ruby>が<ruby>神社<rt>じんじゃ</rt></ruby>や<ruby>川沿<rt>かわぞ</rt></ruby>いに<ruby>集<rt>あつ</rt></ruby>まり、<ruby>屋台<rt>やたい</rt></ruby>でたこ<ruby>焼<rt>や</rt></ruby>きやかき<ruby>氷<rt>ごおり</rt></ruby>を<ruby>楽<rt>たの</rt></ruby>しむ<ruby>光景<rt>こうけい</rt></ruby>は、<ruby>夏<rt>なつ</rt></ruby>ならではの<ruby>風物詩<rt>ふうぶつし</rt></ruby>です。",
          "tts": "日本の夏になると、全国各地で夏祭りや花火大会が開かれます。夕方から浴衣を着た人々が神社や川沿いに集まり、屋台でたこ焼きやかき氷を楽しむ光景は、夏ならではの風物詩です。"
        },
        {
          "html": "ところで、<ruby>日本<rt>にほん</rt></ruby>の<ruby>花火大会<rt>はなびたいかい</rt></ruby>は、もともと<ruby>単<rt>たん</rt></ruby>なる<ruby>娯楽<rt>ごらく</rt></ruby>として<ruby>始<rt>はじ</rt></ruby>まったわけではありません。<span class=\"key-sentence\" data-q=\"0\"><ruby>江戸時代<rt>えどじだい</rt></ruby>に<ruby>疫病<rt>えきびょう</rt></ruby>や<ruby>飢饉<rt>ききん</rt></ruby>で<ruby>多<rt>おお</rt></ruby>くの<ruby>命<rt>いのち</rt></ruby>が<ruby>失<rt>うしな</rt></ruby>われた<ruby>際<rt>さい</rt></ruby>、<ruby>亡<rt>な</rt></ruby>くなった<ruby>人々<rt>ひとびと</rt></ruby>の<ruby>魂<rt>たましい</rt></ruby>を<ruby>慰<rt>なぐさ</rt></ruby>め、<ruby>悪霊<rt>あくりょう</rt></ruby>を<ruby>払<rt>はら</rt></ruby>うために<ruby>花火<rt>はなび</rt></ruby>が<ruby>打<rt>う</rt></ruby>ち<ruby>上<rt>あ</rt></ruby>げられたのが<ruby>起源<rt>きげん</rt></ruby>とされています。</span>",
          "tts": "ところで、日本の花火大会は、もともと単なる娯楽として始まったわけではありません。江戸時代に疫病や飢饉で多くの命が失われた際、亡くなった人々の魂を慰め、悪霊を払うために花火が打ち上げられたのが起源とされています。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"1\"><ruby>夜空<rt>よぞら</rt></ruby>に<ruby>大輪<rt>たいりん</rt></ruby>の<ruby>光<rt>ひかり</rt></ruby>が<ruby>咲<rt>さ</rt></ruby>いては、わずか<ruby>数秒<rt>すうびょう</rt></ruby>で<ruby>静<rt>しず</rt></ruby>かに<ruby>消<rt>き</rt></ruby>えていく<ruby>儚<rt>はかな</rt></ruby>さに、<ruby>人々<rt>ひとびと</rt></ruby>は<ruby>言葉<rt>ことば</rt></ruby>にならない<ruby>美<rt>うつく</rt></ruby>しさを<ruby>感<rt>かん</rt></ruby>じてきました。</span><span class=\"key-sentence\" data-q=\"2\"><ruby>華<rt>はな</rt></ruby>やかな<ruby>賑<rt>にぎ</rt></ruby>わいの<ruby>奥<rt>おく</rt></ruby>に、かつての<ruby>祈<rt>いの</rt></ruby>りや<ruby>季節<rt>きせつ</rt></ruby>を<ruby>慈<rt>いつく</rt></ruby>しむ<ruby>心<rt>こころ</rt></ruby>が<ruby>今<rt>いま</rt></ruby>も<ruby>静<rt>しず</rt></ruby>かに<ruby>息<rt>いき</rt></ruby>づいているのです。</span>",
          "tts": "夜空に大輪の光が咲いては、わずか数秒で静かに消えていく儚さに、人々は言葉にならない美しさを感じてきました。華やかな賑わいの奥に、かつての祈りや季節を慈しむ心が今も静かに息づいているのです。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據文章內容，日本花火大會最初的起源是什麼？",
          "options": [
            "為了慶祝夏季農作物大豐收並吸引外地觀光客",
            "江戶時代遭遇疫病與飢饉時，為了慰靈與驅除惡靈而施放",
            "古代神社為了比較各地職人火藥技術所舉辦的比賽",
            "為了讓夏夜的商店街夜市延長營業時間而創辦的娛樂活動"
          ],
          "answerIndex": 1,
          "explanation": "第二段明確寫道：「江戸時代に疫病や飢饉で多くの命が失われた際、亡くなった人々の魂を慰め、悪霊を払うために花火が打ち上げられたのが起源とされています。」（江戶時代為撫慰亡靈與驅邪而施放）。",
          "wrongReason": "請回頭確認第二段提到「起源（きげん）」的句子，花火最初並非純粹的商業或娛樂活動。"
        },
        {
          "category": "推論",
          "promptZh": "由第三段可推論，日本人特別鍾愛煙火的哪一種美學特質？",
          "options": [
            "持續燃燒數小時、永不熄滅的壯麗感",
            "伴隨震耳欲聾的巨響展現出壓倒性威力",
            "盛大綻放後轉瞬消逝的短暫無常之美（儚さ）",
            "必須搭配特定傳統樂器演奏才能呈現的莊嚴感"
          ],
          "answerIndex": 2,
          "explanation": "第三段指出煙火「大輪の光が咲いては、わずか数秒で静かに消えていく儚さ（盛開後短短數秒便靜靜消逝的短暫無常）」，這正是日本人心中難以言喻的美。",
          "wrongReason": "關鍵詞是「わずか数秒で静かに消えていく儚さ（短短數秒消逝的虛幻無常感）」。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者在這篇文章最後最想傳達的觀點是什麼？",
          "options": [
            "現代夏祭過於商業化，已經徹底失去傳統意義",
            "穿浴衣與吃屋台小吃比欣賞煙火更值得保存",
            "在熱鬧華麗的祭典表象深處，昔日的祈願與珍愛季節之心至今仍靜靜延續",
            "今後應該取消煙火改為安靜的神社參拜儀式"
          ],
          "answerIndex": 2,
          "explanation": "文章結尾總結道：「華やかな賑わいの奥に、かつての祈りや季節を慈しむ心が今も静かに息づいているのです」（在華麗熱鬧的深處，昔日的祈願與憐愛季節之心至今依然生生不息）。",
          "wrongReason": "作者並未否定現代祭典的熱鬧，而是強調熱鬧背後依然承載著古老的祈願與季節感。"
        }
      ]
    },
    {
      "id": "rd_2",
      "title": "満員電車とスマート通勤の進化",
      "topic": "現代通勤科技",
      "jlpt": "N3",
      "unlockRegionId": "r2",
      "firstClearItemId": "ac_silver_ring",
      "rewardGold": 240,
      "rewardExp": 220,
      "paragraphs": [
        {
          "html": "<ruby>東京<rt>とうきょう</rt></ruby>などの<ruby>大都市<rt>だいとし</rt></ruby>では、<ruby>長<rt>なが</rt></ruby>い<ruby>間<rt>あいだ</rt></ruby>、<ruby>朝<rt>あさ</rt></ruby>の<ruby>満員電車<rt>まんいんでんしゃ</rt></ruby>が<ruby>会社員<rt>かいしゃいん</rt></ruby>にとって<ruby>大<rt>おお</rt></ruby>きなストレスの<ruby>原因<rt>げんいん</rt></ruby>となってきました。<ruby>数分<rt>すうふん</rt></ruby>おきに<ruby>正確<rt>せいかく</rt></ruby>に<ruby>運行<rt>うんこう</rt></ruby>される<ruby>鉄道網<rt>てつどうもう</rt></ruby>は<ruby>世界<rt>せかい</rt></ruby>でも<ruby>高<rt>たか</rt></ruby>く<ruby>評価<rt>ひょうか</rt></ruby>されていますが、<ruby>混雑率<rt>こんざつりつ</rt></ruby>の<ruby>高<rt>たか</rt></ruby>さは<ruby>長<rt>なが</rt></ruby>い<ruby>課題<rt>かだい</rt></ruby>だったのです。",
          "tts": "東京などの大都市では、長い間、朝の満員電車が会社員にとって大きなストレスの原因となってきました。数分おきに正確に運行される鉄道網は世界でも高く評価されていますが、混雑率の高さは長い課題だったのです。"
        },
        {
          "html": "しかし<ruby>近年<rt>きんねん</rt></ruby>、デジタル<ruby>技術<rt>ぎじゅつ</rt></ruby>の<ruby>普及<rt>ふきゅう</rt></ruby>により<ruby>通勤風景<rt>つうきんふうけい</rt></ruby>は<ruby>徐々<rt>じょじょ</rt></ruby>に<ruby>変<rt>か</rt></ruby>わりつつあります。<span class=\"key-sentence\" data-q=\"0\"><ruby>鉄道会社<rt>てつどうがいしゃ</rt></ruby>のアプリでは、<ruby>車両<rt>しゃりょう</rt></ruby>ごとの<ruby>混雑状況<rt>こんざつじょうきょう</rt></ruby>をリアルタイムで<ruby>確認<rt>かくにん</rt></ruby>でき、<ruby>空<rt>す</rt></ruby>いている<ruby>時間帯<rt>じかんたい</rt></ruby>を<ruby>選<rt>えら</rt></ruby>ぶとポイントが<ruby>貯<rt>た</rt></ruby>まる<ruby>仕組<rt>しく</rt></ruby>みも<ruby>広<rt>ひろ</rt></ruby>がっています。</span>",
          "tts": "しかし近年、デジタル技術の普及により通勤風景は徐々に変わりつつあります。鉄道会社のアプリでは、車両ごとの混雑状況をリアルタイムで確認でき、空いている時間帯を選ぶとポイントが貯まる仕組みも広がっています。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"1\">さらに<ruby>在宅勤務<rt>ざいたくきんむ</rt></ruby>や<ruby>時差出勤<rt>じさしゅっきん</rt></ruby>を<ruby>導入<rt>どうにゅう</rt></ruby>する<ruby>企業<rt>きぎょう</rt></ruby>が<ruby>増<rt>ふ</rt></ruby>えたことで、「<ruby>毎日<rt>まいにち</rt></ruby><ruby>同<rt>おな</rt></ruby>じ<ruby>時刻<rt>じこく</rt></ruby>に<ruby>全員<rt>ぜんいん</rt></ruby>が<ruby>出社<rt>しゅっしゃ</rt></ruby>する」という<ruby>常識<rt>じょうしき</rt></ruby>そのものが<ruby>見直<rt>みなお</rt></ruby>され<ruby>始<rt>はじ</rt></ruby>めました。</span><span class=\"key-sentence\" data-q=\"2\"><ruby>技術<rt>ぎじゅつ</rt></ruby>の<ruby>力<rt>ちから</rt></ruby>と<ruby>働<rt>はたら</rt></ruby>き<ruby>方<rt>かた</rt></ruby>の<ruby>柔軟化<rt>じゅうなんか</rt></ruby>が<ruby>両輪<rt>りょうりん</rt></ruby>となってこそ、<ruby>快適<rt>かいてき</rt></ruby>な<ruby>都市生活<rt>としせいかつ</rt></ruby>が<ruby>実現<rt>じつげん</rt></ruby>するのです。</span>",
          "tts": "さらに在宅勤務や時差出勤を導入する企業が増えたことで、「毎日同じ時刻に全員が出社する」という常識そのものが見直され始めました。技術の力と働き方の柔軟化が両輪となってこそ、快適な都市生活が実現するのです。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據文章，鐵路公司的手機應用程式提供了哪些緩解擁擠的新措施？",
          "options": [
            "自動預約每節車廂的所有免費座位",
            "即時查詢各車廂擁擠程度，並在離峰時段搭車累積點數",
            "免費提供計程車共乘券給無法上車的上班族",
            "直接將所有通勤列車改為無人駕駛特快車"
          ],
          "answerIndex": 1,
          "explanation": "第二段清楚說明：「車両ごとの混雑状況をリアルタイムで確認でき、空いている時間帯を選ぶとポイントが貯まる仕組みも広がっています。」（即時查看各車廂擁擠度，選擇較空時段搭車還可集點）。",
          "wrongReason": "請留意第二段關於「鉄道会社のアプリ（鐵路公司 App）」的具體描述。"
        },
        {
          "category": "推論",
          "promptZh": "為什麼「每天同一時間全員進公司」的舊常識開始被重新檢視？",
          "options": [
            "因為都市鐵路準點率大幅下降，列車經常誤點",
            "因為愈來愈多企業導入遠距居家辦公與彈性錯峰上班制度",
            "因為政府規定尖峰時段禁止一般民眾搭乘電車",
            "因為大都市的上班族人口急劇減少了一半以上"
          ],
          "answerIndex": 1,
          "explanation": "第三段開頭明確提到「在宅勤務や時差出勤を導入する企業が増えたことで（隨著導入居家辦公與錯峰出勤的企業增加）」，促成了對舊有通勤常識的反思。",
          "wrongReason": "原文指出改變源自「在宅勤務（遠距上班）」與「時差出勤（錯峰上班）」的普及。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者認為實現舒適都市生活的關鍵是什麼？",
          "options": [
            "只需要不斷增開更多班次的電車即可解決一切問題",
            "全面廢除辦公室並強迫所有企業轉為完全遠距辦公",
            "必須結合「數位科技之力」與「工作型態的彈性化」雙管齊下",
            "提高尖峰時段的電車票價以強制減少乘客人數"
          ],
          "answerIndex": 2,
          "explanation": "文章末句點出主旨：「技術の力と働き方の柔軟化が両輪となってこそ、快適な都市生活が実現するのです」（唯有科技力量與工作方式彈性化如同雙輪並進，才能實現舒適都市生活）。",
          "wrongReason": "注意文末比喻「両輪となってこそ（唯有兩者成為車之雙輪、相輔相成）」。"
        }
      ]
    },
    {
      "id": "rd_3",
      "title": "日本の職場と「空気を読む」文化",
      "topic": "職場「空気を読む」",
      "jlpt": "N3",
      "unlockRegionId": "r3",
      "firstClearItemId": "ac_context_lens",
      "rewardGold": 340,
      "rewardExp": 320,
      "paragraphs": [
        {
          "html": "<ruby>日本<rt>にほん</rt></ruby>の<ruby>職場<rt>しょくば</rt></ruby><ruby>文化<rt>ぶんか</rt></ruby>を<ruby>語<rt>かた</rt></ruby>る<ruby>際<rt>さい</rt></ruby>、よく<ruby>取<rt>と</rt></ruby>り<ruby>上<rt>あ</rt></ruby>げられるのが「<ruby>空気<rt>くうき</rt></ruby>を<ruby>読<rt>よ</rt></ruby>む」という<ruby>表現<rt>ひょうげん</rt></ruby>です。これは、<ruby>言葉<rt>ことば</rt></ruby>で<ruby>直接<rt>ちょくせつ</rt></ruby><ruby>示<rt>しめ</rt></ruby>されない<ruby>相手<rt>あいて</rt></ruby>の<ruby>気持<rt>きも</rt></ruby>ちや<ruby>場<rt>ば</rt></ruby>の<ruby>状況<rt>じょうきょう</rt></ruby>を<ruby>察<rt>さっ</rt></ruby>し、<ruby>適切<rt>てきせつ</rt></ruby>に<ruby>行動<rt>こうどう</rt></ruby>する<ruby>力<rt>ちから</rt></ruby>を<ruby>指<rt>さ</rt></ruby>します。",
          "tts": "日本の職場文化を語る際、よく取り上げられるのが「空気を読む」という表現です。これは、言葉で直接示されない相手の気持ちや場の状況を察し、適切に行動する力を指します。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"0\">この<ruby>習慣<rt>しゅうかん</rt></ruby>には、<ruby>不要<rt>ふよう</rt></ruby>な<ruby>対立<rt>たいりつ</rt></ruby>を<ruby>避<rt>さ</rt></ruby>け、チーム<ruby>全体<rt>ぜんたい</rt></ruby>の<ruby>調和<rt>ちょうわ</rt></ruby>を<ruby>保<rt>たも</rt></ruby>ちながら<ruby>業務<rt>ぎょうむ</rt></ruby>を<ruby>円滑<rt>えんかつ</rt></ruby>に<ruby>進<rt>すす</rt></ruby>められるという<ruby>利点<rt>りてん</rt></ruby>があります。</span><ruby>一方<rt>いっぽう</rt></ruby>で、<span class=\"key-sentence\" data-q=\"1\"><ruby>異論<rt>いろん</rt></ruby>を<ruby>唱<rt>とな</rt></ruby>えにくくなったり、<ruby>背景<rt>はいけい</rt></ruby>の<ruby>異<rt>こと</rt></ruby>なる<ruby>同僚<rt>どうりょう</rt></ruby>に<ruby>意図<rt>いと</rt></ruby>が<ruby>伝<rt>つた</rt></ruby>わらず<ruby>誤解<rt>ごかい</rt></ruby>を<ruby>生<rt>う</rt></ruby>んだりする<ruby>危<rt>あや</rt></ruby>うさも<ruby>指摘<rt>してき</rt></ruby>されています。</span>",
          "tts": "この習慣には、不要な対立を避け、チーム全体の調和を保ちながら業務を円滑に進められるという利点があります。一方で、異論を唱えにくくなったり、背景の異なる同僚に意図が伝わらず誤解を生んだりする危うさも指摘されています。"
        },
        {
          "html": "<ruby>多様<rt>たよう</rt></ruby>な<ruby>人材<rt>じんざい</rt></ruby>が<ruby>共<rt>とも</rt></ruby>に<ruby>働<rt>はたら</rt></ruby>く<ruby>現代<rt>げんだい</rt></ruby>の<ruby>職場<rt>しょくば</rt></ruby>では、<ruby>暗黙<rt>あんもく</rt></ruby>の<ruby>了解<rt>りょうかい</rt></ruby>だけに<ruby>頼<rt>たよ</rt></ruby>るのでは<ruby>限界<rt>げんかい</rt></ruby>があります。<span class=\"key-sentence\" data-q=\"2\"><ruby>相手<rt>あいて</rt></ruby>への<ruby>配慮<rt>はいりょ</rt></ruby>を<ruby>失<rt>うしな</rt></ruby>わずに、<ruby>必要<rt>ひつよう</rt></ruby>な<ruby>情報<rt>じょうほう</rt></ruby>や<ruby>意見<rt>いけん</rt></ruby>は<ruby>丁寧<rt>ていねい</rt></ruby>に<ruby>言語化<rt>げんごか</rt></ruby>して<ruby>共有<rt>きょうゆう</rt></ruby>する<ruby>姿勢<rt>しせい</rt></ruby>こそが、<ruby>今後<rt>こんご</rt></ruby>の<ruby>信頼<rt>しんらい</rt></ruby>を<ruby>築<rt>きず</rt></ruby>く<ruby>鍵<rt>かぎ</rt></ruby>となるでしょう。</span>",
          "tts": "多様な人材が共に働く現代の職場では、暗黙の了解だけに頼るのでは限界があります。相手への配慮を失わずに、必要な情報や意見は丁寧に言語化して共有する姿勢こそが、今後の信頼を築く鍵となるでしょう。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據文章第二段，「讀空氣（空気を読む）」這項職場習慣有什麼優點？",
          "options": [
            "能夠縮短開會時間並完全免除書面報告",
            "能避免不必要的對立、維持團隊和諧並讓業務順利推進",
            "可以讓新進員工在入職第一天就掌握所有專業技能",
            "能夠激發激烈的辯論以迅速淘汰不合適的提案"
          ],
          "answerIndex": 1,
          "explanation": "第二段第一句明載：「不要な対立を避け、チーム全体の調和を保ちながら業務を円滑に進められるという利点があります。」（避免不必要對立、維持團隊和諧並順利推展業務）。",
          "wrongReason": "請找第二段中「利点（優點）」之前的敘述。"
        },
        {
          "category": "推論",
          "promptZh": "文章指出，在背景多元的職場環境中過度依賴「讀空氣」可能會帶來什麼問題？",
          "options": [
            "員工之間因為過度直言不諱而頻繁發生口角",
            "大家難以提出不同意見，且容易造成跨文化或不同背景同事間的誤解",
            "企業內部會因為檔案過多而導致資訊外洩",
            "主管無法掌控專案進度而必須全面取消團隊合作"
          ],
          "answerIndex": 1,
          "explanation": "第二段後半提到兩大隱憂：「異論を唱えにくくなる（難以提出異議）」以及「背景の異なる同僚に意図が伝わらず誤解を生む（意圖無法傳達給不同背景的同事而產生誤會）」。",
          "wrongReason": "請留意「一方で（另一方面）」之後列出的兩個負面風險。"
        },
        {
          "category": "作者觀點",
          "promptZh": "面對現代多元職場，作者提倡什麼樣的溝通態度？",
          "options": [
            "徹底拋棄對他人的體貼，改以完全冷冰冰的條文溝通",
            "繼續完全依賴默契與潛規則，要求新同事自行領悟",
            "在不失體貼的前提下，將必要資訊與意見細心言語化並清楚共享",
            "所有職場討論都應該改由文字訊息進行，避免面對面交談"
          ],
          "answerIndex": 2,
          "explanation": "文末點明核心主張：「相手への配慮を失わずに、必要な情報や意見は丁寧に言語化して共有する姿勢こそが、今後の信頼を築く鍵となるでしょう」（兼顧對對方的體貼，同時清楚言語化並共享資訊與意見）。",
          "wrongReason": "作者並非主張完全否定體貼，而是強調「配慮（體貼）」與「言語化（明確說出來）」並重。"
        }
      ]
    },
    {
      "id": "rd_4",
      "title": "和食の歩みと「だし」の知恵",
      "topic": "日本飲食歷史",
      "jlpt": "N2",
      "unlockRegionId": "r4",
      "firstClearItemId": "ac_shrine_bell",
      "rewardGold": 460,
      "rewardExp": 440,
      "paragraphs": [
        {
          "html": "<ruby>世界<rt>せかい</rt></ruby><ruby>無形文化遺産<rt>むけいぶんかいさん</rt></ruby>にも<ruby>登録<rt>とうろく</rt></ruby>されている<ruby>和食<rt>わしょく</rt></ruby>は、<ruby>四季<rt>しき</rt></ruby>の<ruby>移<rt>うつ</rt></ruby>ろいと<ruby>豊<rt>ゆた</rt></ruby>かな<ruby>海山<rt>うみやま</rt></ruby>の<ruby>恵<rt>めぐ</rt></ruby>みに<ruby>育<rt>はぐく</rt></ruby>まれてきました。その<ruby>味<rt>あじ</rt></ruby>の<ruby>根幹<rt>こんかん</rt></ruby>を<ruby>支<rt>ささ</rt></ruby>えているのが、<ruby>昆布<rt>こんぶ</rt></ruby>や<ruby>鰹節<rt>かつおぶし</rt></ruby>から<ruby>丁寧<rt>ていねい</rt></ruby>にとる「だし」の<ruby>存在<rt>そんざい</rt></ruby>です。",
          "tts": "世界無形文化遺産にも登録されている和食は、四季の移ろいと豊かな海山の恵みに育まれてきました。その味の根幹を支えているのが、昆布や鰹節から丁寧にとる「だし」の存在です。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"0\"><ruby>動物性<rt>どうぶつせい</rt></ruby><ruby>油脂<rt>ゆし</rt></ruby>を<ruby>多用<rt>たよう</rt></ruby>せずとも<ruby>深<rt>ふか</rt></ruby>い<ruby>満足感<rt>まんぞくかん</rt></ruby>を<ruby>得<rt>え</rt></ruby>られるのは、だしに<ruby>含<rt>ふく</rt></ruby>まれる「うま<ruby>味<rt>み</rt></ruby>」が<ruby>素材<rt>そざい</rt></ruby><ruby>本来<rt>ほんらい</rt></ruby>の<ruby>風味<rt>ふうみ</rt></ruby>を<ruby>引<rt>ひ</rt></ruby>き<ruby>立<rt>た</rt></ruby>てているからです。</span><span class=\"key-sentence\" data-q=\"1\">また、<ruby>江戸<rt>えど</rt></ruby>の<ruby>町人文化<rt>ちょうにんぶんか</rt></ruby>が<ruby>花開<rt>はなひら</rt></ruby>いた<ruby>頃<rt>ころ</rt></ruby>には、<ruby>醤油<rt>しょうゆ</rt></ruby>やみりんの<ruby>流通<rt>りゅうつう</rt></ruby>とあいまって、<ruby>蕎麦<rt>そば</rt></ruby>や<ruby>寿司<rt>すし</rt></ruby>といった<ruby>今日<rt>こんにち</rt></ruby>の<ruby>代表料理<rt>だいひょうりょうり</rt></ruby>が<ruby>確立<rt>かくりつ</rt></ruby>しました。</span>",
          "tts": "動物性油脂を多用せずとも深い満足感を得られるのは、だしに含まれる「うま味」が素材本来の風味を引き立てているからです。また、江戸の町人文化が花開いた頃には、醤油やみりんの流通とあいまって、蕎麦や寿司といった今日の代表料理が確立しました。"
        },
        {
          "html": "<ruby>多忙<rt>たぼう</rt></ruby>な<ruby>現代<rt>げんだい</rt></ruby>では<ruby>手軽<rt>てがる</rt></ruby>な<ruby>調味料<rt>ちょうみりょう</rt></ruby>も<ruby>重宝<rt>ちょうほう</rt></ruby>されますが、<span class=\"key-sentence\" data-q=\"2\"><ruby>自然<rt>しぜん</rt></ruby>の<ruby>恵<rt>めぐ</rt></ruby>みを<ruby>無駄<rt>むだ</rt></ruby>なく<ruby>生<rt>い</rt></ruby>かし、<ruby>季節<rt>きせつ</rt></ruby>を<ruby>味<rt>あじ</rt></ruby>わうという<ruby>先人<rt>せんじん</rt></ruby>の<ruby>知恵<rt>ちえ</rt></ruby>は、<ruby>健康的<rt>けんこうてき</rt></ruby>な<ruby>食生活<rt>しょくせいかつ</rt></ruby>を<ruby>考<rt>かんが</rt></ruby>えるうえで<ruby>今<rt>いま</rt></ruby>なお<ruby>大<rt>おお</rt></ruby>きな<ruby>示唆<rt>しさ</rt></ruby>を<ruby>与<rt>あた</rt></ruby>えてくれます。</span>",
          "tts": "多忙な現代では手軽な調味料も重宝されますが、自然の恵みを無駄なく生かし、季節を味わうという先人の知恵は、健康的な食生活を考えるうえで今なお大きな示唆を与えてくれます。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據文章，為什麼和食即使不大量使用動物性油脂也能帶來深厚滿足感？",
          "options": [
            "因為使用大量辛香料與辣椒強烈刺激味蕾",
            "因為高湯（だし）中的「鮮味（うま味）」能襯托出食材原有的風味",
            "因為和食規定每餐都必須搭配多道高糖分甜點",
            "因為現代和食全面改用人工合成的濃郁醬汁"
          ],
          "answerIndex": 1,
          "explanation": "第二段明確指出：「だしに含まれる『うま味』が素材本来の風味を引き立てているからです。」（高湯中蘊含的鮮味能將食材本身風味襯托出來）。",
          "wrongReason": "請查看第二段中解釋為何「動物性油脂を多用せずとも深い満足感を得られる」的原因句。"
        },
        {
          "category": "推論",
          "promptZh": "從第二段可以推論，蕎麥麵與壽司等今日代表性料理是在什麼背景下確立的？",
          "options": [
            "隨著現代冷藏貨運與速食調味料的發明才正式出現",
            "江戶町人文化興盛之際，加上醬油與味醂流通普及而相輔相成確立",
            "平安時代貴族為了招待外國使節所研發的宮廷宴席料理",
            "戰後為了節省糧食配給而臨時創作出來的簡易餐食"
          ],
          "answerIndex": 1,
          "explanation": "原文寫道：「江戸の町人文化が花開いた頃には、醤油やみりんの流通とあいまって、蕎麦や寿司といった今日の代表料理が確立しました。」（「とあいまって」意為「加上…相輔相成」）。",
          "wrongReason": "注意第二段提及「江戸の町人文化（江戶庶民文化）」與「醤油やみりんの流通（醬油與味醂的流通）」。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者如何看待先人留下的和食智慧對現代社會的意義？",
          "options": [
            "現代人生活忙碌，應該完全捨棄傳統高湯改用即食調味料",
            "和食只適合在高級料亭品嚐，已與一般家庭飲食脫節",
            "物盡其用活用自然恩賜、品味四季的智慧，對現代健康飲食依然深具啟發",
            "為了保護漁業資源，應該徹底停止使用昆布與柴魚製作高湯"
          ],
          "answerIndex": 2,
          "explanation": "第三段強調，即便方便調味料受青睞，但「自然の恵みを無駄なく生かし、季節を味わうという先人の知恵は、健康的な食生活を考えるうえで今なお大きな示唆を与えてくれます」（至今仍提供極大啟示）。",
          "wrongReason": "關鍵句詞為「大きな示唆を与えてくれます（給予莫大的啟發與借鏡）」。"
        }
      ]
    },
    {
      "id": "rd_5",
      "title": "デジタル時代における日本語の変容",
      "topic": "數位時代日語演變",
      "jlpt": "N2",
      "unlockRegionId": "r5",
      "firstClearItemId": "ac_sanctuary_crown",
      "rewardGold": 620,
      "rewardExp": 600,
      "paragraphs": [
        {
          "html": "SNSやチャットツールの<ruby>普及<rt>ふきゅう</rt></ruby>に<ruby>伴<rt>ともな</rt></ruby>い、<ruby>現代<rt>げんだい</rt></ruby>の<ruby>日本語<rt>にほんご</rt></ruby>はかつてない<ruby>速度<rt>そくど</rt></ruby>で<ruby>変化<rt>へんか</rt></ruby>している。<span class=\"key-sentence\" data-q=\"0\"><ruby>短<rt>みじか</rt></ruby>い<ruby>文面<rt>ぶんめん</rt></ruby>で<ruby>感情<rt>かんじょう</rt></ruby>を<ruby>瞬時<rt>しゅんじ</rt></ruby>に<ruby>伝<rt>つた</rt></ruby>えるため、<ruby>省略語<rt>しょうりゃくご</rt></ruby>や<ruby>絵文字<rt>えもじ</rt></ruby>、さらには<ruby>句点<rt>くてん</rt></ruby>を<ruby>省<rt>はぶ</rt></ruby>く<ruby>書<rt>か</rt></ruby>き<ruby>方<rt>かた</rt></ruby>までもが<ruby>独自<rt>どくじ</rt></ruby>のニュアンスを<ruby>帯<rt>お</rt></ruby>びるようになった。</span>",
          "tts": "SNSやチャットツールの普及に伴い、現代の日本語はかつてない速度で変化している。短い文面で感情を瞬時に伝えるため、省略語や絵文字、さらには句点を省く書き方までもが独自のニュアンスを帯びるようになった。"
        },
        {
          "html": "こうした<ruby>現象<rt>げんしょう</rt></ruby>を「<ruby>言葉<rt>ことば</rt></ruby>の<ruby>乱<rt>みだ</rt></ruby>れ」と<ruby>嘆<rt>なげ</rt></ruby>く<ruby>声<rt>こえ</rt></ruby>も<ruby>少<rt>すく</rt></ruby>なくない。<span class=\"key-sentence\" data-q=\"1\">しかし<ruby>言語史<rt>げんごし</rt></ruby>を<ruby>紐解<rt>ひもと</rt></ruby>けば、<ruby>話<rt>はな</rt></ruby>し<ruby>言葉<rt>ことば</rt></ruby>と<ruby>書<rt>か</rt></ruby>き<ruby>言葉<rt>ことば</rt></ruby>は<ruby>常<rt>つね</rt></ruby>に<ruby>時代<rt>じだい</rt></ruby>の<ruby>媒体<rt>ばいたい</rt></ruby>に<ruby>応<rt>おう</rt></ruby>じて<ruby>姿<rt>すがた</rt></ruby>を<ruby>変<rt>か</rt></ruby>えてきたのであり、<ruby>新<rt>あら</rt></ruby>たな<ruby>表現<rt>ひょうげん</rt></ruby>の<ruby>誕生<rt>たんじょう</rt></ruby>そのものを<ruby>一概<rt>いちがい</rt></ruby>に<ruby>劣化<rt>れっか</rt></ruby>と<ruby>断<rt>だん</rt></ruby>じることはできない。</span>",
          "tts": "こうした現象を「言葉の乱れ」と嘆く声も少なくない。しかし言語史を紐解けば、話し言葉と書き言葉は常に時代の媒体に応じて姿を変えてきたのであり、新たな表現の誕生そのものを一概に劣化と断じることはできない。"
        },
        {
          "html": "<ruby>重要<rt>じゅうよう</rt></ruby>なのは、<ruby>新旧<rt>しんきゅう</rt></ruby>の<ruby>表現<rt>ひょうげん</rt></ruby>のどちらかを<ruby>排斥<rt>はいせき</rt></ruby>することではない。<span class=\"key-sentence\" data-q=\"2\"><ruby>相手<rt>あいて</rt></ruby>や<ruby>場<rt>ば</rt></ruby>に<ruby>応<rt>おう</rt></ruby>じて<ruby>語彙<rt>ごい</rt></ruby>や<ruby>文体<rt>ぶんたい</rt></ruby>を<ruby>自在<rt>じざい</rt></ruby>に<ruby>使<rt>つか</rt></ruby>い<ruby>分<rt>わ</rt></ruby>け、<ruby>相手<rt>あいて</rt></ruby>の<ruby>心<rt>こころ</rt></ruby>に<ruby>届<rt>とど</rt></ruby>く<ruby>言葉<rt>ことば</rt></ruby>を<ruby>選<rt>えら</rt></ruby>び<ruby>抜<rt>ぬ</rt></ruby>く<ruby>感覚<rt>かんかく</rt></ruby>こそが、これからの<ruby>時代<rt>じだい</rt></ruby>に<ruby>問<rt>と</rt></ruby>われているのである。</span>",
          "tts": "重要なのは、新旧の表現のどちらかを排斥することではない。相手や場に応じて語彙や文体を自在に使い分け、相手の心に届く言葉を選び抜く感覚こそが、これからの時代に問われているのである。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據第一段，為了在簡短訊息中瞬間傳達情感，數位溝通衍生出了哪些帶有獨特語感的新形式？",
          "options": [
            "全面改用文言文語尾與直書排版格式",
            "縮略語、表情符號（絵文字），甚至連省略句號的寫法都帶有獨特語氣",
            "將所有漢字強制改為片假名以避免誤讀",
            "在每一句結尾加上正式敬語以彌補缺乏表情的缺點"
          ],
          "answerIndex": 1,
          "explanation": "第一段明確列舉：「省略語や絵文字、さらには句点を省く書き方までもが独自のニュアンスを帯びるようになった」（縮略語、繪文字，乃至省略句號的寫法皆蘊含獨特細微語感）。",
          "wrongReason": "請確認第一段「短い文面で感情を瞬時に伝えるため」後方列出的三項表現特徵。"
        },
        {
          "category": "推論",
          "promptZh": "對於把網路新語視為「語言敗壞（言葉の乱れ）」的批判，作者借重語言史提出了什麼反論？",
          "options": [
            "書面語自古以來從未發生過任何變化，只有現代人例外",
            "語言本來就會隨著時代媒介不斷演變，不能一概將新表現的誕生斷定為退化",
            "因為多數年輕人不懂敬語，所以未來應該廢除所有書面文體",
            "表情符號即將完全取代所有文字成為人類唯一的語言"
          ],
          "answerIndex": 1,
          "explanation": "第二段指出：「話し言葉と書き言葉は常に時代の媒体に応じて姿を変えてきたのであり、新たな表現の誕生そのものを一概に劣化と断じることはできない」（語言向來隨媒介演變，無法一概武斷斥為劣化）。",
          "wrongReason": "請細讀第二段「しかし言語史を紐解けば（然而若翻閱語言史）」之後的論點。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者認為在未來的數位時代，真正考驗語言使用者的核心素養是什麼？",
          "options": [
            "嚴格禁止在日常聊天中使用任何縮略語與表情符號",
            "為了追求效率，在公文與商務往來中也一律採用簡短聊天體",
            "不排斥新舊任何一方，而是能依對象與場合靈活切換文體、挑選觸動人心的話語",
            "創造出最多流行語以在社群媒體上獲得大量關注"
          ],
          "answerIndex": 2,
          "explanation": "第三段總結全文核心：「相手や場に応じて語彙や文体を自在に使い分け、相手の心に届く言葉を選び抜く感覚こそが、これからの時代に問われているのである。」",
          "wrongReason": "作者反對「排斥新舊其中一方」，強調「使い分け（看場合靈活區分使用）」的語感素養。"
        }
      ]
    },
    {
      "id": "rd_6",
      "title": "日本の鉄道旅と「駅弁」の魅力",
      "topic": "日本鐵道與旅遊文化",
      "jlpt": "N3",
      "unlockRegionId": "r3",
      "firstClearItemId": "con_fever_charm",
      "rewardGold": 360,
      "rewardExp": 340,
      "paragraphs": [
        {
          "html": "<ruby>日本<rt>にほん</rt></ruby>を<ruby>鉄道<rt>てつどう</rt></ruby>で<ruby>旅<rt>たび</rt></ruby>するとき、<ruby>多<rt>おお</rt></ruby>くの<ruby>旅行者<rt>りょこうしゃ</rt></ruby>が<ruby>心待<rt>こころま</rt></ruby>ちにしているのが<ruby>駅<rt>えき</rt></ruby>のホームや<ruby>車内<rt>しゃない</rt></ruby>で<ruby>売<rt>う</rt></ruby>られる「<ruby>駅弁<rt>えきべん</rt></ruby>」です。<ruby>長距離<rt>ちょうきょり</rt></ruby>の<ruby>移動<rt>いどう</rt></ruby>は<ruby>新幹線<rt>しんかんせん</rt></ruby>や<ruby>特急列車<rt>とっきゅうれっしゃ</rt></ruby>でずっと<ruby>快適<rt>かいてき</rt></ruby>になりましたが、<ruby>移<rt>うつ</rt></ruby>りゆく<ruby>車窓<rt>しゃそう</rt></ruby>の<ruby>景色<rt>けしき</rt></ruby>を<ruby>眺<rt>なが</rt></ruby>めながら<ruby>弁当<rt>べんとう</rt></ruby>のふたを<ruby>開<rt>あ</rt></ruby>ける<ruby>楽<rt>たの</rt></ruby>しみは、<ruby>明治時代<rt>めいじじだい</rt></ruby>から<ruby>今<rt>いま</rt></ruby>も<ruby>変<rt>か</rt></ruby>わらず<ruby>人々<rt>ひとびと</rt></ruby>に<ruby>親<rt>した</rt></ruby>しまれています。",
          "tts": "日本を鉄道で旅するとき、多くの旅行者が心待ちにしているのが駅のホームや車内で売られる「駅弁」です。長距離の移動は新幹線や特急列車でずっと快適になりましたが、移りゆく車窓の景色を眺めながら弁当のふたを開ける楽しみは、明治時代から今も変わらず人々に親しまれています。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"0\"><ruby>駅弁<rt>えきべん</rt></ruby>の<ruby>最大<rt>さいだい</rt></ruby>の<ruby>特徴<rt>とくちょう</rt></ruby>は、<ruby>海<rt>うみ</rt></ruby>の<ruby>幸<rt>さち</rt></ruby>や<ruby>山<rt>やま</rt></ruby>の<ruby>恵<rt>めぐ</rt></ruby>みなど、その<ruby>土地<rt>とち</rt></ruby>ならではの<ruby>旬<rt>しゅん</rt></ruby>の<ruby>特産品<rt>とくさんひん</rt></ruby>や<ruby>伝統的<rt>でんとうてき</rt></ruby>な<ruby>郷土料理<rt>きょうどりょうり</rt></ruby>が<ruby>彩<rt>いろど</rt></ruby>りよく<ruby>詰<rt>つ</rt></ruby>め<ruby>込<rt>こ</rt></ruby>まれている<ruby>点<rt>てん</rt></ruby>にあります。</span><span class=\"key-sentence\" data-q=\"1\"><ruby>冷<rt>さ</rt></ruby>めてもおいしく<ruby>食<rt>た</rt></ruby>べられるようご<ruby>飯<rt>はん</rt></ruby>の<ruby>炊<rt>た</rt></ruby>き<ruby>方<rt>かた</rt></ruby>や<ruby>味付<rt>あじつ</rt></ruby>けが<ruby>丁寧<rt>ていねい</rt></ruby>に<ruby>工夫<rt>くふう</rt></ruby>され、<ruby>容器<rt>ようき</rt></ruby>の<ruby>形<rt>かたち</rt></ruby>や<ruby>掛<rt>か</rt></ruby>け<ruby>紙<rt>がみ</rt></ruby>のデザインにまで<ruby>旅情<rt>りょじょう</rt></ruby>を<ruby>誘<rt>さそ</rt></ruby>う<ruby>遊<rt>あそ</rt></ruby>び<ruby>心<rt>ごころ</rt></ruby>が<ruby>見<rt>み</rt></ruby>られます。</span>",
          "tts": "駅弁の最大の特徴は、海の幸や山の恵みなど、その土地ならではの旬の特産品や伝統的な郷土料理が彩りよく詰め込まれている点にあります。冷めてもおいしく食べられるようご飯の炊き方や味付けが丁寧に工夫され、容器の形や掛け紙のデザインにまで旅情を誘う遊び心が見られます。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"2\"><ruby>単<rt>たん</rt></ruby>なる<ruby>移動中<rt>いどうちゅう</rt></ruby>の<ruby>食事<rt>しょくじ</rt></ruby>にとどまらず、<ruby>駅弁<rt>えきべん</rt></ruby>はその<ruby>地域<rt>ちいき</rt></ruby>の<ruby>歴史<rt>れきし</rt></ruby>や<ruby>食文化<rt>しょくぶんか</rt></ruby>、<ruby>職人<rt>しょくにん</rt></ruby>の<ruby>想<rt>おも</rt></ruby>いを<ruby>運<rt>はこ</rt></ruby>ぶ<ruby>小<rt>ちい</rt></ruby>さな<ruby>案内人<rt>あんないにん</rt></ruby>として、これからも<ruby>鉄道<rt>てつどう</rt></ruby>の<ruby>旅<rt>たび</rt></ruby>を<ruby>豊<rt>ゆた</rt></ruby>かに<ruby>彩<rt>いろど</rt></ruby>り<ruby>続<rt>つづ</rt></ruby>けていくでしょう。</span>",
          "tts": "単なる移動中の食事にとどまらず、駅弁はその地域の歴史や食文化、職人の想いを運ぶ小さな案内人として、これからも鉄道の旅を豊かに彩り続けていくでしょう。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據第二段，日本「駅弁（鐵道便當）」最大的特色是什麼？",
          "options": [
            "全日本的車站都統一販售完全相同菜色的招牌便當",
            "色彩繽紛地裝入了當地特有的海山恩賜、當季特產與傳統鄉土料理",
            "為了節省時間，全部只用簡單的三明治與飲料組成",
            "必須先預約並於餐廳內享用，無法帶上列車車廂"
          ],
          "answerIndex": 1,
          "explanation": "第二段第一句明確指出：「海の幸や山の恵みなど、その土地ならではの旬の特産品や伝統的な郷土料理が彩りよく詰め込まれている点にあります。」（凝聚該土地獨有的海產山珍、當季特產與傳統鄉土料理）。",
          "wrongReason": "請對照第二段開頭「駅弁の最大の特徴は（駅弁最大的特徵是）」後面的說明。"
        },
        {
          "category": "推論",
          "promptZh": "由第二段後半段可推論，製作駅弁的業者為什麼會在米飯煮法與調味上下功夫？",
          "options": [
            "因為列車上大多沒有加熱設備，為了讓便當即使冷掉依然美味可口",
            "為了讓便當能保存超過一個月以上不腐敗",
            "因為法令禁止在車站內販售熱食與湯品",
            "為了大幅降低食材成本以提高車站販賣部的利潤"
          ],
          "answerIndex": 0,
          "explanation": "第二段清楚說明：「冷めてもおいしく食べられるようご飯の炊き方や味付けが丁寧に工夫され（為了冷了也能吃得美味，在米飯炊煮與調味上極下功夫）」。",
          "wrongReason": "關鍵句詞是「冷めてもおいしく食べられるよう（為了就算冷掉也能美味享用）」。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者在文章結尾如何定位「駅弁」在日本鐵道旅行中的角色？",
          "options": [
            "隨著新幹線速度越來越快，駅弁終將被便利商店取代",
            "駅弁的容器設計過於花俏，反而增加了旅途垃圾問題",
            "不僅只是搭車填飽肚子的餐點，更是承載地方歷史、飲食文化與職人情意的小小嚮導",
            "只有長途觀光列車才有販售駅弁的歷史價值"
          ],
          "answerIndex": 2,
          "explanation": "第三段總結道：「単なる移動中の食事にとどまらず、駅弁はその地域の歴史や食文化、職人の想いを運ぶ小さな案内人として、これからも鉄道の旅を豊かに彩り続けていくでしょう。」",
          "wrongReason": "作者把駅弁比喻為「地域の歴史や食文化、職人の想いを運ぶ小さな案内人（傳遞地方文化與職人情意的小小嚮導）」。"
        }
      ]
    },
    {
      "id": "rd_7",
      "title": "ビジネスメールの基本と季節の挨拶",
      "topic": "日本職場商務書信禮儀",
      "jlpt": "N2",
      "unlockRegionId": "r4",
      "firstClearItemId": "con_break_scroll",
      "rewardGold": 500,
      "rewardExp": 480,
      "paragraphs": [
        {
          "html": "<ruby>日本<rt>にほん</rt></ruby>の<ruby>企業<rt>きぎょう</rt></ruby>や<ruby>組織<rt>そしき</rt></ruby>で<ruby>働<rt>はたら</rt></ruby>くうえで、ビジネスメールの<ruby>書<rt>か</rt></ruby>き<ruby>方<rt>かた</rt></ruby>は<ruby>円滑<rt>えんかつ</rt></ruby>な<ruby>業務<rt>ぎょうむ</rt></ruby>に<ruby>欠<rt>か</rt></ruby>かせない<ruby>基本<rt>きほん</rt></ruby>マナーのひとつです。<ruby>件名<rt>けんめい</rt></ruby>を<ruby>一読<rt>いちどく</rt></ruby>するだけで<ruby>用件<rt>ようけん</rt></ruby>がすぐ<ruby>伝<rt>つた</rt></ruby>わるように<ruby>工夫<rt>くふう</rt></ruby>し、<ruby>本文<rt>ほんぶん</rt></ruby>では「お<ruby>世話<rt>せわ</rt></ruby>になっております」といった<ruby>定型句<rt>ていけいく</rt></ruby>を<ruby>冒頭<rt>ぼうとう</rt></ruby>に<ruby>置<rt>お</rt></ruby>くのが<ruby>一般的<rt>いっぱんてき</rt></ruby>です。",
          "tts": "日本の企業や組織で働くうえで、ビジネスメールの書き方は円滑な業務に欠かせない基本マナーのひとつです。件名を一読するだけで用件がすぐ伝わるように工夫し、本文では「お世話になっております」といった定型句を冒頭に置くのが一般的です。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"0\">また、<ruby>改<rt>あらた</rt></ruby>まった<ruby>紙<rt>かみ</rt></ruby>の<ruby>手紙<rt>てがみ</rt></ruby>であれば「<ruby>拝啓<rt>はいけい</rt></ruby>」に<ruby>続<rt>つづ</rt></ruby>けて<ruby>時候<rt>じこう</rt></ruby>の<ruby>挨拶<rt>あいさつ</rt></ruby>を<ruby>添<rt>そ</rt></ruby>えますが、スピードが<ruby>重視<rt>じゅうし</rt></ruby>されるメールでは<ruby>簡潔<rt>かんけつ</rt></ruby>なクッション<ruby>言葉<rt>ことば</rt></ruby>や<ruby>気遣<rt>きづか</rt></ruby>いの<ruby>一言<rt>ひとこと</rt></ruby>が<ruby>好<rt>この</rt></ruby>まれます。</span><span class=\"key-sentence\" data-q=\"1\">とくに<ruby>相手<rt>あいて</rt></ruby>への<ruby>依頼<rt>いらい</rt></ruby>や<ruby>謝罪<rt>しゃざい</rt></ruby>を<ruby>伝<rt>つた</rt></ruby>えるメールでは、「お<ruby>忙<rt>いそが</rt></ruby>しいところ<ruby>恐縮<rt>きょうしゅく</rt></ruby>ですが」と<ruby>前置<rt>まえお</rt></ruby>きすることで、<ruby>相手<rt>あいて</rt></ruby>への<ruby>敬意<rt>けいい</rt></ruby>や<ruby>配慮<rt>はいりょ</rt></ruby>が<ruby>自然<rt>しぜん</rt></ruby>に<ruby>伝<rt>つた</rt></ruby>わります。</span>",
          "tts": "また、改まった紙の手紙であれば「拝啓」に続けて時候の挨拶を添えますが、スピードが重視されるメールでは簡潔なクッション言葉や気遣いの一言が好まれます。とくに相手への依頼や謝罪を伝えるメールでは、「お忙しいところ恐縮ですが」と前置きすることで、相手への敬意や配慮が自然に伝わります。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"2\"><ruby>形式<rt>けいしき</rt></ruby>にとらわれすぎて<ruby>肝心<rt>かんじん</rt></ruby>な<ruby>用件<rt>ようけん</rt></ruby>が<ruby>曖昧<rt>あいまい</rt></ruby>になっては<ruby>本末転倒<rt>ほんまつてんとう</rt></ruby>ですが、<ruby>相手<rt>あいて</rt></ruby>の<ruby>時間<rt>じかん</rt></ruby>と<ruby>立場<rt>たちば</rt></ruby>を<ruby>尊重<rt>そんちょう</rt></ruby>する<ruby>言葉<rt>ことば</rt></ruby>の<ruby>作法<rt>さほう</rt></ruby>こそが、<ruby>長<rt>なが</rt></ruby>く<ruby>続<rt>つづ</rt></ruby>く<ruby>信頼関係<rt>しんらいかんけい</rt></ruby>を<ruby>築<rt>きず</rt></ruby>く<ruby>確<rt>たし</rt></ruby>かな<ruby>土台<rt>どだい</rt></ruby>となるのです。</span>",
          "tts": "形式にとらわれすぎて肝心な用件が曖昧になっては本末転倒ですが、相手の時間と立場を尊重する言葉の作法こそが、長く続く信頼関係を築く確かな土台となるのです。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據第二段，相較於傳統紙本書信，重視效率的商務電子郵件（メール）通常偏好什麼做法？",
          "options": [
            "在每一封電子郵件開頭都必須寫滿三段長篇季節問候語",
            "省略所有問候語，只傳送一條檔案連結以節省雙方時間",
            "比起長篇「拝啓」與季節寒暄，更偏好簡潔的緩衝語或體貼的一句話",
            "全部改用聊天軟體的貼圖來傳達敬意"
          ],
          "answerIndex": 2,
          "explanation": "第二段第一句寫明：「改まった紙の手紙であれば『拝啓』に続けて時候の挨拶を添えますが、スピードが重視されるメールでは簡潔なクッション言葉や気遣いの一言が好まれます。」",
          "wrongReason": "請比較第二段前半「紙の手紙」與「メール」兩者截然不同的寒暄風格。"
        },
        {
          "category": "推論",
          "promptZh": "在請求他人協助或致歉的商務郵件中，加入「お忙しいところ恐縮ですが」的主要作用是什麼？",
          "options": [
            "藉此暗示對方工作效率低落、總是忙碌不堪",
            "作為前置緩衝語，在進入正題前自然流露對對方的敬意與體諒",
            "用來取代信件結尾的所有署名與聯絡方式",
            "要求收件人必須在十分鐘內立即回覆"
          ],
          "answerIndex": 1,
          "explanation": "原文寫道：「『お忙しいところ恐縮ですが』と前置きすることで、相手への敬意や配慮が自然に伝わります。」（先做緩衝鋪陳，自然傳達敬意與體貼）。",
          "wrongReason": "注意「前置き（先做鋪陳）」與「相手への敬意や配慮が自然に伝わる（自然傳達敬意與體諒）」的因果關聯。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者對於商務書信禮儀抱持什麼樣的整體看法？",
          "options": [
            "只要嚴格遵守形式即可，內容是否明確並不重要",
            "應該完全廢除「お世話になっております」等所有傳統定型句",
            "不應過度拘泥形式導致重點模糊，但尊重對方時間與立場的言語禮法是建立長久信任的基石",
            "紙本書信在任何場合都比電子郵件更值得信賴"
          ],
          "answerIndex": 2,
          "explanation": "第三段總結：「形式にとらわれすぎて肝心な用件が曖昧になっては本末転倒ですが、相手の時間と立場を尊重する言葉の作法こそが、長く続く信頼関係を築く確かな土台となるのです。」",
          "wrongReason": "作者同時指出「不可過度執著形式而模糊重點」，也肯定「尊重他人的作法是信任基礎」。"
        }
      ]
    },
    {
      "id": "rd_8",
      "title": "生成AIの普及と人間の創造性",
      "topic": "AI 與現代社會議題",
      "jlpt": "N1",
      "unlockRegionId": "r6",
      "firstClearItemId": "ac_kotodama_heart",
      "rewardGold": 720,
      "rewardExp": 700,
      "paragraphs": [
        {
          "html": "<ruby>近年<rt>きんねん</rt></ruby>、<ruby>膨大<rt>ぼうだい</rt></ruby>なデータから<ruby>文章<rt>ぶんしょう</rt></ruby>や<ruby>画像<rt>がぞう</rt></ruby>を<ruby>瞬時<rt>しゅんじ</rt></ruby>に<ruby>生<rt>う</rt></ruby>み<ruby>出<rt>だ</rt></ruby>す「<ruby>生成<rt>せいせい</rt></ruby>AI」が<ruby>急速<rt>きゅうそく</rt></ruby>に<ruby>普及<rt>ふきゅう</rt></ruby>し、<ruby>社会<rt>しゃかい</rt></ruby>や<ruby>仕事<rt>しごと</rt></ruby>のあり<ruby>方<rt>かた</rt></ruby>を<ruby>大<rt>おお</rt></ruby>きく<ruby>変<rt>か</rt></ruby>えつつある。<ruby>資料<rt>しりょう</rt></ruby>の<ruby>要約<rt>ようやく</rt></ruby>や<ruby>翻訳<rt>ほんやく</rt></ruby>、<ruby>企画<rt>きかく</rt></ruby>のたたき<ruby>台<rt>だい</rt></ruby><ruby>作成<rt>さくせい</rt></ruby>など、<ruby>作業効率<rt>さぎょうこうりつ</rt></ruby>を<ruby>飛躍的<rt>ひやくてき</rt></ruby>に<ruby>高<rt>たか</rt></ruby>める<ruby>道具<rt>どうぐ</rt></ruby>として、すでに<ruby>多<rt>おお</rt></ruby>くの<ruby>現場<rt>げんば</rt></ruby>で<ruby>活用<rt>かつよう</rt></ruby>されている。",
          "tts": "近年、膨大なデータから文章や画像を瞬時に生み出す「生成AI」が急速に普及し、社会や仕事のあり方を大きく変えつつある。資料の要約や翻訳、企画のたたき台作成など、作業効率を飛躍的に高める道具として、すでに多くの現場で活用されている。"
        },
        {
          "html": "<span class=\"key-sentence\" data-q=\"0\">その<ruby>一方<rt>いっぽう</rt></ruby>で、AIがもっともらしい<ruby>誤情報<rt>ごじょうほう</rt></ruby>を<ruby>出力<rt>しゅつりょく</rt></ruby>するリスクや、<ruby>著作権<rt>ちょさくけん</rt></ruby>・<ruby>個人情報<rt>こじんじょうほう</rt></ruby>をめぐる<ruby>法的<rt>ほうてき</rt></ruby>・<ruby>倫理的<rt>りんりてき</rt></ruby><ruby>課題<rt>かだい</rt></ruby>も<ruby>深刻<rt>しんこく</rt></ruby>に<ruby>議論<rt>ぎろん</rt></ruby>されている。</span><span class=\"key-sentence\" data-q=\"1\">また、<ruby>便利<rt>べんり</rt></ruby>さに<ruby>頼<rt>たよ</rt></ruby>りすぎるあまり、<ruby>人間<rt>にんげん</rt></ruby><ruby>自身<rt>じしん</rt></ruby>が<ruby>粘<rt>ねば</rt></ruby>り<ruby>強<rt>づよ</rt></ruby>く<ruby>思考<rt>しこう</rt></ruby>し、<ruby>自分<rt>じぶん</rt></ruby>の<ruby>言葉<rt>ことば</rt></ruby>で<ruby>表現<rt>ひょうげん</rt></ruby>する<ruby>力<rt>ちから</rt></ruby>が<ruby>衰<rt>おとろ</rt></ruby>えるのではないかという<ruby>懸念<rt>けねん</rt></ruby>も<ruby>少<rt>すく</rt></ruby>なくない。</span>",
          "tts": "その一方で、AIがもっともらしい誤情報を出力するリスクや、著作権・個人情報をめぐる法的・倫理的課題も深刻に議論されている。また、便利さに頼りすぎるあまり、人間自身が粘り強く思考し、自分の言葉で表現する力が衰えるのではないかという懸念も少なくない。"
        },
        {
          "html": "しかし、<ruby>新<rt>あたら</rt></ruby>しい<ruby>技術<rt>ぎじゅつ</rt></ruby>を<ruby>単<rt>たん</rt></ruby>に<ruby>恐<rt>おそ</rt></ruby>れて<ruby>遠<rt>とお</rt></ruby>ざけるだけでは<ruby>前進<rt>ぜんしん</rt></ruby>できない。<span class=\"key-sentence\" data-q=\"2\">AIの<ruby>回答<rt>かいとう</rt></ruby>を<ruby>批判的<rt>ひはんてき</rt></ruby>に<ruby>見極<rt>みきわ</rt></ruby>め、<ruby>何<rt>なに</rt></ruby>を<ruby>問<rt>と</rt></ruby>うべきかを<ruby>構想<rt>こうそう</rt></ruby>する<ruby>人間<rt>にんげん</rt></ruby>ならではの<ruby>創造性<rt>そうぞうせい</rt></ruby>を<ruby>磨<rt>みが</rt></ruby>くことこそが、これからの<ruby>時代<rt>じだい</rt></ruby>に<ruby>求<rt>もと</rt></ruby>められているのである。</span>",
          "tts": "しかし、新しい技術を単に恐れて遠ざけるだけでは前進できない。AIの回答を批判的に見極め、何を問うべきかを構想する人間ならではの創造性を磨くことこそが、これからの時代に求められているのである。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "文章第二段指出了普及生成式 AI 伴隨哪些正在被嚴肅討論的風險與課題？",
          "options": [
            "電力成本低廉到讓傳統印刷機全部消失",
            "輸出似是而非的錯誤資訊之風險，以及圍繞著作權與個人資料的法律及倫理課題",
            "AI 只懂得翻譯外語，完全無法製作企劃草稿或摘要",
            "法律已經全面禁止職場使用任何數位摘要工具"
          ],
          "answerIndex": 1,
          "explanation": "第二段第一句列明：「AIがもっともらしい誤情報を出力するリスクや、著作権・個人情報をめぐる法的・倫理的課題も深刻に議論されている。」（「もっともらしい」意為「看似有理實則錯誤」）。",
          "wrongReason": "請找第二段開頭「その一方で（另一方面）」所提到的具體風險與討論議題。"
        },
        {
          "category": "推論",
          "promptZh": "關於「過度依賴生成式 AI 的便利性」，社會上存在什麼深層隱憂？",
          "options": [
            "人類自己的思考時間變得太長，導致工作效率下降",
            "人類本身持續深思熟慮、並以自己的話語表達的能力恐怕會逐漸衰退",
            "大家會變得更喜歡手寫長篇信件而拒絕使用電腦",
            "AI 產生圖像的速度太慢，無法應付現代社會需求"
          ],
          "answerIndex": 1,
          "explanation": "第二段後半點出憂慮：「人間自身が粘り強く思考し、自分の言葉で表現する力が衰えるのではないかという懸念（人類自身耐心思考並以自己語言表達的能力是否會衰退）」。",
          "wrongReason": "注意「頼りすぎるあまり（因為過度依賴以致於）」後面提到的「力（能力）」衰退隱憂。"
        },
        {
          "category": "作者觀點",
          "promptZh": "面對生成式 AI 的時代，作者認為人類今後最需要培養的是什麼能力？",
          "options": [
            "因為害怕風險而徹底禁止所有 AI 技術進入生活",
            "將所有判斷與提問權完全交給 AI，不需再進行批判性查核",
            "能批判性地審視辨別 AI 回答，並構思「該提出什麼問題」的人類獨有創造力",
            "比拼記憶大量資料庫的速度，試圖在背誦效率上戰勝 AI"
          ],
          "answerIndex": 2,
          "explanation": "第三段總結核心立場：「AIの回答を批判的に見極め、何を問うべきかを構想する人間ならではの創造性を磨くことこそが、これからの時代に求められているのである。」",
          "wrongReason": "作者反對單純恐懼逃避，強調磨練「見極める力（判別力）」與「何を問うべきかを構想する創造性（構思好問題的創造力）」。"
        }
      ]
    },
    {
      "id": "rd_9",
      "title": "日本のコンビニと季節の暮らし",
      "topic": "日本現代生活文化",
      "jlpt": "N4",
      "unlockRegionId": "r1",
      "firstClearItemId": "con_herb",
      "rewardGold": 220,
      "rewardExp": 190,
      "paragraphs": [
        {
          "html": "<ruby>日本<rt>にほん</rt></ruby>の<ruby>町<rt>まち</rt></ruby>を<ruby>歩<rt>ある</rt></ruby>くと、<ruby>駅<rt>えき</rt></ruby>の<ruby>近<rt>ちか</rt></ruby>くや<ruby>道<rt>みち</rt></ruby>の<ruby>角<rt>かど</rt></ruby>など、あちこちでコンビニを<ruby>見<rt>み</rt></ruby>かけます。<span class=\"key-sentence\" data-q=\"0\">コンビニではお<ruby>弁当<rt>べんとう</rt></ruby>や<ruby>飲<rt>の</rt></ruby>み<ruby>物<rt>もの</rt></ruby>を<ruby>買<rt>か</rt></ruby>うだけでなく、<ruby>電気<rt>でんき</rt></ruby>や<ruby>水道<rt>すいどう</rt></ruby>の<ruby>料金<rt>りょうきん</rt></ruby>を<ruby>払<rt>はら</rt></ruby>ったり、<ruby>荷物<rt>にもつ</rt></ruby>を<ruby>送<rt>おく</rt></ruby>ったり、コピー<ruby>機<rt>き</rt></ruby>を<ruby>使<rt>つか</rt></ruby>ったりすることもできます。</span><ruby>忙<rt>いそが</rt></ruby>しい<ruby>毎日<rt>まいにち</rt></ruby>の<ruby>中<rt>なか</rt></ruby>で、すぐ<ruby>近<rt>ちか</rt></ruby>くでいろいろな<ruby>用事<rt>ようじ</rt></ruby>を<ruby>済<rt>す</rt></ruby>ませられるのは<ruby>本当<rt>ほんとう</rt></ruby>に<ruby>便利<rt>べんり</rt></ruby>です。",
          "tts": "日本の町を歩くと、駅の近くや道の角など、あちこちでコンビニを見かけます。コンビニではお弁当や飲み物を買うだけでなく、電気や水道の料金を払ったり、荷物を送ったり、コピー機を使ったりすることもできます。忙しい毎日の中で、すぐ近くでいろいろな用事を済ませられるのは本当に便利です。"
        },
        {
          "html": "また、コンビニでは<ruby>季節<rt>きせつ</rt></ruby>に<ruby>合<rt>あ</rt></ruby>わせた<ruby>商品<rt>しょうひん</rt></ruby>がたくさん<ruby>売<rt>う</rt></ruby>られています。<ruby>春<rt>はる</rt></ruby>は<ruby>桜<rt>さくら</rt></ruby>やいちごのお<ruby>菓子<rt>かし</rt></ruby>、<ruby>夏<rt>なつ</rt></ruby>は<ruby>冷<rt>つめ</rt></ruby>たい<ruby>麺<rt>めん</rt></ruby>、<ruby>秋<rt>あき</rt></ruby>は<ruby>栗<rt>くり</rt></ruby>のデザート、そして<ruby>冬<rt>ふゆ</rt></ruby>は<ruby>温<rt>あたた</rt></ruby>かい<ruby>中華<rt>ちゅうか</rt></ruby>まんやおでんがレジの<ruby>横<rt>よこ</rt></ruby>に<ruby>並<rt>なら</rt></ruby>びます。<span class=\"key-sentence\" data-q=\"1\"><ruby>店<rt>みせ</rt></ruby>の<ruby>中<rt>なか</rt></ruby>を<ruby>見<rt>み</rt></ruby>るだけで、<ruby>今<rt>いま</rt></ruby>の<ruby>季節<rt>きせつ</rt></ruby>を<ruby>身近<rt>みぢか</rt></ruby>に<ruby>感<rt>かん</rt></ruby>じることができるのも、<ruby>日本<rt>にほん</rt></ruby>のコンビニの<ruby>大<rt>おお</rt></ruby>きな<ruby>特徴<rt>とくちょう</rt></ruby>です。</span>",
          "tts": "また、コンビニでは季節に合わせた商品がたくさん売られています。春は桜やいちごのお菓子、夏は冷たい麺、秋は栗のデザート、そして冬は温かい中華まんやおでんがレジの横に並びます。店の中を見るだけで、今の季節を身近に感じることができるのも、日本のコンビニの大きな特徴です。"
        },
        {
          "html": "さらに<ruby>最近<rt>さいきん</rt></ruby>では、<ruby>災害<rt>さいがい</rt></ruby>のときに<ruby>水<rt>みず</rt></ruby>や<ruby>食<rt>た</rt></ruby>べ<ruby>物<rt>もの</rt></ruby>を<ruby>配<rt>くば</rt></ruby>ったり、お<ruby>年寄<rt>としよ</rt></ruby>りのために<ruby>商品<rt>しょうひん</rt></ruby>を<ruby>家<rt>いえ</rt></ruby>まで<ruby>届<rt>とど</rt></ruby>けたりする<ruby>店<rt>みせ</rt></ruby>も<ruby>増<rt>ふ</rt></ruby>えています。<span class=\"key-sentence\" data-q=\"2\">このように、コンビニはただ<ruby>買<rt>か</rt></ruby>い<ruby>物<rt>もの</rt></ruby>をする<ruby>場所<rt>ばしょ</rt></ruby>ではなく、<ruby>地域<rt>ちいき</rt></ruby>の<ruby>人々<rt>ひとびと</rt></ruby>の<ruby>暮<rt>く</rt></ruby>らしを<ruby>身近<rt>みぢか</rt></ruby>なところから<ruby>支<rt>ささ</rt></ruby>える<ruby>大切<rt>たいせつ</rt></ruby>な<ruby>存在<rt>そんざい</rt></ruby>になっているのです。</span>",
          "tts": "さらに最近では、災害のときに水や食べ物を配ったり、お年寄りのために商品を家まで届けたりする店も増えています。このように、コンビニはただ買い物をする場所ではなく、地域の人々の暮らしを身近なところから支える大切な存在になっているのです。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據第一段，除了購買便當與飲料之外，文章中還提到能在日本便利商店辦理哪些日常事務？",
          "options": [
            "免費租借自行車與預約地區醫院門診",
            "欣賞季節限定的電影放映與參加料理教室",
            "繳交水電費、寄送包裹以及使用影印機",
            "辦理護照更新以及申請長期銀行貸款"
          ],
          "answerIndex": 2,
          "explanation": "第一段明確列舉：「電気や水道の料金を払ったり、荷物を送ったり、コピー機を使ったりすることもできます」（也能繳交電費與水費、寄送包裹、使用影印機）。",
          "wrongReason": "請回到第一段確認「買うだけでなく（不只是購買）」之後列出的三項具體生活服務。"
        },
        {
          "category": "推論",
          "promptZh": "由第二段內容可以推論，為何只要走進日本便利商店就能親近地感受到當下的季節？",
          "options": [
            "因為店內會隨四季更替擺出櫻花零食、涼麵、栗子甜點與關東煮等應景商品，讓季節變化直接呈現在貨架與收銀台旁",
            "因為日本便利商店為了節電不開冷暖氣，顧客必須依靠室內溫度變化判斷季節",
            "因為便利商店每年只在春季與冬季販售食品，其他季節則全面改賣日用品",
            "因為每位店員都會在結帳時向顧客詳細解說當天的節氣與傳統飲食歷史"
          ],
          "answerIndex": 0,
          "explanation": "第二段依春夏秋冬舉出各式季節限定食品，並總結「店の中を見るだけで、今の季節を身近に感じることができる（光是看看店裡，就能親近地感受到當下的季節）」。",
          "wrongReason": "關鍵在於第二段開頭「季節に合わせた商品（配合季節推出的商品）」以及四季代表食物的舉例。"
        },
        {
          "category": "作者觀點",
          "promptZh": "綜合全文，作者在最後如何評價現代日本便利商店在社會中的角色？",
          "options": [
            "依然只是讓忙碌上班族快速買完便當就離開的單純零售店",
            "雖然便利度高，但因缺乏社區互動而逐漸與當地居民疏離",
            "過度集中在車站周邊，導致年長者無法享受到任何貼心服務",
            "早已不只是購物場所，而是從生活周遭貼近並支撐社區居民日常的重要存在"
          ],
          "answerIndex": 3,
          "explanation": "第三段先舉出防災發放物資與替長輩送貨到府的實例，接著總結：「ただ買い物をする場所ではなく、地域の人々の暮らしを身近なところから支える大切な存在になっているのです」（不只是購物場所，更是從身邊支撐地區居民生活的重要存在）。",
          "wrongReason": "注意第三段「ただ～ではなく（不只是……而是……）」的句型，作者強調的是便利商店對社區居民生活的支撐作用。"
        }
      ]
    },
    {
      "id": "rd_10",
      "title": "「間」の美学と沈黙の語らい",
      "topic": "日本美學與語言哲學",
      "jlpt": "N1",
      "unlockRegionId": "r6",
      "firstClearItemId": "ac_kotodama_heart",
      "rewardGold": 820,
      "rewardExp": 780,
      "paragraphs": [
        {
          "html": "<ruby>日本<rt>にほん</rt></ruby>の<ruby>伝統<rt>でんとう</rt></ruby><ruby>芸術<rt>げいじゅつ</rt></ruby>を<ruby>紐解<rt>ひもと</rt></ruby>くとき、<ruby>欠<rt>か</rt></ruby>かすことのできない<ruby>美意識<rt>びいしき</rt></ruby>の<ruby>一<rt>ひと</rt></ruby>つに「<ruby>間<rt>ま</rt></ruby>」がある。<ruby>邦楽<rt>ほうがく</rt></ruby>において<ruby>音<rt>おと</rt></ruby>と<ruby>音<rt>おと</rt></ruby>との<ruby>間<rt>あいだ</rt></ruby>に<ruby>置<rt>お</rt></ruby>かれるわずかな<ruby>休止<rt>きゅうし</rt></ruby>や、<ruby>伝統<rt>でんとう</rt></ruby><ruby>建築<rt>けんちく</rt></ruby>の<ruby>茶室<rt>ちゃしつ</rt></ruby>に<ruby>見<rt>み</rt></ruby>られる<ruby>余白<rt>よはく</rt></ruby>は、<ruby>単<rt>たん</rt></ruby>なる<ruby>空白<rt>くうはく</rt></ruby>や<ruby>欠如<rt>けつじょ</rt></ruby>を<ruby>意味<rt>いみ</rt></ruby>するのではない。<span class=\"key-sentence\" data-q=\"0\">むしろ、<ruby>何<rt>なに</rt></ruby>もないからこそ<ruby>前後<rt>ぜんご</rt></ruby>の<ruby>音色<rt>ねいろ</rt></ruby>や<ruby>一輪<rt>いちりん</rt></ruby>の<ruby>花<rt>はな</rt></ruby>が<ruby>際立<rt>きわだ</rt></ruby>ち、そこに<ruby>豊<rt>ゆた</rt></ruby>かな<ruby>余韻<rt>よいん</rt></ruby>と<ruby>緊張感<rt>きんちょうかん</rt></ruby>が<ruby>醸<rt>かも</rt></ruby>し<ruby>出<rt>だ</rt></ruby>されるのである。</span>",
          "tts": "日本の伝統芸術を紐解くとき、欠かすことのできない美意識の一つに「間」がある。邦楽において音と音との間に置かれるわずかな休止や、伝統建築の茶室に見られる余白は、単なる空白や欠如を意味するのではない。むしろ、何もないからこそ前後の音色や一輪の花が際立ち、そこに豊かな余韻と緊張感が醸し出されるのである。"
        },
        {
          "html": "こうした<ruby>感性<rt>かんせい</rt></ruby>は<ruby>芸術<rt>げいじゅつ</rt></ruby>の<ruby>領域<rt>りょういき</rt></ruby>にとどまらず、<ruby>人<rt>ひと</rt></ruby>と<ruby>人<rt>ひと</rt></ruby>との<ruby>対話<rt>たいわ</rt></ruby>にも<ruby>深<rt>ふか</rt></ruby>く<ruby>根<rt>ね</rt></ruby>ざしている。<ruby>効率<rt>こうりつ</rt></ruby>や<ruby>即時性<rt>そくじせい</rt></ruby>が<ruby>重視<rt>じゅうし</rt></ruby>される<ruby>現代<rt>げんだい</rt></ruby>では、<ruby>会話<rt>かいわ</rt></ruby>の<ruby>途切<rt>とぎ</rt></ruby>れを<ruby>気<rt>き</rt></ruby>まずいものとして<ruby>性急<rt>せいきゅう</rt></ruby>に<ruby>埋<rt>う</rt></ruby>めようとしがちである。<span class=\"key-sentence\" data-q=\"1\">しかし、あえて<ruby>言葉<rt>ことば</rt></ruby>を<ruby>重<rt>かさ</rt></ruby>ねず<ruby>沈黙<rt>ちんもく</rt></ruby>を<ruby>共有<rt>きょうゆう</rt></ruby>する<ruby>時間<rt>じかん</rt></ruby>こそが、<ruby>相手<rt>あいて</rt></ruby>の<ruby>心情<rt>しんじょう</rt></ruby>を<ruby>慮<rt>おもんぱか</rt></ruby>り、<ruby>語<rt>かた</rt></ruby>られなかった<ruby>本音<rt>ほんね</rt></ruby>を<ruby>受<rt>う</rt></ruby>け<ruby>止<rt>と</rt></ruby>めるための<ruby>大切<rt>たいせつ</rt></ruby>な<ruby>余地<rt>よち</rt></ruby>となるのだ。</span>",
          "tts": "こうした感性は芸術の領域にとどまらず、人と人との対話にも深く根ざしている。効率や即時性が重視される現代では、会話の途切れを気まずいものとして性急に埋めようとしがちである。しかし、あえて言葉を重ねず沈黙を共有する時間こそが、相手の心情を慮り、語られなかった本音を受け止めるための大切な余地となるのだ。"
        },
        {
          "html": "<ruby>言<rt>い</rt></ruby>い<ruby>換<rt>か</rt></ruby>えれば、<ruby>沈黙<rt>ちんもく</rt></ruby>とは<ruby>言葉<rt>ことば</rt></ruby>の<ruby>不在<rt>ふざい</rt></ruby>ではなく、もう<ruby>一<rt>ひと</rt></ruby>つの<ruby>雄弁<rt>ゆうべん</rt></ruby>な<ruby>語<rt>かた</rt></ruby>らいにほかならない。<span class=\"key-sentence\" data-q=\"2\"><ruby>情報<rt>じょうほう</rt></ruby>があふれ<ruby>返<rt>かえ</rt></ruby>る<ruby>時代<rt>じだい</rt></ruby>だからこそ、<ruby>語<rt>かた</rt></ruby>らないことの<ruby>重<rt>おも</rt></ruby>みを<ruby>見<rt>み</rt></ruby>つめ<ruby>直<rt>なお</rt></ruby>し、<ruby>心<rt>こころ</rt></ruby>と<ruby>心<rt>こころ</rt></ruby>が<ruby>静<rt>しず</rt></ruby>かに<ruby>響<rt>ひび</rt></ruby>き<ruby>合<rt>あ</rt></ruby>う「<ruby>間<rt>ま</rt></ruby>」を<ruby>慈<rt>いつく</rt></ruby>しむ<ruby>姿勢<rt>しせい</rt></ruby>が<ruby>求<rt>もと</rt></ruby>められていると<ruby>言<rt>い</rt></ruby>えよう。</span>",
          "tts": "言い換えれば、沈黙とは言葉の不在ではなく、もう一つの雄弁な語らいにほかならない。情報があふれ返る時代だからこそ、語らないことの重みを見つめ直し、心と心が静かに響き合う「間」を慈しむ姿勢が求められていると言えよう。"
        }
      ],
      "questions": [
        {
          "category": "資訊檢索",
          "promptZh": "根據第一段，在邦樂與傳統茶室等日本藝術中，「間」所發揮的美學作用是什麼？",
          "options": [
            "以繁複的裝飾與不間斷的音符填滿空間，避免觀賞者感到單調",
            "正因看似一無所有，反倒凸顯前後的音色與一枝花，醞釀出豐沛的餘韻與緊張感",
            "刻意暴露作品尚未完成的缺憾，以提醒觀者世事皆有不足",
            "主要為了節省演奏者體力與建築材料而發展出的實用技巧"
          ],
          "answerIndex": 1,
          "explanation": "第一段指出「間」並非單純的空白或欠缺，並明確說明：「むしろ、何もないからこそ前後の音色や一輪の花が際立ち、そこに豊かな余韻と緊張感が醸し出されるのである」（正因為無物，前後音色與一朵花才更顯突出，進而醞釀出豐沛的餘韻與張力）。",
          "wrongReason": "請對照第一段「むしろ（反而、毋寧說）」之後的關鍵句，留意「際立つ（凸顯）」與「醸し出される（醞釀而出）」所描述的效果。"
        },
        {
          "category": "推論",
          "promptZh": "由第二段可以推論，為何作者認為人際對話中「共享沉默的時間」反而極具價值？",
          "options": [
            "因為現代人語言能力退化，沉默能避免說錯話而引發正面衝突",
            "因為在重視效率與即時性的社會裡，唯有迅速填補停頓才能展現善意",
            "因為只要完全停止交談，就能讓對方主動說出所有原本隱藏的秘密",
            "因為刻意不堆砌言語所留下的靜默，能提供體察對方心境並承接未言明真意的空間"
          ],
          "answerIndex": 3,
          "explanation": "第二段指出現代人往往把對話停頓視為尷尬而急於填補，但「あえて言葉を重ねず沈黙を共有する時間こそが、相手の心情を慮り、語られなかった本音を受け止めるための大切な余地となるのだ」（刻意不堆疊言語、共享沉默的時間，才是體察對方心情並接住未出口真心的寶貴餘地）。",
          "wrongReason": "注意第二段「しかし」後的轉折，核心動詞是「慮る（體察、顧慮）」與「受け止める（承接）」，而非逃避溝通或強迫對方開口。"
        },
        {
          "category": "作者觀點",
          "promptZh": "作者在文章結尾最想表達的核心立場為何？",
          "options": [
            "在資訊氾濫的現代，更應重新審視「不語」的份量，珍視讓心靈靜靜共鳴的「間」",
            "為了提升溝通準確度，應盡可能將所有感受化為明確資訊，避免留下沉默空白",
            "「間」的美學僅限於邦樂與茶道等古典藝術，難以套用於現代人際互動",
            "既然言語往往無法傳達真心，今後應當放棄口語對話而全面回歸無聲交流"
          ],
          "answerIndex": 0,
          "explanation": "第三段將沉默定義為「もう一つの雄弁な語らい（另一種雄辯的傾訴）」，並總結道：「情報があふれ返る時代だからこそ、語らないことの重みを見つめ直し、心と心が静かに響き合う『間』を慈しむ姿勢が求められていると言えよう。」",
          "wrongReason": "作者並未否定語言本身，而是強調在資訊過載的時代裡，必須重新珍視不言之處所承載的份量與心靈共鳴之「間」。"
        }
      ]
    }
  ];

  /* ==========================================================================
   * 15 個任務 (6 主線 main / 5 支線 side / 4 每日 daily)
   * ========================================================================== */
  const QUESTS = [
    /* --- 主線任務 (6) --- */
    {
      id: 'q_main_1',
      category: 'main',
      title: '第一章：淨化初音石碑',
      desc: '前往「始まりの町」累積實力，擊敗鎮守出口的區域首領「石碑巨像・初音守」。',
      targetType: 'defeat_boss',
      targetId: 'boss_r1_golem',
      targetCount: 1,
      reward: { exp: 90, gold: 140, itemId: 'con_herb' }
    },
    {
      id: 'q_main_2',
      category: 'main',
      title: '第二章：突破助詞之橋',
      desc: '踏入「基礎の領地」掌握基礎助詞與時態，擊敗首領「助詞鐵騎・繋ぎの騎士」。',
      targetType: 'defeat_boss',
      targetId: 'boss_r2_knight',
      targetCount: 1,
      reward: { exp: 160, gold: 230, itemId: 'con_break_scroll' }
    },
    {
      id: 'q_main_3',
      category: 'main',
      title: '第三章：紅燈戲台的千面考驗',
      desc: '探索「日常の都」精通動詞活用，擊敗首領「千面歌舞伎・活用幻師」。',
      targetType: 'defeat_boss',
      targetId: 'boss_r3_kabuki',
      targetCount: 1,
      reward: { exp: 260, gold: 360, itemId: 'ar_scribe_robe' }
    },
    {
      id: 'q_main_4',
      category: 'main',
      title: '第四章：斬斷文脈迷霧',
      desc: '深入「文脈の峡谷」洞察接續與複合動詞，擊敗首領「文脈大蛇・言の葉の龍」。',
      targetType: 'defeat_boss',
      targetId: 'boss_r4_serpent',
      targetCount: 1,
      reward: { exp: 400, gold: 520, itemId: 'con_fever_charm' }
    },
    {
      id: 'q_main_5',
      category: 'main',
      title: '第五章：通過敬語審判',
      desc: '登上「思索の城塞」駕馭 N2 長文與敬語，擊敗首領「思索宰相・敬語の審判者」。',
      targetType: 'defeat_boss',
      targetId: 'boss_r5_chancellor',
      targetCount: 1,
      reward: { exp: 600, gold: 780, itemId: 'ac_context_lens' }
    },
    {
      id: 'q_main_6',
      category: 'main',
      title: '終章：喚醒聖域真言',
      desc: '挑戰最終之地「言霊の聖域」，以 N1 高階語感淨化「沈默魔王・無言の覇者」。',
      targetType: 'defeat_boss',
      targetId: 'boss_r6_overlord',
      targetCount: 1,
      reward: { exp: 1200, gold: 1500, itemId: 'ar_sanctuary_aegis' }
    },

    /* --- 支線任務 (5) --- */
    {
      id: 'q_side_1',
      category: 'side',
      title: '古籍書庫的尋光者',
      desc: '前往古籍館挑戰並成功通關 2 座長文閱讀地下城，拓展日本文化與讀解視野。',
      targetType: 'clear_reading',
      targetId: null,
      targetCount: 2,
      reward: { exp: 180, gold: 220, itemId: 'con_water' }
    },
    {
      id: 'q_side_2',
      category: 'side',
      title: '始まりの町的寒暄禮儀',
      desc: '在村莊中以自然得體的日語與居民完成 4 次互動對話。',
      targetType: 'npc_talk',
      targetId: null,
      targetCount: 4,
      reward: { exp: 120, gold: 160, itemId: 'con_herb' }
    },
    {
      id: 'q_side_3',
      category: 'side',
      title: '言靈鍛造工坊的學徒',
      desc: '在背包（裝備詳情）或城鎮旅人商會「鍛造強化」分頁中，消耗金幣強化任意裝備達 2 次。',
      targetType: 'enhance_item',
      targetId: null,
      targetCount: 2,
      reward: { exp: 150, gold: 200, itemId: 'con_break_scroll' }
    },
    {
      id: 'q_side_4',
      category: 'side',
      title: '試煉神社的初次奉納',
      desc: '在試煉神社中完成 1 次限時言靈試煉挑戰（不限難度階級）。',
      targetType: 'complete_shrine',
      targetId: null,
      targetCount: 1,
      reward: { exp: 200, gold: 260, itemId: 'con_fever_charm' }
    },
    {
      id: 'q_side_5',
      category: 'side',
      title: '進階言靈使的覺醒',
      desc: '持續歷練戰鬥與讀解，將角色等級提升至 Lv.10。',
      targetType: 'reach_level',
      targetId: null,
      targetCount: 10,
      reward: { exp: 280, gold: 400, itemId: 'ac_shrine_bell' }
    },

    /* --- 每日任務 (4) --- */
    {
      id: 'q_daily_1',
      category: 'daily',
      title: '每日巡邏：驅散雜音',
      desc: '於任意區域擊敗魔物並取得 3 場戰鬥勝利。',
      targetType: 'win_battles',
      targetId: null,
      targetCount: 3,
      reward: { exp: 80, gold: 110, itemId: 'con_herb' }
    },
    {
      id: 'q_daily_2',
      category: 'daily',
      title: '每日精進：十題連貫',
      desc: '在戰鬥或試煉中累計正確回答 10 道日語題目。',
      targetType: 'correct_answers',
      targetId: null,
      targetCount: 10,
      reward: { exp: 95, gold: 125, itemId: 'con_water' }
    },
    {
      id: 'q_daily_3',
      category: 'daily',
      title: '每日專注：喚醒 FEVER',
      desc: '在戰鬥中累積連擊或使用護符，成功觸發 1 次 FEVER 專注狀態。',
      targetType: 'reach_fever',
      targetId: null,
      targetCount: 1,
      reward: { exp: 85, gold: 120, itemId: 'con_break_scroll' }
    },
    {
      id: 'q_daily_4',
      category: 'daily',
      title: '每日問候：溫故知新',
      desc: '回到村莊向居民問候並完成 2 次日語情境對話。',
      targetType: 'npc_talk',
      targetId: null,
      targetCount: 2,
      reward: { exp: 70, gold: 100, itemId: null }
    }
  ];

  /* ==========================================================================
   * 12 個可解鎖成就徽章
   * ========================================================================== */
  const ACHIEVEMENTS = [
    {
      id: 'ach_first_blood',
      name: '言靈初陣',
      icon: 'sword',
      desc: '累計贏得 5 場言靈戰鬥勝利。',
      checkType: 'battlesWon',
      target: 5,
      reward: { gold: 120, sp: 1, title: '初陣劍士' }
    },
    {
      id: 'ach_scholar_path',
      name: '博學篤行',
      icon: 'book',
      desc: '累計正確解答 30 道日語題目。',
      checkType: 'totalCorrect',
      target: 30,
      reward: { gold: 180, sp: 1, title: '言靈求道者' }
    },
    {
      id: 'ach_combo_master',
      name: '連韻不絕',
      icon: 'flame',
      desc: '達成 10 次以上最高連續答對（Combo）。',
      checkType: 'maxCombo',
      target: 10,
      reward: { gold: 240, sp: 1, title: '連擊詠唱師' }
    },
    {
      id: 'ach_boss_slayer',
      name: '六域制霸者',
      icon: 'crown',
      desc: '擊敗全部 6 大區域的守關首領。',
      checkType: 'bossesDefeated',
      target: 6,
      reward: { gold: 800, sp: 3, title: '言靈聖域之主' }
    },
    {
      id: 'ach_fever_soul',
      name: '心流熾焰',
      icon: 'bolt',
      desc: '在戰鬥中累計觸發 3 次 FEVER 專注模式。',
      checkType: 'feverCount',
      target: 3,
      reward: { gold: 180, sp: 1, title: '心流掌控者' }
    },
    {
      id: 'ach_archive_sage',
      name: '古籍讀破賢者',
      icon: 'scroll',
      desc: '完美通關 5 座以上長文閱讀地下城。',
      checkType: 'readingCleared',
      target: 5,
      reward: { gold: 550, sp: 2, title: '長文賢者' }
    },
    {
      id: 'ach_shrine_legend',
      name: '神域 S 級皆傳',
      icon: 'torii',
      desc: '於試煉神社限時挑戰中獲得 S 級評價。',
      checkType: 'shrineRankS',
      target: 1,
      reward: { gold: 420, sp: 2, title: '試煉神速使' }
    },
    {
      id: 'ach_beloved_hero',
      name: '人望如春風',
      icon: 'heart',
      desc: '與任一位村莊 NPC 的好感度達到 100。',
      checkType: 'maxAffection',
      target: 100,
      reward: { gold: 350, sp: 2, title: '知禮達人' }
    },
    {
      id: 'ach_level_master',
      name: '登峰造極',
      icon: 'star',
      desc: '將冒險者等級提升至 Lv.15。',
      checkType: 'level',
      target: 15,
      reward: { gold: 450, sp: 2, title: '高階言靈師' }
    },
    {
      id: 'ach_wealthy_traveler',
      name: '滿載行囊',
      icon: 'coin',
      desc: '冒險途中累計賺取 3,000 枚以上金幣。',
      checkType: 'goldEarned',
      target: 3000,
      reward: { gold: 300, sp: 1, title: '豐饒旅者' }
    },
    {
      id: 'ach_collector',
      name: '秘寶收藏家',
      icon: 'gem',
      desc: '累計收藏 10 種以上不同裝備或道具。',
      checkType: 'itemsOwned',
      target: 10,
      reward: { gold: 260, sp: 1, title: '言靈鑑定師' }
    },
    {
      id: 'ach_shield_breaker',
      name: '破盾真言',
      icon: 'shield',
      desc: '在戰鬥中累計觸發 8 次敵人 BREAK 破防。',
      checkType: 'breaksTriggered',
      target: 8,
      reward: { gold: 220, sp: 1, title: '破邪斬護手' }
    }
  ];

  /* ==========================================================================
   * 試煉神社 4 階限時挑戰
   * ========================================================================== */
  const SHRINE_TIERS = [
    {
      id: 'shrine_n4',
      name: '初傳試煉（N4 基礎鞏固）',
      desc: '精選 N4 等級的生活詞彙、助詞辨析與日常動詞活用，適合檢驗紮實基本功。',
      jlpt: 'N4',
      jlpts: ['N4'],
      regions: ['r1', 'r2', 'r3'],
      timeLimitSec: 180,
      rewardTitle: '初傳・言靈見習',
      rewardItemId: 'ar_festival_haori',
      baseGold: 180,
      baseExp: 160
    },
    {
      id: 'shrine_n3',
      name: '中傳試煉（N3 實戰特訓）',
      desc: '鎖定 N3 核心題庫，考驗複合動詞、接續邏輯與自他動詞辨析的速度與準度。',
      jlpt: 'N3',
      jlpts: ['N3'],
      regions: ['r1', 'r2', 'r3', 'r4', 'r5'],
      timeLimitSec: 165,
      rewardTitle: '中傳・文脈解析師',
      rewardItemId: 'ac_context_lens',
      baseGold: 320,
      baseExp: 300
    },
    {
      id: 'shrine_n2n1',
      name: '奧傳試煉（N2–N1 思索聖域）',
      desc: '直面 N2 至 N1 的高難度敬語、新聞書面語與細微褒貶語感，極致燒腦！',
      jlpt: 'N2–N1',
      jlpts: ['N2', 'N1'],
      regions: ['r4', 'r5', 'r6'],
      timeLimitSec: 150,
      rewardTitle: '奧傳・思索大師',
      rewardItemId: 'ac_sanctuary_crown',
      baseGold: 550,
      baseExp: 520
    },
    {
      id: 'shrine_all',
      name: '皆傳總合試煉（全大陸 N4–N1）',
      desc: '自六大區域隨機抽取 N4 至 N1 全方位題型，在 180 秒內衝刺最高正確率與連擊，爭奪「言靈之王」稱號！',
      jlpt: 'N4–N1',
      jlpts: ['N4', 'N3', 'N2', 'N1'],
      regions: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
      timeLimitSec: 180,
      rewardTitle: '皆傳・言靈之王',
      rewardItemId: 'ac_kotodama_heart',
      baseGold: 800,
      baseExp: 850
    }
  ];

  /* 為陣列集合掛載不可列舉的 ID 快捷查詢屬性，同時 100% 維持純陣列遍歷行為 */
  function attachIdLookup(arr) {
    for (let i = 0; i < arr.length; i++) {
      const entry = arr[i];
      if (entry && entry.id && !(entry.id in arr)) {
        Object.defineProperty(arr, entry.id, {
          value: entry,
          enumerable: false,
          configurable: false,
          writable: false
        });
      }
    }
    return arr;
  }

  attachIdLookup(REGIONS);
  attachIdLookup(SKILLS);
  attachIdLookup(READING_DUNGEONS);
  attachIdLookup(QUESTS);
  attachIdLookup(ACHIEVEMENTS);
  attachIdLookup(SHRINE_TIERS);

  window.GAME_DATA = {
    VERSION: 1,
    JOBS,
    REGIONS,
    ENEMIES,
    SKILLS,
    ITEMS,
    NPCS,
    QUESTIONS,
    READING_DUNGEONS,
    QUESTS,
    ACHIEVEMENTS,
    SHRINE_TIERS
  };
})();
