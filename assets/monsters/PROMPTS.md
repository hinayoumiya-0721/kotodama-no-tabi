# 《言霊の旅》怪物立繪生成提示詞（18 隻）

目標：讓怪物和 `assets/portraits/` 的 7 張角色頭像有**同樣的畫風與精緻度**。
做好的圖放進 `assets/monsters/`，檔名照下表，我會用跟角色頭像一樣的方式接進遊戲。

---

## 一、交付規格

| 項目 | 規格 |
|---|---|
| 尺寸 | **512×512**（與角色頭像相同） |
| 格式 | **WebP**（或 PNG，我再轉檔），**透明背景** |
| 構圖 | **全身或 3/4 身**，角色置中，四周留約 8% 空白，不要被切到 |
| 朝向 | **面朝左方**（戰鬥時怪物在右邊，要面向左邊的主角） |
| 背景 | 完全透明，不要地面、陰影、邊框或文字 |
| 檔名 | 用下表的 `檔名` 欄，例如 `en_r1_slime.webp` |

---

## 二、共用畫風（每一張都貼在最前面）

> 先貼這段，再接各怪物自己的描述。

```
16-bit SNES-era JRPG pixel art sprite, hand-drawn pixel art, chunky visible pixels
(approx. 64x64 pixel grid upscaled to 512x512 with nearest-neighbor),
thick solid near-black outline (#1a1018) around the whole silhouette,
3-tone cel shading per material (highlight / base / shadow), light source from the top-left,
warm saturated palette, no dithering, no anti-aliasing, no blur, no gradients,
full-body monster facing LEFT, centered, transparent background, no ground, no shadow, no text, no frame.
Same art style as the attached character portraits.
```

**一定要附上參考圖**：把 `assets/portraits/` 裡的 `hero_swordsman.webp`、`npc_mayor.webp`、`npc_merchant.webp` 一起上傳當風格參考。這是讓畫風一致最有效的方法。

---

## 三、18 隻怪物

> 世界觀：語言崩壞後，錯誤的日文化成魔物。每隻怪物的外型都帶著它「代表的日文錯誤」，這是設計重點。
> 一般怪可以可愛或滑稽一點；首領要有壓迫感、體型大、細節多。

### 區域 1｜始まりの町（石砌小鎮・N4 生活語境・暖色調）

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r1_slime.webp` | 濁音史萊姆 | 單字讀音 |
```
A cute but mischievous purple-grey slime monster made of murky mist, with floating dakuten marks (゛) and handakuten (゜) bubbling on its body like drops, wobbly jelly body, big dumb eyes, a wide grin.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r1_crow.webp` | 墨羽烏鴉 | 助詞填空 |
```
A cunning black crow with glossy ink-black feathers that drip like calligraphy ink, carrying a torn notebook page in its beak with hiragana particles "は" "が" "を" falling out, sly yellow eyes, perched pose with wings half-spread.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `boss_r1_golem.webp` | 石碑巨像・初音守（首領） | 單字讀音 |
```
BOSS. A towering ancient stone golem made of a moss-covered stone stele, large engraved kanji glowing teal on its chest and arms, glowing teal eye slits, cracked granite body with vines, massive fists, guardian of the town gate, imposing and heavy, fills most of the frame.
```

