# 宣傳影片產生器

`index.html` 用 canvas 逐格畫出 30 秒的宣傳影片（1920×1080、30fps），再用瀏覽器內建的 WebCodecs 轉成 H.264＋AAC 的 MP4。畫面素材直接使用遊戲的立繪、圖示與真實題目，配樂在頁面裡即時合成。

## 輸出影片

1. 在專案根目錄啟動本機伺服器：`node tools/serve.js`
2. 用 Chrome 或 Edge 開 <http://127.0.0.1:5173/promo/>，等畫面出現「ready」。
3. 打開開發者工具的 Console，執行：

   ```js
   await renderVideo()
   ```

   約 10～20 秒後，影片會存到 `promo/out/kotodama-promo-30s.mp4`。

## 其他用法

- 只看某一秒的畫面：網址加 `?t=秒數`，例如 `/promo/?t=8.4`。
- 輸出高解析度靜態圖：`await exportStills([8.4, 14.6])`，會存成 `promo/out/still-8_4.png` 等檔案（簡報的配圖就是這樣做的）。
- 畫面的時間軸、文字和配樂都在 `index.html` 裡的 `scene*()` 函式與 `renderAudio()`，修改後重新整理即可預覽。

需要網路載入 Google Fonts 與 mp4-muxer（jsDelivr）。`promo/out/` 不會提交進 git。
