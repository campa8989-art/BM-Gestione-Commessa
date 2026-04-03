/**
 * Gemini 2.5 Pro Assistant Module (via Puter.js)
 * High-performance Cloud AI without API Keys.
 */

class PuterAssistant {
    constructor() {
        this.isReady = false;
        this.currentModel = 'gemini-2.5-pro'; // Upgrade alla versione 2.5 Pro richiesto dall'utente
        this.init();
    }

    async init() {
        console.log("🤖 Inizializzazione Assistente Gemini Pro via Puter...");
        
        // Verifichiamo se l'SDK di Puter è caricato correttamente
        if (typeof puter === 'undefined') {
            console.error("❌ SDK Puter non trovato. Assicurati che lo script sia incluso in index.html.");
            this.updateStatusUI("Errore");
            return;
        }

        this.isReady = true;
        this.updateStatusUI("Pronto");
        console.log("✅ Puter Cloud AI è pronto.");
        
        // Esposizione globale dei metodi necessari alla dashboard
        window.runAIAudit = () => this.runAIAudit();
        window.sendAIExpanded = (text) => this.sendAIExpanded(text);
    }

    updateStatusUI(status) {
        const dot = document.getElementById('ai-pulse');
        if (dot) {
            if (status === "Pronto") dot.style.background = "#3b82f6"; // Blue per Cloud AI
            else if (status === "Errore") dot.style.background = "#ef4444";
            else dot.style.background = "#f59e0b";
        }
    }

    async ask(userPrompt, contextData = null) {
        if (!this.isReady) {
            return "L'IA non è ancora pronta. Ricarica la pagina o riprova tra poco.";
        }

        let fullPrompt = "";
        if (contextData && contextData.length > 0) {
            const dataStr = JSON.stringify(contextData);
            fullPrompt = `Sei l'assistente IA della Dashboard "Building Manager" per l'ASST FBF Sacco.
                Ti sto fornendo i dati tecnici estratti direttamente dal database del presidio corrente.
                USI ESCLUSIVAMENTE QUESTI DATI PER RISPONDERE. Sii tecnico, preciso e professionale.
                ---
                DATI TECNICI PRESIDIO (Formato JSON):
                ${dataStr}
                ---
                DOMANDA DELL'UTENTE: ${userPrompt}
                ---
                Istruzioni Risposta:
                1. Cita numeri, quantità e scadenze esatte presenti nei dati sopra.
                2. Rispondi in Italiano.
                3. Se l'utente chiede quantità (es. "quanti estintori"), cerca nel campo "Attivita".`;
        } else {
            fullPrompt = userPrompt;
        }

        try {
            console.log(`🤖 Invio richiesta a Puter (${this.currentModel})...`);
            const response = await puter.ai.chat(fullPrompt, { model: this.currentModel });
            return response.toString();
        } catch (e) {
            console.error("❌ Errore critico Puter AI:", e);
            
            // Fallback
            try {
                const fallbackResponse = await puter.ai.chat(fullPrompt);
                return fallbackResponse.toString();
            } catch (err) {
                const errorDetail = err.message || JSON.stringify(err);
                return `🚨 SISTEMA IA NON DISPONIBILE: ${errorDetail}`;
            }
        }
    }

    // --- Sezione Audit Intelligente (Nuova Sezione Centro AI) ---

