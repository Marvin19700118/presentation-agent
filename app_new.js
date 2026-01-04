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

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

document.querySelectorAll('.agent-item').forEach(item => {
    item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
        }
    });
});
});
