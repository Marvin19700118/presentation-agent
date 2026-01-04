# AgentDeck - Multi-Agent Brainstorming Web App

這是一個利用 **Multi-Agent Architecture (多代理人架構)** 設計的跨時代簡報腦力激盪工具原型。

## 核心特色
1.  **Context-First (背景優先)**：系統強制要求使用者輸入「受眾特質」與「主題摘要」，確保產出的內容具有針對性。
2.  **多代理人協作系統**：內建 6 個專業開發角色：
    -   **戰略顧問 (Strategist)**：定義簡報成功的關鍵。
    -   **敘事架構師 (Storyteller)**：規劃具說服力的 10 頁故事線。
    -   **市場研究員 (Researcher)**：補充市場數據與行業洞察。
    -   **終極批判者 (Critic)**：從受眾視角進行壓力測試。
    -   **文案精煉師 (Copywriter)**：優化標題與內容張力。
    -   **視覺創意總監 (Designer)**：設計視覺風格與排版建議。
3.  **沉浸式 UI 體驗**：使用 Dark Mode 與 Glassmorphism (玻璃擬態) 設計，營造科技顧問公司的專業感。

## 如何啟動 (實戰版)
### 1. 設定 API Key
請在專案目錄下找到 `.env` 檔案，將 `YOUR_GEMINI_API_KEY_HERE` 替換為您從 [Google AI Studio](https://aistudio.google.com/app/apikey) 申請的 Key。

### 2. 安裝相依套件
在終端機執行：
```powershell
pip install -r requirements.txt
```

### 3. 啟動後端伺服器 (Gemini 串接)
```powershell
python server.py
```
伺服器將運行在 `http://localhost:5000`。

### 4. 啟動前端介面
您可以直接開啟 `index.html`，或是啟動另一個簡單的伺服器：
```powershell
python -m http.server 8000
```
現在訪問 `http://localhost:8000` 即可開始與真實的 Gemini Agent 團隊進行腦力激盪。