    // Avvia l'Audit Tecnico tramite Gemini 2.5 Pro
    async runAIAudit() {
        const auditStatus = document.getElementById('ai-audit-status');
        const auditContent = document.getElementById('ai-audit-content');
        const currentSite = window.sites[window.currentSiteId];

        if (!currentSite) return;

        // UI Feedback
        if (auditStatus) {
            auditStatus.innerText = "Analisi in corso...";
            auditStatus.className = "badge-verify syncing";
        }
        
        auditContent.innerHTML = `
            <div class="ai-loading-container" style="text-align: center; width: 100%; padding: 40px;">
                <i class="fas fa-microchip fa-spin fa-3x" style="color: #a855f7; margin-bottom: 20px;"></i>
                <h4>Gemini 2.5 Pro sta analizzando il presidio...</h4>
                <p style="font-size: 13px; opacity: 0.6;">Ottimizzazione dati in corso per analisi profonda.</p>
            </div>
        `;

        // Semplificazione dati per evitare context overload
        const simplifiedTasks = currentSite.tasks
            .filter(t => t.Stato_Documentale !== 'OK' && t.Stato_Documentale !== 'REALE')
            .map(t => ({ sys: t.Sistema, task: t.Attivita, urg: t.Urgency, status: t.Stato_Documentale }));

        const auditContext = {
            id: currentSite.id,
            nome: currentSite.nome,
            stats: {
                totali: currentSite.total,
                ok: currentSite.ok,
                percentuale: Math.round((currentSite.ok / currentSite.total) * 100)
            },
            anomalie: simplifiedTasks.slice(0, 40) // Limitiamo alle prime 40 anomalie per focus
        };

        const systemPrompt = `AGISCI COME AUDITOR TECNICO. RISPONDI ESCLUSIVAMENTE IN FORMATO JSON.
        NON SCRIVERE TESTO INTRODUTTIVO. INIZIA LA RISPOSTA CON '{'.
        
        STRUTTURA JSON:
        {
          "healthScore": 0-100,
          "summary": "Sintesi estrema",
          "findings": [
            {"title": "Titolo", "description": "Dettaglio", "level": "critical|warning|success", "icon": "fas fa-warning"}
          ]
        }`;

        const fullPrompt = `${systemPrompt}\n\nANALIZZA QUESTO SITO E RISPONDI SOLO JSON:\n${JSON.stringify(auditContext)}`;

        let rawResponse = "";
        try {
            // Utilizzo del modello specificato con fallback automatico
            const response = await puter.ai.chat(fullPrompt, { model: 'gemini-2.5-pro' });
            rawResponse = response.toString().trim();
            console.log("🤖 AI Response:", rawResponse);

            const jsonStart = rawResponse.indexOf('{');
            const jsonEnd = rawResponse.lastIndexOf('}');
            
            if (jsonStart === -1) {
                throw new Error("L'IA ha risposto con testo semplice invece di dati JSON. Vedi 'Debug Response' sotto.");
            }

            const jsonStr = rawResponse.substring(jsonStart, jsonEnd + 1);
            const results = JSON.parse(jsonStr);

            this.renderAuditResults(results);
            
            if (auditStatus) {
                auditStatus.innerText = "Audit Completato";
                auditStatus.className = "badge-ok";
            }
        } catch (error) {
            console.error("AI Audit Error:", error);
            auditContent.innerHTML = `
                <div class="error-msg" style="padding: 24px; text-align: center; border-radius: 20px; border: 1px dashed rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05);">
                    <i class="fas fa-bug fa-2x" style="color: #ef4444; margin-bottom: 12px;"></i>
                    <h4 style="margin-bottom: 8px;">Eccezione nell'Audit Intelligente</h4>
                    <p style="font-size: 13px; color: #ef4444; font-weight: 600; margin-bottom: 16px;">${error.message}</p>
                    
                    <div style="text-align: left; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                        <div style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;">Risposta Grezza dell'IA:</div>
                        <div style="font-family: monospace; font-size: 11px; white-space: pre-wrap; max-height: 150px; overflow-y: auto; color: #a8b2d1; border: 1px solid rgba(255,255,255,0.05); padding: 8px;">
                            ${rawResponse || "Nessuna risposta ricevuta dal server Cloud AI."}
                        </div>
                    </div>
                    
                    <button onclick="window.runAIAudit()" class="ai-btn-primary" style="margin: 0 auto; padding: 10px 20px; font-size: 13px;">Riprova Analisi</button>
                </div>
            `;
            if (auditStatus) auditStatus.innerText = "Errore";
        }
    }

    renderAuditResults(data) {
        const auditContent = document.getElementById('ai-audit-content');
        const score = data.healthScore || 0;
        
        let html = `
            <div class="ai-health-header glass-effect" style="grid-column: 1/-1; padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 32px; margin-bottom: 20px; border: 1px solid rgba(168, 85, 247, 0.3); background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), transparent);">
                <div class="health-gauge" style="position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; border: 4px solid rgba(255,255,255,0.05); border-radius: 50%;">
                    <div style="font-size: 28px; font-weight: 800; color: ${score > 70 ? '#10b981' : (score > 40 ? '#f59e0b' : '#ef4444')}">${score}%</div>
                    <svg style="position: absolute; width: 100px; height: 100px; transform: rotate(-90deg);">
                        <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(168, 85, 247, 0.2)" stroke-width="6" />
                        <circle cx="50" cy="50" r="46" fill="none" stroke="${score > 70 ? '#10b981' : (score > 40 ? '#f59e0b' : '#ef4444')}" stroke-width="6" stroke-dasharray="290" stroke-dashoffset="${290 - (290 * score / 100)}" stroke-linecap="round" />
                    </svg>
                </div>
                <div>
                    <h2 style="margin: 0; font-size: 20px;">Indice di Salute del Presidio</h2>
                    <p style="margin: 8px 0 0; color: var(--text-muted); font-size: 14px;">${data.summary}</p>
                </div>
            </div>
        `;

        data.findings.forEach(f => {
            const iconClass = `icon-${f.level}`;
            html += `
                <div class="ai-insight-card">
                    <div class="ai-insight-header">
                        <div class="ai-insight-icon ${iconClass}">
                            <i class="fas ${f.icon}"></i>
                        </div>
                        <h4 style="margin: 0; font-size: 15px;">${f.title}</h4>
                    </div>
                    <p style="font-size: 13px; color: var(--text-muted); line-height: 1.5; margin: 0;">${f.description}</p>
                </div>
            `;
        });

        auditContent.innerHTML = html;
    }