### 區域 2｜基礎の領地（石橋與溪谷・N4–N2 助詞句型・藍灰色調）

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r2_wisp.webp` | 青火助詞靈 | 助詞填空 |
```
A floating will-o'-the-wisp spirit of pale blue flame, its flame shaped like the hiragana "に" and "で" swirling around a small mischievous face, wispy tail, faint blue glow particles.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r2_wolf.webp` | 語序荒狼 | 句子重組 |
```
A large feral grey wolf with ragged fur, sentence fragments written on torn paper strips caught in its jaws and stuck in its fur, glowing amber eyes, snarling, crouched ready to pounce.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `boss_r2_knight.webp` | 助詞鐵騎・繋ぎの騎士（首領） | 助詞填空 |
```
BOSS. A heavy armored knight in dark iron plate armor whose plates are linked together by glowing chains, each chain link engraved with particles "は" "が" "を" "に" "で", tall helmet with a single glowing visor slit, huge greatsword, tattered blue cape, stern and imposing, fills most of the frame.
```

### 區域 3｜日常の都（暮色古都・N4–N2 活用會話・紅橙燈籠色調）

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r3_tanuki.webp` | 化形狸妖 | 動詞活用 |
```
A mischievous shapeshifting tanuki yokai with a leaf on its head, round belly, holding a merchant's abacus, half of its body transforming into puffs of smoke, playful smug expression, Japanese folklore style.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r3_puppet.webp` | 失禮絡繰人偶 | 不自然表達 |
```
A creepy karakuri wooden puppet doll in a faded kimono, visible brass gears and loose strings, jaw hanging open as if speaking rudely, mismatched painted face, one arm jerking at an odd angle, theater stage puppet.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `boss_r3_kabuki.webp` | 千面歌舞伎・活用幻師（首領） | 動詞活用 |
```
BOSS. A flamboyant kabuki performer with bold red-and-white kumadori face paint, wild long white lion mane, ornate layered kimono, holding several floating kabuki masks with different expressions orbiting around him, dramatic mie pose, red paper lanterns glow motif, fills most of the frame.
```

### 區域 4｜文脈の峡谷（紫霧峽谷・N3–N1 進階文脈・紫色調）

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r4_harpy.webp` | 斷章風妖 | 句子重組 |
```
A harpy wind spirit with purple-grey feathered wings and talons, tearing a long paper scroll into fluttering fragments, wild hair blown by wind, sharp grin, mid-flight pose.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r4_gargoyle.webp` | 誤讀石像鬼 | 不自然表達 |
```
A black stone gargoyle crouching on a broken rock pillar, small bat wings, horns, cracked dark stone skin with misread kanji carved into it, sly squinting glowing purple eyes.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `boss_r4_serpent.webp` | 文脈大蛇・言の葉の龍（首領） | 句子重組 |
```
BOSS. A colossal coiling eastern serpent dragon with blue-green scales, its long body made of intertwining lines of flowing text and leaves (kotonoha), purple mist around its coils, glowing gold eyes, open jaws with fangs, majestic and menacing, fills most of the frame.
```

### 區域 5｜思索の城塞（雲上書庫要塞・N3–N1 長文敬語・藍與金色調）

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r5_automaton.webp` | 禮法機關兵 | 動詞活用 |
```
A mechanical automaton guard soldier in sleek blue-and-brass armor, clockwork joints, a glowing etiquette rulebook built into its chest, holding a spear, rigid formal stance, single glowing eye lens.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r5_phantom.webp` | 類義幽影 | 不自然表達 |
```
A semi-transparent ghostly phantom drifting between library bookshelves, pale cyan translucent body, two nearly identical faces overlapping (representing confusing synonyms), long trailing robes made of book pages.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `boss_r5_chancellor.webp` | 思索宰相・敬語の審判者（首領） | 不自然表達 |
```
BOSS. A cold, elegant chancellor in formal dark-blue court robes with gold embroidery, tall court hat, monocle, holding golden scales of judgment in one hand and a thick law codex in the other, floating stacks of books behind him, stern calculating expression, fills most of the frame.
```

### 區域 6｜言霊の聖域（天穹聖殿・N2–N1 高階語感・緋紅與黑金色調）

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r6_archon.webp` | 慣用句執政官 | 單字讀音 |
```
An ancient language spirit archon in flowing crimson ceremonial robes, golden halo of rare kanji characters orbiting its head, solemn masked face, holding a ceremonial staff, dignified and mysterious.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `en_r6_voidling.webp` | 語感虛無獸 | 不自然表達 |
```
A shadowy void beast born from a crack in meaning, black-violet body with shifting edges, multiple glowing eyes, cracks of light running across its body, low prowling stance, eerie and unsettling.
```

| 檔名 | 名稱 | 弱點 |
|---|---|---|
| `boss_r6_overlord.webp` | 沈默魔王・無言の覇者（最終首領） | 不自然表達 |
```
FINAL BOSS. The Silent Demon Lord who wants to erase all language: towering dark armored overlord with a long black cape, his mouth sealed by an ornate metal mask with no mouth, hollow glowing white eyes, broken letters and kana dissolving into dust around him, crown of black thorns, overwhelming presence, fills most of the frame.
```

---

## 四、讓 18 張畫風一致的小技巧

1. **先做一張當樣板**：建議先做 `en_r1_slime.webp`。滿意後，之後每張都把**角色頭像＋這張史萊姆**一起當參考圖上傳。
2. **共用畫風那段一字不改**，只換後面的怪物描述。
3. **檢查清單**（每張生成後看一下）：
   - 背景有沒有真的透明（不是白底或棋盤格圖案）
   - 有沒有面向左邊
   - 外框是不是粗黑線、像素顆粒看得清楚（不是糊糊的插畫）
   - 身體有沒有被畫面切到
4. 不用一次做完。先給我幾張，我就可以先接進遊戲，其他還沒做的怪物會繼續用現在的圖。

---

## 五、之後我會怎麼接進遊戲（供參考）

- 跟角色頭像一樣，用對照表把 `敵人 id → assets/monsters/<id>.webp` 對起來；有圖的用圖，沒圖的維持現在的畫法。
- 精英怪（「精英・XXX」）沿用一般怪的圖，再加上紅色光暈，所以不用另外畫。
- 受擊、破防等動畫套在整張圖上，不需要額外的動作差分圖。
