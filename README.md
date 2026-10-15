# 軌跡 ORBIT — 地月觀測站

以 Three.js 0.170.0 製作的繁體中文互動式 3D 地月模擬網站。

## 開啟

本專案為純靜態網站，不需 npm install 或 build；所有 Three.js 與紋理均已內含，不依賴外部 CDN。需要支援 WebGL 2 的現代瀏覽器。

本機預覽（需 Python 3）：

```sh
python3 -m http.server 8788 --bind 127.0.0.1
```

開啟 http://localhost:8788/。不要直接雙擊 index.html：ES modules 與圖片需透過 HTTP 存取。

部署到正式網站伺服器時，將 `index.html`、`style.css`、`app.js`、`assets/`、`vendor/` 保持相對目錄結構放入 Nginx／Apache／Caddy 等靜態主機，並保留 `vendor/LICENSE`；伺服器須正確提供 JavaScript MIME type。詳細 Windows 本機啟動方式見 `部署說明.txt`。

## 操作

- 左鍵拖曳：環繞觀察；滾輪：縮放；右鍵拖曳：平移。
- 觸控：單指旋轉、雙指縮放／平移。
- 視角：地月系統、日地全景、近看月球。
- 底部：播放／暫停、一年時間軸、時間流速、時間歸零。
- 空白鍵：播放／暫停（操作表單或開啟說明時不攔截）。
- 右側：切換軌道、天體標籤、地球雲層。
- 右下：重設視角、全螢幕（嵌入式預覽是否支援取決於宿主權限）。
- 遵循 prefers-reduced-motion：偏好減少動畫時預設暫停。

## 模型邊界

- 地球繞日 365.25 天，地球恆星自轉 0.99726968 天。
- 月球繞地、自轉 27.3217 天，同步自轉。
- 地軸傾角 23.44°，月球軌道傾角 5.145°。
- 地月半徑比接近真實；地月距離、日地距離、太陽大小經縮放。
- 圓形軌道近似；忽略橢圓軌道、攝動、歲差、日月食。
- 起始時間為任意模擬零點，不是即時天文星曆。
- 月相與照亮比例由縮放後模型的日地月幾何計算，適合互動示意，不供科學預報。
- 面板 384,400 km 是真實平均距離常數，不是目前 3D 座標的距離。

## 檔案

- `index.html`：介面與說明。
- `style.css`：桌機與手機版樣式。
- `app.js`：Three.js 場景、軌道、月相、互動。
- `vendor/`：本地 Three.js 與 OrbitControls；MIT 授權在 vendor/LICENSE。
- `assets/`：地球、月球與雲層紋理，來源為 three.js examples/textures/planets。
- `verify.py`：Playwright 真實 Chromium 自動化功能測試。
- `test-results.json`：最近執行的測試結果。
- `screenshot-*.png`：測試截圖。

所有網站執行資源均存於本地，不需 npm build，也不依賴外部 CDN。

## 重新驗證

本機已可使用 Python Playwright，測試使用獨立 headless Chromium，不接管個人瀏覽器。

```sh
python verify.py
```

測試涵蓋 WebGL、時間前進／暫停、速度、時間軸、三種視角、開關、重設、滑鼠互動、說明彈窗與手機寬度；全螢幕需要依使用者瀏覽器實際授權操作。
