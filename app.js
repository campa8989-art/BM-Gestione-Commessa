// Building Manager Premium Dashboard - Core Logic
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. Ambiente & Sincronizzazione Dati ---
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:';
    
    // Scegliamo il dataset in base all'ambiente (iniettato da PS)
    window.workspaceData = isLocal ? 
        (typeof workspaceDataLocal !== 'undefined' ? workspaceDataLocal : (typeof workspaceData !== 'undefined' ? workspaceData : [])) : 
        (typeof workspaceDataRemote !== 'undefined' ? workspaceDataRemote : (typeof workspaceData !== 'undefined' ? workspaceData : []));
    
    console.log(`Ambiente rilevato: ${isLocal ? 'LOCALE/OneDrive' : 'REMOTA (GitHub Sync)'}`);
    console.log(`Workspace Data items: ${window.workspaceData ? window.workspaceData.length : 0}`);
    
    // --- 0.1 Offline & Data Persistence ---
    let connectionStatus = document.getElementById('connection-status');
    let statusText = document.getElementById('status-text');

    // Creazione dinamica del badge se non presente nell'HTML
    if (!connectionStatus) {
        const headerInfo = document.querySelector('.header-info');
        const themeBtn = document.getElementById('theme-toggle');
        if (headerInfo && themeBtn) {
            const btnGroup = document.createElement('div');
            btnGroup.style.display = 'flex';
            btnGroup.style.alignItems = 'center';
            btnGroup.style.gap = '12px';
            
            connectionStatus = document.createElement('div');
            connectionStatus.id = 'connection-status';
            connectionStatus.className = 'connection-status';
            connectionStatus.innerHTML = '<div class="status-dot"></div><span id="status-text">Online</span>';
            
            themeBtn.parentNode.insertBefore(btnGroup, themeBtn);
            btnGroup.appendChild(connectionStatus);
            btnGroup.appendChild(themeBtn);
            statusText = document.getElementById('status-text');
        }
    }

    function updateOnlineStatus() {
        const isOnline = navigator.onLine;
        if (connectionStatus && statusText) {
            if (isOnline) {
                connectionStatus.classList.remove('offline');
                statusText.innerText = 'Online';
                connectionStatus.style.opacity = "1";
            } else {
                connectionStatus.classList.add('offline');
                const lastSync = localStorage.getItem('bm_last_sync') || '---';
                statusText.innerText = 'Offline (Cache: ' + lastSync + ')';
                connectionStatus.style.opacity = "0.8";
            }
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Gestione Caching Dati (Fallback Locale)
    if (typeof maintenanceData !== 'undefined' && maintenanceData.length > 0) {
        localStorage.setItem('bm_maintenance_data', JSON.stringify(maintenanceData));
        localStorage.setItem('bm_last_sync', new Date().toLocaleString());
    } else {
        const cachedData = localStorage.getItem('bm_maintenance_data');
        if (cachedData) {
            window.maintenanceData = JSON.parse(cachedData);
            const lastSync = localStorage.getItem('bm_last_sync');
            console.warn('Connessione assente o data.js mancante. Uso cache locale del: ' + lastSync);
        }
    }

    // --- 1. Data Initialization & Global Stats ---
    const sites = {};
    let totalTasks = 0;
    let okTasks = 0;

    // 1. Appresa la struttura dell'archivio (05-Servizi)
    const SYSTEM_KEYWORDS = {
        'HVAC': ['climatici', 'hvac', 'condizionamento', 'climatizzazione', 'uta', 'chiller'],
        'Elettrico': ['elettrici', 'elettrico', 'quadri', 'cabina'],
        'Idrico': ['idrici', 'idrico', 'acqua', 'addolcitori', 'autoclave', 'legionella'],
        'Antincendio': ['antincendio', 'estintori', 'idranti', 'sprinkler', 'rilevazione'],
        'Legionella': ['legionella', 'biossido'],
        'Elevatori': ['ascensori', 'elevatori', 'montacarichi'],
        'Edile': ['edile', 'infissi', 'porte', 'opere']
    };

    function indexServiziFiles(items) {
        let files = [];
        function traverse(list) {
            list.forEach(item => {
                if (item.isDir && item.children) { traverse(item.children); } 
                else if (!item.isDir && item.path.toLowerCase().includes('05 - servizi')) {
                    files.push(item.path.toLowerCase());
                }
            });
        }
        traverse(items);
        return files;
    }
    const flatServiziFiles = indexServiziFiles(workspaceData);

    function hasActualDocument(row) {
        if (!row) return false;
        const siteName = row.Nome_Sito || "";
        
        // Estrai parole chiave significative dal nome del sito (minimo 3 caratteri, escludendo "Via", numeri, ecc.)
        const siteKeywords = siteName
            .replace(/Via|V\.le|Piazza|Viale|viale|[0-9/]+/gi, '')
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length >= 3);
            
        const sysKeywords = SYSTEM_KEYWORDS[row.Sistema] || [row.Sistema.toLowerCase()];
        
        return flatServiziFiles.some(path => {
            // Il percorso deve contenere ALMENO UNA parola chiave del sito
            const containsSite = siteKeywords.some(kw => path.includes(kw));
            if (!containsSite) return false;
            
            // E ALMENO UNA parola chiave del sistema
            const containsSystem = sysKeywords.some(kw => path.includes(kw));
            return containsSystem;
        });
    }

    // 2. Popolamento Siti e Statistiche Globali (Dinamico)
    const activeData = (typeof maintenanceData !== 'undefined') ? maintenanceData : (window.maintenanceData || []);
    window.sites = sites; // Rende i siti accessibili all'IA
    
    activeData.forEach(row => {
        if (!sites[row.ID_Sito]) {
            sites[row.ID_Sito] = {
                id: row.ID_Sito,
                nome: row.Nome_Sito,
                indirizzo: row.Indirizzo,
                tasks: [],
                ok: 0,
                total: 0
            };
        }
        sites[row.ID_Sito].tasks.push(row);
        sites[row.ID_Sito].total++;
        totalTasks++;
        
        if (hasActualDocument(row)) {
            sites[row.ID_Sito].ok++;
            okTasks++;
        }
    });

    const siteIds = Object.keys(sites).sort();
    let currentSiteId = siteIds[0];
    window.currentSiteId = currentSiteId; // Inizializzazione globale per l'IA
    let currentFilter = 'all';
    let currentUrgencyFilter = 'all';
    let currentDocFilter = 'all';
    let currentView = 'dashboard';
    let currentSubview = 'profile';
    
    
    // Calendar State (Punto 3)
    let calendarDate = new Date(2026, 2, 1); // Marzo 2026 (Mese corrente per Programma 2026)
    let calendarViewMode = 'monthly';

    // Workspace State
    let workspaceCurrentDir = { name: 'Archivio', children: workspaceData };
    let workspaceHistory = [workspaceCurrentDir];
    let workspaceHistoryIndex = 0;
    let workspaceSearchQuery = '';
    
    // --- Map State (Punto 5) ---
    let map = null;
    const siteCoordinates = {
        "01": [45.485, 9.213], "02": [45.496, 9.231], "03": [45.484, 9.182], "04": [45.459, 9.191],
        "05": [45.466, 9.227], "06": [45.491, 9.186], "07": [45.495, 9.179], "08": [45.501, 9.180],
        "09": [45.455, 9.220], "10": [45.441, 9.220], "11a": [45.511, 9.251], "11b": [45.510, 9.250],
        "12": [45.541, 9.117], "14": [45.465, 9.218], "15": [45.474, 9.231], "16": [45.448, 9.208],
        "17": [45.451, 9.250], "18": [45.446, 9.221], "19": [45.497, 9.124], "20": [45.501, 9.136],
        "21": [45.508, 9.141], "22": [45.502, 9.119], "23": [45.467, 9.157], "24": [45.477, 9.186],
        "25": [45.505, 9.221], "26": [45.498, 9.225], "27": [45.455, 9.215], "28": [45.466, 9.215],
        "29": [45.445, 9.213], "31": [45.445, 9.221], "32": [45.493, 9.127], "33": [45.441, 9.218]
    };

    // Themes
    const body = document.body;
    const themeToggles = [
        document.getElementById('theme-toggle'), 
        document.getElementById('theme-toggle-workspace'),
        document.getElementById('theme-toggle-map'),
        document.getElementById('theme-toggle-analytics')
    ];

    function initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
            themeToggles.forEach(t => { if(t) t.innerHTML = '<i class="fas fa-sun"></i>'; });
        }
    }

    // --- Forza Aggiornamento Dati ---
    const forceUpdateBtn = document.getElementById('force-update-btn');
    if (forceUpdateBtn) {
        forceUpdateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            forceUpdateBtn.style.opacity = "0.5";
            forceUpdateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            forceUpdateBtn.classList.add('syncing');
            
            // Pulisce cache dati specifica
            localStorage.removeItem('bm_maintenance_data');
            localStorage.removeItem('bm_last_sync');
            
            // Messaggio opzionale in console per debug
            console.log("Cache pulita. Ricaricamento forzato in corso...");

            // Ricarica con cache buster
            setTimeout(() => {
                const url = new URL(window.location.href);
                url.searchParams.set('reload', Date.now());
                window.location.href = url.href;
            }, 800);
        });
    }

    // --- Sincronizzazione Manuale Archivio (Fix Cache) ---
    const syncBtn = document.getElementById('sync-workspace-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', (e) => {
            e.preventDefault();
            syncBtn.style.opacity = "0.5";
            syncBtn.classList.add('syncing');
            syncBtn.innerHTML = '<span class="nav-icon"><i class="fas fa-spinner fa-spin"></i></span> Sincronizzazione...';
            
            // Forza il ricaricamento bypassando la cache
            setTimeout(() => {
                const url = new URL(window.location.href);
                url.searchParams.set('v', Date.now());
                window.location.href = url.href;
            }, 800);
        });
    }

    function toggleTheme() {
        body.classList.toggle('light-theme');
        const isLight = body.classList.contains('light-theme');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        themeToggles.forEach(t => { if(t) t.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; });
        
        // Update map tiles if map exists
        if (map) {
            updateMapTiles();
        }

        if (currentView === 'analytics') {
            renderGlobalAnalytics();
        }
    }

    themeToggles.forEach(t => {
        if (t) t.onclick = (e) => {
            e.stopPropagation();
            toggleTheme();
        };
    });

    // UI Elements
    const siteListEl = document.getElementById('site-list');
    const siteSearchInput = document.getElementById('site-search');
    const currentSiteNameEl = document.getElementById('current-site-name');
    const activityGridEl = document.getElementById('activity-grid');
    const statTotalTasksEl = document.getElementById('stat-total-tasks');
    const statComplianceEl = document.getElementById('stat-compliance');
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.getElementById('menu-toggle');

    // --- 2. Dashboard Logic ---
    function updateHeaderStats(list) {
        const total = list.length;
        const okCount = list.filter(t => hasActualDocument(t)).length;
        const compliance = total > 0 ? Math.round((okCount / total) * 100) : 0;
        
        statTotalTasksEl.innerText = total;
        statComplianceEl.innerText = `${compliance}%`;
    }

    function renderSiteList(filterText = '') {
        siteListEl.innerHTML = '';
        siteIds.forEach(id => {
            const site = sites[id];
            if (site.nome.toLowerCase().includes(filterText.toLowerCase()) || id.includes(filterText)) {
                const link = document.createElement('a');
                link.href = '#';
                link.className = `site-link ${id === currentSiteId ? 'active' : ''}`;
                link.innerHTML = `<span style="opacity: 0.6; font-size: 11px;">${id}</span> - ${site.nome}`;
                
                link.onclick = (e) => {
                    e.preventDefault();
                    currentSiteId = id;
                    window.currentSiteId = id; // Aggiornamento globale per l'IA
                    document.querySelectorAll('.site-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    
                    if (window.innerWidth <= 1350) sidebar.classList.remove('open');
                    renderCurrentSite();
                };
                siteListEl.appendChild(link);
            }
        });
    }

    function renderCurrentSite() {
        if (!currentSiteId) return;
        const site = sites[currentSiteId];
        // Update header immediately so it doesn't flicker
        const siteIdDisplay = site ? site.id : (currentSiteId || '---');
        const siteNameDisplay = site ? site.nome : 'Siti non trovati in data.js';
        currentSiteNameEl.innerText = `${siteIdDisplay} - ${siteNameDisplay}`;

        if (!site) {
            console.error(`Sito con ID ${currentSiteId} non trovato in data.js`);
            if (activityGridEl) activityGridEl.innerHTML = `<div class='error-msg'>Dati per il sito ${currentSiteId} mancanti. Riesegui SINC_TOTALE.ps1</div>`;
            return;
        }
        
        // Subview rendering with small transition
        if (currentView === 'calendar') {
            renderCalendar();
        } else {
            if (currentSubview === 'detail') renderMaintenanceTable();
            else if (currentSubview === 'monthly') renderMonthlySchedule();
            else renderSiteProfile();
        }
        
        document.getElementById('view-calendar').style.opacity = '1';
    }

    function renderMaintenanceTable() {
        const site = sites[currentSiteId];
        if (!activityGridEl) return;
        activityGridEl.innerHTML = '';
        
        let filteredTasks = currentFilter === 'all' 
            ? site.tasks 
            : site.tasks.filter(t => t.Sistema === currentFilter || t.Sistema.toLowerCase().includes(currentFilter.toLowerCase()));

        if (currentUrgencyFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => t.Urgency === currentUrgencyFilter);
        }

        if (currentDocFilter !== 'all') {
            filteredTasks = filteredTasks.filter(t => {
                const isOk = hasActualDocument(t);
                return currentDocFilter === 'ok' ? isOk : !isOk;
            });
        }

        updateHeaderStats(filteredTasks);

        filteredTasks.forEach((task, index) => {
            const card = document.createElement('div');
            card.className = `activity-card ${task.Urgency.toLowerCase()}`;
            card.style.animation = `fadeInUp 0.4s ease forwards ${index * 0.05}s`;
            card.style.opacity = 0;

            const hasDoc = hasActualDocument(task);
            const statusLabel = hasDoc ? 'Conforme' : 'Mancante';
            const statusClass = hasDoc ? 'badge-ok' : 'badge-verify';

            let urgencyLabel = 'Normale';
            if (task.Urgency === 'Urgent') urgencyLabel = 'Urgente';
            if (task.Urgency === 'Overdue') urgencyLabel = 'Scaduto';

            card.innerHTML = `
                <div class="card-header">
                    <span class="system-tag">${task.Sistema}</span>
                    <span class="urgency-badge ${task.Urgency.toLowerCase()}">${urgencyLabel}</span>
                </div>
                <h3>${task.Attivita}</h3>
                <div class="card-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar-check"></i>
                        <span>Ultimo: ${task.Last_Date === 'DA VERIFICARE' ? 'Nessun dato' : (task.Last_Date || '---')}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-sync"></i>
                        <span>Frequenza: ${task.Frequenza}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-shield-halved"></i>
                        <span>Stato: <b class="${statusClass}" style="padding: 2px 6px; border-radius: 4px; font-size: 11px;">${statusLabel}</b></span>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn-glass details-btn">Dettagli Tecnici</button>
                    <button class="btn-glass doc-btn" ${!hasDoc ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''}>Documenti</button>
                </div>
            `;

            card.onclick = (e) => {
                e.stopPropagation();
                openTaskDrawer(task);
            };

            const detailsBtn = card.querySelector('.details-btn');
            if (detailsBtn) {
                detailsBtn.onclick = (e) => {
                    e.stopPropagation();
                    openTaskDrawer(task);
                };
            }

            const docBtn = card.querySelector('.doc-btn');
            if (docBtn && hasDoc) {
                docBtn.onclick = (e) => {
                    e.stopPropagation();
                    viewDoc(task);
                };
            }

            activityGridEl.appendChild(card);
        });
    }

    function renderMonthlySchedule() {
        const site = sites[currentSiteId];
        const monthlyBodyEl = document.getElementById('monthly-body');
        monthlyBodyEl.innerHTML = '';

        const filteredTasks = currentFilter === 'all' 
            ? site.tasks 
            : site.tasks.filter(t => t.Sistema === currentFilter || t.Sistema.toLowerCase().includes(currentFilter.toLowerCase()));

        filteredTasks.forEach(task => {
            const tr = document.createElement('tr');
            const freq = task.Frequenza.toLowerCase();
            
            let cells = `<td style="font-weight: 500">${task.Attivita}</td>`;
            const startMonth = parseInt(task.Next_Date.split('-')[1]) - 1;
            
            // Logic based on Next_Date month
            for (let i = 0; i < 12; i++) {
                let active = false;
                if (freq.includes('mensile') || freq.includes('settimanale')) active = true;
                else if (freq.includes('bimestrale') && (i - startMonth + 12) % 2 === 0) active = true;
                else if (freq.includes('trimestrale') && (i - startMonth + 12) % 3 === 0) active = true;
                else if (freq.includes('semestrale') && (i - startMonth + 12) % 6 === 0) active = true;
                else if (freq.includes('annuale') && i === startMonth) active = true;
                
                if (active) {
                    cells += `<td style="text-align: center; background: rgba(16, 185, 129, 0.15); border-radius: 4px;">
                                <span style="color: #10b981; font-weight: bold; font-size: 14px;">✓</span>
                              </td>`;
                } else {
                    cells += `<td style="text-align: center; color: #94a3b8;">-</td>`;
                }
            }
            tr.innerHTML = cells;
            monthlyBodyEl.appendChild(tr);
        });
    }

    function renderSiteProfile() {
        const site = sites[currentSiteId];
        if (!site) return;

        // Anagrafica
        document.getElementById('profile-name').innerText = site.nome;
        document.getElementById('profile-address').innerText = `📍 ${site.indirizzo || 'Indirizzo non disponibile'}`;
        document.getElementById('profile-id-badge').innerText = `ID: ${site.id}`;

        // Stats
        const compliance = site.total > 0 ? Math.round((site.ok / site.total) * 100) : 0;
        document.getElementById('prof-stat-compliance').innerText = `${compliance}%`;
        document.getElementById('prof-compliance-bar').style.width = `${compliance}%`;
        
        // Update top header stats as well
        document.getElementById('stat-total-tasks').innerText = site.total;
        document.getElementById('stat-compliance').innerText = `${compliance}%`;

        const urgentCount = site.tasks.filter(t => t.Urgency === 'Urgent' || t.Urgency === 'Overdue').length;
        document.getElementById('prof-stat-urgent').innerText = urgentCount;
        document.getElementById('prof-stat-urgent').style.color = urgentCount > 0 ? '#ef4444' : '#10b981';

        // Prevalent System
        const systems = {};
        site.tasks.forEach(t => {
            systems[t.Sistema] = (systems[t.Sistema] || 0) + 1;
        });
        let maxSys = '-';
        let maxCount = 0;
        for (const sys in systems) {
            if (systems[sys] > maxCount) {
                maxCount = systems[sys];
                maxSys = sys;
            }
        }
        document.getElementById('prof-stat-system').innerText = maxSys;

        // History
        const historyList = document.getElementById('profile-history-list');
        historyList.innerHTML = '';
        
        // Filter tasks with a valid Last_Date and sort them descending
        const history = site.tasks
            .filter(t => t.Last_Date && t.Last_Date !== 'DA VERIFICARE')
            .sort((a, b) => new Date(b.Last_Date) - new Date(a.Last_Date))
            .slice(0, 5);

        if (history.length === 0) {
            historyList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">Nessun intervento storico registrato</div>';
        } else {
            history.forEach(item => {
                const div = document.createElement('div');
                div.className = 'glass-effect';
                div.style.padding = '12px 16px';
                div.style.borderRadius = '12px';
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                div.style.border = '1px solid var(--border)';
                div.style.background = 'rgba(255,255,255,0.02)';

                div.innerHTML = `
                    <div>
                        <div style="font-weight: 600; font-size: 14px;">${item.Attivita}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${item.Sistema}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: var(--primary); font-size: 13px;">${item.Last_Date}</div>
                        <div style="font-size: 10px; opacity: 0.6;">COMPLETATO</div>
                    </div>
                `;
                historyList.appendChild(div);
            });
        }
    }

    function renderCalendar() {
        const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
                          "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        
        const displayEl = document.getElementById('current-month-display');
        if (displayEl) {
            displayEl.innerText = `${monthNames[calendarDate.getMonth()]} ${calendarDate.getFullYear()}`;
        }

        const site = sites[currentSiteId];
        const siteContextEl = document.getElementById('calendar-site-context');
        if (siteContextEl && site) {
            siteContextEl.innerText = `Presidio: ${site.id} - ${site.nome}`;
        }
        
        if (calendarViewMode === 'monthly') {
            document.getElementById('calendar-monthly-layout').style.display = 'grid';
            document.getElementById('calendar-yearly-container').style.display = 'none';
            renderMonthlyCalendar();
        } else {
            document.getElementById('calendar-monthly-layout').style.display = 'none';
            document.getElementById('calendar-yearly-container').style.display = 'block';
            renderYearlyCalendar();
        }
    }

    function renderMonthlyCalendar() {
        const grid = document.getElementById('calendar-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Adjust for Monday start (JS 0 is Sunday)
        const offset = firstDay === 0 ? 6 : firstDay - 1;

        const site = sites[currentSiteId];
        const allTasks = site.tasks;

        // Empty cells for offset
        for (let i = 0; i < offset; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            grid.appendChild(empty);
        }

        // Days
        for (let d = 1; d <= daysInMonth; d++) {
            const dayEl = document.createElement('div');
            const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year;
            dayEl.className = `calendar-day ${isToday ? 'today' : ''}`;
            
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const tasksToday = allTasks.filter(t => t.Next_Date === dateStr);
            const systemsToday = [...new Set(tasksToday.map(t => t.Sistema))];

            dayEl.innerHTML = `
                <span class="calendar-day-number">${d}</span>
                <div class="calendar-markers" style="margin-top: 8px; display: flex; flex-direction: column; gap: 2px;">
                    ${systemsToday.slice(0, 2).map(sys => `<span class="calendar-day-badge badge-${sys.toLowerCase()}">${sys}</span>`).join('')}
                    ${systemsToday.length > 2 ? `<span style="font-size: 8px; opacity: 0.6; font-weight: bold; margin-left: 2px;">+${systemsToday.length - 2}</span>` : ''}
                </div>
            `;

            dayEl.onclick = () => {
                document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));
                dayEl.classList.add('selected');
                renderAgenda(tasksToday, d, month, year);
            };

            grid.appendChild(dayEl);
        }
    }

    function renderAgenda(tasks, day, month, year) {
        const titleEl = document.getElementById('agenda-date-title');
        const listEl = document.getElementById('calendar-agenda-list');
        const badgeEl = document.getElementById('agenda-count-badge');
        
        const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
                          "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];
        
        titleEl.innerText = `${day} ${monthNames[month]} ${year}`;
        badgeEl.innerText = `${tasks.length} Attività`;
        badgeEl.className = tasks.length > 0 ? 'badge-ok' : 'badge-none';
        
        listEl.innerHTML = '';
        
        if (tasks.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding-top: 60px; font-size: 13px; animation: fadeInUp 0.4s ease;">
                    <span style="font-size: 40px; display: block; margin-bottom: 12px;">📅</span>
                    Nessuna attività programmata per questo giorno.
                </div>
            `;
            return;
        }
        
        tasks.forEach((task, index) => {
            const item = document.createElement('div');
            item.className = 'agenda-item';
            item.style.animationDelay = `${index * 0.05}s`;
            
            let icon = '⚙️';
            if (task.Sistema === 'HVAC') icon = '❄️';
            if (task.Sistema === 'Elettrico') icon = '⚡';
            if (task.Sistema === 'Antincendio') icon = '🔥';
            if (task.Sistema === 'Idrico') icon = '💧';
            if (task.Sistema === 'Legionella') icon = '🦠';
            if (task.Sistema === 'Elevatori') icon = '🛗';

            item.innerHTML = `
                <div class="agenda-icon badge-${task.Sistema.toLowerCase()}">${icon}</div>
                <div class="agenda-info">
                    <div class="agenda-title">${task.Attivita}</div>
                    <div class="agenda-meta">${task.Sistema} • ${task.Frequenza}</div>
                    <div class="agenda-urgency">
                        <span class="urgency-label ${task.Urgency === 'Urgent' ? 'urgency-urgent' : (task.Urgency === 'Overdue' ? 'urgency-overdue' : 'urgency-normal')}">
                            ${task.Urgency === 'Urgent' ? 'Urgente' : (task.Urgency === 'Overdue' ? 'Scaduto' : 'In Programma')}
                        </span>
                    </div>
                </div>
            `;
            
            item.onclick = () => openTaskDrawer(task);
            listEl.appendChild(item);
        });
    }

    function renderYearlyCalendar() {
        const grid = document.getElementById('calendar-year-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const year = calendarDate.getFullYear();
        const monthNames = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
        
        const site = sites[currentSiteId];
        const allTasks = site.tasks;

        for (let m = 0; m < 12; m++) {
            const monthDiv = document.createElement('div');
            monthDiv.className = 'mini-month glass-effect';
            
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            const firstDay = new Date(year, m, 1).getDay();
            const offset = firstDay === 0 ? 6 : firstDay - 1;

            let gridHtml = `<div class="mini-month-title">${monthNames[m]} ${year}</div>`;
            gridHtml += `<div class="mini-month-grid">`;
            
            for (let i = 0; i < offset; i++) {
                gridHtml += `<div class="mini-day"></div>`;
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const hasTask = allTasks.some(t => t.Next_Date === dateStr);
                gridHtml += `<div class="mini-day ${hasTask ? 'has-task' : ''}">${d}</div>`;
            }
            
            gridHtml += `</div>`;
            monthDiv.innerHTML = gridHtml;
            
            monthDiv.onclick = () => {
                calendarDate = new Date(year, m, 1);
                calendarViewMode = 'monthly';
                document.querySelectorAll('[data-calview]').forEach(b => b.classList.toggle('active', b.dataset.calview === 'monthly'));
                renderCalendar();
            };

            grid.appendChild(monthDiv);
        }
    }

    // --- 5. Global Analytics Logic ---
    let dashboardCharts = {};

    function renderGlobalAnalytics() {
        const ctxSystems = document.getElementById('chart-systems')?.getContext('2d');
        const ctxUrgency = document.getElementById('chart-urgency')?.getContext('2d');
        const ctxStatus = document.getElementById('chart-status')?.getContext('2d');
        
        if (!ctxSystems || !ctxUrgency || !ctxStatus) return;

        // Auto-iniezione pulsante Report Globale nell'header se mancante
        if (!document.getElementById('btn-export-global')) {
            const analyticsHeader = document.querySelector('#view-analytics .top-header');
            if (analyticsHeader) {
                // Rimuovi il vecchio theme toggle se presente per raggrupparlo
                const oldToggle = document.getElementById('theme-toggle-analytics');
                const btnGroup = document.createElement('div');
                btnGroup.style.display = 'flex';
                btnGroup.style.gap = '12px';
                btnGroup.style.alignItems = 'center';
                
                const exportBtn = document.createElement('button');
                exportBtn.id = 'btn-export-global';
                exportBtn.className = 'export-btn analytics';
                exportBtn.title = 'Esporta Report Flotta PDF';
                exportBtn.style.cssText = 'background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 14px;';
                exportBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Report Globale';
                exportBtn.onclick = (e) => { e.stopPropagation(); exportGlobalAnalyticsPDF(); };
                
                btnGroup.appendChild(exportBtn);
                if (oldToggle) {
                    oldToggle.parentNode.insertBefore(btnGroup, oldToggle);
                    btnGroup.appendChild(oldToggle);
                } else {
                    analyticsHeader.appendChild(btnGroup);
                }
            }
        }

        // Colors based on theme
        const isLight = document.body.classList.contains('light-theme');
        const textColor = isLight ? '#475569' : '#94a3b8';
        const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

        // 1. Data Aggregation
        const systemsCount = {};
        const urgencyCount = { 'Normal': 0, 'Urgent': 0, 'Overdue': 0 };
        const statusCount = { 'OK/REALE': 0, 'DA VERIFICARE': 0, 'N/D': 0 };
        let totalVal = 0;
        let okVal = 0;

        // Aggregazione per i grafici e conformità globale
        maintenanceData.forEach(task => {
            systemsCount[task.Sistema] = (systemsCount[task.Sistema] || 0) + 1;
            if (urgencyCount.hasOwnProperty(task.Urgency)) urgencyCount[task.Urgency]++;
            
            const status = task.Stato_Documentale || 'N/D';
            if (status === 'OK' || status === 'REALE') {
                okVal++;
                statusCount['OK/REALE']++;
            } else if (status === 'DA VERIFICARE') {
                statusCount['DA VERIFICARE']++;
            } else {
                statusCount['N/D']++;
            }
            totalVal++;
        });

        // Calcolo Performance per SINGOLO SITO (Novità)
        const sitePerformance = siteIds.map(id => {
            const site = sites[id];
            const compliance = site.total > 0 ? Math.round((site.ok / site.total) * 100) : 0;
            return { id, nome: site.nome, compliance };
        });

        // Ordinamento per classifiche
        const sortedSites = [...sitePerformance].sort((a, b) => b.compliance - a.compliance);
        const top5 = sortedSites.slice(0, 5);
        const bottom5 = [...sitePerformance].sort((a, b) => a.compliance - b.compliance).slice(0, 5);

        // Rendering classifiche con iniezione dinamica dei contenitori se mancanti
        const renderTable = (data, containerId, title, isTop) => {
            let container = document.getElementById(containerId);
            
            // Auto-iniezione se la sezione performance non esiste nell'HTML
            if (!container) {
                const analyticsView = document.querySelector('#view-analytics .view-container');
                if (analyticsView) {
                    let perfSection = document.querySelector('.performance-section');
                    if (!perfSection) {
                        perfSection = document.createElement('div');
                        perfSection.className = 'performance-section';
                        perfSection.style.marginTop = '40px';
                        perfSection.style.display = 'grid';
                        perfSection.style.gridTemplateColumns = 'repeat(auto-fit, minmax(400px, 1fr))';
                        perfSection.style.gap = '32px';
                        analyticsView.appendChild(perfSection);
                    }
                    
                    const card = document.createElement('div');
                    card.className = 'performance-card glass-effect';
                    card.style.padding = '32px';
                    card.style.borderRadius = '24px';
                    card.style.border = '1px solid var(--border)';
                    card.style.background = 'var(--glass-bg)';
                    card.innerHTML = `
                        <h3 style="margin-bottom: 24px; font-size: 18px; color: ${isTop ? '#10b981' : '#ef4444'}; display: flex; align-items: center; gap: 10px;">
                            <i class="fas ${isTop ? 'fa-trophy' : 'fa-circle-exclamation'}"></i> ${title}
                        </h3>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="text-align: left; border-bottom: 1px solid var(--border); font-size: 12px; color: var(--text-muted);">
                                        <th style="padding: 12px 8px;">Presidio</th>
                                        <th style="padding: 12px 8px; text-align: center;">Conformità</th>
                                    </tr>
                                </thead>
                                <tbody id="${containerId}"></tbody>
                            </table>
                        </div>
                    `;
                    perfSection.appendChild(card);
                    container = document.getElementById(containerId);
                }
            }

            if (!container) return;
            container.innerHTML = data.map(item => `
                <tr style="border-bottom: 1px solid var(--border); transition: background 0.2s; cursor: pointer;" 
                    onclick="window.appSelectSite('${item.id}')">
                    <td style="padding: 12px 8px;">
                        <div style="font-weight: 600; font-size: 13px;">${item.nome}</div>
                        <div style="font-size: 10px; color: var(--text-muted);">ID: ${item.id}</div>
                    </td>
                    <td style="padding: 12px 8px; text-align: center;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <div style="flex-grow: 1; height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; min-width: 60px; overflow: hidden;">
                                <div style="width: ${item.compliance}%; height: 100%; background: ${item.compliance > 70 ? '#10b981' : (item.compliance > 30 ? '#f59e0b' : '#ef4444')};"></div>
                            </div>
                            <span style="font-weight: 700; font-size: 12px; min-width: 35px;">${item.compliance}%</span>
                        </div>
                    </td>
                </tr>
            `).join('');
        };

        renderTable(top5, 'top-sites-body', 'Top 5 Performance (Siti)', true);
        renderTable(bottom5, 'bottom-sites-body', 'Bottom 5 Attention (Siti)', false);

        const compliance = totalVal > 0 ? Math.round((okVal / totalVal) * 100) : 0;
        const complianceEl = document.getElementById('analytics-compliance-value');
        if (complianceEl) {
            complianceEl.innerText = `${compliance}%`;
            if (compliance > 80) complianceEl.style.color = '#10b981';
            else if (compliance > 50) complianceEl.style.color = '#f59e0b';
            else complianceEl.style.color = '#ef4444';
        }

        // Destroy existing charts if they exist
        if (dashboardCharts.systems) dashboardCharts.systems.destroy();
        if (dashboardCharts.urgency) dashboardCharts.urgency.destroy();
        if (dashboardCharts.status) dashboardCharts.status.destroy();

        // 2. Systems Chart (Doughnut)
        dashboardCharts.systems = new Chart(ctxSystems, {
            type: 'doughnut',
            data: {
                labels: Object.keys(systemsCount),
                datasets: [{
                    data: Object.values(systemsCount),
                    backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 15, font: { size: 11, weight: '600' } } }
                },
                cutout: '65%'
            }
        });

        // 3. Urgency Chart (Bar)
        dashboardCharts.urgency = new Chart(ctxUrgency, {
            type: 'bar',
            data: {
                labels: ['Normal', 'Urgent', 'Overdue'],
                datasets: [{
                    label: 'Attività',
                    data: [urgencyCount.Normal, urgencyCount.Urgent, urgencyCount.Overdue],
                    backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(245, 158, 11, 0.6)', 'rgba(239, 68, 68, 0.6)'],
                    borderColor: ['#10b981', '#f59e0b', '#ef4444'],
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: textColor } },
                    x: { grid: { display: false }, ticks: { color: textColor } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // 4. Status Chart (Pie)
        dashboardCharts.status = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ['OK / Reale', 'Da Verificare', 'Non Disponibile'],
                datasets: [{
                    data: [statusCount['OK/REALE'], statusCount['DA VERIFICARE'], statusCount['N/D']],
                    backgroundColor: ['#10b981', '#f59e0b', 'rgba(148, 163, 184, 0.3)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, padding: 15 } }
                }
            }
        });
    }

    function exportGlobalAnalyticsPDF() {
        let jsPDFClass;
        try {
            const { jsPDF } = window.jspdf || {};
            jsPDFClass = jsPDF || window.jsPDF;
            if (!jsPDFClass) throw new Error("Libreria jsPDF mancante");
        } catch (e) {
            alert("Errore PDF: libreria non pronta.");
            return;
        }

        try {
            const doc = new jsPDFClass('p', 'mm', 'a4');
            const now = new Date().toLocaleString();
            
            doc.setFontSize(22);
            doc.setTextColor(16, 185, 129); // Primary color
            doc.text("REPORT GLOBALE COMMESSA", 105, 20, { align: 'center' });
            
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139);
            doc.text(`Generato il: ${now} - ASST FBF Sacco Fleet Status`, 105, 28, { align: 'center' });
            
            // Stats summary
            const totalSiti = siteIds.length;
            const totalAttivita = maintenanceData.length;
            const okTotal = maintenanceData.filter(t => t.Stato_Documentale === 'OK' || t.Stato_Documentale === 'REALE').length;
            const compliance = Math.round((okTotal / totalAttivita) * 100);

            doc.setDrawColor(226, 232, 240);
            doc.line(14, 35, 196, 35);
            
            doc.setFontSize(14);
            doc.setTextColor(51, 65, 85);
            doc.text("Riepilogo Numerico", 14, 45);
            
            const statsData = [
                ["Presidi Gestiti", totalSiti.toString()],
                ["Attività Totali Giugno 2026", totalAttivita.toString()],
                ["Attività Conformi (OK)", okTotal.toString()],
                ["Conformità Globale Media", `${compliance}%`]
            ];
            
            doc.autoTable({
                startY: 50,
                head: [['Metrica', 'Valore']],
                body: statsData,
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }
            });

            // Top 5 Sites
            const sitePerformance = siteIds.map(id => {
                const site = sites[id];
                const comp = site.total > 0 ? Math.round((site.ok / site.total) * 100) : 0;
                return [site.nome, id, `${comp}%`];
            }).sort((a, b) => parseInt(b[2]) - parseInt(a[2]));

            doc.text("Top 10 Performers (Siti)", 14, doc.lastAutoTable.finalY + 15);
            doc.autoTable({
                startY: doc.lastAutoTable.finalY + 20,
                head: [['Nome Presidio', 'ID', 'Conformità']],
                body: sitePerformance.slice(0, 10),
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] }
            });

            doc.save("Report_Globale_Commessa_2026.pdf");
            alert("Report Globale generato con successo!");
        } catch (err) {
            console.error("PDF Global Export Error:", err);
            alert("Errore PDF Globale: " + err.message);
        }
    }

    // --- 3. View Switcher & Navigation ---

    function switchView(viewName) {
        currentView = viewName;
        
        // Update sidebar links
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.view === viewName));
        if (window.innerWidth <= 1350) sidebar.classList.remove('open');
        
        // Update main views
        document.getElementById('view-dashboard').classList.toggle('active', viewName === 'dashboard');
        document.getElementById('view-workspace').classList.toggle('active', viewName === 'workspace');
        document.getElementById('view-map').classList.toggle('active', viewName === 'map');
        document.getElementById('view-calendar').classList.toggle('active', viewName === 'calendar');
        document.getElementById('view-analytics').classList.toggle('active', viewName === 'analytics');
        document.getElementById('view-ai').classList.toggle('active', viewName === 'ai');

        const siteNavSection = document.querySelector('.nav-section:last-child');
        const siteSearch = document.querySelector('.sidebar-search');

        if (viewName === 'workspace') {
            if (siteNavSection) siteNavSection.style.display = 'none';
            if (siteSearch) siteSearch.style.display = 'none';
            const workspaceSearch = document.getElementById('workspace-search');
            if (workspaceSearch) {
                workspaceSearch.value = workspaceSearchQuery;
            }
            renderWorkspace();
        } else if (viewName === 'map') {
            if (siteNavSection) siteNavSection.style.display = 'block';
            if (siteSearch) siteSearch.style.display = 'block';
            setTimeout(initMap, 400); 
        } else if (viewName === 'calendar') {
            if (siteNavSection) siteNavSection.style.display = 'block';
            if (siteSearch) siteSearch.style.display = 'block';
            renderCalendar();
        } else if (viewName === 'analytics') {
            if (siteNavSection) siteNavSection.style.display = 'block';
            if (siteSearch) siteSearch.style.display = 'block';
            renderGlobalAnalytics();
        } else if (viewName === 'ai') {
            if (siteNavSection) siteNavSection.style.display = 'block';
            if (siteSearch) siteSearch.style.display = 'block';
            // L'audit verrà attivato manualmente o all'ingresso se desiderato
        } else {
            if (siteNavSection) siteNavSection.style.display = 'block';
            if (siteSearch) siteSearch.style.display = 'block';
            renderCurrentSite();
        }
    }

    function switchSubview(subviewName) {
        currentSubview = subviewName;
        
        // Update toggle buttons
        document.querySelectorAll('.toggle-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subview === subviewName);
        });

        // Toggle subview sections using .active class (to preserve CSS opacity/animation)
        document.getElementById('subview-detail').classList.toggle('active', subviewName === 'detail');
        document.getElementById('subview-monthly').classList.toggle('active', subviewName === 'monthly');
        
        const profileEl = document.getElementById('subview-profile');
        if (profileEl) {
            profileEl.style.display = subviewName === 'profile' ? 'flex' : 'none';
            profileEl.classList.toggle('active', subviewName === 'profile');
        }

        renderCurrentSite();
    }

    // --- 6. Export Functions (Punto 3 Roadmap) ---
    function getFilteredData() {
        const site = sites[currentSiteId];
        if (!site) return [];
        return currentFilter === 'all' 
            ? site.tasks 
            : site.tasks.filter(t => t.Sistema === currentFilter || t.Sistema.toLowerCase().includes(currentFilter.toLowerCase()));
    }

    function exportToExcel() {
        if (typeof XLSX === 'undefined') {
            alert("Errore: Libreria Excel non caricata.");
            return;
        }

        const data = getFilteredData();
        if (data.length === 0) {
            alert("Nessun dato da esportare.");
            return;
        }

        try {
            const site = sites[currentSiteId];
            const fileName = `Piano_Manutenzione_${site.id}_2026.xlsx`;
            
            const excelData = data.map(t => ({
                'Sistema': t.Sistema,
                'Attività': t.Attivita,
                'Frequenza': t.Frequenza,
                'Scadenza': t.Next_Date,
                'Stato': t.Stato_Documentale,
                'Urgenza': t.Urgency
            }));

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Manutenzione");

            // Base64 Method
            const b64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
            const dataUri = "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," + b64;
            
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
            }, 100);

            alert("Esportazione Excel completata!");
        } catch (err) {
            console.error("Excel Error:", err);
            alert("Errore Excel: " + err.message);
        }
    }

    function exportToPDF() {
        let jsPDFClass;
        try {
            const { jsPDF } = window.jspdf || {};
            jsPDFClass = jsPDF || window.jsPDF;
            if (!jsPDFClass) throw new Error("Libreria jsPDF mancante");
        } catch (e) {
            alert("Errore PDF: libreria non pronta.");
            return;
        }

        const data = getFilteredData();
        if (data.length === 0) {
            alert("Nessun dato per PDF.");
            return;
        }

        try {
            const site = sites[currentSiteId];
            const fileName = `Piano_Manutenzione_${site.id}_2026.pdf`;
            const doc = new jsPDFClass('l', 'mm', 'a4');
            
            doc.setFontSize(16);
            doc.text(`Piano Manutenzione: ${site.nome}`, 14, 15);
            
            const columns = [
                { header: 'Sistema', dataKey: 'sys' },
                { header: 'Attività', dataKey: 'task' },
                { header: 'Urgenza', dataKey: 'urg' },
                { header: 'Scadenza', dataKey: 'next' }
            ];

            const rows = data.map(t => ({
                sys: t.Sistema,
                task: t.Attivita,
                urg: t.Urgency,
                next: t.Next_Date || ''
            }));

            doc.autoTable({
                columns: columns,
                body: rows,
                startY: 25,
                styles: { fontSize: 8 }
            });

            // Base64 Method
            const dataUri = doc.output('datauristring');
            
            const a = document.createElement('a');
            a.href = dataUri;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            
            setTimeout(() => {
                document.body.removeChild(a);
                console.log("PDF Export Success (Sent to browser)");
            }, 100);

            alert("Esportazione PDF completata!");
        } catch (err) {
            console.error("PDF Error:", err);
            alert("Errore PDF: " + err.message);
        }
    }

    // --- 4. Workspace Explorer ---
    function navigateToDir(dir, isNewNavigation = true) {
        if (isNewNavigation) {
            if (workspaceHistoryIndex < workspaceHistory.length - 1) {
                workspaceHistory = workspaceHistory.slice(0, workspaceHistoryIndex + 1);
            }
            workspaceHistory.push(dir);
            workspaceHistoryIndex = workspaceHistory.length - 1;
        }
        workspaceCurrentDir = dir;
        renderWorkspace();
        renderFolderTree(workspaceData, document.getElementById('workspace-tree'));
        updateNavButtons();
    }

    function renderFolderTree(data, container, depth = 0) {
        if (!container) return;
        if (depth === 0) container.innerHTML = '';
        
        const items = Array.isArray(data) ? data : [data];
        items.forEach(item => {
            if (item.isDir) {
                const itemContainer = document.createElement('div');
                itemContainer.className = 'tree-item-container';
                
                const div = document.createElement('div');
                const isActive = workspaceCurrentDir.path === item.path;
                div.className = `tree-item ${isActive ? 'active' : ''}`;
                
                // Check if this folder or any of its children are the current directory
                const isParentOfCurrent = isAncestor(item, workspaceCurrentDir);
                if (isParentOfCurrent) div.classList.add('expanded');

                div.innerHTML = `
                    <span class="toggle-icon"><i class="fas fa-chevron-right"></i></span>
                    <span><i class="fas fa-folder"></i> ${item.name}</span>
                `;
                
                const subContainer = document.createElement('div');
                subContainer.className = `tree-sub ${isParentOfCurrent || isActive ? 'expanded' : ''}`;
                
                div.onclick = (e) => {
                    e.stopPropagation();
                    navigateToDir(item);
                };

                itemContainer.appendChild(div);
                
                if (item.children) {
                    const children = Array.isArray(item.children) ? item.children : [item.children];
                    if (children.some(child => child.isDir)) {
                        renderFolderTree(children, subContainer, depth + 1);
                        itemContainer.appendChild(subContainer);
                    }
                }
                
                container.appendChild(itemContainer);
            }
        });
    }

    function isAncestor(parent, child) {
        if (!parent.children) return false;
        const children = Array.isArray(parent.children) ? parent.children : [parent.children];
        return children.some(item => item === child || (item.isDir && isAncestor(item, child)));
    }

    function updateNavButtons() {
        const btnBack = document.getElementById('btn-workspace-back');
        const btnForward = document.getElementById('btn-workspace-forward');
        if (btnBack) btnBack.disabled = workspaceHistoryIndex === 0;
        if (btnForward) btnForward.disabled = workspaceHistoryIndex === workspaceHistory.length - 1;
        
        if (btnBack) btnBack.style.opacity = btnBack.disabled ? '0.3' : '1';
        if (btnForward) btnForward.style.opacity = btnForward.disabled ? '0.3' : '1';
    }

    function renderWorkspace() {
        const grid = document.getElementById('workspace-grid');
        const breadcrumb = document.getElementById('workspace-breadcrumb');
        if (!grid || !breadcrumb) return;

        grid.innerHTML = '';
        breadcrumb.innerHTML = '';

        workspaceHistory.slice(0, workspaceHistoryIndex + 1).forEach((dir, index) => {
            const span = document.createElement('span');
            span.innerText = dir.name;
            span.className = 'breadcrumb-item';
            span.onclick = () => {
                workspaceHistoryIndex = index;
                navigateToDir(dir, false);
            };
            breadcrumb.appendChild(span);
        });

        let filteredItems = [];
        if (workspaceSearchQuery) {
            const query = workspaceSearchQuery.toLowerCase();
            const findMatches = (list) => {
                let matches = [];
                const seenPaths = new Set();
                
                const searchRecursive = (items) => {
                    const arr = Array.isArray(items) ? items : [items];
                    for (const item of arr) {
                        if (item && item.name && item.name.toLowerCase().includes(query)) {
                            if (!seenPaths.has(item.path)) {
                                matches.push(item);
                                seenPaths.add(item.path);
                            }
                        }
                        if (item && item.isDir && item.children) {
                            searchRecursive(item.children);
                        }
                    }
                };
                
                searchRecursive(list);
                return matches;
            };
            // Search globally starting from root data
            filteredItems = findMatches(workspaceData);
        } else {
            const rawChildren = workspaceCurrentDir.children || [];
            filteredItems = Array.isArray(rawChildren) ? rawChildren : [rawChildren];
        }

        if (filteredItems.length === 0 && workspaceSearchQuery) {
            grid.innerHTML = `<div style="grid-column: 1/-1; color: var(--text-muted); padding: 60px; text-align: center;">
                <span style="font-size: 40px; display: block; margin-bottom: 20px;"><i class="fas fa-search"></i></span>
                Nessun risultato trovato per "<strong>${workspaceSearchQuery}</strong>" nell'intero Archivio
            </div>`;
            return;
        }

        filteredItems.forEach(item => {
            const card = document.createElement('div');
            
            // File type detection
            let typeClass = 'folder';
            let icon = '<i class="fas fa-folder"></i>';
            if (!item.isDir) {
                const ext = item.name.toLowerCase();
                if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) { typeClass = 'file-excel'; icon = '<i class="fas fa-file-excel"></i>'; }
                else if (ext.endsWith('.pdf')) { typeClass = 'file-pdf'; icon = '<i class="fas fa-file-pdf"></i>'; }
                else if (ext.endsWith('.docx') || ext.endsWith('.doc')) { typeClass = 'file-word'; icon = '<i class="fas fa-file-word"></i>'; }
                else if (ext.endsWith('.zip') || ext.endsWith('.rar')) { typeClass = 'file-zip'; icon = '<i class="fas fa-file-archive"></i>'; }
                else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.webp')) { typeClass = 'file-image'; icon = '<i class="fas fa-file-image"></i>'; }
                else { typeClass = 'file-generic'; icon = '<i class="fas fa-file-alt"></i>'; }
            }

            card.className = `workspace-item ${typeClass}`;
            
            // Relative path helper
            const getRelPath = (path) => {
                const internal = path.replace(/\\/g, '/');
                return window.location.protocol === 'file:' ? `../../../${internal}` : internal;
            };

            // Calculate metadata
            let metaText = item.isDir ? 'Cartella' : (Math.round(item.size / 1024) + ' KB');

            card.innerHTML = `
                <div class="item-icon">${icon}</div>
                <div class="item-name">${item.name}</div>
                <div class="item-meta">${metaText}</div>
            `;

            card.onclick = () => {
                if (item.isDir) {
                    const searchInput = document.getElementById('workspace-search');
                    if (searchInput) searchInput.value = '';
                    workspaceSearchQuery = '';
                    navigateToDir(item);
                } else {
                    window.open(getRelPath(item.path), '_blank');
                }
            };
            grid.appendChild(card);
        });

        renderFolderTree(workspaceData, document.getElementById('workspace-tree'));
        updateNavButtons();
    }





    // --- 5. Task Detail Drawer Logic (Punto 3) ---
    const taskDrawer = document.getElementById('task-drawer');
    const drawerOverlay = document.getElementById('drawer-overlay');
    let currentDrawerTask = null;

    function openTaskDrawer(task) {
        if (!task) return;
        currentDrawerTask = task;
        
        // Populate Data
        document.getElementById('drawer-title').innerText = task.Attivita;
        document.getElementById('drawer-system-badge').innerText = task.Sistema;
        document.getElementById('drawer-freq').innerText = task.Frequenza;
        document.getElementById('drawer-norm').innerText = task.Normativa;
        document.getElementById('drawer-last').innerText = task.Last_Date || 'Non disponibile';
        document.getElementById('drawer-next').innerText = task.Next_Date || 'Da definire';
        document.getElementById('drawer-notes').innerText = task.Note || 'Nessuna nota aggiuntiva.';

        // System-based badge color
        const badge = document.getElementById('drawer-system-badge');
        badge.className = 'badge';
        if (task.Stato_Documentale === 'OK') badge.classList.add('badge-ok');
        else if (task.Stato_Documentale === 'DA VERIFICARE') badge.classList.add('badge-verify');
        else badge.classList.add('badge-none');

        // Reset Verify Button
        const btnVerify = document.getElementById('btn-drawer-verify');
        if (btnVerify) {
            btnVerify.innerText = '✅ Segna come Verificato (Demo)';
            btnVerify.classList.remove('active');
            btnVerify.style.background = '';
            btnVerify.style.color = '';
        }

        // Smart Search for Documents
        renderDrawerRelatedDocs(task);

        // Show Drawer
        drawerOverlay.classList.add('active');
        taskDrawer.classList.add('active');
    }

    function renderDrawerRelatedDocs(task) {
        const container = document.getElementById('drawer-related-docs');
        if (!container) return;

        const system = task.Sistema;
        const keywords = SYSTEM_KEYWORDS[system] || [system];
        const query = Array.isArray(keywords) ? keywords[0].toLowerCase() : keywords.toLowerCase();
        const siteId = task.ID_Sito;

        // Recursive search for files matching the system and site
        const results = [];
        function search(dir) {
            if (dir && dir.children) {
                const children = Array.isArray(dir.children) ? dir.children : [dir.children];
                children.forEach(child => {
                    if (child.isDir) {
                        search(child);
                    } else if (child.name) {
                        const nameLower = child.name.toLowerCase();
                        if (nameLower.includes(query)) {
                            results.push(child);
                        }
                    }
                });
            }
        }
        search({ name: 'Root', children: workspaceData });

        if (results.length === 0) {
            container.innerHTML = `<p class="drawer-text" style="font-size: 13px; opacity: 0.6;">Nessun documento trovato per "${task.Sistema}".</p>`;
        } else {
            // Take top 3 relevant docs
            results.slice(0, 3).forEach(doc => {
                const item = document.createElement('a');
                item.href = '#';
                item.className = 'drawer-doc-item';
                item.innerHTML = `
                    <span class="drawer-doc-icon"><i class="fas fa-file-lines"></i></span>
                    <span class="drawer-doc-name">${doc.name}</span>
                `;
                item.onclick = (e) => {
                    e.preventDefault();
                    switchView('workspace');
                    // We could also navigate directly to the file, but for now we search it
                    const searchInput = document.getElementById('workspace-search');
                    if (searchInput) {
                        searchInput.value = doc.name;
                        workspaceSearchQuery = doc.name;
                        renderWorkspace();
                    }
                    closeTaskDrawer();
                };
                container.appendChild(item);
            });
        }
    }

    function viewDoc(task) {
        if (!task) return;
        const system = task.Sistema;
        const keywords = SYSTEM_KEYWORDS[system] || [system];
        const sysKeywords = Array.isArray(keywords) ? keywords : [keywords];
        const siteName = task.Nome_Sito || "";
        
        // Parole chiave del sito per raffinare la ricerca
        const siteKeywords = siteName
            .replace(/Via|V\.le|Piazza|Viale|viale|[0-9/]+/gi, '')
            .trim()
            .toLowerCase()
            .split(/\s+/)
            .filter(w => w.length >= 3);

        let foundDoc = null;

        function searchRecursive(items) {
            if (foundDoc) return;
            const list = Array.isArray(items) ? items : [items];
            
            for (const item of list) {
                if (item.isDir && item.children) {
                    searchRecursive(item.children);
                } else if (!item.isDir) {
                    const pathLower = item.path.toLowerCase();
                    // Deve contenere il sistema e possibilmente il sito
                    const matchesSystem = sysKeywords.some(kw => pathLower.includes(kw.toLowerCase()));
                    const matchesSite = siteKeywords.some(kw => pathLower.includes(kw));
                    
                    if (matchesSystem && matchesSite) {
                        foundDoc = item;
                        return;
                    }
                }
            }
        }

        searchRecursive(workspaceData);

        if (foundDoc) {
            const internal = foundDoc.path.replace(/\\/g, '/');
            const finalPath = window.location.protocol === 'file:' ? `../../../${internal}` : internal;
            window.open(finalPath, '_blank');
        } else {
            // Fallback: Apri l'archivio con la ricerca preimpostata
            switchView('workspace');
            workspaceSearchQuery = siteKeywords[0] || system;
            const searchInput = document.getElementById('workspace-search');
            if (searchInput) searchInput.value = workspaceSearchQuery;
            renderWorkspace();
            alert("Documento specifico non trovato. Reindirizzamento all'Archivio per ricerca manuale.");
        }
    }

    // --- AI View Listeners ---
    const btnStartAudit = document.getElementById('btn-start-audit');
    if (btnStartAudit) {
        btnStartAudit.onclick = () => {
            if (typeof window.runAIAudit === 'function') {
                window.runAIAudit();
            } else {
                alert("Motore AI in fase di inizializzazione... Riprova tra un istante.");
            }
        };
    }

    const expandedInput = document.getElementById('ai-expanded-input');
    const btnSendExpanded = document.getElementById('send-ai-expanded');
    if (btnSendExpanded && expandedInput) {
        const sendMsg = () => {
            const text = expandedInput.value.trim();
            if (text && typeof window.sendAIExpanded === 'function') {
                window.sendAIExpanded(text);
                expandedInput.value = '';
            }
        };
        btnSendExpanded.onclick = sendMsg;
        expandedInput.onkeypress = (e) => { if (e.key === 'Enter') sendMsg(); };
    }

    function closeTaskDrawer() {
        drawerOverlay.classList.remove('active');
        taskDrawer.classList.remove('active');
    }

    // Drawer Listeners
    const closeBtn = document.getElementById('close-drawer');
    if (closeBtn) closeBtn.onclick = closeTaskDrawer;
    if (drawerOverlay) drawerOverlay.onclick = closeTaskDrawer;

    // Profile Quick Access Archive
    const btnProfileArchive = document.getElementById('btn-profile-archive');
    if (btnProfileArchive) {
        btnProfileArchive.onclick = () => {
            if (!currentSiteId) return;
            workspaceSearchQuery = currentSiteId;
            const searchInput = document.getElementById('workspace-search');
            if (searchInput) searchInput.value = currentSiteId;
            switchView('workspace');
        };
    }

    // Action Button Logic (Drawer)
    const btnArchive = document.getElementById('btn-drawer-archive');
    if (btnArchive) {
        btnArchive.onclick = (e) => {
            e.preventDefault();
            if (!currentDrawerTask) return;
            
            const system = currentDrawerTask.Sistema;
            const query = SYSTEM_KEYWORDS[system] || system;
            
            // Set global search state
            workspaceSearchQuery = query;
            
            // Switch to Workspace View
            switchView('workspace');
            closeTaskDrawer();
        };
    }

    // "Verify" Button Feedback (Demo Logic)
    const btnVerify = document.getElementById('btn-drawer-verify');
    if (btnVerify) {
        btnVerify.onclick = () => {
            btnVerify.innerHTML = '<i class="fas fa-bolt"></i> AGGIORNAMENTO...';
            btnVerify.style.background = 'var(--primary)';
            btnVerify.style.color = '#fff';
            
            setTimeout(() => {
                btnVerify.innerHTML = '<i class="fas fa-check"></i> VERIFICATO';
                btnVerify.style.background = '#10b981';
                // In a real app, we would update the data.js state here
            }, 1000);
        };
    }

    // Esc key to close all modals/drawers
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTaskDrawer();
        }
    });

    // --- 6. Map Logic (Punto 5) ---
    function initMap() {
        if (map) {
            map.invalidateSize();
            renderMarkers();
            return;
        }

        map = L.map('map').setView([45.485, 9.185], 12);
        updateMapTiles();
        renderMarkers();
    }

    function updateMapTiles() {
        if (!map) return;
        
        // Remove existing tile layer if any
        map.eachLayer(layer => {
            if (layer instanceof L.TileLayer) map.removeLayer(layer);
        });

        const isLight = body.classList.contains('light-theme');
        const tileUrl = isLight 
            ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
            : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            
        L.tileLayer(tileUrl, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(map);
    }

    function renderMarkers() {
        if (!map) return;
        
        // Clear existing markers
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) map.removeLayer(layer);
        });

        siteIds.forEach(id => {
            const site = sites[id];
            const coords = siteCoordinates[id];
            if (!coords) return;

            // Determine status color based on urgency AND compliance
            let color = '#10b981'; // Green
            const compliance = site.total > 0 ? (site.ok / site.total) * 100 : 0;
            const hasOverdue = site.tasks.some(t => t.Urgency === 'Overdue');
            const hasUrgent = site.tasks.some(t => t.Urgency === 'Urgent');
            
            if (hasOverdue || compliance < 40) {
                color = '#ef4444'; // Red (Overdue or Low Compliance)
            } else if (hasUrgent || compliance < 80) {
                color = '#f59e0b'; // Amber (Urgent or Moderate Compliance)
            }

            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${color};" class="marker-pin"></div>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });

            const marker = L.marker(coords, { icon: icon }).addTo(map);
            
            const popupContent = `
                <div style="font-family: 'Outfit'; min-width: 150px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; color: ${color}">${site.nome}</h3>
                    <p style="margin: 0; font-size: 12px; color: var(--text-muted); line-height: 1.4;">
                        ID: <strong>${id}</strong><br>
                        Compiti: <strong>${site.total}</strong><br>
                        Conformità: <strong>${Math.round((site.ok/site.total)*100)}%</strong>
                    </p>
                    <button class="toggle-btn active" style="margin-top: 12px; width: 100%; font-size: 10px; padding: 6px;" onclick="window.appSelectSite('${id}')">Apri Dettaglio</button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        });
    }

    // Global helper for marker popup clicks
    window.appSelectSite = (id) => {
        currentSiteId = id;
        window.currentSiteId = id; // Update global for AI
        switchView('dashboard');
        renderCurrentSite();

        // Reset AI Audit view for the new site
        if (typeof window.resetAIAudit === 'function') {
            window.resetAIAudit();
        }

        // Update link in sidebar
        document.querySelectorAll('.site-link').forEach(l => {
            l.classList.toggle('active', l.innerText.includes(id));
        });
    };

    // --- 6. Event Listeners ---
    navLinks.forEach(link => {
        link.onclick = (e) => {
            e.preventDefault();
            switchView(link.dataset.view);
        };
    });

    siteSearchInput.addEventListener('input', (e) => {
        renderSiteList(e.target.value);
    });

    // Filter Btns
    filterBtns.forEach(btn => {
        btn.onclick = () => {
            const type = btn.dataset.filterType;
            const value = btn.dataset.filter;

            // Reset active in specific group
            document.querySelectorAll(`.filter-btn[data-filter-type="${type}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (type === 'system') currentFilter = value;
            if (type === 'urgency') currentUrgencyFilter = value;
            if (type === 'doc') currentDocFilter = value;

            renderMaintenanceTable();
            if (currentSubview === 'monthly') renderMonthlySchedule();
        };
    });

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.onclick = () => switchSubview(btn.dataset.subview);
    });

    if (menuToggle) {
        menuToggle.onclick = () => sidebar.classList.toggle('open');
    }

    const workspaceSearchInput = document.getElementById('workspace-search');
    if (workspaceSearchInput) {
        workspaceSearchInput.addEventListener('input', (e) => {
            workspaceSearchQuery = e.target.value;
            renderWorkspace();
        });
    }

    const btnBack = document.getElementById('btn-workspace-back');
    const btnForward = document.getElementById('btn-workspace-forward');
    
    if (btnBack) {
        btnBack.onclick = () => {
            if (workspaceHistoryIndex > 0) {
                workspaceHistoryIndex--;
                navigateToDir(workspaceHistory[workspaceHistoryIndex], false);
            }
        };
    }
    
    if (btnForward) {
        btnForward.onclick = () => {
            if (workspaceHistoryIndex < workspaceHistory.length - 1) {
                workspaceHistoryIndex++;
                navigateToDir(workspaceHistory[workspaceHistoryIndex], false);
            }
        };
    }

    // Calendar Listeners
    const btnPrevMonth = document.getElementById('prev-month');
    const btnNextMonth = document.getElementById('next-month');
    if (btnPrevMonth) {
        btnPrevMonth.onclick = () => {
            calendarDate.setMonth(calendarDate.getMonth() - 1);
            renderCalendar();
        };
    }
    if (btnNextMonth) {
        btnNextMonth.onclick = () => {
            calendarDate.setMonth(calendarDate.getMonth() + 1);
            renderCalendar();
        };
    }

    document.querySelectorAll('[data-calview]').forEach(btn => {
        btn.onclick = () => {
            calendarViewMode = btn.dataset.calview;
            document.querySelectorAll('[data-calview]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCalendar();
        };
    });

    // Initialize
    initTheme();
    renderSiteList();
    switchSubview(currentSubview);
    renderWorkspace();

    // Export functions to global window to avoid scope issues in local protocol
    window.openTaskDrawer = openTaskDrawer;
    window.viewDoc = viewDoc;
    window.switchView = switchView;
    window.renderCurrentSite = renderCurrentSite;
    // window.appSelectSite is already on window from its declaration
    
    const btnExcel = document.getElementById('btn-export-excel');
    const btnPdf = document.getElementById('btn-export-pdf');
    
    if (btnExcel) {
        btnExcel.onclick = (e) => {
            e.stopPropagation();
            console.log("Excel Export Triggered");
            try {
                exportToExcel();
            } catch (err) {
                console.error("Excel Export Error:", err);
                alert("Errore durante l'esportazione Excel: " + err.message);
            }
        };
    }
    
    if (btnPdf) {
        btnPdf.onclick = (e) => {
            e.stopPropagation();
            exportToPDF();
        };
    }

    const btnGlobalPdf = document.getElementById('btn-export-global');
    if (btnGlobalPdf) {
        btnGlobalPdf.onclick = (e) => {
            e.stopPropagation();
            exportGlobalAnalyticsPDF();
        };
    }

    // --- Diagnostic: Show Last Sync ---
    const syncStatus = document.getElementById('sync-status');
    if (syncStatus && typeof workspaceVersion !== 'undefined' && workspaceVersion) {
        syncStatus.innerHTML = `
            <div style="margin-bottom: 4px;"><i class="fas fa-history" style="font-size: 8px;"></i> Ultimo sync: <strong>${workspaceVersion}</strong></div>
            <div style="font-size: 9px; color: var(--primary); opacity: 0.8;"><i class="fas fa-circle-check" style="font-size: 8px;"></i> Monitoraggio OneDrive attivo</div>
        `;
    } else if (syncStatus) {
        syncStatus.innerText = 'Sync non ancora eseguito';
    }
});