    async sendAIExpanded(text) {
        const messagesEl = document.getElementById('ai-expanded-messages');
        if (!messagesEl) return;

        const userDiv = document.createElement('div');
        userDiv.className = 'ai-message user';
        userDiv.innerText = text;
        messagesEl.appendChild(userDiv);
        messagesEl.scrollTop = messagesEl.scrollHeight;

        try {
            const response = await this.ask(text);
            const aiDiv = document.createElement('div');
            aiDiv.className = 'ai-message ai';
            aiDiv.innerText = response;
            messagesEl.appendChild(aiDiv);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        } catch (err) {
            console.error("Expanded Chat Error:", err);
        }
    }

    // Resetta l'Audit e la visualizzazione dello stato
    resetView() {
        const auditStatus = document.getElementById('ai-audit-status');
        const auditContent = document.getElementById('ai-audit-content');
        
        if (auditStatus) {
            auditStatus.innerText = "Pronto per l'analisi";
            auditStatus.className = "badge-verify";
        }
        
        if (auditContent) {
            auditContent.innerHTML = `
                <div class="ai-placeholder-card glass-effect" style="text-align: center; padding: 60px 40px; border-radius: 20px;">
                    <div class="ai-icon-glow" style="font-size: 48px; color: #a855f7; margin-bottom: 20px;">
                        <i class="fas fa-wand-magic-sparkles"></i>
                    </div>
                    <h3>Gemini è pronto per l'Audit</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px; font-size: 14px;">Entrando in questa sezione, l'IA analizzerà l'entità tecnica del presidio selezionato.</p>
                    <button id="btn-start-audit" onclick="window.runAIAudit()" class="ai-btn-primary" style="margin: 0 auto;">
                        <i class="fas fa-play"></i> Carica Insight Intelligenti
                    </button>
                </div>
            `;
        }
    }
}

// Inizializzazione globale
document.addEventListener('DOMContentLoaded', () => {
    window.puterAssistant = new PuterAssistant();
    window.resetAIAudit = () => window.puterAssistant.resetView(); // Esposizione globale per app.js
});

// UI Handlers (Integrazione con gli elementi grafici della dashboard)
document.addEventListener('DOMContentLoaded', () => {
    const aiBtn = document.getElementById('gemini-fab');
    const aiPanel = document.getElementById('ai-panel');
    const closeAi = document.getElementById('close-ai');
    const sendAi = document.getElementById('send-ai');
    const aiInput = document.getElementById('ai-input');
    const aiMessages = document.getElementById('ai-messages');

    if (aiBtn && aiPanel) {
        aiBtn.onclick = () => {
            aiPanel.classList.add('open');
            aiBtn.style.opacity = "0";
        };

        closeAi.onclick = () => {
            aiPanel.classList.remove('open');
            aiBtn.style.opacity = "1";
        };
    }

    async function handleAiPrompt() {
        const text = aiInput.value.trim();
        if (!text) return;

        const userMsg = appendMessage('user', text);
        aiInput.value = '';
        
        const loader = appendMessage('ai', '<i class="fas fa-spinner fa-spin"></i> Analisi in corso...');
        
        let context = null;
        if (window.currentSiteId && window.sites && window.sites[window.currentSiteId]) {
            context = window.sites[window.currentSiteId].tasks;
        }

        const response = await window.puterAssistant.ask(text, context);
        loader.innerHTML = response;
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }

    if (sendAi) sendAi.onclick = handleAiPrompt;
    if (aiInput) {
        aiInput.onkeypress = (e) => {
            if (e.key === 'Enter') handleAiPrompt();
        };
    }

    function appendMessage(role, text) {
        const msg = document.createElement('div');
        msg.className = `ai-message ${role}`;
        msg.innerHTML = text;
        aiMessages.appendChild(msg);
        aiMessages.scrollTop = aiMessages.scrollHeight;
        return msg;
    }
});
