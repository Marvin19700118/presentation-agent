document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-brainstorm');
    const stepInput = document.getElementById('step-input');
    const stepProcess = document.getElementById('step-process');
    const stepHistory = document.getElementById('step-history');
    const historyList = document.getElementById('history-list');
    const historyTab = document.getElementById('history-tab');
    const warRoom = document.getElementById('warRoom');
    const agentListItems = document.querySelectorAll('.agent-item');
    const finalActions = document.getElementById('finalActions');

    let brainStormHistory = "";
    let currentSessionMessages = []; // To store messages for history

    const agents = [
        { id: 'strategist', name: '戰略顧問', role: 'Strategy Expert', icon: '🎯', color: '#4f46e5' },
        { id: 'storyteller', name: '敘事架構師', role: 'Structure & Narrative', icon: '📜', color: '#7c3aed' },
        { id: 'researcher', name: '市場研究員', role: 'Data & Industry', icon: '🔍', color: '#06b6d4' },
        { id: 'critic', name: '終極批判者', role: 'Devil\'s Advocate', icon: '⚖️', color: '#ef4444' },
        { id: 'copywriter', name: '文案精煉師', role: 'Punchy Headlines', icon: '✒️', color: '#f59e0b' },
        { id: 'designer', name: '視覺創意總監', role: 'Visual Identity', icon: '🎨', color: '#ec4899' }
    ];

    // --- History Logic ---
    function saveSession(topic, audience, messages, fullHistoryText, deck = null) {
        const history = JSON.parse(localStorage.getItem('agent_deck_history') || '[]');
        const newEntry = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            topic,
            audience,
            messages,
            fullHistoryText,
            deck
        };
        history.unshift(newEntry);
        localStorage.setItem('agent_deck_history', JSON.stringify(history));
    }

    function renderHistoryList() {
        const history = JSON.parse(localStorage.getItem('agent_deck_history') || '[]');
        historyList.innerHTML = '';

        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align:center; color:var(--text-secondary);">尚無歷史紀錄</p>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div class="info">
                    <h4>${item.topic}</h4>
                    <p>${item.date} | 受眾：${item.audience}</p>
                </div>
                <button class="delete-history" data-id="${item.id}">🗑️</button>
            `;
            div.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-history')) {
                    restoreSession(item);
                }
            });
            historyList.appendChild(div);
        });

        document.querySelectorAll('.delete-history').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistory(btn.dataset.id);
            });
        });
    }

    function deleteHistory(id) {
        let history = JSON.parse(localStorage.getItem('agent_deck_history') || '[]');
        history = history.filter(item => item.id != id);
        localStorage.setItem('agent_deck_history', JSON.stringify(history));
        renderHistoryList();
    }

    function restoreSession(item) {
        // 隱藏所有視圖
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));

        // 還原輸入與全域狀態
        document.getElementById('topic').value = item.topic;
        document.getElementById('audience').value = item.audience;
        brainStormHistory = item.fullHistoryText || "";
        currentSessionMessages = item.messages;

        // 1. 還原戰情室 (腦力激盪過程)
        warRoom.innerHTML = '';
        stepProcess.classList.remove('hidden');
        item.messages.forEach(msg => {
            addMessageToRoom({ name: msg.name, role: msg.role, icon: msg.icon, color: msg.color }, msg.content);
        });

        // 2. 還原簡報結果 (如果有的話)
        if (item.deck) {
            renderFinalDeck(item.deck);
            document.getElementById('step-final').classList.remove('hidden');
            // 滾動到最下方的簡報結果
            setTimeout(() => {
                document.getElementById('step-final').scrollIntoView({ behavior: 'smooth' });
            }, 300);
        }

        // 3. 更新側邊欄狀態
        agents.forEach(agent => updateSidebarStatus(agent.id, 'completed'));

        finalActions.classList.remove('hidden');
        document.getElementById('process-subtitle').textContent = '已還原歷史紀錄：包含討論過程與簡報結果。';
    }

    function openHistory() {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        stepHistory.classList.remove('hidden');
        renderHistoryList();
        updateActiveTab(historyTab);
    }

    function openHome() {
        document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
        stepInput.classList.remove('hidden');
        updateActiveTab(homeTab);
    }

    function updateActiveTab(activeElem) {
        document.querySelectorAll('.agent-item').forEach(item => item.classList.remove('active'));
        activeElem.classList.add('active');
    }

    const homeTab = document.getElementById('home-tab');
    homeTab.addEventListener('click', openHome);
    historyTab.addEventListener('click', openHistory);

    const showHistoryMain = document.getElementById('show-history-main');
    if (showHistoryMain) {
        showHistoryMain.addEventListener('click', openHistory);
    }

    // --- Main Workflow ---
    startBtn.addEventListener('click', async () => {
        const topic = document.getElementById('topic').value.trim();
        const audience = document.getElementById('audience').value.trim();

        if (!topic || !audience) {
            alert('請填寫完整的主題與受眾資訊！');
            return;
        }

        stepInput.classList.add('hidden');
        stepProcess.classList.remove('hidden');
        currentSessionMessages = [];
        await runAgentWorkflow(topic, audience);
    });

    async function runAgentWorkflow(topic, audience) {
        brainStormHistory = "";
        for (let i = 0; i < agents.length; i++) {
            const agent = agents[i];
            updateSidebarStatus(agent.id, 'active');
            try {
                const response = await fetch('/api/agent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: agent.id,
                        agent_name: agent.name,
                        agent_role: agent.role,
                        topic, audience, history: brainStormHistory
                    })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);

                addMessageToRoom(agent, data.content);
                currentSessionMessages.push({ ...agent, content: data.content });
                brainStormHistory += `\n\n[${agent.name}]: ${data.content}`;
            } catch (error) {
                addMessageToRoom(agent, "錯誤：" + error.message);
            }
            updateSidebarStatus(agent.id, 'completed');
            warRoom.scrollTop = warRoom.scrollHeight;
        }

        // Result Save (captures full discussion)
        saveSession(topic, audience, currentSessionMessages, brainStormHistory);

        finalActions.classList.remove('hidden');
        document.getElementById('process-subtitle').textContent = '腦力激盪已完成，點擊下方按鈕製作簡報。';
    }

    // Presentation Config
    const prepBtn = document.getElementById('prep-presentation-btn');
    const stepConfig = document.getElementById('step-config');
    const durationInput = document.getElementById('duration');
    const slidesInput = document.getElementById('slides');

    durationInput.addEventListener('input', () => {
        slidesInput.value = Math.max(1, Math.round(durationInput.value / 2));
    });

    prepBtn.addEventListener('click', () => {
        stepProcess.classList.add('hidden');
        stepConfig.classList.remove('hidden');
    });

    // Final Generation
    const generateFinalBtn = document.getElementById('generate-final-btn');
    const stepFinal = document.getElementById('step-final');
    const deckContainer = document.getElementById('final-deck-container');

    generateFinalBtn.addEventListener('click', async () => {
        const topic = document.getElementById('topic').value;
        const audience = document.getElementById('audience').value;
        generateFinalBtn.disabled = true;
        generateFinalBtn.textContent = '規劃中...';
        try {
            const response = await fetch('/api/final_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic, audience, history: brainStormHistory,
                    duration: durationInput.value, slides_count: slidesInput.value
                })
            });
            const data = await response.json();
            const deck = JSON.parse(data.deck);
            renderFinalDeck(deck);

            // Update latest history entry with the deck
            updateLatestHistoryWithDeck(deck);

            stepConfig.classList.add('hidden');
            stepFinal.classList.remove('hidden');
        } catch (error) {
            alert('失敗：' + error.message);
        } finally {
            generateFinalBtn.disabled = false;
            generateFinalBtn.textContent = '產出完整簡報內容 🚀';
        }
    });

    function updateLatestHistoryWithDeck(deck) {
        let history = JSON.parse(localStorage.getItem('agent_deck_history') || '[]');
        if (history.length > 0) {
            history[0].deck = deck;
            localStorage.setItem('agent_deck_history', JSON.stringify(history));
        }
    }

    function renderFinalDeck(deck) {
        deckContainer.innerHTML = '';
        deck.forEach(slide => {
            const card = document.createElement('div');
            card.className = 'slide-card';
            card.innerHTML = `
                <div class="slide-number">${slide.page}</div>
                <h3>P.${slide.page} ${slide.title}</h3>
                <div class="slide-content">${slide.content}</div>
            `;
            deckContainer.appendChild(card);
        });
    }

    function addMessageToRoom(agent, content) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'agent-message';
        msgDiv.innerHTML = `
            <div class="agent-msg-icon" style="background-color: ${agent.color}">${agent.icon}</div>
            <div class="agent-msg-content">
                <div class="agent-msg-header">
                    <span class="name">${agent.name}</span>
                    <span class="role">${agent.role}</span>
                </div>
                <div class="agent-msg-body">${content}</div>
            </div>
        `;
        warRoom.appendChild(msgDiv);
    }

    function updateSidebarStatus(agentId, status) {
        agentListItems.forEach(item => {
            if (item.dataset.agent === agentId) {
                item.classList.remove('active', 'completed');
                item.classList.add(status);
            }
        });
    }

    // Export Options
    const exportMdBtn = document.getElementById('export-md-btn');
    const exportGsBtn = document.getElementById('export-gs-btn');

    exportMdBtn.addEventListener('click', () => {
        const topic = document.getElementById('topic').value.trim();
        const slides = document.querySelectorAll('.slide-card');
        let exportContent = `# AgentDeck 完整簡報計畫書\n\n## 核心背景\n- **主題**：${topic}\n- **演講時長**：${durationInput.value} 分鐘\n\n---\n\n`;
        slides.forEach(card => {
            const title = card.querySelector('h3').textContent;
            const content = card.querySelector('.slide-content').textContent;
            exportContent += `## ${title}\n${content}\n\n`;
        });
        downloadFile(exportContent, `AgentDeck_Final_${new Date().getTime()}.md`);
    });

    exportGsBtn.addEventListener('click', () => {
        const topic = document.getElementById('topic').value.trim();
        const slides = document.querySelectorAll('.slide-card');

        let pptx = new PptxGenJS();
        let slide = pptx.addSlide();
        slide.background = { color: "0F1219" };
        slide.addText(topic, { x: 0, y: "40%", w: "100%", align: "center", fontSize: 36, color: "FFFFFF", bold: true });
        slide.addText("AgentDeck AI 簡報生成", { x: 0, y: "55%", w: "100%", align: "center", fontSize: 18, color: "94A3B8" });

        slides.forEach(card => {
            const title = card.querySelector('h3').textContent.replace(/^P\.\d+\s/, "");
            const content = card.querySelector('.slide-content').textContent;
            let newSlide = pptx.addSlide();
            newSlide.background = { color: "0F1219" };
            newSlide.addText(title, { x: 0.5, y: 0.5, w: "90%", fontSize: 28, color: "4F46E5", bold: true });
            newSlide.addText(content, { x: 0.5, y: 1.5, w: "90%", h: "70%", fontSize: 14, color: "E2E8F0", valign: "top", lineSpacing: 24, breakLine: true });
        });

        pptx.writeFile({ fileName: `AgentDeck_${topic}_${new Date().getTime()}.pptx` })
            .then(() => { alert('簡報下載完成！您可以直接上傳至 Google Slides 使用。'); });
    });

    function downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    document.querySelectorAll('.agent-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        });
    });
});
