import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini
api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-2.0-flash')

@app.route('/api/agent', methods=['POST'])
def run_agent():
    # ... (existing code remains same)
    data = request.json
    agent_id = data.get('agent_id')
    agent_name = data.get('agent_name')
    agent_role = data.get('agent_role')
    topic = data.get('topic')
    audience = data.get('audience')
    history = data.get('history', "")

    prompt = f"""
    你現在是一位專業的簡報諮詢代理人：{agent_name} ({agent_role})。
    這是一場腦力激盪會議，目標是為以下主題產生完美的商業簡報。

    【簡報主題摘要】: {topic}
    【受眾特質分析】: {audience}

    【目前的會議紀錄與進度】:
    {history}

    請根據你的專業（{agent_role}），針對上述資訊給出你的具體建議、內容架構或是對前人的批判。
    請用繁體中文回覆，語氣要符合專業職位，直接切入核心重點。
    """

    try:
        response = model.generate_content(prompt)
        return jsonify({
            "content": response.text,
            "agent_id": agent_id
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/final_report', methods=['POST'])
def generate_final():
    data = request.json
    topic = data.get('topic')
    audience = data.get('audience')
    history = data.get('history')
    duration = data.get('duration')
    slides_count = data.get('slides_count')

    prompt = f"""
    你是首席簡報架構師。我們剛完成了一場關於《{topic}》的腦力激盪，受眾是《{audience}》。
    
    【會議紀錄總結】:
    {history}

    任務：將上述所有建議與批判，轉化為一份正式的簡報大綱。
    規格要求：
    1. 總時長：{duration} 分鐘。
    2. 總頁數：{slides_count} 頁。
    3. 每一頁必須包含：[頁數]、[標題]、[內容詳細說明]。
    4. 內容要吸取會議紀錄中「市場研究員」的數據、「批判者」的警告以及「敘事師」的大綱。
    
    輸出格式：請以 JSON 陣列格式輸出，每項包含 "page", "title", "content"。不要輸出 JSON 以外的任何文字。
    範例：
    [
      {{"page": 1, "title": "...", "content": "..."}},
      ...
    ]
    """

    try:
        response = model.generate_content(prompt)
        # Clean potential markdown block markers from Gemini
        text = response.text.replace("```json", "").replace("```", "").strip()
        return jsonify({"deck": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
